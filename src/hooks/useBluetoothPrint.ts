import { useCallback } from 'react';
import type { PrinterReceiptData, Shift } from '../types';
import { usePrinterStore } from '../app/store/usePrinterStore';
import { BleClient, numbersToDataView } from '@capacitor-community/bluetooth-le';
import { isNative } from '../utils/capacitor';

// ESC/POS commands
const ESC = 0x1b;
const GS  = 0x1d;

function textToBytes(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
    const total = arrays.reduce((s, a) => s + a.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) {
        out.set(a, offset);
        offset += a.length;
    }
    return out;
}

function formatCurrency(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

function padLine(left: string, right: string, width = 32): string {
    const spaces = width - left.length - right.length;
    return left + ' '.repeat(Math.max(spaces, 1)) + right;
}

/**
 * Converts an image from URL to ESC/POS Raster data (GS v 0)
 */
async function imageToEscPosRaster(url: string, maxWidth: number = 200): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No canvas context');

            // Maintain aspect ratio, but cap at maxWidth
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }

            // ESC/POS raster width must be a multiple of 8 bits
            const rasterWidth = Math.ceil(width / 8) * 8;
            canvas.width = rasterWidth;
            canvas.height = height;

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, rasterWidth, height);
            ctx.drawImage(img, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, rasterWidth, height);
            const { data } = imageData;

            // Convert to 1-bit per pixel (black and white)
            const bytesPerRow = rasterWidth / 8;
            const rasterData = new Uint8Array(bytesPerRow * height);

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < rasterWidth; x++) {
                    const offset = (y * rasterWidth + x) * 4;
                    // Grayscale conversion
                    const r = data[offset];
                    const g = data[offset + 1];
                    const b = data[offset + 2];
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    
                    // Threshold (128 is midpoint)
                    if (gray < 128) {
                        const byteIdx = y * bytesPerRow + Math.floor(x / 8);
                        const bitIdx = 7 - (x % 8);
                        rasterData[byteIdx] |= (1 << bitIdx);
                    }
                }
            }

            // GS v 0 m xL xH yL yH d1...dk
            // m=0 (normal), xL xH = width in bytes, yL yH = height in pixels
            const xL = bytesPerRow % 256;
            const xH = Math.floor(bytesPerRow / 256);
            const yL = Math.floor(height) % 256;
            const yH = Math.floor(Math.floor(height) / 256);

            const header = new Uint8Array([GS, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
            resolve(concat(header, rasterData));
        };
        img.onerror = (e) => reject('Failed to load image for print: ' + JSON.stringify(e));
        img.src = url;
    });
}

async function buildEscPosData(receipt: PrinterReceiptData): Promise<Uint8Array> {
    const LF = new Uint8Array([0x0a]);

    const init      = new Uint8Array([ESC, 0x40]);                  // Initialize
    const centerOn  = new Uint8Array([ESC, 0x61, 0x01]);            // Center align
    const leftOn    = new Uint8Array([ESC, 0x61, 0x00]);            // Left align
    
    const sizeSmall  = new Uint8Array([ESC, 0x21, 0x00]);           // Font A, Normal
    const boldSmall  = new Uint8Array([ESC, 0x21, 0x08]);
    const boldMedium = new Uint8Array([ESC, 0x21, 0x18]);
    const boldLarge  = new Uint8Array([ESC, 0x21, 0x38]);

    const cutPaper = new Uint8Array([GS,  0x56, 0x41, 0x00]);      // Full cut

    const settings = receipt.receipt_settings;
    const alignCmd = settings?.alignment === 'center' ? centerOn : leftOn;
    
    let storeMode = boldLarge;
    if (settings?.font_size === 'small') storeMode = boldSmall;
    if (settings?.font_size === 'medium') storeMode = boldMedium;

    const paperWidth = settings?.paper_width || 32;
    const separator = textToBytes('-'.repeat(paperWidth) + '\n');

    const paymentLabel: Record<string, string> = {
        cash: 'Tunai', bank_transfer: 'Transfer', 'e-wallet': 'E-Wallet',
    };

    const typeLabel: Record<string, string> = {
        dine_in: 'Dine In', takeaway: 'Bungkus', delivery: 'Delivery',
    };

    const lines: (Uint8Array | Uint8Array[])[] = [
        init,
        alignCmd, storeMode,
    ];

    // Add Logo if exists
    if (settings?.logo_url) {
        try {
            const logoRaster = await imageToEscPosRaster(settings.logo_url, settings.logo_width || 160);
            lines.push(logoRaster);
            lines.push(LF);
        } catch (e) {
            console.warn('Logo print failed:', e);
        }
    }

    lines.push(...([
        textToBytes((settings?.store_name || receipt.store_name) + '\n'),
        sizeSmall,
        receipt.store_address ? textToBytes(receipt.store_address + '\n') : new Uint8Array(0),
        receipt.store_phone ? textToBytes('Tel: ' + receipt.store_phone + '\n') : new Uint8Array(0),
        settings?.header_text ? concat(LF, textToBytes(settings.header_text + '\n')) : new Uint8Array(0),
        separator,
        leftOn, sizeSmall,
        textToBytes(`No: ${receipt.invoice_number}\n`),
        textToBytes(`Tgl: ${receipt.date}\n`),
        textToBytes(`Kasir: ${receipt.cashier}\n`),
        textToBytes(`Pelanggan: ${receipt.customer}\n`),
        receipt.table_name ? textToBytes(`Meja: ${receipt.table_name}\n`) : (receipt.table_id ? textToBytes(`Meja ID: ${receipt.table_id}\n`) : new Uint8Array(0)),
        receipt.type ? textToBytes(`Tipe: ${typeLabel[receipt.type] ?? receipt.type}\n`) : new Uint8Array(0),
        separator,
        ...receipt.items.flatMap(item => {
            const isFree = item.discount >= (item.price * item.quantity);
            const nameLine = isFree ? `${item.name} (FREE)` : item.name;
            return [
                textToBytes(`${nameLine}\n`),
                ...(item.notes ? [textToBytes(`  * ${item.notes}\n`)] : []),
                ...(item.modifiers || []).map(m => textToBytes(`  - ${m.name}\n`)),
                item.discount > 0 && !isFree 
                    ? textToBytes(padLine(`  Disc: -${formatCurrency(item.discount)}`, '', paperWidth) + '\n')
                    : new Uint8Array(0),
                textToBytes(padLine(`  ${item.quantity} x ${formatCurrency(item.price)}`, formatCurrency(item.subtotal), paperWidth) + '\n'),
            ] as Uint8Array[];
        }),
        separator,
        textToBytes(padLine('Subtotal', formatCurrency(receipt.subtotal), paperWidth) + '\n'),
        receipt.discount > 0
            ? textToBytes(padLine('Diskon', `-${formatCurrency(receipt.discount)}`, paperWidth) + '\n')
            : new Uint8Array(0),
        receipt.service_charge > 0
            ? textToBytes(padLine('Service', formatCurrency(receipt.service_charge), paperWidth) + '\n')
            : new Uint8Array(0),
        textToBytes(padLine(`Pajak (${receipt.tax_rate}%)`, formatCurrency(receipt.tax), paperWidth) + '\n'),
        separator,
        boldMedium,
        textToBytes(padLine('TOTAL', formatCurrency(receipt.grand_total), paperWidth) + '\n'),
        sizeSmall,
        textToBytes(padLine('Bayar', formatCurrency(receipt.paid_amount), paperWidth) + '\n'),
        textToBytes(padLine('Kembali', formatCurrency(receipt.change_amount), paperWidth) + '\n'),
        textToBytes(padLine('Metode', paymentLabel[receipt.payment_method] ?? receipt.payment_method, paperWidth) + '\n'),
        separator,
        alignCmd, sizeSmall,
        receipt.notes ? textToBytes(`Note: ${receipt.notes}\n\n`) : new Uint8Array(0),
        settings?.footer_text 
            ? textToBytes(settings.footer_text + '\n') 
            : textToBytes('Terima kasih!\nSelamat datang kembali :)\n'),
        LF, LF, LF,
        cutPaper,
    ] as Uint8Array[]));

    return concat(...(lines.flat().filter(a => a.length > 0) as Uint8Array[]));
}

function buildShiftEscPosData(shift: Shift): Uint8Array {
    const LF = new Uint8Array([0x0a]);
    const init = new Uint8Array([ESC, 0x40]);
    const centerOn = new Uint8Array([ESC, 0x61, 0x01]);
    const leftOn = new Uint8Array([ESC, 0x61, 0x00]);
    const boldLarge = new Uint8Array([ESC, 0x21, 0x38]);
    const boldMedium = new Uint8Array([ESC, 0x21, 0x18]);
    const sizeSmall = new Uint8Array([ESC, 0x21, 0x00]);
    const cutPaper = new Uint8Array([GS, 0x56, 0x41, 0x00]);

    const report = shift.report;
    if (!report) return new Uint8Array(0);

    const paperWidth = 32;
    const separator = textToBytes('-'.repeat(paperWidth) + '\n');

    const lines: Uint8Array[] = [
        init, centerOn, boldLarge, textToBytes('SUMMARY SHIFT\n'),
        sizeSmall, textToBytes(`Outlet ID: ${shift.outlet_id}\n`),
        separator, leftOn,
        textToBytes(`Buka  : ${new Date(shift.opened_at).toLocaleString('id-ID')}\n`),
        textToBytes(`Tutup : ${shift.closed_at ? new Date(shift.closed_at).toLocaleString('id-ID') : '-'}\n`),
        textToBytes(`Kasir : ${report.opened_by_name || '-'}\n`),
        separator,
        textToBytes(padLine('Gross Sales', formatCurrency(report.gross_sales), paperWidth) + '\n'),
        textToBytes(padLine('Refund', `(${formatCurrency(report.refund_total)})`, paperWidth) + '\n'),
        boldMedium,
        textToBytes(padLine('NET SALES', formatCurrency(report.net_sales), paperWidth) + '\n'),
        sizeSmall, separator,
        textToBytes('PEMBAYARAN:\n'),
        ...Object.entries(report.payment_breakdown).map(([m, a]) => 
            textToBytes(padLine(`  ${m}`, formatCurrency(a), paperWidth) + '\n')
        ),
        separator,
        textToBytes(padLine('Ekspektasi Kas', formatCurrency(report.expected_cash), paperWidth) + '\n'),
        textToBytes(padLine('Kas Aktual', formatCurrency(report.actual_cash), paperWidth) + '\n'),
        textToBytes(padLine('Selisih', formatCurrency(report.difference), paperWidth) + '\n'),
        LF, LF, LF,
        centerOn, textToBytes('. . . . . . . . . . . . . . . .\n'),
        textToBytes('Tanda Tangan Kasir\n'),
        LF, LF, LF,
        cutPaper,
    ];

    return concat(...lines);
}

function buildKitchenEscPosData(order: any): Uint8Array {
    const LF = new Uint8Array([0x0a]);
    const init = new Uint8Array([ESC, 0x40]);
    const centerOn = new Uint8Array([ESC, 0x61, 0x01]);
    const leftOn = new Uint8Array([ESC, 0x61, 0x00]);
    const boldLarge = new Uint8Array([ESC, 0x21, 0x38]);
    const boldMedium = new Uint8Array([ESC, 0x21, 0x18]);
    const sizeSmall = new Uint8Array([ESC, 0x21, 0x00]);
    const cutPaper = new Uint8Array([GS, 0x56, 0x41, 0x00]);

    const paperWidth = 32;
    const separator = textToBytes('-'.repeat(paperWidth) + '\n');
    const typeLabel: Record<string, string> = { dine_in: 'DINE IN', takeaway: 'BUNGKUS', delivery: 'DELIVERY' };

    const lines: Uint8Array[] = [
        init, centerOn, boldLarge, textToBytes('ORDER DAPUR\n'),
        boldMedium, textToBytes(`${typeLabel[order.type] || order.type}\n`),
        order.table_name ? textToBytes(`MEJA: ${order.table_name}\n`) : (order.table_id ? textToBytes(`MEJA ID: ${order.table_id}\n`) : new Uint8Array(0)),
        sizeSmall, textToBytes(`Waktu: ${new Date().toLocaleTimeString('id-ID')}\n`),
        separator, leftOn,
        ...order.items.flatMap((item: any) => [
            boldMedium, textToBytes(`${item.quantity}x ${item.name || item.product_name}\n`),
            ...(item.notes ? [sizeSmall, textToBytes(`  * ${item.notes}\n`), boldMedium] : []),
            ...(item.modifiers || []).map((m: any) => textToBytes(`  - ${m.name}\n`)),
        ]),
        separator,
        order.notes ? textToBytes(`Notes: ${order.notes}\n`) : new Uint8Array(0),
        LF, LF, LF,
        cutPaper,
    ];

    return concat(...lines);
}

const PRINT_SERVICE_UUID       = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINT_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

let characteristicCache: Record<string, BluetoothRemoteGATTCharacteristic | null> = {};

export function useBluetoothPrint() {
    const { 
        cashierDevice, setCashierDevice,
        kitchenDevice, setKitchenDevice,
        isConnecting, setIsConnecting,
        isConnected, setIsConnected,
        lastCashierPrinterId, lastKitchenPrinterId,
        setLastError 
    } = usePrinterStore();

    const isSupported = isNative ? true : !!navigator.bluetooth;

    const onDisconnected = useCallback(() => {
        console.warn(`Printer disconnected.`);
        setIsConnected(false);
        characteristicCache = {};
    }, [setIsConnected]);

    const autoConnect = useCallback(async (configList?: any[]): Promise<void> => {
        if (isNative) {
            try {
                await BleClient.initialize();
                
                // If we have a config list, use it to determine which IDs to connect
                const cashierId = configList?.find(p => p.type === 'cashier' || p.type === 'both')?.mac_address || lastCashierPrinterId;
                const kitchenId = configList?.find(p => p.type === 'kitchen' || p.type === 'both')?.mac_address || lastKitchenPrinterId;

                if (cashierId) {
                    try {
                        await BleClient.connect(cashierId, onDisconnected);
                        setCashierDevice({ id: cashierId, name: 'Kasir Printer', native: true });
                    } catch (e) { console.warn('Native Cashier connect failed', e); }
                }

                if (kitchenId && kitchenId !== cashierId) {
                    try {
                        await BleClient.connect(kitchenId, onDisconnected);
                        setKitchenDevice({ id: kitchenId, name: 'Dapur Printer', native: true });
                    } catch (e) { console.warn('Native Kitchen connect failed', e); }
                }
                
                setIsConnected(!!(cashierId || kitchenId));
            } catch (e) {
                console.warn('Capacitor Auto-connect failed', e);
            }
            return;
        }

        if (!navigator.bluetooth || !navigator.bluetooth.getDevices) return;
        try {
            const devices = await navigator.bluetooth.getDevices();
            
            // Map types from configList if provided
            let cashierTargetId = lastCashierPrinterId;
            let kitchenTargetId = lastKitchenPrinterId;

            if (configList) {
                cashierTargetId = configList.find(p => p.type === 'cashier' || p.type === 'both')?.mac_address || null;
                kitchenTargetId = configList.find(p => p.type === 'kitchen' || p.type === 'both')?.mac_address || null;
            }

            const cDev = devices.find(d => d.id === cashierTargetId);
            const kDev = devices.find(d => d.id === kitchenTargetId);
            
            if (cDev) {
                try {
                    if (!cDev.gatt?.connected) await cDev.gatt?.connect();
                    cDev.removeEventListener('gattserverdisconnected', onDisconnected);
                    cDev.addEventListener('gattserverdisconnected', onDisconnected);
                    setCashierDevice(cDev);
                } catch (e) { console.warn('Web Cashier connect failed', e); }
            }
            
            if (kDev && kDev.id !== cDev?.id) {
                try {
                    if (!kDev.gatt?.connected) await kDev.gatt?.connect();
                    kDev.removeEventListener('gattserverdisconnected', onDisconnected);
                    kDev.addEventListener('gattserverdisconnected', onDisconnected);
                    setKitchenDevice(kDev);
                } catch (e) { console.warn('Web Kitchen connect failed', e); }
            }
            setIsConnected(!!(cDev || kDev));
        } catch (err) {
            console.warn('Auto-connect failed', err);
        }
    }, [lastCashierPrinterId, lastKitchenPrinterId, setCashierDevice, setKitchenDevice, setIsConnected, onDisconnected]);

    const connectPrinter = useCallback(async (role: 'cashier' | 'kitchen' | 'both' = 'cashier'): Promise<any | null> => {
        setLastError(null);
        if (isNative) {
            try {
                setIsConnecting(true);
                await BleClient.initialize();
                const device = await BleClient.requestDevice({
                    services: [PRINT_SERVICE_UUID],
                    optionalServices: [PRINT_SERVICE_UUID],
                }).catch(() => BleClient.requestDevice({}));

                await BleClient.connect(device.deviceId, onDisconnected);
                const devObj = { id: device.deviceId, name: device.name || 'BT Printer', native: true };
                
                if (role === 'cashier' || role === 'both') setCashierDevice(devObj);
                if (role === 'kitchen' || role === 'both') setKitchenDevice(devObj);
                
                setIsConnected(true);
                setIsConnecting(false);
                return { name: devObj.name, device: devObj };
            } catch (err: any) {
                setIsConnecting(false);
                setLastError(err.message);
                throw err;
            }
        }

        if (!navigator.bluetooth) return null;
        try {
            setIsConnecting(true);
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [PRINT_SERVICE_UUID] }],
                optionalServices: [PRINT_SERVICE_UUID],
            }).catch(() => navigator.bluetooth.requestDevice({
                acceptAllDevices: true, optionalServices: [PRINT_SERVICE_UUID],
            }));

            if (!device.gatt?.connected) await device.gatt?.connect();
            device.removeEventListener('gattserverdisconnected', onDisconnected);
            device.addEventListener('gattserverdisconnected', onDisconnected);

            if (role === 'cashier' || role === 'both') setCashierDevice(device);
            if (role === 'kitchen' || role === 'both') setKitchenDevice(device);
            
            setIsConnected(true);
            setIsConnecting(false);
            return { name: device.name ?? 'Bluetooth Printer', device };
        } catch (err: any) {
            setIsConnecting(false);
            if (err.name === 'NotFoundError') return null;
            setLastError(err.message);
            throw err;
        }
    }, [setCashierDevice, setKitchenDevice, setIsConnecting, setIsConnected, onDisconnected, setLastError]);

    const printRaw = async (data: Uint8Array, target: any): Promise<boolean> => {
        if (!target) return false;
        try {
            if (isNative || target.native) {
                const deviceId = target.id;
                await BleClient.initialize();
                try { await BleClient.connect(deviceId, onDisconnected); } catch (e) {}
                const services = await BleClient.getServices(deviceId);
                let charId = PRINT_CHARACTERISTIC_UUID, svcId = PRINT_SERVICE_UUID;
                const printSvc = services.find(s => s.uuid === PRINT_SERVICE_UUID);
                if (!printSvc) {
                    for (const s of services) {
                        const char = s.characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);
                        if (char) { svcId = s.uuid; charId = char.uuid; break; }
                    }
                }
                const CHUNK = 20;
                for (let i = 0; i < data.length; i += CHUNK) {
                    const chunk = data.slice(i, i + CHUNK);
                    await BleClient.writeWithoutResponse(deviceId, svcId, charId, numbersToDataView(Array.from(chunk)));
                    if (i + CHUNK < data.length) await new Promise(r => setTimeout(r, 15));
                }
                return true;
            }

            if (!target.gatt?.connected) {
                await target.gatt!.connect();
                target.removeEventListener('gattserverdisconnected', onDisconnected);
                target.addEventListener('gattserverdisconnected', onDisconnected);
            }

            let char = characteristicCache[target.id];
            if (!char || !target.gatt?.connected) {
                const server = target.gatt!;
                try {
                    const svc = await server.getPrimaryService(PRINT_SERVICE_UUID);
                    char = await svc.getCharacteristic(PRINT_CHARACTERISTIC_UUID);
                } catch {
                    const svcs = await server.getPrimaryServices();
                    for (const s of svcs) {
                        try {
                            const chars = await s.getCharacteristics();
                            char = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse) || null;
                        } catch {}
                        if (char) break;
                    }
                }
                if (char) characteristicCache[target.id] = char;
            }

            if (!char) throw new Error('Characteristic not found');
            const CHUNK = 20, DELAY = 25;
            for (let i = 0; i < data.length; i += CHUNK) {
                const chunk = data.slice(i, i + CHUNK);
                if (char.properties.writeWithoutResponse) await char.writeValueWithoutResponse(chunk);
                else await char.writeValue(chunk);
                if (i + CHUNK < data.length) await new Promise(r => setTimeout(r, DELAY));
            }
            return true;
        } catch (err: any) {
            console.error('Print Raw Error:', err);
            setLastError(err.message || 'Bluetooth Error.');
            return false;
        }
    };

    const printReceipt = useCallback(async (receipt: PrinterReceiptData): Promise<boolean> => {
        const target = cashierDevice || kitchenDevice; // Fallback to whatever is connected
        if (!target) { if (!isNative) window.print(); return false; }
        const data = await buildEscPosData(receipt);
        return printRaw(data, target);
    }, [cashierDevice, kitchenDevice]);

    const printShiftReport = useCallback(async (shift: Shift): Promise<boolean> => {
        const target = cashierDevice || kitchenDevice;
        if (!target) return false;
        const data = buildShiftEscPosData(shift);
        return printRaw(data, target);
    }, [cashierDevice, kitchenDevice]);

    const printKitchenOrder = useCallback(async (order: any): Promise<boolean> => {
        const target = kitchenDevice || cashierDevice;
        if (!target) return false;
        const data = buildKitchenEscPosData(order);
        return printRaw(data, target);
    }, [kitchenDevice, cashierDevice]);

    return { 
        isSupported, connectPrinter, printReceipt, printShiftReport, printKitchenOrder,
        autoConnect, isConnecting, isConnected 
    };
}

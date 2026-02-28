import { useCallback } from 'react';
import type { PrinterReceiptData } from '../types';
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

function buildEscPosData(receipt: PrinterReceiptData): Uint8Array {
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

    const lines: Uint8Array[] = [
        init,
        alignCmd, storeMode,
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
        receipt.type ? textToBytes(`Tipe: ${typeLabel[receipt.type] ?? receipt.type}\n`) : new Uint8Array(0),
        separator,
        ...receipt.items.flatMap(item => [
            textToBytes(`${item.name}\n`),
            textToBytes(padLine(`  ${item.quantity} x ${formatCurrency(item.price)}`, formatCurrency(item.subtotal), paperWidth) + '\n'),
        ] as Uint8Array[]),
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
        settings?.footer_text 
            ? textToBytes(settings.footer_text + '\n') 
            : textToBytes('Terima kasih!\nSelamat datang kembali :)\n'),
        LF, LF, LF,
        cutPaper,
    ];

    return concat(...lines.filter(a => a.length > 0));
}

const PRINT_SERVICE_UUID       = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINT_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

let characteristicCache: BluetoothRemoteGATTCharacteristic | null = null;

export function useBluetoothPrint() {
    const { 
        activeDevice, setActiveDevice, 
        isConnecting, setIsConnecting,
        isConnected, setIsConnected,
        lastUsedPrinterId,
        setLastError 
    } = usePrinterStore();

    const isSupported = isNative ? true : !!navigator.bluetooth;

    const onDisconnected = useCallback(() => {
        console.warn(`Printer disconnected.`);
        setIsConnected(false);
        characteristicCache = null;
    }, [setIsConnected]);

    const autoConnect = useCallback(async (): Promise<any | null> => {
        if (isNative) {
            try {
                await BleClient.initialize();
                if (lastUsedPrinterId) {
                    await BleClient.connect(lastUsedPrinterId, onDisconnected);
                    const device = { id: lastUsedPrinterId, name: 'Saved Printer' };
                    setActiveDevice(device);
                    setIsConnected(true);
                    return device;
                }
            } catch (e) {
                console.warn('Capacitor Auto-connect failed', e);
            }
            return null;
        }

        if (!navigator.bluetooth || !navigator.bluetooth.getDevices) return null;
        try {
            const devices = await navigator.bluetooth.getDevices();
            let printer = devices.find(d => d.id === lastUsedPrinterId);
            if (!printer) {
                printer = devices.find(d => 
                    d.name?.toLowerCase().includes('printer') || 
                    d.name?.toLowerCase().includes('pos')
                );
            }
            if (printer) {
                if (!printer.gatt?.connected) {
                    setIsConnecting(true);
                    await printer.gatt?.connect();
                    setIsConnecting(false);
                }
                printer.removeEventListener('gattserverdisconnected', onDisconnected);
                printer.addEventListener('gattserverdisconnected', onDisconnected);
                setActiveDevice(printer);
                setIsConnected(true);
                return printer;
            }
            return null;
        } catch (err) {
            setIsConnecting(false);
            return null;
        }
    }, [lastUsedPrinterId, setActiveDevice, setIsConnecting, setIsConnected, onDisconnected]);

    const connectPrinter = useCallback(async (): Promise<any | null> => {
        setLastError(null);
        if (isNative) {
            try {
                setIsConnecting(true);
                await BleClient.initialize();
                const device = await BleClient.requestDevice({
                    services: [PRINT_SERVICE_UUID],
                    optionalServices: [PRINT_SERVICE_UUID],
                }).catch(async () => {
                    return await BleClient.requestDevice({
                        // No filters fallback
                    });
                });

                await BleClient.connect(device.deviceId, onDisconnected);
                const devObj = { id: device.deviceId, name: device.name || 'BT Printer', native: true };
                setActiveDevice(devObj);
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
            }).catch(async () => {
                return await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: [PRINT_SERVICE_UUID],
                });
            });

            if (!device.gatt?.connected) {
                await device.gatt?.connect();
            }
            device.removeEventListener('gattserverdisconnected', onDisconnected);
            device.addEventListener('gattserverdisconnected', onDisconnected);

            setActiveDevice(device);
            setIsConnected(true);
            setIsConnecting(false);
            return { name: device.name ?? 'Bluetooth Printer', device };
        } catch (err: any) {
            setIsConnecting(false);
            if (err.name === 'NotFoundError') return null;
            setLastError(err.message);
            throw err;
        }
    }, [setActiveDevice, setIsConnecting, setIsConnected, onDisconnected, setLastError]);

    const printReceipt = useCallback(async (receipt: PrinterReceiptData, device?: any): Promise<boolean> => {
        let target = device ?? activeDevice;

        if (!target && isSupported) {
            target = await autoConnect();
        }

        if (!target) {
            if (!isNative) window.print();
            return false;
        }

        try {
            setLastError(null);
            const data = buildEscPosData(receipt);

            if (isNative || target.native) {
                const deviceId = target.id;
                await BleClient.initialize();
                
                // Ensure connected
                try {
                    await BleClient.connect(deviceId, onDisconnected);
                } catch (e) {}

                const services = await BleClient.getServices(deviceId);
                let characteristicId = PRINT_CHARACTERISTIC_UUID;
                let serviceId = PRINT_SERVICE_UUID;

                // Heuristic for characteristic if default UUIDs fail
                const printService = services.find(s => s.uuid === PRINT_SERVICE_UUID);
                if (!printService) {
                    for (const s of services) {
                        const char = s.characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);
                        if (char) {
                            serviceId = s.uuid;
                            characteristicId = char.uuid;
                            break;
                        }
                    }
                }

                // Capacitor LE handles MTU/batching better, but small chunks are safer
                const CHUNK_SIZE = 20;
                for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                    const chunk = data.slice(i, i + CHUNK_SIZE);
                    await BleClient.writeWithoutResponse(deviceId, serviceId, characteristicId, numbersToDataView(Array.from(chunk)));
                    if (i + CHUNK_SIZE < data.length) {
                        await new Promise(r => setTimeout(r, 15));
                    }
                }
                return true;
            }

            // Web Bluetooth logic
            if (!target.gatt?.connected) {
                setIsConnecting(true);
                await target.gatt!.connect();
                setIsConnecting(false);
                setIsConnected(true);
                target.removeEventListener('gattserverdisconnected', onDisconnected);
                target.addEventListener('gattserverdisconnected', onDisconnected);
            }

            let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
            if (characteristicCache && characteristicCache.service.device.id === target.id && target.gatt?.connected) {
                characteristic = characteristicCache;
            } else {
                const server = target.gatt!;
                try {
                    const service = await server.getPrimaryService(PRINT_SERVICE_UUID);
                    characteristic = await service.getCharacteristic(PRINT_CHARACTERISTIC_UUID);
                } catch (err) {
                    const services = await server.getPrimaryServices();
                    for (const svc of services) {
                        try {
                            const chars = await svc.getCharacteristics();
                            for (const c of chars) {
                                if (c.properties.write || c.properties.writeWithoutResponse) {
                                    characteristic = c;
                                    break;
                                }
                            }
                        } catch (e) {}
                        if (characteristic) break;
                    }
                }
                if (characteristic) characteristicCache = characteristic;
            }

            if (!characteristic) throw new Error('Characteristic not found');

            const CHUNK_SIZE = 20;
            const DELAY_MS = 25;
            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                const chunk = data.slice(i, i + CHUNK_SIZE);
                if (characteristic.properties.writeWithoutResponse) {
                    await characteristic.writeValueWithoutResponse(chunk);
                } else {
                    await characteristic.writeValue(chunk);
                }
                if (i + CHUNK_SIZE < data.length) await new Promise(r => setTimeout(r, DELAY_MS));
            }

            return true;
        } catch (err: any) {
            console.error('Bluetooth Print Error:', err);
            setLastError(err.message || 'Bluetooth Error.');
            setIsConnecting(false);
            throw err;
        }
    }, [activeDevice, isSupported, autoConnect, setIsConnecting, setIsConnected, onDisconnected, setLastError]);

    return { isSupported, connectPrinter, printReceipt, autoConnect, isConnecting, isConnected };
}

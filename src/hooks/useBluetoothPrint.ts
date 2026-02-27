import { useCallback } from 'react';
import type { PrinterReceiptData } from '../types';
import { usePrinterStore } from '../app/store/usePrinterStore';

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
    
    // Using ESC ! n (Select print mode) instead of GS ! n for better compatibility
    // Bits: 0: font B, 3: bold, 4: double height, 5: double width
    const sizeSmall  = new Uint8Array([ESC, 0x21, 0x00]);           // Font A, Normal
    
    // Combined modes for store name
    const boldSmall  = new Uint8Array([ESC, 0x21, 0x08]);
    const boldMedium = new Uint8Array([ESC, 0x21, 0x18]);
    const boldLarge  = new Uint8Array([ESC, 0x21, 0x38]);

    const cutPaper = new Uint8Array([GS,  0x56, 0x41, 0x00]);      // Full cut

    const settings = receipt.receipt_settings;
    const alignCmd = settings?.alignment === 'center' ? centerOn : leftOn;
    
    let storeMode = boldLarge;
    if (settings?.font_size === 'small') storeMode = boldSmall;
    if (settings?.font_size === 'medium') storeMode = boldMedium;

    const paperWidth = settings?.paper_width || 32; // Default for 58mm. Could be 48 for 80mm.
    const separator = textToBytes('-'.repeat(paperWidth) + '\n');

    const paymentLabel: Record<string, string> = {
        cash: 'Tunai', bank_transfer: 'Transfer', 'e-wallet': 'E-Wallet',
    };

    const typeLabel: Record<string, string> = {
        dine_in: 'Dine In', takeaway: 'Bungkus', delivery: 'Delivery',
    };

    console.log('Build print data with settings:', settings);

    const lines: Uint8Array[] = [
        init,
        // Header/Store Identity
        alignCmd, storeMode,
        textToBytes((settings?.store_name || receipt.store_name) + '\n'),
        
        sizeSmall, // Reset to normal size for secondary info
        receipt.store_address ? textToBytes(receipt.store_address + '\n') : new Uint8Array(0),
        receipt.store_phone ? textToBytes('Tel: ' + receipt.store_phone + '\n') : new Uint8Array(0),
        
        // Header Text
        settings?.header_text ? concat(LF, textToBytes(settings.header_text + '\n')) : new Uint8Array(0),
        
        separator,

        // Invoice header
        leftOn, sizeSmall,
        textToBytes(`No: ${receipt.invoice_number}\n`),
        textToBytes(`Tgl: ${receipt.date}\n`),
        textToBytes(`Kasir: ${receipt.cashier}\n`),
        textToBytes(`Pelanggan: ${receipt.customer}\n`),
        receipt.type ? textToBytes(`Tipe: ${typeLabel[receipt.type] ?? receipt.type}\n`) : new Uint8Array(0),
        separator,

        // Items
        ...receipt.items.flatMap(item => [
            textToBytes(`${item.name}\n`),
            textToBytes(padLine(`  ${item.quantity} x ${formatCurrency(item.price)}`, formatCurrency(item.subtotal), paperWidth) + '\n'),
        ] as Uint8Array[]),
        separator,

        // Totals
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

        // Footer
        alignCmd, sizeSmall,
        settings?.footer_text 
            ? textToBytes(settings.footer_text + '\n') 
            : textToBytes('Terima kasih!\nSelamat datang kembali :)\n'),
        
        LF, LF, LF,
        cutPaper,
    ];

    return concat(...lines.filter(a => a.length > 0));
}

// Service UUID for generic Bluetooth serial printers (Epson, ZJ-58, etc.)
const PRINT_SERVICE_UUID       = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINT_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';


export function useBluetoothPrint() {
    const { 
        activeDevice, setActiveDevice, 
        setIsConnecting, setLastError 
    } = usePrinterStore();

    const isSupported = !!navigator.bluetooth;

    const autoConnect = useCallback(async (): Promise<BluetoothDevice | null> => {
        if (!navigator.bluetooth || !navigator.bluetooth.getDevices) return null;
        
        try {
            const devices = await navigator.bluetooth.getDevices();
            // We'll take the first device that supports our print service
            // In a better version, we'd match against the "default" printer Mac Address from API
            const printer = devices.find(d => d.name?.toLowerCase().includes('printer') || d.name?.toLowerCase().includes('pos'));
            
            if (printer) {
                if (!printer.gatt?.connected) {
                    setIsConnecting(true);
                    await printer.gatt?.connect();
                    setIsConnecting(false);
                }
                setActiveDevice(printer);
                return printer;
            }
            return null;
        } catch (err) {
            console.error('Auto-connect error:', err);
            setIsConnecting(false);
            return null;
        }
    }, [setActiveDevice, setIsConnecting]);

    const connectPrinter = useCallback(async (): Promise<{ name: string; device: BluetoothDevice } | null> => {
        if (!navigator.bluetooth) return null;
        setLastError(null);
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

            setActiveDevice(device);
            setIsConnecting(false);
            return { name: device.name ?? 'Bluetooth Printer', device };
        } catch (err: any) {
            setIsConnecting(false);
            if (err.name === 'NotFoundError') return null;
            setLastError(err.message);
            throw err;
        }
    }, [setActiveDevice, setIsConnecting, setLastError]);

    const printReceipt = useCallback(async (receipt: PrinterReceiptData, device?: BluetoothDevice): Promise<boolean> => {
        let target = device ?? activeDevice;

        // Try auto-connect if no active device and we're starting a print job
        if (!target && isSupported) {
            console.log('No active device, attempting auto-reconnect...');
            target = await autoConnect();
        }

        // If still no Bluetooth device, fallback to browser print
        if (!target || !navigator.bluetooth) {
            console.log('No Bluetooth device found, falling back to window.print()');
            window.print();
            return false;
        }

        try {
            setLastError(null);
            
            // Reconnect if disconnected
            if (!target.gatt?.connected) {
                console.log('Device disconnected, attempting GATT connect...');
                setIsConnecting(true);
                await target.gatt!.connect();
                setIsConnecting(false);
            }

            console.log('Discovering services...');
            const server = target.gatt!;
            let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

            try {
                const service = await server.getPrimaryService(PRINT_SERVICE_UUID);
                characteristic = await service.getCharacteristic(PRINT_CHARACTERISTIC_UUID);
            } catch (err) {
                console.warn('Primary service/char not found, searching all services...', err);
                const services = await server.getPrimaryServices();
                for (const svc of services) {
                    try {
                        const chars = await svc.getCharacteristics();
                        for (const c of chars) {
                            if (c.properties.write || c.properties.writeWithoutResponse) {
                                characteristic = c;
                                console.log(`Found alternate characteristic in service: ${svc.uuid}`);
                                break;
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to get characteristics for service ${svc.uuid}`, e);
                    }
                    if (characteristic) break;
                }
            }

            if (!characteristic) {
                throw new Error('Printer ditukar atau tidak mendukung protokol ESC/POS via Bluetooth Low Energy.');
            }

            console.log('Building ESC/POS data...');
            const data = buildEscPosData(receipt);
            
            /**
             * BLE Reliability Fix:
             * 1. Small chunk size (20 bytes is the standard BLE MTU payload limit)
             * 2. Small delay between chunks to prevent buffer overflow on the printer
             */
            const CHUNK_SIZE = 20; 
            const DELAY_MS = 30;

            console.log(`Starting print job: ${data.length} bytes in ${Math.ceil(data.length / CHUNK_SIZE)} chunks`);

            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                const chunk = data.slice(i, i + CHUNK_SIZE);
                
                if (characteristic.properties.writeWithoutResponse) {
                    await characteristic.writeValueWithoutResponse(chunk);
                } else {
                    await characteristic.writeValue(chunk);
                }

                // Wait a bit before next chunk
                if (i + CHUNK_SIZE < data.length) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
                }
            }

            console.log('Print job sent successfully.');
            return true;
        } catch (err: any) {
            console.error('Print error details:', err);
            setLastError(err.message || 'GATT Error.');
            setIsConnecting(false);
            throw err;
        }
    }, [activeDevice, isSupported, autoConnect, setIsConnecting, setLastError]);

    return { isSupported, connectPrinter, printReceipt, autoConnect };
}

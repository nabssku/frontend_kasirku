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


// Module-level cache for characteristic to speed up subsequent prints
let characteristicCache: BluetoothRemoteGATTCharacteristic | null = null;

export function useBluetoothPrint() {
    const { 
        activeDevice, setActiveDevice, 
        isConnecting, setIsConnecting,
        isConnected, setIsConnected,
        lastUsedPrinterId,
        setLastError 
    } = usePrinterStore();

    const isSupported = !!navigator.bluetooth;

    // Handle sudden disconnections
    const onDisconnected = useCallback((event: Event) => {
        const device = event.target as BluetoothDevice;
        console.warn(`Printer ${device.name || 'Unknown'} disconnected.`);
        setIsConnected(false);
        characteristicCache = null;
    }, [setIsConnected]);

    const autoConnect = useCallback(async (): Promise<BluetoothDevice | null> => {
        if (!navigator.bluetooth || !navigator.bluetooth.getDevices) return null;
        
        try {
            const devices = await navigator.bluetooth.getDevices();
            console.log(`Auto-connect: Found ${devices.length} paired devices.`);
            
            // Prioritize the last used device ID if available
            let printer = devices.find(d => d.id === lastUsedPrinterId);
            
            // Fallback to name-based heuristic
            if (!printer) {
                printer = devices.find(d => 
                    d.name?.toLowerCase().includes('printer') || 
                    d.name?.toLowerCase().includes('pos') ||
                    d.name?.toLowerCase().includes('blue')
                );
            }
            
            if (printer) {
                console.log(`Attempting to auto-connect to: ${printer.name}`);
                if (!printer.gatt?.connected) {
                    setIsConnecting(true);
                    await printer.gatt?.connect();
                    setIsConnecting(false);
                }
                
                // Ensure listener is only added once
                printer.removeEventListener('gattserverdisconnected', onDisconnected);
                printer.addEventListener('gattserverdisconnected', onDisconnected);
                
                setActiveDevice(printer);
                setIsConnected(true);
                return printer;
            }
            return null;
        } catch (err) {
            console.error('Auto-connect error:', err);
            setIsConnecting(false);
            return null;
        }
    }, [lastUsedPrinterId, setActiveDevice, setIsConnecting, setIsConnected, onDisconnected]);

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

            // Setup disconnection listener
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

    const printReceipt = useCallback(async (receipt: PrinterReceiptData, device?: BluetoothDevice): Promise<boolean> => {
        let target = device ?? activeDevice;

        // Auto-reconnect flow
        if (!target && isSupported) {
            console.log('No active device, attempting auto-reconnect...');
            target = await autoConnect();
        }

        // Final fallback if still no device
        if (!target) {
            console.log('No Bluetooth device found, falling back to window.print()');
            window.print();
            return false;
        }

        try {
            setLastError(null);
            
            // Force reconnection if GATT link is dead
            if (!target.gatt?.connected) {
                console.log('Device disconnected, re-establishing GATT session...');
                setIsConnecting(true);
                await target.gatt!.connect();
                setIsConnecting(false);
                setIsConnected(true);
                
                // Re-attach listener
                target.removeEventListener('gattserverdisconnected', onDisconnected);
                target.addEventListener('gattserverdisconnected', onDisconnected);
            }

            let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

            // Use cached characteristic if it's still valid for the current connection
            if (characteristicCache && characteristicCache.service.device.id === target.id && target.gatt?.connected) {
                console.log('Re-using cached characteristic');
                characteristic = characteristicCache;
            } else {
                console.log('Discovering printer services...');
                const server = target.gatt!;
                
                try {
                    const service = await server.getPrimaryService(PRINT_SERVICE_UUID);
                    characteristic = await service.getCharacteristic(PRINT_CHARACTERISTIC_UUID);
                } catch (err) {
                    console.warn('Initial service discovery failed, scanning all services...', err);
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
                
                if (characteristic) {
                    characteristicCache = characteristic;
                }
            }

            if (!characteristic) {
                throw new Error('Printer tidak mendukung protokol ESC/POS atau servis tidak ditemukan.');
            }

            console.log('Generating ESC/POS commands...');
            const data = buildEscPosData(receipt);
            
            // BLE Transmission parameters
            const CHUNK_SIZE = 20; 
            const DELAY_MS = 25; // Sightly faster but still safe

            console.log(`Printing: ${data.length} bytes / ${Math.ceil(data.length / CHUNK_SIZE)} chunks`);

            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                const chunk = data.slice(i, i + CHUNK_SIZE);
                
                try {
                    if (characteristic.properties.writeWithoutResponse) {
                        await characteristic.writeValueWithoutResponse(chunk);
                    } else {
                        await characteristic.writeValue(chunk);
                    }
                } catch (writeErr: any) {
                    // If write fails, clear cache and re-throw
                    characteristicCache = null;
                    throw writeErr;
                }

                if (i + CHUNK_SIZE < data.length) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
                }
            }

            console.log('Print success.');
            return true;
        } catch (err: any) {
            console.error('Bluetooth Print Error:', err);
            
            // If it's a "GATT Operation failed", it usually means a stale connection
            if (err.message?.includes('GATT')) {
                setIsConnected(false);
                characteristicCache = null;
            }
            
            setLastError(err.message || 'Bluetooth Error.');
            setIsConnecting(false);
            throw err;
        }
    }, [activeDevice, isSupported, autoConnect, setIsConnecting, setIsConnected, onDisconnected, setLastError]);

    return { isSupported, connectPrinter, printReceipt, autoConnect, isConnecting, isConnected };
}

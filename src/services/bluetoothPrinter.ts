/**
 * Web Bluetooth Thermal Mini Printer Service
 * Handles automatic discovery, GATT connection, disconnection monitoring,
 * auto-reconnect, and chunked ESC/POS binary data transmission.
 */

// Known thermal printer GATT service UUIDs (standard ESC/POS, SPP-over-BLE, and common Chinese mini printer boards)
export const THERMAL_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard mini thermal printer service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // ESC/POS BLE service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
  '0000fff0-0000-1000-8000-00805f9b34fb', // Generic thermal printer service
  '0000ff00-0000-1000-8000-00805f9b34fb', // Feasycom / GOOJPRT printer
  '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / Ali POS printer
  '0000af30-0000-1000-8000-00805f9b34fb', // Zebra / Portable printer
];

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
}

export type ConnectionStatusListener = (
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error',
  error?: string
) => void;

class BluetoothPrinterService {
  private device: any | null = null;
  private server: any | null = null;
  private characteristic: any | null = null;
  private listeners: Set<ConnectionStatusListener> = new Set();
  private isConnecting: boolean = false;
  private autoReconnect: boolean = true;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeoutId: any = null;
  private lastKnownDeviceName: string = '';
  private lastKnownDeviceId: string = '';

  constructor() {
    try {
      this.lastKnownDeviceName = localStorage.getItem('bt_printer_name') || '';
      this.lastKnownDeviceId = localStorage.getItem('bt_printer_id') || '';
    } catch {
      // LocalStorage access fallback
    }
  }

  /**
   * Check if Web Bluetooth API is supported in the current environment
   */
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public subscribe(listener: ConnectionStatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(
    status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error',
    error?: string
  ) {
    this.listeners.forEach((listener) => {
      try {
        listener(status, error);
      } catch (err) {
        console.error('Error in printer listener:', err);
      }
    });
  }

  public setAutoReconnect(enabled: boolean) {
    this.autoReconnect = enabled;
  }

  public getConnectedDevice(): BluetoothDeviceInfo | null {
    if (this.device && this.server && this.server.connected) {
      return {
        id: this.device.id,
        name: this.device.name || this.lastKnownDeviceName || 'Mini Thermal Printer',
      };
    }
    return null;
  }

  public isConnected(): boolean {
    return Boolean(this.server && this.server.connected && this.characteristic);
  }

  /**
   * Request Bluetooth device via Web Bluetooth picker dialog
   */
  public async requestAndConnect(): Promise<boolean> {
    if (!this.isSupported()) {
      this.notify('error', 'Browser ini belum mendukung Web Bluetooth API.');
      throw new Error('Web Bluetooth tidak didukung pada browser ini. Gunakan Google Chrome / Edge.');
    }

    if (this.isConnecting) return false;
    this.isConnecting = true;
    this.notify('connecting');

    try {
      // Prompt user to select Bluetooth Mini Printer
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: THERMAL_PRINTER_SERVICES,
      });

      if (!device) {
        throw new Error('Tidak ada perangkat printer yang dipilih.');
      }

      this.device = device;
      this.lastKnownDeviceName = device.name || 'Mini Thermal Printer';
      this.lastKnownDeviceId = device.id;

      try {
        localStorage.setItem('bt_printer_name', this.lastKnownDeviceName);
        localStorage.setItem('bt_printer_id', this.lastKnownDeviceId);
      } catch {
        // ignore
      }

      // Attach disconnection listener for automatic connection tracking
      this.attachDeviceListeners(device);

      // Establish GATT connection
      await this.connectGatt(device);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.notify('connected');
      return true;
    } catch (err: any) {
      this.isConnecting = false;
      if (err.name === 'NotFoundError') {
        // User cancelled picker
        this.notify(this.isConnected() ? 'connected' : 'disconnected');
        return false;
      }
      console.error('Bluetooth connection failed:', err);
      this.notify('error', err?.message || 'Gagal menyambungkan ke printer mini.');
      throw err;
    }
  }

  /**
   * Attempt automatic connection to a previously paired printer
   */
  public async tryAutoConnect(): Promise<boolean> {
    if (!this.isSupported() || !this.autoReconnect) return false;
    if (this.isConnected() || this.isConnecting) return false;

    // Check if getDevices() is available (Chrome 85+)
    if (typeof (navigator as any).bluetooth.getDevices === 'function') {
      try {
        const devices = await (navigator as any).bluetooth.getDevices();
        if (devices && devices.length > 0) {
          // Look for previously connected device or first available
          const target = this.lastKnownDeviceId
            ? devices.find((d: any) => d.id === this.lastKnownDeviceId) || devices[0]
            : devices[0];

          if (target) {
            this.isConnecting = true;
            this.notify('reconnecting');
            this.device = target;
            this.attachDeviceListeners(target);
            await this.connectGatt(target);
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.notify('connected');
            return true;
          }
        }
      } catch (err) {
        console.warn('Auto-reconnect via getDevices failed:', err);
      }
    }

    return false;
  }

  /**
   * Internal routine to connect to GATT server and discover writable ESC/POS characteristic
   */
  private async connectGatt(device: any): Promise<void> {
    if (!device.gatt) {
      throw new Error('Perangkat tidak memiliki GATT server.');
    }

    this.server = await device.gatt.connect();

    // Iterate through known services or primary services to find a writable characteristic
    let foundChar: any = null;

    // Attempt 1: Check known printer services first
    for (const serviceUuid of THERMAL_PRINTER_SERVICES) {
      try {
        const service = await this.server.getPrimaryService(serviceUuid);
        if (service) {
          const characteristics = await service.getCharacteristics();
          for (const c of characteristics) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              foundChar = c;
              break;
            }
          }
        }
      } catch {
        // Service not present on this device, continue searching
      }
      if (foundChar) break;
    }

    // Attempt 2: Generic fallback - inspect all primary services if permitted
    if (!foundChar) {
      try {
        const services = await this.server.getPrimaryServices();
        for (const service of services) {
          try {
            const characteristics = await service.getCharacteristics();
            for (const c of characteristics) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                foundChar = c;
                break;
              }
            }
          } catch {
            // continue
          }
          if (foundChar) break;
        }
      } catch {
        // Fallback failed
      }
    }

    if (!foundChar) {
      throw new Error(
        'Karakteristik cetak tidak ditemukan pada printer ini. Pastikan Bluetooth printer menyala dan dalam jangkauan.'
      );
    }

    this.characteristic = foundChar;
  }

  private attachDeviceListeners(device: any) {
    // Remove previous listeners if any
    device.removeEventListener('gattserverdisconnected', this.handleDisconnected);
    device.addEventListener('gattserverdisconnected', this.handleDisconnected);
  }

  private handleDisconnected = () => {
    this.characteristic = null;
    this.server = null;
    console.warn('Mini printer Bluetooth disconnected.');

    if (this.autoReconnect && this.device && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.notify('reconnecting');
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
      
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = setTimeout(async () => {
        try {
          if (this.device) {
            await this.connectGatt(this.device);
            this.reconnectAttempts = 0;
            this.notify('connected');
          }
        } catch {
          this.notify('disconnected');
        }
      }, delay);
    } else {
      this.notify('disconnected');
    }
  };

  /**
   * Explicitly disconnect printer
   */
  public async disconnect(): Promise<void> {
    clearTimeout(this.reconnectTimeoutId);
    this.autoReconnect = false; // prevent immediate reconnect loop
    
    if (this.server && this.server.connected) {
      try {
        this.server.disconnect();
      } catch (err) {
        console.warn('Error during disconnect:', err);
      }
    }

    this.characteristic = null;
    this.server = null;
    this.isConnecting = false;
    this.notify('disconnected');
  }

  /**
   * Send ESC/POS binary data to printer with chunking.
   * Thermal mini printers typically have small BLE buffers (20-100 bytes).
   * Chunking prevents buffer overflows and packet drops!
   */
  public async write(data: Uint8Array): Promise<void> {
    if (!this.isConnected() || !this.characteristic) {
      throw new Error('Printer mini belum tersambung via Bluetooth.');
    }

    const CHUNK_SIZE = 80; // 80 bytes per packet
    const totalBytes = data.length;

    for (let offset = 0; offset < totalBytes; offset += CHUNK_SIZE) {
      const chunk = data.slice(offset, offset + CHUNK_SIZE);
      
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValueWithResponse
          ? await this.characteristic.writeValueWithResponse(chunk)
          : await this.characteristic.writeValue(chunk);
      }

      // Small delay between packets to allow printer buffer to flush
      if (offset + CHUNK_SIZE < totalBytes) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();

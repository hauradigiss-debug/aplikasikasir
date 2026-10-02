import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  PrinterConnectionStatus,
  BluetoothPrinterConfig,
  Order,
  StoreSettings,
} from '../types';
import {
  bluetoothPrinter,
  BluetoothDeviceInfo,
} from '../services/bluetoothPrinter';
import {
  generateReceiptEscPos,
  generateTestReceiptEscPos,
  generateCashDrawerEscPos,
  generateFeedPaperEscPos,
} from '../services/escpos';

export interface VirtualReceiptLog {
  id: string;
  timestamp: string;
  orderNumber?: string;
  title: string;
  paperWidth: '58mm' | '80mm';
  rawBytesLength: number;
  textPreview: string;
}

interface PrinterContextType {
  status: PrinterConnectionStatus;
  device: BluetoothDeviceInfo | null;
  config: BluetoothPrinterConfig;
  isSupported: boolean;
  isPrinting: boolean;
  errorMessage: string | null;
  virtualReceiptLogs: VirtualReceiptLog[];
  isPrinterModalOpen: boolean;
  connectPrinter: () => Promise<boolean>;
  disconnectPrinter: () => Promise<void>;
  printReceipt: (order: Order, settings: StoreSettings) => Promise<boolean>;
  printTestReceipt: (storeName: string) => Promise<boolean>;
  openCashDrawer: () => Promise<boolean>;
  feedPaper: (lines?: number) => Promise<boolean>;
  cutPaper: () => Promise<boolean>;
  sendRawCommand: (bytes: Uint8Array) => Promise<boolean>;
  updateConfig: (patch: Partial<BluetoothPrinterConfig>) => void;
  openPrinterModal: () => void;
  closePrinterModal: () => void;
  clearLogs: () => void;
}

const DEFAULT_CONFIG: BluetoothPrinterConfig = {
  paperWidth: '58mm',
  autoPrintOnCheckout: true,
  autoReconnect: true,
  feedLines: 4,
  openCashDrawerOnPrint: false,
  virtualSimulationMode: false,
};

const PrinterContext = createContext<PrinterContextType | null>(null);

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<PrinterConnectionStatus>('disconnected');
  const [device, setDevice] = useState<BluetoothDeviceInfo | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState<boolean>(false);
  const [virtualReceiptLogs, setVirtualReceiptLogs] = useState<VirtualReceiptLog[]>([]);

  const isSupported = bluetoothPrinter.isSupported();

  // Load config from LocalStorage
  const [config, setConfig] = useState<BluetoothPrinterConfig>(() => {
    try {
      const saved = localStorage.getItem('bt_printer_config');
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  });

  // Save config on change
  const updateConfig = useCallback((patch: Partial<BluetoothPrinterConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('bt_printer_config', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Listen to Bluetooth Service status changes
  useEffect(() => {
    bluetoothPrinter.setAutoReconnect(config.autoReconnect);

    const unsubscribe = bluetoothPrinter.subscribe((newStatus, error) => {
      setStatus(newStatus);
      if (error) {
        setErrorMessage(error);
      } else if (newStatus === 'connected') {
        setErrorMessage(null);
      }

      if (newStatus === 'connected') {
        const connectedDev = bluetoothPrinter.getConnectedDevice();
        setDevice(connectedDev);
        if (connectedDev) {
          updateConfig({
            deviceName: connectedDev.name,
            deviceId: connectedDev.id,
            lastConnected: new Date().toISOString(),
          });
        }
      } else if (newStatus === 'disconnected') {
        setDevice(null);
      }
    });

    // Check if simulation mode is enabled and activate
    if (config.virtualSimulationMode) {
      setStatus('connected');
      setDevice({
        id: 'SIMULATOR-BT-001',
        name: 'Mini Printer RPP02N (Simulasi BT)',
      });
    } else {
      // Try auto connect to previously paired Bluetooth printer on load
      bluetoothPrinter.tryAutoConnect().catch(() => {});
    }

    return () => {
      unsubscribe();
    };
  }, [config.autoReconnect, config.virtualSimulationMode, updateConfig]);

  // Connect handler
  const connectPrinter = useCallback(async (): Promise<boolean> => {
    setErrorMessage(null);

    // If in simulation mode, instantly simulate connection
    if (config.virtualSimulationMode) {
      setStatus('connecting');
      await new Promise((r) => setTimeout(r, 600));
      setStatus('connected');
      setDevice({
        id: 'SIMULATOR-BT-001',
        name: 'Mini Printer RPP02N (Simulasi BT)',
      });
      return true;
    }

    try {
      const success = await bluetoothPrinter.requestAndConnect();
      return success;
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyambungkan Bluetooth printer.');
      return false;
    }
  }, [config.virtualSimulationMode]);

  // Disconnect handler
  const disconnectPrinter = useCallback(async (): Promise<void> => {
    if (config.virtualSimulationMode) {
      setStatus('disconnected');
      setDevice(null);
      return;
    }
    await bluetoothPrinter.disconnect();
    setStatus('disconnected');
    setDevice(null);
  }, [config.virtualSimulationMode]);

  // Record virtual log for inspection and preview
  const addLog = useCallback(
    (title: string, textPreview: string, rawBytesLength: number, orderNumber?: string) => {
      setVirtualReceiptLogs((prev) => [
        {
          id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          timestamp: new Date().toLocaleTimeString('id-ID'),
          title,
          paperWidth: config.paperWidth,
          rawBytesLength,
          textPreview,
          orderNumber,
        },
        ...prev.slice(0, 19), // keep last 20 receipts
      ]);
    },
    [config.paperWidth]
  );

  // Send raw ESC/POS bytes to printer or simulator
  const sendRawCommand = useCallback(
    async (bytes: Uint8Array): Promise<boolean> => {
      if (status !== 'connected' && !config.virtualSimulationMode) {
        setErrorMessage('Printer belum terhubung via Bluetooth.');
        return false;
      }

      setIsPrinting(true);
      try {
        if (config.virtualSimulationMode || !bluetoothPrinter.isConnected()) {
          // Simulation delay
          await new Promise((r) => setTimeout(r, 350));
        } else {
          await bluetoothPrinter.write(bytes);
        }
        setIsPrinting(false);
        return true;
      } catch (err: any) {
        setIsPrinting(false);
        setErrorMessage(err?.message || 'Gagal mengirim perintah ESC/POS.');
        return false;
      }
    },
    [status, config.virtualSimulationMode]
  );

  // Print Receipt for an order
  const printReceipt = useCallback(
    async (order: Order, settings: StoreSettings): Promise<boolean> => {
      setIsPrinting(true);
      setErrorMessage(null);

      try {
        const { bytes, textPreview } = generateReceiptEscPos(
          order,
          settings,
          config.paperWidth,
          {
            feedLines: config.feedLines,
            cut: true,
            openCashDrawer: config.openCashDrawerOnPrint,
          }
        );

        addLog(`Nota #${order.receiptNumber}`, textPreview, bytes.length, order.receiptNumber);

        if (config.virtualSimulationMode || !bluetoothPrinter.isConnected()) {
          // Virtual simulation mode
          await new Promise((r) => setTimeout(r, 450));
        } else {
          // Real Bluetooth printer write
          await bluetoothPrinter.write(bytes);
        }

        setIsPrinting(false);
        return true;
      } catch (err: any) {
        setIsPrinting(false);
        setErrorMessage(err?.message || 'Gagal mencetak struk belanja.');
        return false;
      }
    },
    [config.paperWidth, config.feedLines, config.openCashDrawerOnPrint, config.virtualSimulationMode, addLog]
  );

  // Print Test Receipt
  const printTestReceipt = useCallback(
    async (storeName: string): Promise<boolean> => {
      setIsPrinting(true);
      setErrorMessage(null);

      try {
        const { bytes, textPreview } = generateTestReceiptEscPos(storeName, config.paperWidth);
        addLog('Uji Coba Printer', textPreview, bytes.length);

        if (config.virtualSimulationMode || !bluetoothPrinter.isConnected()) {
          await new Promise((r) => setTimeout(r, 400));
        } else {
          await bluetoothPrinter.write(bytes);
        }

        setIsPrinting(false);
        return true;
      } catch (err: any) {
        setIsPrinting(false);
        setErrorMessage(err?.message || 'Gagal mencetak struk uji coba.');
        return false;
      }
    },
    [config.paperWidth, config.virtualSimulationMode, addLog]
  );

  // Kick cash drawer
  const openCashDrawer = useCallback(async (): Promise<boolean> => {
    const bytes = generateCashDrawerEscPos();
    return sendRawCommand(bytes);
  }, [sendRawCommand]);

  // Feed paper
  const feedPaper = useCallback(
    async (lines: number = 3): Promise<boolean> => {
      const bytes = generateFeedPaperEscPos(lines);
      return sendRawCommand(bytes);
    },
    [sendRawCommand]
  );

  // Cut paper
  const cutPaper = useCallback(async (): Promise<boolean> => {
    const cutBytes = new Uint8Array([0x1d, 0x56, 0x42, 0x00]);
    return sendRawCommand(cutBytes);
  }, [sendRawCommand]);

  const openPrinterModal = useCallback(() => setIsPrinterModalOpen(true), []);
  const closePrinterModal = useCallback(() => setIsPrinterModalOpen(false), []);
  const clearLogs = useCallback(() => setVirtualReceiptLogs([]), []);

  return (
    <PrinterContext.Provider
      value={{
        status,
        device,
        config,
        isSupported,
        isPrinting,
        errorMessage,
        virtualReceiptLogs,
        isPrinterModalOpen,
        connectPrinter,
        disconnectPrinter,
        printReceipt,
        printTestReceipt,
        openCashDrawer,
        feedPaper,
        cutPaper,
        sendRawCommand,
        updateConfig,
        openPrinterModal,
        closePrinterModal,
        clearLogs,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
};

export const usePrinter = (): PrinterContextType => {
  const context = useContext(PrinterContext);
  if (!context) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
};

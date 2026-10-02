export type CategoryType = 'Notebooks' | 'Writing' | 'Accessories' | 'Art Supplies' | 'Paper & Envelopes' | 'Other';

export type UserRole = 'super_admin' | 'manager' | 'cashier' | 'member';

export type MemberTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface Member {
  id: string;
  memberCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  username: string;
  password?: string;
  points: number;
  tier: MemberTier;
  discountRate: number; // e.g. 0.05 for 5%
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  lastLogin?: string;
  memberData?: Member;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: CategoryType;
  price: number;
  costPrice?: number;
  stock: number;
  minStockAlert: number;
  icon: string;
  description?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent?: number;
}

export type PaymentMethod = 'cash' | 'card' | 'qris' | 'transfer';

export interface Order {
  id: string;
  receiptNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  cashierName: string;
  customerName?: string;
  timestamp: string;
  status: 'completed' | 'refunded' | 'voided';
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type PrinterConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
export type PrinterPaperWidth = '58mm' | '80mm';

export interface BluetoothPrinterConfig {
  deviceName?: string;
  deviceId?: string;
  paperWidth: PrinterPaperWidth;
  autoPrintOnCheckout: boolean;
  autoReconnect: boolean;
  feedLines: number;
  openCashDrawerOnPrint: boolean;
  virtualSimulationMode: boolean;
  lastConnected?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  taxRate: number; // e.g. 0.08 for 8%
  currencySymbol: string;
  lowStockThreshold: number;
  receiptFooter: string;
  enableSound: boolean;
  themeMode?: ThemeMode;
  printerConfig?: BluetoothPrinterConfig;
}

export type NavigationTab = 'dashboard' | 'products' | 'cashier' | 'history' | 'categories' | 'members' | 'settings' | 'admin_security';

export type CategoryType = 'Notebooks' | 'Writing' | 'Accessories' | 'Art Supplies' | 'Paper & Envelopes' | 'Other';

export interface Product {
  id: string;
  name: string;
  sku: string;
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
}

export type NavigationTab = 'dashboard' | 'products' | 'cashier' | 'history' | 'categories' | 'settings';

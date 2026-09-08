import { useState, useEffect } from 'react';
import { Product, Order, StoreSettings, NavigationTab, CategoryType, User } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_SETTINGS, INITIAL_USERS } from './data/initialData';
import { NavigationDrawer } from './components/NavigationDrawer';
import { InventoryView } from './components/InventoryView';
import { CashierView } from './components/CashierView';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { CategoryView } from './components/CategoryView';
import { SettingsView } from './components/SettingsView';
import { ProductModal } from './components/ProductModal';
import { StockAdjustModal } from './components/StockAdjustModal';
import { ReceiptModal } from './components/ReceiptModal';
import { LoginView } from './components/LoginView';

const DEFAULT_CATEGORIES: CategoryType[] = [
  'Notebooks',
  'Writing',
  'Accessories',
  'Art Supplies',
  'Paper & Envelopes',
];

export default function App() {
  // Users state for Enterprise RBAC
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('stationery_pos_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        // Ensure super admin haura is always present with password 231
        const hasHaura = parsed.some((u) => u.username.toLowerCase() === 'haura');
        if (!hasHaura) {
          return [...INITIAL_USERS, ...parsed];
        }
        return parsed;
      } catch {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('stationery_pos_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Load state from localStorage or initial seed
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('stationery_pos_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('stationery_pos_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('stationery_pos_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [categories, setCategories] = useState<CategoryType[]>(() => {
    const saved = localStorage.getItem('stationery_pos_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('products');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);
  const [productForStock, setProductForStock] = useState<Product | null>(null);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('stationery_pos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('stationery_pos_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('stationery_pos_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('stationery_pos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('stationery_pos_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('stationery_pos_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('stationery_pos_categories', JSON.stringify(categories));
  }, [categories]);

  // Auth Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // update lastLogin
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u))
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Product CRUD
  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (product: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) => (p.id === product.id ? product : p));
      }
      return [product, ...prev];
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Stock Adjustment
  const handleOpenStockAdjust = (product: Product) => {
    setProductForStock(product);
    setIsStockAdjustOpen(true);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  };

  // Complete POS Sale
  const handleCompleteSale = (newOrder: Order) => {
    // 1. Add order to sales list
    setOrders((prev) => [newOrder, ...prev]);

    // 2. Deduct inventory stock
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = newOrder.items.find((item) => item.product.id === p.id);
        if (cartItem) {
          return {
            ...p,
            stock: Math.max(0, p.stock - cartItem.quantity),
          };
        }
        return p;
      })
    );
  };

  // Refund Order
  const handleRefundOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status === 'refunded') return;

    // Update order status
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'refunded' } : o))
    );

    // Restock items
    setProducts((prev) =>
      prev.map((p) => {
        const item = targetOrder.items.find((i) => i.product.id === p.id);
        if (item) {
          return { ...p, stock: p.stock + item.quantity };
        }
        return p;
      })
    );

    // Update active receipt if currently viewing
    if (activeReceiptOrder?.id === orderId) {
      setActiveReceiptOrder({ ...activeReceiptOrder, status: 'refunded' });
    }
  };

  // Receipt Modal
  const handleOpenReceipt = (order: Order) => {
    setActiveReceiptOrder(order);
    setIsReceiptOpen(true);
  };

  // Category
  const handleAddCategory = (categoryName: CategoryType) => {
    if (!categories.includes(categoryName)) {
      setCategories((prev) => [...prev, categoryName]);
    }
  };

  // Reset Data
  const handleResetData = () => {
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setSettings(INITIAL_SETTINGS);
    setCategories(DEFAULT_CATEGORIES);
    localStorage.removeItem('stationery_pos_products');
    localStorage.removeItem('stationery_pos_orders');
    localStorage.removeItem('stationery_pos_settings');
    localStorage.removeItem('stationery_pos_categories');
  };

  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  // If not authenticated, display enterprise login view
  if (!currentUser) {
    return <LoginView users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col md:flex-row pb-20 md:pb-0 pt-16 md:pt-0 selection:bg-[#d3e4fe]">
      {/* Navigation (Sidebar Desktop & Top/Bottom Bar Mobile) */}
      <NavigationDrawer
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddProduct={handleOpenAddProduct}
        lowStockCount={lowStockCount}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 lg:ml-80 p-4 sm:p-6 lg:p-8 bg-[#f8f9ff] min-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'products' && (
            <InventoryView
              products={products}
              categories={categories}
              settings={settings}
              onAddProduct={handleOpenAddProduct}
              onEditProduct={handleOpenEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onOpenStockAdjust={handleOpenStockAdjust}
            />
          )}

          {activeTab === 'cashier' && (
            <CashierView
              products={products}
              categories={categories}
              settings={settings}
              currentUser={currentUser}
              onCompleteSale={handleCompleteSale}
              onOpenReceipt={handleOpenReceipt}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              products={products}
              orders={orders}
              settings={settings}
              onNavigate={setActiveTab}
              onOpenReceipt={handleOpenReceipt}
              onOpenStockAdjust={handleOpenStockAdjust}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              orders={orders}
              settings={settings}
              onOpenReceipt={handleOpenReceipt}
              onRefundOrder={handleRefundOrder}
            />
          )}

          {activeTab === 'categories' && (
            <CategoryView
              categories={categories}
              products={products}
              settings={settings}
              onAddCategory={handleAddCategory}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              users={users}
              currentUser={currentUser}
              onSaveSettings={setSettings}
              onSaveUsers={setUsers}
              onResetData={handleResetData}
            />
          )}
        </div>
      </main>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        categories={categories}
      />

      {/* Stock Adjust Modal */}
      <StockAdjustModal
        isOpen={isStockAdjustOpen}
        onClose={() => setIsStockAdjustOpen(false)}
        product={productForStock}
        onUpdateStock={handleUpdateStock}
      />

      {/* Thermal Receipt Preview Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={activeReceiptOrder}
        settings={settings}
        onRefund={handleRefundOrder}
      />
    </div>
  );
}

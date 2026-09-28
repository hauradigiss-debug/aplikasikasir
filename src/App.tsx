import { useState, useEffect } from 'react';
import { Product, Order, StoreSettings, NavigationTab, CategoryType, User, Member } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_SETTINGS, INITIAL_USERS, INITIAL_MEMBERS } from './data/initialData';
import { api } from './services/api';
import { NavigationDrawer } from './components/NavigationDrawer';
import { InventoryView } from './components/InventoryView';
import { CashierView } from './components/CashierView';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { CategoryView } from './components/CategoryView';
import { SettingsView } from './components/SettingsView';
import { MemberPortalView } from './components/MemberPortalView';
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

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('stationery_pos_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('products');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);
  const [productForStock, setProductForStock] = useState<Product | null>(null);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  // Sync state with Turso Cloud on mount
  useEffect(() => {
    let isMounted = true;
    api.getBootstrap().then((bootstrap) => {
      if (!isMounted || !bootstrap) return;
      if (bootstrap.products && bootstrap.products.length > 0) {
        setProducts(bootstrap.products);
      }
      if (bootstrap.orders) {
        setOrders(bootstrap.orders);
      }
      if (bootstrap.users && bootstrap.users.length > 0) {
        setUsers(bootstrap.users);
      }
      if (bootstrap.categories && bootstrap.categories.length > 0) {
        setCategories(bootstrap.categories);
      }
      if (bootstrap.settings) {
        setSettings(bootstrap.settings);
      }
      if (bootstrap.members && bootstrap.members.length > 0) {
        setMembers(bootstrap.members);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage as offline fallback
  useEffect(() => {
    localStorage.setItem('stationery_pos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('stationery_pos_members', JSON.stringify(members));
  }, [members]);

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
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u))
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Member Loyalty handlers
  const handleMemberPointEarned = (memberId: string, pointsEarned: number) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const newPoints = m.points + pointsEarned;
          // Sync with Turso DB
          api.updateMember(memberId, { points: newPoints });
          return { ...m, points: newPoints };
        }
        return m;
      })
    );
  };

  const handleMemberCreated = (newMember: Member) => {
    setMembers((prev) => [newMember, ...prev.filter((m) => m.id !== newMember.id)]);
  };

  // Product CRUD (Synced to Turso Cloud)
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
    api.saveProduct(product).catch(console.error);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    api.deleteProduct(productId).catch(console.error);
  };

  // Stock Adjustment (Synced to Turso Cloud)
  const handleOpenStockAdjust = (product: Product) => {
    setProductForStock(product);
    setIsStockAdjustOpen(true);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
    api.adjustStock(productId, newStock).catch(console.error);
  };

  // Complete POS Sale (Atomic transaction with Turso Cloud)
  const handleCompleteSale = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);

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

    api.createOrder(newOrder).catch(console.error);
  };

  // Refund Order
  const handleRefundOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status === 'refunded') return;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'refunded' } : o))
    );

    setProducts((prev) =>
      prev.map((p) => {
        const item = targetOrder.items.find((i) => i.product.id === p.id);
        if (item) {
          const newStk = p.stock + item.quantity;
          api.adjustStock(p.id, newStk).catch(console.error);
          return { ...p, stock: newStk };
        }
        return p;
      })
    );

    if (activeReceiptOrder?.id === orderId) {
      setActiveReceiptOrder({ ...activeReceiptOrder, status: 'refunded' });
    }
  };

  // Receipt Modal
  const handleOpenReceipt = (order: Order) => {
    setActiveReceiptOrder(order);
    setIsReceiptOpen(true);
  };

  // Categories
  const handleAddCategory = (categoryName: CategoryType) => {
    if (!categories.includes(categoryName)) {
      const updated = [...categories, categoryName];
      setCategories(updated);
      api.saveCategories(updated).catch(console.error);
    }
  };

  // Settings & Users Sync
  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    api.saveSettings(newSettings).catch(console.error);
  };

  const handleSaveUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    for (const u of newUsers) {
      api.saveUser(u).catch(console.error);
    }
  };

  // Reset Data (Resets and re-seeds Turso Cloud)
  const handleResetData = async () => {
    await api.resetDatabase();
    const fresh = await api.getBootstrap();
    if (fresh) {
      setProducts(fresh.products);
      setOrders(fresh.orders);
      setSettings(fresh.settings);
      setCategories(fresh.categories);
      setUsers(fresh.users);
    } else {
      setProducts(INITIAL_PRODUCTS);
      setOrders(INITIAL_ORDERS);
      setSettings(INITIAL_SETTINGS);
      setCategories(DEFAULT_CATEGORIES);
    }
    localStorage.removeItem('stationery_pos_products');
    localStorage.removeItem('stationery_pos_orders');
    localStorage.removeItem('stationery_pos_settings');
    localStorage.removeItem('stationery_pos_categories');
  };

  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  // If not authenticated, display enterprise login view
  if (!currentUser) {
    return (
      <LoginView
        users={users}
        members={members}
        onLogin={handleLogin}
        onMemberCreated={handleMemberCreated}
      />
    );
  }

  // If authenticated user is a Member, show the Member Loyalty Portal
  if (currentUser.role === 'member') {
    const activeMember =
      currentUser.memberData ||
      members.find((m) => m.id === currentUser.id || m.username === currentUser.username) ||
      members[0];

    return (
      <MemberPortalView
        member={activeMember}
        orders={orders}
        settings={settings}
        onLogout={handleLogout}
        onOpenCashier={() => {
          const cashierUser = users.find((u) => u.role === 'cashier') || users[0];
          setCurrentUser(cashierUser);
          setActiveTab('cashier');
        }}
      />
    );
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
              members={members}
              onMemberPointEarned={handleMemberPointEarned}
              onCompleteSale={handleCompleteSale}
              onOpenReceipt={handleOpenReceipt}
            />
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-[#c5c5d3]/70 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0b1c30]">Member Loyalty Management</h1>
                  <p className="text-xs text-[#757682] mt-0.5">
                    Data keanggotaan pelanggan, poin belanja, dan barcode digital tersinkron dengan database Turso.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const sampleMember = members[0];
                    if (sampleMember) {
                      setCurrentUser({
                        id: sampleMember.id,
                        username: sampleMember.username,
                        fullName: sampleMember.fullName,
                        role: 'member',
                        avatar: sampleMember.avatar,
                        memberData: sampleMember,
                      });
                    }
                  }}
                  className="px-4 py-2.5 bg-[#00236f] hover:bg-[#12398c] text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">badge</span>
                  <span>Buka Portal Member</span>
                </button>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl p-5 border border-[#c5c5d3]/70 shadow-xs hover:border-[#00236f]/40 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase bg-amber-100 text-amber-900 border border-amber-300">
                          {m.tier} Member
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                          {Math.round(m.discountRate * 100)}% Diskon
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-[#0b1c30]">{m.fullName}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">@{m.username}</p>

                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Kode Member:</span>
                          <span className="font-mono font-bold text-[#00236f]">{m.memberCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Poin Hadiah:</span>
                          <span className="font-bold text-amber-700">{m.points} Pts</span>
                        </div>
                        {m.phone && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">No. WhatsApp:</span>
                            <span className="font-mono text-slate-700">{m.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Barcode aktif di Kasir</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentUser({
                            id: m.id,
                            username: m.username,
                            fullName: m.fullName,
                            role: 'member',
                            avatar: m.avatar,
                            memberData: m,
                          });
                        }}
                        className="text-xs font-bold text-[#00236f] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Lihat Kartu</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              onSaveSettings={handleSaveSettings}
              onSaveUsers={handleSaveUsers}
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

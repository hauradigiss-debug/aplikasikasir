import React from 'react';
import { NavigationTab, User } from '../types';

interface NavigationProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onAddProduct: () => void;
  lowStockCount: number;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const NavigationDrawer: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  currentUser,
  onLogout,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: 'analytics', badge: 0 },
    { id: 'products' as NavigationTab, label: 'Inventory', icon: 'package_2', badge: lowStockCount },
    { id: 'cashier' as NavigationTab, label: 'Cashier / POS', icon: 'point_of_sale', badge: 0 },
    { id: 'history' as NavigationTab, label: 'Sales Report', icon: 'receipt_long', badge: 0 },
    { id: 'categories' as NavigationTab, label: 'Category Setup', icon: 'category', badge: 0 },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: 'settings', badge: 0 },
  ];

  const roleLabel = currentUser?.role === 'super_admin'
    ? 'Super Admin'
    : currentUser?.role === 'manager'
    ? 'Manager'
    : 'Cashier';

  return (
    <>
      {/* Desktop Navigation Drawer (Sidebar) */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full z-40 py-6 w-72 lg:w-80 rounded-r-xl border-r border-[#c5c5d3]/50 shadow-sm bg-white select-none">
        {/* Brand Header */}
        <div className="px-6 lg:px-8 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-[#d3e4fe] flex items-center justify-center text-[#00236f] shadow-sm">
              <span className="material-symbols-outlined text-2xl icon-fill">edit_note</span>
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#00236f] tracking-tight leading-tight">
                StationeryPOS
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs font-semibold text-[#00236f]">{roleLabel} Mode</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#e5eeff]">
            <p className="text-xs font-medium text-[#757682]">v1.0.4 • Ready</p>
            <span className="text-[11px] font-semibold bg-[#eff4ff] text-[#00236f] px-2 py-0.5 rounded-full">
              Terminal #01
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between text-left w-full px-4 py-3 rounded-full transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-[#1e3a8a] text-white shadow-sm font-semibold translate-x-1'
                    : 'text-[#444651] hover:bg-[#eff4ff] hover:text-[#00236f]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`material-symbols-outlined text-[22px] transition-transform group-hover:scale-105 ${
                      isActive ? 'icon-fill text-[#90a8ff]' : 'text-[#757682]'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[15px] font-medium tracking-tight">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Shift / User summary with Logout */}
        <div className="mx-4 mt-auto p-3.5 bg-[#f8f9ff] border border-[#d3e4fe]/80 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#00236f] uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-[#d3e4fe]">
              {currentUser?.role === 'super_admin' ? 'SUPER ADMIN' : 'REGISTER POS'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#00236f] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {currentUser?.fullName?.charAt(0) || 'H'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0b1c30] truncate">
                  {currentUser?.fullName || 'Haura'}
                </p>
                <p className="text-[11px] text-[#757682] truncate">@{currentUser?.username || 'haura'}</p>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Keluar / Logout"
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Slide-out Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="fixed top-0 bottom-0 left-0 w-4/5 max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e5eeff]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[#00236f]">
                    <span className="material-symbols-outlined text-2xl icon-fill">edit_note</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-[#00236f]">StationeryPOS</h2>
                    <p className="text-xs text-[#757682]">Terminal #01</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-full text-[#757682] hover:bg-gray-100"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`flex items-center justify-between text-left w-full px-4 py-3 rounded-full transition-all ${
                        isActive
                          ? 'bg-[#1e3a8a] text-white font-semibold'
                          : 'text-[#444651] hover:bg-[#eff4ff]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {item.badge > 0 && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 bg-[#f8f9ff] border border-[#d3e4fe] rounded-xl text-xs text-[#444651] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#00236f]">
                  {currentUser?.role === 'super_admin' ? 'SUPER ADMIN' : 'STAF KASIR'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-[#0b1c30]">{currentUser?.fullName || 'Haura'}</p>
                  <p className="text-[11px] text-[#757682]">@{currentUser?.username || 'haura'}</p>
                </div>
                {onLogout && (
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onLogout();
                    }}
                    className="px-3 py-1 bg-red-50 text-red-700 font-semibold rounded-lg flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Keluar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top AppBar */}
      <header className="md:hidden flex justify-between items-center w-full px-4 h-16 bg-white border-b border-[#c5c5d3]/50 fixed top-0 left-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-1.5 rounded-lg text-[#00236f] hover:bg-[#eff4ff] transition-colors"
            aria-label="Open Navigation Menu"
          >
            <span className="material-symbols-outlined text-[26px]">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] icon-fill text-2xl">edit_note</span>
            <h1 className="text-xl font-bold text-[#00236f] tracking-tight">StationeryPOS</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full flex items-center gap-1"
              title="Keluar"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Keluar
            </button>
          )}
          <button
            onClick={() => setActiveTab('settings')}
            className="w-9 h-9 rounded-full overflow-hidden bg-[#d3e4fe] flex items-center justify-center text-[#00236f] hover:opacity-90 transition-opacity font-bold text-xs"
            title="Profile & Settings"
          >
            {currentUser?.fullName?.charAt(0) || <span className="material-symbols-outlined text-lg">person</span>}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center h-20 px-2 pb-2 bg-white border-t border-[#c5c5d3]/50 shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'dashboard' ? 'text-[#00236f] font-bold' : 'text-[#444651] hover:text-[#00236f]'
          }`}
        >
          <span className={`material-symbols-outlined mb-0.5 text-2xl ${activeTab === 'dashboard' ? 'icon-fill' : ''}`}>
            dashboard
          </span>
          <span className="text-[11px] font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('cashier')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'cashier' ? 'text-[#00236f] font-bold' : 'text-[#444651] hover:text-[#00236f]'
          }`}
        >
          <span className={`material-symbols-outlined mb-0.5 text-2xl ${activeTab === 'cashier' ? 'icon-fill' : ''}`}>
            point_of_sale
          </span>
          <span className="text-[11px] font-medium">Cashier</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-full ${
            activeTab === 'products'
              ? 'bg-[#1e3a8a] text-white px-3 py-1.5 shadow-sm scale-95'
              : 'text-[#444651] hover:text-[#00236f]'
          }`}
        >
          <span className={`material-symbols-outlined mb-0.5 text-2xl ${activeTab === 'products' ? 'icon-fill text-[#90a8ff]' : ''}`}>
            inventory_2
          </span>
          <span className="text-[11px] font-bold">Products</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'history' ? 'text-[#00236f] font-bold' : 'text-[#444651] hover:text-[#00236f]'
          }`}
        >
          <span className={`material-symbols-outlined mb-0.5 text-2xl ${activeTab === 'history' ? 'icon-fill' : ''}`}>
            history
          </span>
          <span className="text-[11px] font-medium">History</span>
        </button>
      </nav>
    </>
  );
};

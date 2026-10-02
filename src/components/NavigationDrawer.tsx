import React from 'react';
import { NavigationTab, User } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { PrinterStatusPill } from './PrinterStatusPill';

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
    { id: 'members' as NavigationTab, label: 'Member Loyalty', icon: 'card_membership', badge: 0 },
    { id: 'history' as NavigationTab, label: 'Sales Report', icon: 'receipt_long', badge: 0 },
    { id: 'categories' as NavigationTab, label: 'Category Setup', icon: 'category', badge: 0 },
    ...(currentUser?.role === 'super_admin'
      ? [
          {
            id: 'admin_security' as NavigationTab,
            label: 'CRUD Password Admin',
            icon: 'shield_lock',
            badge: 0,
            special: true,
          },
        ]
      : []),
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
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full z-40 py-6 w-72 lg:w-80 rounded-r-xl border-r border-[#c5c5d3]/50 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 select-none transition-colors duration-200">
        {/* Brand Header */}
        <div className="px-6 lg:px-8 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-[#d3e4fe] dark:bg-slate-800 flex items-center justify-center text-[#00236f] dark:text-blue-400 shadow-sm">
              <span className="material-symbols-outlined text-2xl icon-fill">edit_note</span>
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#00236f] dark:text-blue-300 tracking-tight leading-tight">
                StationeryPOS
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs font-semibold text-[#00236f] dark:text-blue-200">{roleLabel} Mode</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#e5eeff] dark:border-slate-800">
            <p className="text-xs font-medium text-[#757682] dark:text-slate-400">v1.0.4 • Ready</p>
            <span className="text-[11px] font-semibold bg-[#eff4ff] dark:bg-slate-800 text-[#00236f] dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-100 dark:border-slate-700">
              Terminal #01
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between text-left w-full px-4 py-2.5 rounded-xl transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-[#1e3a8a] dark:bg-blue-600 text-white shadow-sm font-semibold translate-x-1'
                    : 'text-[#444651] dark:text-slate-300 hover:bg-[#eff4ff] dark:hover:bg-slate-800 hover:text-[#00236f] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`material-symbols-outlined text-[22px] transition-transform group-hover:scale-105 ${
                      isActive ? 'icon-fill text-[#90a8ff] dark:text-blue-200' : 'text-[#757682] dark:text-slate-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[14px] font-medium tracking-tight">{item.label}</span>
                </div>
                {(item as any).special && (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-amber-300 text-amber-950 font-bold'
                        : 'bg-blue-100 dark:bg-blue-900/60 text-[#00236f] dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                    }`}
                  >
                    Admin
                  </span>
                )}
                {item.badge > 0 && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bluetooth Mini Printer Quick Status in Desktop Sidebar */}
        <div className="px-4 mb-2">
          <PrinterStatusPill variant="sidebar" />
        </div>

        {/* Theme Mode Switcher in Desktop Sidebar */}
        <div className="px-4 mb-3 pt-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 px-1">
            <span>Tema Tampilan</span>
          </div>
          <ThemeToggle variant="segmented" />
        </div>

        {/* Quick Shift / User summary with Logout */}
        <div className="mx-4 mt-auto p-3 bg-[#f8f9ff] dark:bg-slate-800/80 border border-[#d3e4fe]/80 dark:border-slate-700/80 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            {currentUser?.role === 'super_admin' ? (
              <button
                type="button"
                onClick={() => setActiveTab('admin_security')}
                className="text-[10px] font-bold text-[#00236f] dark:text-blue-300 hover:bg-[#d3e4fe] dark:hover:bg-slate-700 uppercase tracking-wider bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-[#d3e4fe] dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="Buka Menu CRUD Password Super Admin"
              >
                <span className="material-symbols-outlined text-[13px]">shield_lock</span>
                <span>SUPER ADMIN</span>
              </button>
            ) : (
              <span className="text-[10px] font-bold text-[#00236f] dark:text-blue-300 uppercase tracking-wider bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-[#d3e4fe] dark:border-slate-700">
                REGISTER POS
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#00236f] dark:bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {currentUser?.fullName?.charAt(0) || 'H'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#0b1c30] dark:text-slate-100 truncate">
                  {currentUser?.fullName || 'Haura'}
                </p>
                <p className="text-[11px] text-[#757682] dark:text-slate-400 truncate">@{currentUser?.username || 'haura'}</p>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Keluar / Logout"
                className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#d3e4fe]/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-[#5a6072] dark:text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Turso DB
            </span>
            <span className="text-[#00236f] dark:text-blue-300 font-semibold truncate max-w-[130px]">mykasirdb (Tokyo)</span>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-out Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="fixed top-0 bottom-0 left-0 w-4/5 max-w-xs bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e5eeff] dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#d3e4fe] dark:bg-slate-800 flex items-center justify-center text-[#00236f] dark:text-blue-300">
                    <span className="material-symbols-outlined text-2xl icon-fill">edit_note</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-[#00236f] dark:text-blue-300">StationeryPOS</h2>
                    <p className="text-xs text-[#757682] dark:text-slate-400">Terminal #01</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-full text-[#757682] dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Printer Status in Mobile Drawer */}
              <div className="mb-3">
                <PrinterStatusPill variant="sidebar" />
              </div>

              {/* Theme Toggle in Mobile Drawer */}
              <div className="mb-4">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Tema Tampilan</p>
                <ThemeToggle variant="segmented" />
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
                      className={`flex items-center justify-between text-left w-full px-4 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? 'bg-[#1e3a8a] dark:bg-blue-600 text-white font-semibold'
                          : 'text-[#444651] dark:text-slate-300 hover:bg-[#eff4ff] dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {(item as any).special && (
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-amber-300 text-amber-950 font-bold'
                              : 'bg-blue-100 dark:bg-blue-900/60 text-[#00236f] dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                          }`}
                        >
                          Admin
                        </span>
                      )}
                      {item.badge > 0 && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
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

            <div className="p-3.5 bg-[#f8f9ff] dark:bg-slate-800/80 border border-[#d3e4fe] dark:border-slate-700 rounded-xl text-xs text-[#444651] dark:text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#00236f] dark:text-blue-300">
                  {currentUser?.role === 'super_admin' ? 'SUPER ADMIN' : 'STAF KASIR'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-[#0b1c30] dark:text-slate-100">{currentUser?.fullName || 'Haura'}</p>
                  <p className="text-[11px] text-[#757682] dark:text-slate-400">@{currentUser?.username || 'haura'}</p>
                </div>
                {onLogout && (
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onLogout();
                    }}
                    className="px-3 py-1 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-semibold rounded-lg flex items-center gap-1"
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
      <header className="md:hidden flex justify-between items-center w-full px-4 h-16 bg-white dark:bg-slate-900 border-b border-[#c5c5d3]/50 dark:border-slate-800 fixed top-0 left-0 z-40 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-1.5 rounded-lg text-[#00236f] dark:text-blue-300 hover:bg-[#eff4ff] dark:hover:bg-slate-800 transition-colors"
            aria-label="Open Navigation Menu"
          >
            <span className="material-symbols-outlined text-[26px]">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] dark:text-blue-400 icon-fill text-2xl">edit_note</span>
            <h1 className="text-xl font-bold text-[#00236f] dark:text-blue-300 tracking-tight">StationeryPOS</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Printer Status for Mobile Header */}
          <PrinterStatusPill variant="compact" />

          {/* Quick Theme Toggle for Mobile Header */}
          <ThemeToggle variant="compact" />

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-full flex items-center gap-1"
              title="Keluar"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="hidden xs:inline">Keluar</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('settings')}
            className="w-9 h-9 rounded-full overflow-hidden bg-[#d3e4fe] dark:bg-slate-800 flex items-center justify-center text-[#00236f] dark:text-blue-300 hover:opacity-90 transition-opacity font-bold text-xs"
            title="Profile & Settings"
          >
            {currentUser?.fullName?.charAt(0) || <span className="material-symbols-outlined text-lg">person</span>}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center h-20 px-2 pb-2 bg-white dark:bg-slate-900 border-t border-[#c5c5d3]/50 dark:border-slate-800 shadow-lg transition-colors">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'dashboard' ? 'text-[#00236f] dark:text-blue-400 font-bold' : 'text-[#444651] dark:text-slate-400 hover:text-[#00236f]'
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
            activeTab === 'cashier' ? 'text-[#00236f] dark:text-blue-400 font-bold' : 'text-[#444651] dark:text-slate-400 hover:text-[#00236f]'
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
              ? 'bg-[#1e3a8a] dark:bg-blue-600 text-white px-3 py-1.5 shadow-sm scale-95'
              : 'text-[#444651] dark:text-slate-400 hover:text-[#00236f]'
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
            activeTab === 'history' ? 'text-[#00236f] dark:text-blue-400 font-bold' : 'text-[#444651] dark:text-slate-400 hover:text-[#00236f]'
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


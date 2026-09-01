import React from 'react';
import { NavigationTab } from '../types';

interface NavigationProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onAddProduct: () => void;
  lowStockCount: number;
}

export const NavigationDrawer: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
}) => {
  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: 'analytics', badge: 0 },
    { id: 'products' as NavigationTab, label: 'Inventory', icon: 'package_2', badge: lowStockCount },
    { id: 'cashier' as NavigationTab, label: 'Cashier / POS', icon: 'point_of_sale', badge: 0 },
    { id: 'history' as NavigationTab, label: 'Sales Report', icon: 'receipt_long', badge: 0 },
    { id: 'categories' as NavigationTab, label: 'Category Setup', icon: 'category', badge: 0 },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: 'settings', badge: 0 },
  ];

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
              <h2 className="font-semibold text-lg text-[#00236f] tracking-tight leading-tight">
                Stationery Hub
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs font-medium text-[#444651]">Admin Mode</p>
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

        {/* Quick Shift summary */}
        <div className="mx-4 mt-auto p-3.5 bg-[#f8f9ff] border border-[#d3e4fe]/80 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#00236f] uppercase tracking-wider">Active Register</span>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
          </div>
          <p className="text-xs text-[#444651]">Cashier: <span className="font-semibold text-[#0b1c30]">Sarah J.</span></p>
          <p className="text-[11px] text-[#757682] mt-0.5">Shift started: 08:30 AM</p>
        </div>
      </aside>

      {/* Mobile Top AppBar */}
      <header className="md:hidden flex justify-between items-center w-full px-4 h-16 bg-white border-b border-[#c5c5d3]/50 fixed top-0 left-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(activeTab === 'products' ? 'dashboard' : 'products')}
            className="p-1 rounded-md text-[#00236f] hover:bg-[#eff4ff]"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-[26px]">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] icon-fill text-2xl">edit_note</span>
            <h1 className="text-xl font-bold text-[#00236f] tracking-tight">StationeryPOS</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className="w-9 h-9 rounded-full overflow-hidden bg-[#d3e4fe] flex items-center justify-center text-[#00236f] hover:opacity-90"
            title="Profile & Settings"
          >
            <span className="material-symbols-outlined text-lg">person</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-2 pb-2 bg-white border-t border-[#c5c5d3]/50 shadow-lg">
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

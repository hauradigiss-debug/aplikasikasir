import React from 'react';
import { Product, Order, StoreSettings, NavigationTab } from '../types';
import { formatCurrency } from '../utils';

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  onNavigate: (tab: NavigationTab) => void;
  onOpenReceipt: (order: Order) => void;
  onOpenStockAdjust: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  orders,
  settings,
  onNavigate,
  onOpenReceipt,
  onOpenStockAdjust,
}) => {
  // Aggregate KPI metrics
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalItemsSold = completedOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const averageTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const lowStockItems = products.filter((p) => p.stock <= p.minStockAlert);
  const outOfStockItems = products.filter((p) => p.stock === 0);

  // Sales by Category
  const categorySalesMap: Record<string, number> = {};
  completedOrders.forEach((ord) => {
    ord.items.forEach((item) => {
      const cat = item.product.category || 'Other';
      categorySalesMap[cat] = (categorySalesMap[cat] || 0) + item.product.price * item.quantity;
    });
  });

  const categorySalesList = Object.entries(categorySalesMap).sort((a, b) => b[1] - a[1]);
  const maxCategorySales = categorySalesList.length > 0 ? Math.max(...categorySalesList.map((c) => c[1])) : 1;

  // Mock 7-day sales breakdown
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const daySales = [184.5, 240.0, 195.8, 310.2, 425.0, 580.4, totalRevenue || 340.0];
  const maxDaySale = Math.max(...daySales);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-[#444651] mt-1">
            Real-time sales velocity, revenue metrics, and inventory health
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('cashier')}
            className="bg-[#00236f] hover:bg-[#1e3a8a] text-white text-sm font-semibold h-11 px-5 rounded-full shadow-sm flex items-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
            Open Cashier Register
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="bg-white p-5 rounded-xl border border-[#c5c5d3]/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5a6072]">Total Penjualan</span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#00236f] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">attach_money</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#00236f] tracking-tight">
              {formatCurrency(totalRevenue, settings.currencySymbol)}
            </h3>
            <p className="text-xs text-[#5a6072] mt-1">
              Dari {completedOrders.length} transaksi selesai
            </p>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white p-5 rounded-xl border border-[#c5c5d3]/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5a6072]">Total Transaksi</span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#00236f] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">receipt</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
              {completedOrders.length}
            </h3>
            <p className="text-xs text-[#5a6072] mt-1">
              Rata-rata: <strong>{formatCurrency(averageTicket, settings.currencySymbol)}</strong>
            </p>
          </div>
        </div>

        {/* Items Sold */}
        <div className="bg-white p-5 rounded-xl border border-[#c5c5d3]/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5a6072]">Unit Terjual</span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#00236f] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">shopping_bag</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
              {totalItemsSold}
            </h3>
            <p className="text-xs text-[#5a6072] mt-1">Produk alat tulis terjual</p>
          </div>
        </div>

        {/* Stock Alert Warning */}
        <div
          onClick={() => onNavigate('products')}
          className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            lowStockItems.length > 0
              ? 'bg-[#fef7e0]/70 border-[#b06000]/40 hover:bg-[#fef7e0]'
              : 'bg-white border-[#c5c5d3]/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#b06000]">Peringatan Stok</span>
            <div className="w-8 h-8 rounded-lg bg-amber-200 text-[#b06000] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">warning</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#b06000] tracking-tight">
              {lowStockItems.length}
            </h3>
            <p className="text-xs text-[#b06000] font-semibold mt-1">
              {outOfStockItems.length} produk habis
            </p>
          </div>
        </div>
      </div>

      {/* Middle Grid: Weekly Sales Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#c5c5d3]/60 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-[#0b1c30]">Weekly Sales Performance</h3>
              <p className="text-xs text-[#757682]">Daily revenue for the current 7-day cycle</p>
            </div>
            <span className="text-xs font-bold bg-[#eff4ff] text-[#00236f] px-3 py-1 rounded-full">
              Past 7 Days
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
            {daysOfWeek.map((day, idx) => {
              const val = daySales[idx];
              const heightPercent = Math.max(15, (val / maxDaySale) * 100);
              const isToday = idx === daysOfWeek.length - 1;

              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[11px] font-bold text-[#00236f] opacity-0 group-hover:opacity-100 transition-opacity">
                    ${Math.round(val)}
                  </span>
                  <div className="w-full max-w-[38px] bg-[#eff4ff] rounded-t-lg relative flex items-end h-32 overflow-hidden">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday ? 'bg-[#00236f]' : 'bg-[#1e3a8a] group-hover:bg-[#00236f]'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isToday ? 'text-[#00236f] font-bold' : 'text-[#757682]'
                    }`}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Revenue Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-[#c5c5d3]/60 shadow-xs flex flex-col">
          <h3 className="text-base font-bold text-[#0b1c30] mb-1">Penjualan per Kategori</h3>
          <p className="text-xs text-[#757682] mb-5">Distribusi omset berdasarkan rumpun produk</p>

          <div className="space-y-4 flex-1">
            {categorySalesList.map(([cat, amount]) => {
              const pct = Math.round((amount / maxCategorySales) * 100);
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#0b1c30]">{cat}</span>
                    <span className="text-[#00236f]">
                      {formatCurrency(amount, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="w-full bg-[#f1f3f4] h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-[#00236f] h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Low Stock Alert Actions & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Stock List */}
        <div className="bg-white p-6 rounded-xl border border-[#c5c5d3]/60 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b06000] text-xl">warning</span>
              <h3 className="text-base font-bold text-[#0b1c30]">Perlu Restok Segera</h3>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-semibold text-[#00236f] hover:underline"
            >
              Lihat Semua Produk
            </button>
          </div>

          <div className="divide-y divide-[#f1f3f4]">
            {lowStockItems.slice(0, 4).map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-xs text-[#0b1c30]">{p.name}</h4>
                  <p className="text-[11px] text-[#757682] font-mono">
                    SKU: {p.sku} • Sisa: <strong className="text-[#ba1a1a]">{p.stock} {p.unit}</strong>
                  </p>
                </div>
                <button
                  onClick={() => onOpenStockAdjust(p)}
                  className="px-2.5 h-7 text-xs font-medium bg-[#f8f9ff] hover:bg-[#eff4ff] border border-[#c5c5d3] text-[#00236f] rounded"
                >
                  Atur Stok
                </button>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <div className="py-8 text-center text-xs text-emerald-800 font-medium">
                Semua level stok inventaris mencukupi.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white p-6 rounded-xl border border-[#c5c5d3]/60 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00236f] text-xl">receipt_long</span>
              <h3 className="text-base font-bold text-[#0b1c30]">Transaksi Terakhir</h3>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-[#00236f] hover:underline"
            >
              Riwayat Lengkap
            </button>
          </div>
          <div className="divide-y divide-[#f1f3f4]">
            {orders.slice(0, 4).map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0b1c30]">{ord.receiptNumber}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 uppercase text-[#444651]">
                      {ord.paymentMethod}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#757682] mt-0.5">
                    {new Date(ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {ord.items.length} item • {ord.customerName || 'Walk-in'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#00236f]">
                    {formatCurrency(ord.total, settings.currencySymbol)}
                  </span>
                  <button
                    onClick={() => onOpenReceipt(ord)}
                    className="w-8 h-8 rounded-full bg-[#f8f9ff] hover:bg-[#d3e4fe] flex items-center justify-center text-[#00236f]"
                    title="Lihat Struk"
                  >
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </button>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="py-8 text-center text-xs text-[#757682]">
                Belum ada transaksi tercatat hari ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

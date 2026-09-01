import React, { useState, useMemo } from 'react';
import { Order, StoreSettings } from '../types';
import { formatCurrency } from '../utils';

interface HistoryViewProps {
  orders: Order[];
  settings: StoreSettings;
  onOpenReceipt: (order: Order) => void;
  onRefundOrder: (orderId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  orders,
  settings,
  onOpenReceipt,
  onRefundOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.receiptNumber.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        o.items.some((i) => i.product.name.toLowerCase().includes(q));

      const matchesPayment = paymentFilter === 'all' || o.paymentMethod === paymentFilter;
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [orders, searchQuery, paymentFilter, statusFilter]);

  const totalFilteredSales = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);
  }, [filteredOrders]);

  const handleExportCSV = () => {
    const headers = ['Receipt #', 'Date', 'Cashier', 'Customer', 'Items Count', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment', 'Status'];
    const rows = filteredOrders.map((o) => [
      o.receiptNumber,
      new Date(o.timestamp).toLocaleString(),
      o.cashierName,
      o.customerName || 'Walk-in',
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.subtotal.toFixed(2),
      o.tax.toFixed(2),
      o.discount.toFixed(2),
      o.total.toFixed(2),
      o.paymentMethod.toUpperCase(),
      o.status.toUpperCase(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stationery_sales_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">Sales Report</h1>
          <p className="text-sm text-[#444651] mt-1">
            Complete transaction ledger, audit receipts, and cashier settlements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 h-11 bg-white hover:bg-[#eff4ff] border border-[#c5c5d3] text-[#00236f] font-semibold text-xs rounded-full shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Sales Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#c5c5d3]/60 shadow-xs">
          <span className="text-xs font-bold text-[#757682] uppercase">Period Net Revenue</span>
          <h3 className="text-2xl font-bold text-[#00236f] mt-1">
            {formatCurrency(totalFilteredSales, settings.currencySymbol)}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#c5c5d3]/60 shadow-xs">
          <span className="text-xs font-bold text-[#757682] uppercase">Transactions Recorded</span>
          <h3 className="text-2xl font-bold text-[#0b1c30] mt-1">{filteredOrders.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#c5c5d3]/60 shadow-xs">
          <span className="text-xs font-bold text-[#757682] uppercase">Refunded Transactions</span>
          <h3 className="text-2xl font-bold text-amber-700 mt-1">
            {filteredOrders.filter((o) => o.status === 'refunded').length}
          </h3>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by receipt #, customer name, or item..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] outline-none placeholder:text-[#757682]"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-11 px-3 bg-white border border-[#c5c5d3] rounded-lg text-xs font-medium text-[#0b1c30] focus:border-[#00236f] outline-none"
          >
            <option value="all">All Payment Types</option>
            <option value="cash">Cash</option>
            <option value="card">Card / Terminal</option>
            <option value="qris">QRIS / Digital</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-3 bg-white border border-[#c5c5d3] rounded-lg text-xs font-medium text-[#0b1c30] focus:border-[#00236f] outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#c5c5d3]/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9ff] border-b border-[#e5eeff] text-[11px] font-bold text-[#757682] uppercase tracking-wider">
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4] text-xs">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#00236f]">
                    {ord.receiptNumber}
                  </td>
                  <td className="py-3 px-4 text-[#444651]">
                    {new Date(ord.timestamp).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    <span className="text-[11px] text-[#757682]">
                      {new Date(ord.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#0b1c30]">
                    {ord.customerName || 'Walk-in'}
                  </td>
                  <td className="py-3 px-4 text-[#444651]">
                    {ord.items.reduce((s, i) => s + i.quantity, 0)} units
                  </td>
                  <td className="py-3 px-4">
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-[#444651]">
                      {ord.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#00236f]">
                    {formatCurrency(ord.total, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        ord.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onOpenReceipt(ord)}
                        className="p-1.5 rounded-lg text-[#00236f] hover:bg-[#eff4ff]"
                        title="View / Print Receipt"
                      >
                        <span className="material-symbols-outlined text-[18px]">receipt</span>
                      </button>
                      {ord.status === 'completed' && (
                        <button
                          onClick={() => {
                            if (confirm(`Refund receipt ${ord.receiptNumber}?`)) {
                              onRefundOrder(ord.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-[#757682] hover:text-[#ba1a1a] hover:bg-red-50"
                          title="Refund"
                        >
                          <span className="material-symbols-outlined text-[18px]">undo</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#757682]">
                    No transactions match your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

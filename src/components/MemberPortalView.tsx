import React, { useState } from 'react';
import { Member, Order, StoreSettings } from '../types';
import { formatCurrency } from '../utils';
import { BarcodeRenderer } from './BarcodeRenderer';

interface MemberPortalViewProps {
  member: Member;
  orders: Order[];
  settings: StoreSettings;
  onLogout: () => void;
  onOpenCashier?: () => void;
}

export const MemberPortalView: React.FC<MemberPortalViewProps> = ({
  member,
  orders,
  settings,
  onLogout,
  onOpenCashier,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'history' | 'rewards'>('card');
  const [copiedCode, setCopiedCode] = useState(false);

  // Filter orders matching member name or member code
  const memberOrders = orders.filter((o) => {
    if (!o.customerName) return false;
    const lowerName = o.customerName.toLowerCase();
    return (
      lowerName.includes(member.fullName.toLowerCase()) ||
      lowerName.includes(member.memberCode.toLowerCase()) ||
      lowerName.includes(member.username.toLowerCase())
    );
  });

  const totalSpent = memberOrders.reduce((sum, o) => sum + (o.status !== 'refunded' ? o.total : 0), 0);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(member.memberCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return 'bg-gradient-to-r from-purple-900 to-indigo-900 text-purple-100 border-purple-400/40';
      case 'Gold':
        return 'bg-gradient-to-r from-amber-700 to-yellow-600 text-amber-100 border-amber-300/40';
      case 'Silver':
        return 'bg-gradient-to-r from-slate-700 to-slate-900 text-slate-100 border-slate-300/40';
      case 'Bronze':
      default:
        return 'bg-gradient-to-r from-amber-900 to-stone-800 text-amber-100 border-amber-500/40';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Gold':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Silver':
        return 'bg-slate-200 text-slate-800 border-slate-400';
      case 'Bronze':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-[#0b1c30] flex flex-col items-center p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="w-full max-w-4xl bg-white border border-[#d8dce6] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#00236f] text-white flex items-center justify-center font-bold text-xl shadow-xs">
            <span className="material-symbols-outlined text-2xl">card_membership</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-[#0b1c30]">
                {member.fullName}
              </h1>
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${getTierBadge(member.tier)}`}>
                {member.tier} Member
              </span>
            </div>
            <p className="text-xs text-[#5a6072] mt-0.5">
              Kode Member: <strong className="font-mono text-[#00236f]">{member.memberCode}</strong> • Diskon Belanja: <strong className="text-emerald-700 font-bold">{Math.round(member.discountRate * 100)}%</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onOpenCashier && (
            <button
              type="button"
              onClick={onOpenCashier}
              className="px-3.5 h-9 bg-slate-100 hover:bg-slate-200 text-[#00236f] text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">point_of_sale</span>
              <span>Buka POS Kasir</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 h-9 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="w-full max-w-4xl flex items-center gap-2 border-b border-[#d8dce6] pb-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('card')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'card'
              ? 'bg-[#00236f] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">badge</span>
          <span>Kartu Member Digital</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#00236f] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">receipt_long</span>
          <span>Riwayat Belanja ({memberOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'rewards'
              ? 'bg-[#00236f] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">stars</span>
          <span>Reward & Poin</span>
        </button>
      </div>

      {/* Tab 1: Digital Membership Card */}
      {activeTab === 'card' && (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card Visual (Left 7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <div className={`w-full rounded-2xl p-6 sm:p-7 shadow-xl border relative overflow-hidden flex flex-col justify-between min-h-[250px] ${getTierColor(member.tier)}`}>
              {/* Background ambient accents */}
              <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none"></div>
              <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none"></div>

              {/* Card Header */}
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">storefront</span>
                    <span className="text-sm font-bold tracking-wider uppercase">{settings.storeName}</span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5">VIP Loyalty Pass</p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider border border-white/30">
                    {member.tier}
                  </span>
                </div>
              </div>

              {/* Barcode in card */}
              <div className="my-4 p-2.5 bg-white rounded-xl shadow-md flex flex-col items-center justify-center relative z-10">
                <BarcodeRenderer
                  value={member.memberCode}
                  height={42}
                  width={1.6}
                  fontSize={11}
                  className="border-none shadow-none p-0"
                />
                <span className="text-[10px] font-medium text-slate-500 mt-1">
                  Tunjukkan barcode ini kepada kasir saat berbelanja
                </span>
              </div>

              {/* Card Footer */}
              <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/20">
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-75">Nama Member</p>
                  <p className="text-base font-bold tracking-wide">{member.fullName}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider opacity-75">Saldo Poin</p>
                  <p className="text-xl font-bold tracking-tight text-amber-300">
                    {member.points.toLocaleString()} <span className="text-xs font-normal text-white">PTS</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-white rounded-xl p-4 border border-[#d8dce6] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs text-[#5a6072] block">Kode Member:</span>
                <span className="text-base font-mono font-bold text-[#00236f]">{member.memberCode}</span>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 h-9 bg-[#00236f] hover:bg-[#1a388b] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-base">
                  {copiedCode ? 'check' : 'content_copy'}
                </span>
                <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
              </button>
            </div>
          </div>

          {/* Stats & Privileges (Right 5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#d8dce6] shadow-xs">
              <h3 className="text-sm font-bold text-[#0b1c30] mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg text-amber-600">verified</span>
                <span>Keuntungan Member Anda</span>
              </h3>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0">percent</span>
                  <div>
                    <strong className="block text-[#0b1c30]">Diskon Tetap {Math.round(member.discountRate * 100)}%</strong>
                    <span className="text-[11px] text-slate-500">Berlaku untuk seluruh produk di setiap transaksi kasir.</span>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">loyalty</span>
                  <div>
                    <strong className="block text-[#0b1c30]">Poin Hadiah Belanja</strong>
                    <span className="text-[11px] text-slate-500">Dapatkan 1 poin setiap kelipatan Rp 1.000 / $1 belanjaan.</span>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="material-symbols-outlined text-[#00236f] text-lg shrink-0">redeem</span>
                  <div>
                    <strong className="block text-[#0b1c30]">Tukar Hadiah & Voucher</strong>
                    <span className="text-[11px] text-slate-500">Tukarkan poin loyalty Anda dengan diskon kasir langsung.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Total Spending Stat */}
            <div className="bg-white rounded-2xl p-5 border border-[#d8dce6] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5a6072]">Total Belanja Tercatat</p>
                <p className="text-lg font-bold text-[#00236f] mt-0.5">
                  {formatCurrency(totalSpent, settings.currencySymbol)}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {memberOrders.length} transaksi selesai
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">shopping_cart_checkout</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Shopping History */}
      {activeTab === 'history' && (
        <div className="w-full max-w-4xl bg-white rounded-2xl border border-[#d8dce6] p-5 shadow-xs">
          <h2 className="text-base font-bold text-[#0b1c30] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-[#00236f]">receipt_long</span>
            <span>Riwayat Belanja Terhubung ({memberOrders.length})</span>
          </h2>

          {memberOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-2">shopping_bag</span>
              <p className="text-sm font-medium">Belum ada riwayat transaksi yang tercatat atas nama Anda.</p>
              <p className="text-xs text-slate-500 mt-1">
                Tunjukkan kode member Anda saat berbelanja di kasir untuk mulai mengumpulkan poin!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {memberOrders.map((ord) => (
                <div key={ord.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#00236f]">{ord.receiptNumber}</span>
                      <span className="text-[11px] text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{new Date(ord.timestamp).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {ord.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      {ord.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                    </p>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <p className="text-sm font-bold text-[#0b1c30]">
                      {formatCurrency(ord.total, settings.currencySymbol)}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      +{Math.floor(ord.total)} Poin didapat
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Rewards & Point Catalog */}
      {activeTab === 'rewards' && (
        <div className="w-full max-w-4xl bg-white rounded-2xl border border-[#d8dce6] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-[#0b1c30]">Katalog Penukaran Poin</h2>
              <p className="text-xs text-slate-500">Tukarkan poin loyalti Anda dengan voucher belanja di toko.</p>
            </div>
            <div className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold">
              Saldo: {member.points.toLocaleString()} Poin
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-slate-50">
              <div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                  Voucher Kasir
                </span>
                <h4 className="text-sm font-bold text-[#0b1c30] mt-2">Potongan Diskon $5 / Rp 25.000</h4>
                <p className="text-xs text-slate-500 mt-1">Dapat langsung dipotong pada transaksi belanja kasir berikutnya.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700">100 Poin</span>
                <button
                  type="button"
                  disabled={member.points < 100}
                  className="px-3 h-7 bg-[#00236f] hover:bg-[#1a388b] text-white text-xs font-medium rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  Tukar
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-slate-50">
              <div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                  Merchandise
                </span>
                <h4 className="text-sm font-bold text-[#0b1c30] mt-2">Pilot G2 Gel Pen Gratis</h4>
                <p className="text-xs text-slate-500 mt-1">Dapatkan 1 buah pulpen gel premium warna pilihan Anda.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700">150 Poin</span>
                <button
                  type="button"
                  disabled={member.points < 150}
                  className="px-3 h-7 bg-[#00236f] hover:bg-[#1a388b] text-white text-xs font-medium rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  Tukar
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-slate-50">
              <div>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold uppercase">
                  VIP Upgrade
                </span>
                <h4 className="text-sm font-bold text-[#0b1c30] mt-2">Upgrade Status ke Gold</h4>
                <p className="text-xs text-slate-500 mt-1">Tingkatkan diskon belanja menjadi 15% untuk selamanya.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700">500 Poin</span>
                <button
                  type="button"
                  disabled={member.points < 500}
                  className="px-3 h-7 bg-[#00236f] hover:bg-[#1a388b] text-white text-xs font-medium rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  Tukar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

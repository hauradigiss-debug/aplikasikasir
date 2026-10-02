import React, { useState, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Product, CartItem, Order, StoreSettings, PaymentMethod, CategoryType, User, Member } from '../types';
import { formatCurrency, generateReceiptNumber, playSound } from '../utils';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { usePrinter } from '../context/PrinterContext';
import { PrinterStatusPill } from './PrinterStatusPill';

interface CashierViewProps {
  products: Product[];
  categories: CategoryType[];
  settings: StoreSettings;
  currentUser?: User | null;
  members?: Member[];
  onMemberPointEarned?: (memberId: string, pointsEarned: number) => void;
  onCompleteSale: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
}

export const CashierView: React.FC<CashierViewProps> = ({
  products,
  categories,
  settings,
  currentUser,
  members = [],
  onMemberPointEarned,
  onCompleteSale,
  onOpenReceipt,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Items');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<number | ''>('');
  const [heldCarts, setHeldCarts] = useState<{ id: string; time: string; items: CartItem[]; customer: string }[]>([]);

  // Bluetooth Mini Printer Global Hook
  const { printReceipt, config, isConnected, status: printerStatus } = usePrinter();

  // Barcode Scanning States
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [scanToast, setScanToast] = useState<{ name: string; sku: string; price: number } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Global Hardware USB / Bluetooth Barcode Gun Scanner Listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Do not capture if inside a standard input that the user is intentionally typing into,
      // EXCEPT when keys come in at sub-45ms speed (which is a hardware barcode scanner)
      const target = e.target as HTMLElement | null;
      const isTypingField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const currentTime = Date.now();
      const interval = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        // Hardware barcode scanners send an Enter key at the end of the barcode stream
        if (buffer.length >= 2 && interval < 120) {
          const scannedCode = buffer.trim();
          buffer = '';

          // 1. Check if scanned code is a Member Barcode (e.g. MBR-8801)
          const clean = scannedCode.toLowerCase();
          const matchedMember = members.find(
            (m) =>
              m.memberCode.toLowerCase() === clean ||
              m.id.toLowerCase() === clean ||
              (m.phone && m.phone === scannedCode)
          );

          if (matchedMember) {
            e.preventDefault();
            setSelectedMember(matchedMember);
            setCustomerName(`${matchedMember.fullName} (${matchedMember.memberCode})`);
            setDiscountPercent(Math.round(matchedMember.discountRate * 100));
            if (settings.enableSound) playSound('success');
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            setScanToast({
              name: `Member VIP: ${matchedMember.fullName} (${matchedMember.tier})`,
              sku: matchedMember.memberCode,
              price: 0,
            });
            toastTimeoutRef.current = setTimeout(() => setScanToast(null), 3500);
            return;
          }

          // 2. Check if scanned code is a Product SKU or Barcode
          const matched = products.find((p) => {
            return (
              (p.sku && p.sku.toLowerCase() === clean) ||
              (p.barcode && p.barcode.toLowerCase() === clean) ||
              (p.id && p.id.toLowerCase() === clean)
            );
          });

          if (matched) {
            e.preventDefault();
            handleAddToCart(matched);

            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            setScanToast({ name: matched.name, sku: matched.sku, price: matched.price });
            toastTimeoutRef.current = setTimeout(() => setScanToast(null), 3500);
          }
        } else {
          buffer = '';
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Collect characters if rapid interval (hardware gun) or if user is not in an input
        if (interval < 60 || !isTypingField) {
          buffer += e.key;
        } else {
          buffer = e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [products, settings]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchesCat = selectedCategory === 'All Items' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart math
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * settings.taxRate;
  const grandTotal = taxableAmount + taxAmount;

  // Add item to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      if (settings.enableSound) playSound('error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          if (settings.enableSound) playSound('error');
          return prev;
        }
        if (settings.enableSound) playSound('beep');
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      } else {
        if (settings.enableSound) playSound('beep');
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((it) => {
          if (it.product.id === productId) {
            const nextQty = it.quantity + delta;
            if (nextQty > it.product.stock) return it;
            return { ...it, quantity: nextQty };
          }
          return it;
        })
        .filter((it) => it.quantity > 0);
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    if (settings.enableSound) playSound('delete');
    setCart((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const handleClearCart = () => {
    if (cart.length > 0 && confirm('Clear entire checkout cart?')) {
      setCart([]);
      setDiscountPercent(0);
      setCustomerName('');
    }
  };

  // Hold current cart
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: `hold-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      customer: customerName || 'Walk-in',
    };
    setHeldCarts((prev) => [newHold, ...prev]);
    setCart([]);
    setCustomerName('');
    setDiscountPercent(0);
  };

  const handleRecallCart = (holdId: string) => {
    const target = heldCarts.find((h) => h.id === holdId);
    if (target) {
      setCart(target.items);
      setCustomerName(target.customer === 'Walk-in' ? '' : target.customer);
      setHeldCarts((prev) => prev.filter((h) => h.id !== holdId));
    }
  };

  // Process Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashTendered(Math.ceil(grandTotal));
    setIsCheckoutOpen(true);
  };

  const handleFinalizeSale = () => {
    const tendered = paymentMethod === 'cash' ? Number(cashTendered) || grandTotal : grandTotal;
    const change = Math.max(0, tendered - grandTotal);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      receiptNumber: generateReceiptNumber(),
      items: [...cart],
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      paymentMethod,
      amountPaid: tendered,
      change,
      cashierName: currentUser?.fullName || 'Haura',
      customerName: customerName.trim() || 'Walk-in Customer',
      timestamp: new Date().toISOString(),
      status: 'completed',
    };

    onCompleteSale(newOrder);
    if (settings.enableSound) playSound('success');

    // Award loyalty points to member if attached
    if (selectedMember && onMemberPointEarned) {
      const earned = Math.max(1, Math.floor(grandTotal));
      onMemberPointEarned(selectedMember.id, earned);
    }

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // Ignore confetti if not supported
    }

    setIsCheckoutOpen(false);
    setCart([]);
    setCustomerName('');
    setSelectedMember(null);
    setDiscountPercent(0);

    // Auto-detect & print via Mini Printer Bluetooth if enabled
    if (config.autoPrintOnCheckout) {
      printReceipt(newOrder, settings).catch((err) => {
        console.warn('Auto print receipt failed:', err);
      });
    }

    onOpenReceipt(newOrder);
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-6">
      {/* Left 60%: Product Catalog & Quick Tap Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header & Quick Scan */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1c30] dark:text-slate-100 tracking-tight">Point of Sale</h1>
            <p className="text-xs text-[#757682] dark:text-slate-400">Tap items to add directly to current checkout basket</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Global Bluetooth Mini Printer Status Indicator */}
            <PrinterStatusPill variant="badge" />

            {heldCarts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                  {heldCarts.length} Held Cart{heldCarts.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => handleRecallCart(heldCarts[0].id)}
                  className="text-xs font-semibold text-[#00236f] dark:text-blue-300 hover:underline cursor-pointer"
                >
                  Recall ({heldCarts[0].customer})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search, Barcode Input & Scanner Button */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682] dark:text-slate-400">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  const query = searchQuery.trim().toLowerCase();
                  const exact = products.find(
                    (p) =>
                      (p.sku && p.sku.toLowerCase() === query) ||
                      (p.barcode && p.barcode.toLowerCase() === query) ||
                      (p.id && p.id.toLowerCase() === query)
                  );
                  if (exact) {
                    e.preventDefault();
                    handleAddToCart(exact);
                    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
                    setScanToast({ name: exact.name, sku: exact.sku, price: exact.price });
                    toastTimeoutRef.current = setTimeout(() => setScanToast(null), 3500);
                    setSearchQuery('');
                  }
                }
              }}
              placeholder="Cari nama barang atau ketik / scan SKU barcode (Enter)..."
              className="w-full h-11 pl-10 pr-3.5 bg-white dark:bg-slate-900 border border-[#c5c5d3] dark:border-slate-700 rounded-xl text-sm text-[#0b1c30] dark:text-slate-100 focus:border-[#00236f] dark:focus:border-blue-400 focus:ring-1 focus:ring-[#00236f] outline-none placeholder:text-[#757682] dark:placeholder:text-slate-500"
            />
          </div>

          {/* Barcode Scanner Launch Button */}
          <button
            type="button"
            onClick={() => setIsBarcodeScannerOpen(true)}
            className="h-11 px-4 bg-[#00236f] dark:bg-blue-600 hover:bg-[#1a388b] dark:hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
            title="Buka Kamera Barcode Scanner atau Mode USB"
          >
            <span className="material-symbols-outlined text-[20px]">barcode_scanner</span>
            <span>Scan Barcode</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
          </button>
        </div>

        {/* Category Pills & Hardware Scanner Status */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
            <button
              onClick={() => setSelectedCategory('All Items')}
              className={`whitespace-nowrap px-3.5 h-9 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                selectedCategory === 'All Items'
                  ? 'bg-[#00236f] dark:bg-blue-600 text-white border-[#00236f] dark:border-blue-600'
                  : 'bg-white dark:bg-slate-900 text-[#444651] dark:text-slate-300 border-[#c5c5d3] dark:border-slate-700 hover:bg-[#d3e4fe] dark:hover:bg-slate-800'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3.5 h-9 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#00236f] dark:bg-blue-600 text-white border-[#00236f] dark:border-blue-600'
                    : 'bg-white dark:bg-slate-900 text-[#444651] dark:text-slate-300 border-[#c5c5d3] dark:border-slate-700 hover:bg-[#d3e4fe] dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Scanner USB Aktif
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((prod) => {
              const isOut = prod.stock <= 0;
              const cartItem = cart.find((it) => it.product.id === prod.id);

              return (
                <button
                  key={prod.id}
                  disabled={isOut}
                  onClick={() => handleAddToCart(prod)}
                  className={`bg-white dark:bg-slate-900 border rounded-xl p-3 text-left flex flex-col justify-between transition-all duration-150 relative cursor-pointer group ${
                    isOut
                      ? 'opacity-40 cursor-not-allowed border-[#c5c5d3] dark:border-slate-800'
                      : cartItem
                      ? 'border-[#00236f] dark:border-blue-500 ring-2 ring-[#00236f]/20 dark:ring-blue-500/30 shadow-xs'
                      : 'border-[#c5c5d3]/70 dark:border-slate-800 hover:border-[#00236f] dark:hover:border-blue-500 hover:shadow-sm'
                  }`}
                >
                  {/* Cart badge counter */}
                  {cartItem && (
                    <span className="absolute -top-2 -right-2 bg-[#00236f] dark:bg-blue-600 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50">
                      {cartItem.quantity}
                    </span>
                  )}

                  <div className="h-20 w-full bg-[#d3e4fe]/40 dark:bg-slate-800/80 rounded-lg mb-2 flex items-center justify-center text-[#4059aa] dark:text-blue-300 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-3xl">{prod.icon || 'inventory_2'}</span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs text-[#0b1c30] dark:text-slate-100 line-clamp-2 leading-tight">
                      {prod.name}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-[#757682] dark:text-slate-400 font-mono mt-0.5">
                      <span className="material-symbols-outlined text-[12px] text-slate-400 dark:text-slate-500">qr_code</span>
                      <span>{prod.sku}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e5eeff] dark:border-slate-800 w-full">
                    <span className="font-bold text-sm text-[#00236f] dark:text-blue-300">
                      {formatCurrency(prod.price, settings.currencySymbol)}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        prod.stock <= prod.minStockAlert ? 'text-[#b06000] dark:text-amber-400 font-bold' : 'text-[#757682] dark:text-slate-400'
                      }`}
                    >
                      {prod.stock} in stock
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right 40%: Order Basket & Checkout Pane */}
      <div className="w-full lg:w-[380px] xl:w-[420px] bg-white dark:bg-slate-900 rounded-2xl border border-[#c5c5d3]/70 dark:border-slate-800 shadow-sm flex flex-col h-[650px] lg:h-[calc(100vh-100px)] sticky top-4 transition-colors">
        {/* Cart Header */}
        <div className="p-4 border-b border-[#e5eeff] dark:border-slate-800 bg-[#f8f9ff] dark:bg-slate-850 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00236f] dark:text-blue-400 text-xl">shopping_cart</span>
            <div>
              <h2 className="font-bold text-sm text-[#00236f] dark:text-blue-300">Current Basket</h2>
              <p className="text-[11px] text-[#757682] dark:text-slate-400">{cart.length} unique items</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {cart.length > 0 && (
              <>
                <button
                  onClick={handleHoldCart}
                  title="Hold this cart"
                  className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border border-[#c5c5d3] dark:border-slate-700 text-[#444651] dark:text-slate-300 rounded-md hover:bg-[#eff4ff] dark:hover:bg-slate-700 cursor-pointer"
                >
                  Hold
                </button>
                <button
                  onClick={handleClearCart}
                  title="Clear basket"
                  className="w-7 h-7 flex items-center justify-center rounded-md text-[#ba1a1a] dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Member Loyalty Section */}
        <div className="px-3.5 py-2 bg-gradient-to-r from-amber-50/70 to-slate-50 dark:from-slate-800/60 dark:to-slate-900 border-b border-[#e5eeff] dark:border-slate-800 flex flex-col gap-1.5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-700 dark:text-amber-400 text-sm">loyalty</span>
              <span className="text-[11px] font-bold text-[#0b1c30] dark:text-slate-200">Member Loyalty</span>
            </div>

            {selectedMember ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setDiscountPercent(0);
                  setCustomerName('');
                }}
                className="text-[10px] text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold cursor-pointer"
              >
                Lepas Member
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                className="text-[11px] font-bold text-[#00236f] dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>+ Hubungkan Member</span>
                <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
              </button>
            )}
          </div>

          {selectedMember ? (
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-200/80 dark:border-amber-800/60 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center font-bold text-[10px]">
                  {selectedMember.tier[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#0b1c30] dark:text-slate-100">{selectedMember.fullName}</span>
                    <span className="px-1 text-[9px] font-bold rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 uppercase border border-amber-300 dark:border-amber-800">
                      {selectedMember.tier}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#5a6072] dark:text-slate-400 font-mono block">
                    {selectedMember.memberCode} • Saldo: {selectedMember.points} Pts
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                  {Math.round(selectedMember.discountRate * 100)}% OFF
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-[#5a6072] dark:text-slate-400">
              Scan barcode kartu member atau pilih dari daftar database
            </div>
          )}

          {/* Member Dropdown Picker */}
          {isMemberDropdownOpen && !selectedMember && (
            <div className="absolute top-full left-2 right-2 mt-1 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 max-h-48 overflow-y-auto">
              <div className="text-[11px] font-bold text-[#0b1c30] dark:text-slate-100 pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span>Pilih Member Terdaftar</span>
                <button
                  type="button"
                  onClick={() => setIsMemberDropdownOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              </div>

              {members.length === 0 ? (
                <p className="text-xs text-slate-400 p-2 text-center">Belum ada member terdaftar.</p>
              ) : (
                <div className="space-y-1">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMember(m);
                        setCustomerName(`${m.fullName} (${m.memberCode})`);
                        setDiscountPercent(Math.round(m.discountRate * 100));
                        setIsMemberDropdownOpen(false);
                      }}
                      className="w-full p-1.5 text-left rounded-lg hover:bg-amber-50/80 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div>
                        <span className="font-semibold text-[#0b1c30] dark:text-slate-100 block">{m.fullName}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {m.memberCode} • {m.points} Poin
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800">
                        {Math.round(m.discountRate * 100)}% Diskon
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Name quick input */}
        <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-[#e5eeff] dark:border-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#757682] dark:text-slate-400 text-sm">person</span>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama Pelanggan / Catatan Meja"
            className="w-full text-xs text-[#0b1c30] dark:text-slate-100 placeholder:text-[#757682] dark:placeholder:text-slate-500 outline-none bg-transparent"
          />
        </div>

        {/* Line Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-[#f1f3f4] dark:divide-slate-800">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.product.id} className="pt-3 first:pt-0 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-[#0b1c30] dark:text-slate-100 line-clamp-1">
                    {item.product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-[#00236f] dark:text-blue-300">
                      {formatCurrency(item.product.price, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-[#757682] dark:text-slate-400 font-mono">
                      {item.product.sku}
                    </span>
                  </div>
                </div>

                {/* Stepper controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#f8f9ff] dark:bg-slate-800 border border-[#c5c5d3] dark:border-slate-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, -1)}
                      className="w-7 h-7 flex items-center justify-center text-[#444651] dark:text-slate-300 hover:bg-[#d3e4fe] dark:hover:bg-slate-700 font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#0b1c30] dark:text-slate-100">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-7 h-7 flex items-center justify-center text-[#444651] dark:text-slate-300 hover:bg-[#d3e4fe] dark:hover:bg-slate-700 font-bold text-sm disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <span className="w-16 text-right font-bold text-xs text-[#0b1c30] dark:text-slate-100">
                    {formatCurrency(item.product.price * item.quantity, settings.currencySymbol)}
                  </span>

                  <button
                    onClick={() => handleRemoveFromCart(item.product.id)}
                    className="text-[#757682] dark:text-slate-400 hover:text-[#ba1a1a] dark:hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-[#757682] dark:text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-30">add_shopping_cart</span>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Checkout basket is empty</p>
              <p className="text-[11px] text-[#757682] dark:text-slate-500 mt-0.5">Click any stationery item to begin transaction</p>
            </div>
          )}
        </div>

        {/* Quick Discounts & Cart Summary */}
        <div className="p-4 bg-[#f8f9ff] dark:bg-slate-850 border-t border-[#e5eeff] dark:border-slate-800 space-y-2 rounded-b-2xl">
          {/* Quick discount chips */}
          <div className="flex items-center justify-between pb-2 border-b border-[#e5eeff] dark:border-slate-800">
            <span className="text-xs font-semibold text-[#444651] dark:text-slate-300">Discount</span>
            <div className="flex gap-1">
              {[0, 5, 10, 15, 20].map((d) => (
                <button
                  key={d}
                  onClick={() => setDiscountPercent(d)}
                  className={`text-[11px] px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    discountPercent === d
                      ? 'bg-[#00236f] dark:bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-[#444651] dark:text-slate-300 border border-[#c5c5d3]/70 dark:border-slate-700 hover:bg-[#eff4ff] dark:hover:bg-slate-700'
                  }`}
                >
                  {d === 0 ? 'None' : `${d}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between text-xs text-[#444651] dark:text-slate-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, settings.currencySymbol)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
              <span>Discount ({discountPercent}%)</span>
              <span>-{formatCurrency(discountAmount, settings.currencySymbol)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs text-[#444651] dark:text-slate-400">
            <span>Estimated Tax ({Math.round(settings.taxRate * 100 * 10) / 10}%)</span>
            <span>{formatCurrency(taxAmount, settings.currencySymbol)}</span>
          </div>

          <div className="flex justify-between text-lg font-bold text-[#00236f] dark:text-blue-300 pt-2 border-t border-[#c5c5d3] dark:border-slate-700">
            <span>Total</span>
            <span className="text-xl">{formatCurrency(grandTotal, settings.currencySymbol)}</span>
          </div>

          {/* Checkout Button */}
          <button
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
            className="w-full h-12 bg-[#00236f] dark:bg-blue-600 hover:bg-[#1e3a8a] dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed active:scale-98 text-white font-bold text-sm rounded-full shadow-md transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">payments</span>
            Pay {formatCurrency(grandTotal, settings.currencySymbol)}
          </button>
        </div>
      </div>

      {/* Payment & Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-[#c5c5d3]/50 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
            {/* Header */}
            <div className="p-5 border-b border-[#e5eeff] dark:border-slate-800 bg-[#f8f9ff] dark:bg-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00236f] dark:bg-blue-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined">point_of_sale</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#00236f] dark:text-blue-300">Complete Payment</h3>
                  <p className="text-xs text-[#757682] dark:text-slate-400">Choose payment method and confirm tender</p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#757682] dark:text-slate-400 hover:bg-[#e5eeff] dark:hover:bg-slate-800 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Grand Total banner */}
              <div className="p-4 bg-[#eff4ff] dark:bg-blue-950/40 border border-[#d3e4fe] dark:border-blue-900/60 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#757682] dark:text-slate-400 uppercase">Total Due</p>
                  <p className="text-3xl font-black text-[#00236f] dark:text-blue-300">
                    {formatCurrency(grandTotal, settings.currencySymbol)}
                  </p>
                </div>
                <div className="text-right text-xs text-[#444651] dark:text-slate-300">
                  <p>{cart.reduce((s, i) => s + i.quantity, 0)} items</p>
                  <p className="font-semibold text-[#00236f] dark:text-blue-300">
                    {customerName || 'Walk-in Customer'}
                  </p>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-[#0b1c30] dark:text-slate-200 uppercase mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-[#00236f] dark:border-blue-500 bg-[#eff4ff] dark:bg-blue-950/60 text-[#00236f] dark:text-blue-300 font-bold shadow-xs'
                        : 'border-[#c5c5d3] dark:border-slate-700 text-[#444651] dark:text-slate-300 hover:bg-[#f8f9ff] dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">payments</span>
                    <span className="text-xs">Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-[#00236f] dark:border-blue-500 bg-[#eff4ff] dark:bg-blue-950/60 text-[#00236f] dark:text-blue-300 font-bold shadow-xs'
                        : 'border-[#c5c5d3] dark:border-slate-700 text-[#444651] dark:text-slate-300 hover:bg-[#f8f9ff] dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">credit_card</span>
                    <span className="text-xs">Card / Terminal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'qris'
                        ? 'border-[#00236f] dark:border-blue-500 bg-[#eff4ff] dark:bg-blue-950/60 text-[#00236f] dark:text-blue-300 font-bold shadow-xs'
                        : 'border-[#c5c5d3] dark:border-slate-700 text-[#444651] dark:text-slate-300 hover:bg-[#f8f9ff] dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                    <span className="text-xs">QRIS / Digital</span>
                  </button>
                </div>
              </div>

              {/* Cash Tendered & Quick Denominations */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3 animate-in fade-in duration-100">
                  <div>
                    <label className="block text-xs font-bold text-[#0b1c30] dark:text-slate-200 uppercase mb-1">
                      Cash Received ({settings.currencySymbol})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#757682] dark:text-slate-400">{settings.currencySymbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        min={grandTotal}
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-12 pl-8 pr-4 bg-[#f8f9ff] dark:bg-slate-800 border border-[#c5c5d3] dark:border-slate-700 rounded-lg text-xl font-bold text-[#00236f] dark:text-blue-300 focus:border-[#00236f] outline-none"
                      />
                    </div>
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setCashTendered(grandTotal)}
                      className="px-3 py-1.5 bg-[#f8f9ff] dark:bg-slate-800 hover:bg-[#d3e4fe] dark:hover:bg-slate-700 border border-[#c5c5d3] dark:border-slate-700 rounded-md text-xs font-semibold text-[#00236f] dark:text-blue-300 cursor-pointer"
                    >
                      Exact ({formatCurrency(grandTotal, settings.currencySymbol)})
                    </button>
                    {[10, 20, 50, 100].map((note) => {
                      if (note < grandTotal && note * 2 < grandTotal) return null;
                      return (
                        <button
                          key={note}
                          type="button"
                          onClick={() => setCashTendered(note)}
                          className="px-3 py-1.5 bg-[#f8f9ff] dark:bg-slate-800 hover:bg-[#d3e4fe] dark:hover:bg-slate-700 border border-[#c5c5d3] dark:border-slate-700 rounded-md text-xs font-semibold text-[#00236f] dark:text-blue-300 cursor-pointer"
                        >
                          ${note}
                        </button>
                      );
                    })}
                  </div>

                  {/* Change due preview */}
                  <div className="p-3 bg-[#e6f4ea] dark:bg-emerald-950/60 border border-[#137333]/30 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-[#137333] dark:text-emerald-300 uppercase">Change Due</span>
                    <span className="text-xl font-bold text-[#137333] dark:text-emerald-300">
                      {formatCurrency(
                        Math.max(0, (Number(cashTendered) || 0) - grandTotal),
                        settings.currencySymbol
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Digital payment simulation note */}
              {paymentMethod !== 'cash' && (
                <div className="p-4 bg-[#f8f9ff] dark:bg-slate-800 border border-[#d3e4fe] dark:border-slate-700 rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl text-[#00236f] dark:text-blue-400">contactless</span>
                  <div>
                    <p className="text-xs font-bold text-[#00236f] dark:text-blue-300">Ready for Customer Tap / Scan</p>
                    <p className="text-[11px] text-[#757682] dark:text-slate-400">
                      Card terminal authorized. Click Confirm to finalize receipt.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-[#e5eeff] dark:border-slate-800 bg-[#f8f9ff] dark:bg-slate-850 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-5 h-11 text-xs font-semibold text-[#444651] dark:text-slate-300 hover:bg-[#e5eeff] dark:hover:bg-slate-800 rounded-full cursor-pointer"
              >
                Back to Basket
              </button>
              <button
                type="button"
                disabled={paymentMethod === 'cash' && (Number(cashTendered) || 0) < grandTotal}
                onClick={handleFinalizeSale}
                className="px-8 h-12 bg-[#00236f] dark:bg-blue-600 hover:bg-[#1e3a8a] dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-800 text-white font-bold text-sm rounded-full shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Confirm & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Camera & USB Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        products={products}
        settings={settings}
        onScanProduct={(product) => {
          handleAddToCart(product);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          setScanToast({ name: product.name, sku: product.sku, price: product.price });
          toastTimeoutRef.current = setTimeout(() => setScanToast(null), 3500);
        }}
      />

      {/* Floating Barcode Scan Success Toast */}
      {scanToast && (
        <div
          id="barcode-scan-toast"
          className="fixed bottom-6 right-6 z-50 bg-[#00236f] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#d3e4fe]/30 animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-lg">check</span>
          </div>
          <div>
            <p className="text-xs font-bold flex items-center gap-1.5">
              <span>+1 {scanToast.name}</span>
              <span className="text-emerald-300 font-normal">ditambahkan</span>
            </p>
            <p className="text-[11px] text-slate-300 font-mono">
              SKU: {scanToast.sku} • {formatCurrency(scanToast.price, settings.currencySymbol)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScanToast(null)}
            className="text-slate-300 hover:text-white ml-2 text-xs cursor-pointer"
            aria-label="Tutup Toast"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
    </div>
  );
};

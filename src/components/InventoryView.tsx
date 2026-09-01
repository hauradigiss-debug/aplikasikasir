import React, { useState, useMemo } from 'react';
import { Product, CategoryType, StoreSettings } from '../types';
import { formatCurrency } from '../utils';

interface InventoryViewProps {
  products: Product[];
  categories: CategoryType[];
  settings: StoreSettings;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenStockAdjust: (product: Product) => void;
}

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc';

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  categories,
  settings,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenStockAdjust,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Items');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search query
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query));

        // Category filter
        const matchesCategory = selectedCategory === 'All Items' || p.category === selectedCategory;

        // Stock status filter
        let matchesStock = true;
        if (stockFilter === 'in_stock') {
          matchesStock = p.stock > p.minStockAlert;
        } else if (stockFilter === 'low_stock') {
          matchesStock = p.stock > 0 && p.stock <= p.minStockAlert;
        } else if (stockFilter === 'out_of_stock') {
          matchesStock = p.stock === 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'stock_asc') return a.stock - b.stock;
        if (sortBy === 'stock_desc') return b.stock - a.stock;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy]);

  // Total summary counts
  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.stock > p.minStockAlert).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="w-full">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">Inventory</h1>
          <p className="text-sm sm:text-base text-[#444651] mt-1">
            Manage your products, stock, and pricing.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onAddProduct}
            className="bg-[#00236f] hover:bg-[#1e3a8a] text-white font-medium text-sm h-[44px] px-6 rounded-full active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Product
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div
          onClick={() => { setStockFilter('all'); setSelectedCategory('All Items'); }}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            stockFilter === 'all' && selectedCategory === 'All Items'
              ? 'bg-[#eff4ff] border-[#1e3a8a] shadow-xs'
              : 'bg-white border-[#c5c5d3]/50 hover:bg-[#f8f9ff]'
          }`}
        >
          <p className="text-xs font-semibold text-[#757682] uppercase">Total Catalog</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-[#00236f]">{totalProducts}</span>
            <span className="text-xs text-[#444651]">items</span>
          </div>
        </div>

        <div
          onClick={() => setStockFilter('in_stock')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            stockFilter === 'in_stock'
              ? 'bg-[#e6f4ea] border-[#137333] shadow-xs'
              : 'bg-white border-[#c5c5d3]/50 hover:bg-[#f8f9ff]'
          }`}
        >
          <p className="text-xs font-semibold text-[#137333] uppercase">In Stock</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-[#137333]">{inStockCount}</span>
            <span className="text-xs text-[#137333]">healthy</span>
          </div>
        </div>

        <div
          onClick={() => setStockFilter('low_stock')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            stockFilter === 'low_stock'
              ? 'bg-[#fef7e0] border-[#b06000] shadow-xs'
              : 'bg-white border-[#c5c5d3]/50 hover:bg-[#f8f9ff]'
          }`}
        >
          <p className="text-xs font-semibold text-[#b06000] uppercase">Low Stock</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-[#b06000]">{lowStockCount}</span>
            <span className="text-xs text-[#b06000]">need restock</span>
          </div>
        </div>

        <div
          onClick={() => setStockFilter('out_of_stock')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            stockFilter === 'out_of_stock'
              ? 'bg-[#f1f3f4] border-[#5f6368] shadow-xs'
              : 'bg-white border-[#c5c5d3]/50 hover:bg-[#f8f9ff]'
          }`}
        >
          <p className="text-xs font-semibold text-[#5f6368] uppercase">Out of Stock</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-[#ba1a1a]">{outOfStockCount}</span>
            <span className="text-xs text-red-600">depleted</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU or product name..."
            className="w-full h-[44px] pl-10 pr-10 bg-white border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none transition-all placeholder:text-[#757682]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757682] hover:text-[#0b1c30]"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All Items')}
            className={`whitespace-nowrap px-4 h-[44px] rounded-full text-sm font-medium border transition-colors cursor-pointer ${
              selectedCategory === 'All Items'
                ? 'bg-[#00236f] text-white border-[#00236f]'
                : 'bg-white text-[#444651] hover:bg-[#d3e4fe] border-[#c5c5d3]'
            }`}
          >
            All Items
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 h-[44px] rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#00236f] text-white border-[#00236f]'
                  : 'bg-white text-[#444651] hover:bg-[#d3e4fe] border-[#c5c5d3]'
              }`}
            >
              {cat}
            </button>
          ))}

          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`whitespace-nowrap px-4 h-[44px] rounded-full text-sm font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
              showMoreFilters || stockFilter !== 'all'
                ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                : 'bg-white text-[#444651] hover:bg-[#d3e4fe] border-[#c5c5d3]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            {stockFilter !== 'all' ? `Filter: ${stockFilter.replace('_', ' ')}` : 'More Filters'}
          </button>
        </div>
      </div>

      {/* Expanded Filters Drawer */}
      {showMoreFilters && (
        <div className="p-4 bg-white rounded-xl border border-[#c5c5d3]/70 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-[#0b1c30] uppercase">Stock Status:</span>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All Status' },
                { id: 'in_stock', label: 'In Stock' },
                { id: 'low_stock', label: 'Low Stock' },
                { id: 'out_of_stock', label: 'Out of Stock' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStockFilter(st.id as StockFilter)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-all ${
                    stockFilter === st.id
                      ? 'bg-[#00236f] text-white border-[#00236f]'
                      : 'bg-[#f8f9ff] text-[#444651] border-[#c5c5d3] hover:bg-[#eff4ff]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#0b1c30] uppercase">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 px-3 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-xs font-medium text-[#0b1c30] focus:border-[#00236f] outline-none"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
              <option value="stock_asc">Stock (Low to High)</option>
              <option value="stock_desc">Stock (High to Low)</option>
            </select>
          </div>
        </div>
      )}

      {/* Active Filter Notice if non-empty */}
      {(searchQuery || selectedCategory !== 'All Items' || stockFilter !== 'all') && (
        <div className="flex items-center justify-between mb-4 px-1 text-xs text-[#757682]">
          <span>
            Showing <strong className="text-[#0b1c30]">{filteredProducts.length}</strong> of {products.length} products
          </span>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All Items');
              setStockFilter('all');
            }}
            className="text-[#00236f] font-semibold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Product Grid (Bento style) */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock === 0;
            const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
            const isInStock = product.stock > product.minStockAlert;

            return (
              <div
                key={product.id}
                className={`bg-white border border-[#c5c5d3]/70 rounded-xl p-4 flex flex-col gap-2 hover:border-[#00236f] hover:shadow-md transition-all group relative ${
                  isOutOfStock ? 'opacity-80' : ''
                }`}
              >
                {/* Top Status & Hover Actions */}
                <div className="flex justify-between items-start mb-1">
                  {isInStock && (
                    <span className="bg-[#e6f4ea] text-[#137333] px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase">
                      In Stock
                    </span>
                  )}
                  {isLowStock && (
                    <span className="bg-[#fef7e0] text-[#b06000] px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase animate-pulse">
                      Low Stock
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="bg-[#f1f3f4] text-[#5f6368] px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase">
                      Out of Stock
                    </span>
                  )}

                  {/* Actions (visible on hover and always accessible on mobile) */}
                  <div className="flex gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onOpenStockAdjust(product)}
                      title="Adjust Stock"
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#eff4ff] text-[#00236f] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">swap_vert</span>
                    </button>
                    <button
                      onClick={() => onEditProduct(product)}
                      title="Edit Product"
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#d3e4fe] text-[#444651] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${product.name}" from inventory?`)) {
                          onDeleteProduct(product.id);
                        }
                      }}
                      title="Delete Product"
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#ffdad6] text-[#ba1a1a] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Product Visual Box */}
                <div
                  className={`h-32 w-full bg-[#d3e4fe]/40 rounded-lg mb-1 relative overflow-hidden flex items-center justify-center border border-[#c5c5d3]/30 ${
                    isOutOfStock ? 'grayscale opacity-60' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-[#4059aa] text-4xl opacity-70 group-hover:scale-110 transition-transform duration-200">
                    {product.icon || 'inventory_2'}
                  </span>
                  <div className="absolute bottom-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 text-[#00236f] backdrop-blur-xs">
                    {product.category}
                  </div>
                </div>

                {/* Product Details */}
                <h3
                  className={`font-semibold text-base text-[#0b1c30] line-clamp-1 group-hover:text-[#00236f] transition-colors ${
                    isOutOfStock ? 'text-[#444651]' : ''
                  }`}
                  title={product.name}
                >
                  {product.name}
                </h3>
                <p className="text-xs text-[#757682] font-mono tracking-tight">
                  SKU: {product.sku}
                </p>

                {/* Price & Unit Count */}
                <div className="flex justify-between items-end mt-auto pt-2.5 border-t border-[#c5c5d3]/40">
                  <span className="text-lg font-bold text-[#00236f] leading-none">
                    {formatCurrency(product.price, settings.currencySymbol)}
                  </span>
                  <span
                    className={`text-xs ${
                      isLowStock
                        ? 'text-[#b06000] font-bold'
                        : isOutOfStock
                        ? 'text-[#757682] font-medium'
                        : 'text-[#444651] font-medium'
                    }`}
                  >
                    {product.stock} units
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-[#c5c5d3] rounded-2xl bg-white mt-4">
          <div className="w-20 h-20 rounded-full bg-[#f8f9ff] flex items-center justify-center mb-4 text-[#757682]/60">
            <span className="material-symbols-outlined text-5xl">inventory_2</span>
          </div>
          <h2 className="text-lg font-bold text-[#0b1c30] mb-1">No products found</h2>
          <p className="text-sm text-[#444651] mb-6 max-w-sm">
            {searchQuery || selectedCategory !== 'All Items' || stockFilter !== 'all'
              ? 'No stationery items match your current filters. Try resetting the search or filters.'
              : 'Your inventory is currently empty. Add products to start managing stock and selling in the POS.'}
          </p>
          {searchQuery || selectedCategory !== 'All Items' || stockFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Items');
                setStockFilter('all');
              }}
              className="bg-[#eff4ff] text-[#00236f] font-semibold text-sm h-[44px] px-6 rounded-full hover:bg-[#d3e4fe] transition-colors"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={onAddProduct}
              className="bg-[#00236f] text-white font-semibold text-sm h-[44px] px-6 rounded-full hover:bg-[#1e3a8a] active:scale-95 transition-all shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add First Product
            </button>
          )}
        </div>
      )}
    </div>
  );
};

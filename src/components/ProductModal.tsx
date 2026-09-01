import React, { useState, useEffect } from 'react';
import { Product, CategoryType } from '../types';
import { generateSKU } from '../utils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
  categories: CategoryType[];
}

const AVAILABLE_ICONS = [
  { id: 'book', label: 'Notebook', icon: 'book' },
  { id: 'draw', label: 'Pen / Pencil', icon: 'draw' },
  { id: 'folder', label: 'Folder / Storage', icon: 'folder' },
  { id: 'palette', label: 'Art / Color', icon: 'palette' },
  { id: 'menu_book', label: 'Journal', icon: 'menu_book' },
  { id: 'edit', label: 'Fountain Pen', icon: 'edit' },
  { id: 'brush', label: 'Brush Pen', icon: 'brush' },
  { id: 'auto_fix_high', label: 'Washi Tape', icon: 'auto_fix_high' },
  { id: 'folder_open', label: 'Binder', icon: 'folder_open' },
  { id: 'stylus', label: 'Gel Pen', icon: 'stylus' },
  { id: 'crop_landscape', label: 'Eraser', icon: 'crop_landscape' },
  { id: 'grid_view', label: 'Dot Pad', icon: 'grid_view' },
  { id: 'content_cut', label: 'Scissors', icon: 'content_cut' },
  { id: 'straighten', label: 'Ruler', icon: 'straighten' },
  { id: 'sticky_note_2', label: 'Sticky Notes', icon: 'sticky_note_2' },
  { id: 'attach_file', label: 'Clips & Pins', icon: 'attach_file' },
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  categories,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<CategoryType>('Notebooks');
  const [price, setPrice] = useState<number | ''>(0);
  const [costPrice, setCostPrice] = useState<number | ''>(0);
  const [stock, setStock] = useState<number | ''>(0);
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(10);
  const [icon, setIcon] = useState('book');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setCategory(productToEdit.category);
      setPrice(productToEdit.price);
      setCostPrice(productToEdit.costPrice ?? 0);
      setStock(productToEdit.stock);
      setMinStockAlert(productToEdit.minStockAlert);
      setIcon(productToEdit.icon || 'book');
      setDescription(productToEdit.description || '');
    } else {
      setName('');
      setCategory('Notebooks');
      setSku(generateSKU('Notebooks', 'NEW'));
      setPrice('');
      setCostPrice('');
      setStock(20);
      setMinStockAlert(10);
      setIcon('book');
      setDescription('');
    }
    setErrors({});
  }, [productToEdit, isOpen]);

  const handleCategoryChange = (newCat: CategoryType) => {
    setCategory(newCat);
    if (!productToEdit) {
      setSku(generateSKU(newCat, name || 'ITM'));
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!productToEdit && (!sku || sku.includes('NEW') || sku.includes('ITM'))) {
      setSku(generateSKU(category, val));
    }
  };

  const handleRegenerateSKU = () => {
    setSku(generateSKU(category, name || 'ITM'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Product name is required';
    if (!sku.trim()) newErrors.sku = 'SKU is required';
    if (price === '' || Number(price) < 0) newErrors.price = 'Valid price is required';
    if (stock === '' || Number(stock) < 0) newErrors.stock = 'Valid stock count is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const product: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category,
      price: Number(price),
      costPrice: costPrice === '' ? 0 : Number(costPrice),
      stock: Number(stock),
      minStockAlert: minStockAlert === '' ? 10 : Number(minStockAlert),
      icon,
      description: description.trim(),
      createdAt: productToEdit ? productToEdit.createdAt : new Date().toISOString(),
    };

    onSave(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-[#c5c5d3]/50 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5eeff] bg-[#f8f9ff]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[#00236f]">
              <span className="material-symbols-outlined">{productToEdit ? 'edit' : 'add_box'}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#00236f]">
                {productToEdit ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-[#757682]">Update stationery details, pricing, and inventory alert</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#757682] hover:bg-[#e5eeff] hover:text-[#0b1c30]"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Moleskine Classic Ruled Hardcover"
              className={`w-full h-11 px-3.5 bg-[#f8f9ff] border ${
                errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-[#c5c5d3]'
              } rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none transition-all`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Category & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as CategoryType)}
                className="w-full h-11 px-3 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                  SKU Code *
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateSKU}
                  className="text-[11px] font-semibold text-[#00236f] hover:underline"
                >
                  Generate
                </button>
              </div>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. N-MOL-001"
                className={`w-full h-11 px-3.5 font-mono uppercase bg-[#f8f9ff] border ${
                  errors.sku ? 'border-red-500 ring-1 ring-red-500' : 'border-[#c5c5d3]'
                } rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] outline-none`}
              />
              {errors.sku && <p className="text-xs text-red-600 mt-1">{errors.sku}</p>}
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
                Retail Price ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#757682] font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full h-11 pl-8 pr-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm font-semibold text-[#0b1c30] focus:border-[#00236f] outline-none"
                />
              </div>
              {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
                Cost Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#757682] font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full h-11 pl-8 pr-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Stock Quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
                Current Stock (Units) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full h-11 px-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm font-bold text-[#0b1c30] focus:border-[#00236f] outline-none"
              />
              {errors.stock && <p className="text-xs text-red-600 mt-1">{errors.stock}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
                Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="10"
                className="w-full h-11 px-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] outline-none"
              />
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-2">
              Visual Product Icon
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2 bg-[#f8f9ff] border border-[#c5c5d3]/60 rounded-xl">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic.id}
                  onClick={() => setIcon(ic.icon)}
                  title={ic.label}
                  className={`h-11 rounded-lg flex flex-col items-center justify-center transition-all ${
                    icon === ic.icon
                      ? 'bg-[#00236f] text-white shadow-xs scale-105'
                      : 'hover:bg-[#d3e4fe] text-[#444651]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{ic.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specifications, size, color variants, paper weight (gsm), manufacturer info..."
              className="w-full p-3 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e5eeff]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-11 rounded-full text-sm font-semibold text-[#444651] hover:bg-[#eff4ff] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-11 bg-[#00236f] hover:bg-[#1e3a8a] active:scale-95 text-white text-sm font-bold rounded-full shadow-sm transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              {productToEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

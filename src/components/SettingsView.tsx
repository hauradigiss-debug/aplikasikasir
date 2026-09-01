import React, { useState } from 'react';
import { StoreSettings } from '../types';

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (newSettings: StoreSettings) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">System Settings</h1>
        <p className="text-sm text-[#444651] mt-1">
          Store profile, tax rate calculation, receipt footer, and hardware preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Profile */}
        <div className="bg-white p-6 rounded-2xl border border-[#c5c5d3]/60 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#00236f] flex items-center gap-2">
            <span className="material-symbols-outlined">store</span>
            Store Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1.5">
                Store Name
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full h-11 px-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1.5">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full h-11 px-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1.5">
                Store Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full h-11 px-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-11 px-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Financial & Tax Settings */}
        <div className="bg-white p-6 rounded-2xl border border-[#c5c5d3]/60 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#00236f] flex items-center gap-2">
            <span className="material-symbols-outlined">receipt</span>
            Tax & Pricing
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1.5">
                Sales Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={Math.round(formData.taxRate * 10000) / 100}
                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) / 100 })}
                className="w-full h-11 px-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm font-semibold text-[#0b1c30] focus:border-[#00236f] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1.5">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full h-11 px-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm font-bold text-[#0b1c30] focus:border-[#00236f] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1.5">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                className="w-full h-11 px-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm font-semibold text-[#0b1c30] focus:border-[#00236f] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1.5">
              Receipt Footer Message
            </label>
            <input
              type="text"
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              className="w-full h-11 px-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] outline-none"
            />
          </div>
        </div>

        {/* Audio & Feedback */}
        <div className="bg-white p-6 rounded-2xl border border-[#c5c5d3]/60 shadow-xs flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-[#0b1c30]">POS Audio Feedback</h4>
            <p className="text-xs text-[#757682]">Play scanner beep and cash register chime on checkout</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, enableSound: !formData.enableSound })}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              formData.enableSound ? 'bg-[#00236f]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full transition-transform shadow-xs absolute top-0.5 ${
                formData.enableSound ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Settings saved successfully!
            </span>
          ) : <span />}

          <button
            type="submit"
            className="px-6 h-11 bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save Settings
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-xs mt-8">
        <h3 className="text-base font-bold text-red-700 flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined">dangerous</span>
          Data Reset & Seed Defaults
        </h3>
        <p className="text-xs text-[#757682] mb-4">
          Reset all products, stock counts, and sales history back to the initial sample stationery store data.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to reset all inventory and transaction history to initial defaults?')) {
              onResetData();
            }
          }}
          className="px-4 h-10 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          Reset to Factory Initial Data
        </button>
      </div>
    </div>
  );
};

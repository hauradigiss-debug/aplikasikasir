import React, { useState } from 'react';
import { StoreSettings, User, UserRole } from '../types';

interface SettingsViewProps {
  settings: StoreSettings;
  users?: User[];
  currentUser?: User | null;
  onSaveSettings: (newSettings: StoreSettings) => void;
  onSaveUsers?: (newUsers: User[]) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  users = [],
  currentUser,
  onSaveSettings,
  onSaveUsers,
  onResetData,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New User Form Modal/State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('cashier');
  const [showAddUser, setShowAddUser] = useState(false);
  const [userSuccessMsg, setUserSuccessMsg] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisible = (userId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !onSaveUsers) return;

    if (users.some((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      alert('Username tersebut sudah digunakan!');
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: newUsername.trim().toLowerCase(),
      password: newPassword.trim(),
      fullName: newFullName.trim() || newUsername.trim(),
      role: newRole,
      avatar: newRole === 'super_admin' ? 'shield_person' : newRole === 'manager' ? 'manage_accounts' : 'badge',
      lastLogin: new Date().toISOString(),
    };

    onSaveUsers([...users, newUser]);
    setNewUsername('');
    setNewPassword('');
    setNewFullName('');
    setShowAddUser(false);
    setUserSuccessMsg(`Pengguna "${newUser.fullName}" berhasil ditambahkan!`);
    setTimeout(() => setUserSuccessMsg(''), 3500);
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (username === 'haura') {
      alert('Akun Super Admin "haura" adalah akun utama dan tidak boleh dihapus!');
      return;
    }
    if (confirm(`Yakin ingin menghapus akses untuk pengguna @${username}?`)) {
      onSaveUsers?.(users.filter((u) => u.id !== userId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">System Settings</h1>
        <p className="text-sm text-[#444651] mt-1">
          Store profile, tax rate calculation, receipt footer, and hardware preferences
        </p>
      </div>

      {/* User Accounts & Credential List Section (ENTERPRISE RBAC) */}
      <div className="bg-white p-6 rounded-xl border border-[#c5c5d3]/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#e5eeff]">
          <div>
            <h3 className="text-base font-bold text-[#00236f] flex items-center gap-2">
              <span className="material-symbols-outlined">admin_panel_settings</span>
              Daftar Kredensial & Pengguna Sistem (RBAC)
            </h3>
            <p className="text-xs text-[#757682] mt-0.5">
              Kelola kredensial akun Super Admin, Kasir, dan Manajer register POS
            </p>
          </div>
          {onSaveUsers && (
            <button
              type="button"
              onClick={() => setShowAddUser(!showAddUser)}
              className="px-4 h-9 bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold rounded-full flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showAddUser ? 'close' : 'person_add'}
              </span>
              {showAddUser ? 'Tutup Form' : 'Tambah Kasir/Staf'}
            </button>
          )}
        </div>

        {userSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {userSuccessMsg}
          </div>
        )}

        {/* Add User Mini Form */}
        {showAddUser && (
          <form onSubmit={handleAddUser} className="p-4 bg-[#f8f9ff] border border-[#d3e4fe] rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#00236f] uppercase">Form Akun Baru</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#444651] mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Contoh: Dina Rahayu"
                  className="w-full h-9 px-3 bg-white border border-[#c5c5d3] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#444651] mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Contoh: dina"
                  className="w-full h-9 px-3 bg-white border border-[#c5c5d3] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#444651] mb-1">Password</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-9 px-3 bg-white border border-[#c5c5d3] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#444651] mb-1">Peran (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full h-9 px-3 bg-white border border-[#c5c5d3] rounded-lg text-xs font-medium"
                >
                  <option value="cashier">Kasir (Register POS)</option>
                  <option value="manager">Manajer Toko</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="px-3 h-8 text-xs font-medium text-[#757682] hover:bg-gray-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 h-8 bg-[#00236f] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Simpan Akun
              </button>
            </div>
          </form>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8f9ff] text-[#444651] uppercase tracking-wider font-semibold border-y border-[#e5eeff]">
                <th className="py-2.5 px-3">Nama & Pengguna</th>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Password Terdaftar</th>
                <th className="py-2.5 px-3">Hak Akses / Peran</th>
                <th className="py-2.5 px-3 text-right">Status / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {users.map((u) => {
                const isSuper = u.role === 'super_admin';
                const isCurrentUser = currentUser?.id === u.id;
                const isPassVisible = visiblePasswords[u.id];

                return (
                  <tr key={u.id} className={isCurrentUser ? 'bg-[#eff4ff]/60' : 'hover:bg-[#f8f9ff]'}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSuper ? 'bg-[#00236f] text-white' : 'bg-[#d3e4fe] text-[#00236f]'
                        }`}>
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#0b1c30]">{u.fullName}</p>
                          {isCurrentUser && (
                            <span className="text-[10px] text-emerald-700 font-semibold">(Sedang Login)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#00236f]">
                      @{u.username}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#f1f3f4] px-2 py-0.5 rounded font-bold text-[#0b1c30]">
                          {isPassVisible ? u.password : '••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisible(u.id)}
                          className="text-[#757682] hover:text-[#00236f] p-0.5"
                          title={isPassVisible ? 'Sembunyikan' : 'Lihat password'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isPassVisible ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isSuper
                          ? 'bg-blue-100 text-[#00236f] border border-blue-200'
                          : u.role === 'manager'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isSuper ? 'Super Admin' : u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isSuper ? (
                        <span className="text-[11px] text-[#757682] font-semibold italic">Akun Utama</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="text-red-600 hover:text-red-800 font-semibold hover:underline"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Profile */}
        <div className="bg-white p-6 rounded-xl border border-[#c5c5d3]/60 shadow-xs space-y-4">
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
        <div className="bg-white p-6 rounded-xl border border-[#c5c5d3]/60 shadow-xs space-y-4">
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
        <div className="bg-white p-6 rounded-xl border border-[#c5c5d3]/60 shadow-xs flex items-center justify-between">
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
      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-xs mt-8">
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

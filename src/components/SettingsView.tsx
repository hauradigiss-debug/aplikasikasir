import React, { useState } from 'react';
import { StoreSettings, User, UserRole, NavigationTab, ThemeMode } from '../types';
import { api, DatabaseStatus } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

interface SettingsViewProps {
  settings: StoreSettings;
  users?: User[];
  currentUser?: User | null;
  onSaveSettings: (newSettings: StoreSettings) => void;
  onSaveUsers?: (newUsers: User[]) => void;
  onResetData: () => void;
  onNavigate?: (tab: NavigationTab) => void;
  onUpdateUserPassword?: (
    userId: string,
    newPassword: string,
    oldPassword?: string,
    forceReset?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  users = [],
  currentUser,
  onSaveSettings,
  onSaveUsers,
  onResetData,
  onNavigate,
  onUpdateUserPassword,
}) => {
  const { themeMode, effectiveTheme, setThemeMode } = useTheme();
  const [formData, setFormData] = useState<StoreSettings>({ ...settings, themeMode: settings.themeMode || themeMode });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Turso Ping & Live Status
  const [tursoStatus, setTursoStatus] = useState<DatabaseStatus | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const handlePingTurso = async () => {
    setIsPinging(true);
    try {
      const res = await api.getStatus();
      setTursoStatus(res);
    } catch (err: any) {
      setTursoStatus({ connected: false, error: err?.message });
    } finally {
      setIsPinging(false);
    }
  };

  // Change Password Modal State
  const [userToEditPass, setUserToEditPass] = useState<User | null>(null);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editPassError, setEditPassError] = useState('');
  const [showEditPass, setShowEditPass] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const handleOpenEditPassword = (u: User) => {
    setUserToEditPass(u);
    setEditNewPassword('');
    setEditPassError('');
    setShowEditPass(false);
  };

  const handleSaveEditPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEditPass) return;
    setEditPassError('');

    if (!editNewPassword.trim()) {
      setEditPassError('Password baru tidak boleh kosong');
      return;
    }

    if (editNewPassword.trim().length < 3) {
      setEditPassError('Password minimal 3 karakter');
      return;
    }

    setIsUpdatingPass(true);
    try {
      if (onUpdateUserPassword) {
        const res = await onUpdateUserPassword(userToEditPass.id, editNewPassword.trim(), undefined, true);
        if (res.success) {
          setUserSuccessMsg(`Password @${userToEditPass.username} berhasil diperbarui di database Turso!`);
          setTimeout(() => setUserSuccessMsg(''), 4000);
          setUserToEditPass(null);
        } else {
          setEditPassError(res.error || 'Gagal mengubah password');
        }
      } else {
        // Fallback update user in state
        const updated = users.map((u) => (u.id === userToEditPass.id ? { ...u, password: editNewPassword.trim() } : u));
        onSaveUsers?.(updated);
        setUserSuccessMsg(`Password @${userToEditPass.username} berhasil diperbarui!`);
        setTimeout(() => setUserSuccessMsg(''), 4000);
        setUserToEditPass(null);
      }
    } catch (err: any) {
      setEditPassError(err?.message || 'Gagal menghubungi server');
    } finally {
      setIsUpdatingPass(false);
    }
  };

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
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] dark:text-slate-100 tracking-tight">System Settings</h1>
        <p className="text-sm text-[#444651] dark:text-slate-400 mt-1">
          Store profile, tax rate calculation, receipt footer, appearance theme, and hardware preferences
        </p>
      </div>

      {/* Turso Cloud Database Integration Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#c5c5d3]/60 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#e5eeff] dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-200 dark:border-emerald-800">
              <span className="material-symbols-outlined">database</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#00236f] dark:text-blue-300">Turso Cloud Database (libSQL)</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Connected
                </span>
              </div>
              <p className="text-xs text-[#757682] dark:text-slate-400 mt-0.5">
                Penyimpanan cloud terdistribusi dengan transaksi atomik (ACID) berkecepatan edge.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePingTurso}
            disabled={isPinging}
            className="px-4 h-9 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-full flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px] animate-spin" style={{ display: isPinging ? 'inline-block' : 'none' }}>
              sync
            </span>
            <span className="material-symbols-outlined text-[16px]" style={{ display: isPinging ? 'none' : 'inline-block' }}>
              network_ping
            </span>
            {isPinging ? 'Menguji...' : 'Uji Koneksi Turso'}
          </button>
        </div>

        {/* Connection Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-[#f8f9ff] dark:bg-slate-800/80 border border-[#d3e4fe] dark:border-slate-700 rounded-lg">
            <span className="text-[10px] font-bold text-[#757682] dark:text-slate-400 uppercase tracking-wider block">Database Name</span>
            <span className="text-xs font-mono font-bold text-[#00236f] dark:text-blue-300 truncate block mt-0.5">mykasirdb-hauradigiss</span>
          </div>
          <div className="p-3 bg-[#f8f9ff] dark:bg-slate-800/80 border border-[#d3e4fe] dark:border-slate-700 rounded-lg">
            <span className="text-[10px] font-bold text-[#757682] dark:text-slate-400 uppercase tracking-wider block">Wilayah Cloud</span>
            <span className="text-xs font-bold text-[#0b1c30] dark:text-slate-200 block mt-0.5">AWS Tokyo (ap-northeast-1)</span>
          </div>
          <div className="p-3 bg-[#f8f9ff] dark:bg-slate-800/80 border border-[#d3e4fe] dark:border-slate-700 rounded-lg">
            <span className="text-[10px] font-bold text-[#757682] dark:text-slate-400 uppercase tracking-wider block">Protokol & Driver</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">libSQL v0.18 (@libsql/client)</span>
          </div>
        </div>

        {tursoStatus && (
          <div className={`p-3 rounded-lg text-xs flex items-center justify-between ${tursoStatus.connected ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-sm">{tursoStatus.connected ? 'check_circle' : 'error'}</span>
              {tursoStatus.connected
                ? `Koneksi aktif! Database merespons dengan latensi ${tursoStatus.latencyMs ?? '<50'} ms.`
                : `Gagal tersambung: ${tursoStatus.error || 'Server error'}`}
            </span>
            <span className="text-[10px] font-mono text-[#5a6072] dark:text-slate-400">Endpoint: libsql://mykasirdb-hauradigiss.aws-ap-northeast-1.turso.io</span>
          </div>
        )}
      </div>

      {/* User Accounts & Credential List Section (ENTERPRISE RBAC) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#c5c5d3]/60 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#e5eeff] dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-[#00236f] dark:text-blue-300 flex items-center gap-2">
              <span className="material-symbols-outlined">admin_panel_settings</span>
              Daftar Kredensial & Pengguna Sistem (RBAC)
            </h3>
            <p className="text-xs text-[#757682] dark:text-slate-400 mt-0.5">
              Kelola kredensial akun Super Admin, Kasir, dan Manajer register POS
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onNavigate && currentUser?.role === 'super_admin' && (
              <button
                type="button"
                onClick={() => onNavigate('admin_security')}
                className="px-3.5 h-9 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#00236f] dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-full flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Buka panel khusus CRUD Password Super Admin"
              >
                <span className="material-symbols-outlined text-[17px]">shield_lock</span>
                <span>CRUD Password Admin</span>
              </button>
            )}
            {onSaveUsers && (
              <button
                type="button"
                onClick={() => setShowAddUser(!showAddUser)}
                className="px-4 h-9 bg-[#00236f] dark:bg-blue-600 hover:bg-[#1e3a8a] dark:hover:bg-blue-700 text-white text-xs font-bold rounded-full flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showAddUser ? 'close' : 'person_add'}
                </span>
                {showAddUser ? 'Tutup Form' : 'Tambah Kasir/Staf'}
              </button>
            )}
          </div>
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
              <tr className="bg-[#f8f9ff] dark:bg-slate-800 text-[#444651] dark:text-slate-300 uppercase tracking-wider font-semibold border-y border-[#e5eeff] dark:border-slate-700">
                <th className="py-2.5 px-3">Nama & Pengguna</th>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">Password Terdaftar</th>
                <th className="py-2.5 px-3">Hak Akses / Peran</th>
                <th className="py-2.5 px-3 text-right">Status / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4] dark:divide-slate-800">
              {users.map((u) => {
                const isSuper = u.role === 'super_admin';
                const isCurrentUser = currentUser?.id === u.id;
                const isPassVisible = visiblePasswords[u.id];

                return (
                  <tr key={u.id} className={isCurrentUser ? 'bg-[#eff4ff]/60 dark:bg-blue-950/30' : 'hover:bg-[#f8f9ff] dark:hover:bg-slate-800/50'}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSuper ? 'bg-[#00236f] dark:bg-blue-600 text-white' : 'bg-[#d3e4fe] dark:bg-slate-700 text-[#00236f] dark:text-blue-300'
                        }`}>
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#0b1c30] dark:text-slate-100">{u.fullName}</p>
                          {isCurrentUser && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">(Sedang Login)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#00236f] dark:text-blue-300">
                      @{u.username}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#f1f3f4] dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-[#0b1c30] dark:text-slate-200">
                          {isPassVisible ? u.password : '••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisible(u.id)}
                          className="text-[#757682] dark:text-slate-400 hover:text-[#00236f] dark:hover:text-blue-300 p-0.5"
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
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-[#00236f] dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                          : u.role === 'manager'
                          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300'
                      }`}>
                        {isSuper ? 'Super Admin' : u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPassword(u)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title={`Ubah password akun @${u.username}`}
                        >
                          <span className="material-symbols-outlined text-[14px] text-[#00236f] dark:text-blue-300">key</span>
                          <span>Ubah Password</span>
                        </button>
                        {!isSuper && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold hover:underline text-[11px] px-1"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Password Modal */}
      {userToEditPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00236f]">key</span>
                <h3 className="text-sm font-bold text-[#0b1c30]">
                  Ubah Password @{userToEditPass.username}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUserToEditPass(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {editPassError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl">
                {editPassError}
              </div>
            )}

            <form onSubmit={handleSaveEditPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password Baru ({userToEditPass.fullName})
                </label>
                <div className="relative">
                  <input
                    type={showEditPass ? 'text' : 'password'}
                    required
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="w-full h-9 px-3 pr-9 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPass(!showEditPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showEditPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToEditPass(null)}
                  className="px-3 h-8 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPass}
                  className="px-4 h-8 bg-[#00236f] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingPass ? 'Menyimpan...' : 'Simpan Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Appearance & Theme Mode Section (Light / Dark / System) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#c5c5d3]/60 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#e5eeff] dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-[#00236f] dark:text-blue-300 flex items-center gap-2">
                <span className="material-symbols-outlined">palette</span>
                Tema Tampilan & Mode Warna
              </h3>
              <p className="text-xs text-[#757682] dark:text-slate-400 mt-0.5">
                Sesuaikan kenyamanan visual register kasir dan panel inventaris (Terang, Gelap, atau Otomatis Sistem).
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-slate-800 text-[#00236f] dark:text-blue-300 border border-blue-200 dark:border-slate-700">
              Aktif: {effectiveTheme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => {
                setThemeMode('light');
                setFormData((prev) => ({ ...prev, themeMode: 'light' }));
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                themeMode === 'light'
                  ? 'border-[#00236f] bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-[#00236f]/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Sun className="w-5 h-5 text-amber-600" />
                </div>
                {themeMode === 'light' && (
                  <span className="w-5 h-5 rounded-full bg-[#00236f] text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-[#0b1c30] dark:text-slate-100">Mode Terang (Light)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tampilan kontras tinggi dengan latar putih bersih, ideal untuk pencahayaan ruangan toko yang terang.
              </p>
            </button>

            {/* System Mode Card */}
            <button
              type="button"
              onClick={() => {
                setThemeMode('system');
                setFormData((prev) => ({ ...prev, themeMode: 'system' }));
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                themeMode === 'system'
                  ? 'border-[#00236f] bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-[#00236f]/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 flex items-center justify-center font-bold">
                  <Monitor className="w-5 h-5" />
                </div>
                {themeMode === 'system' && (
                  <span className="w-5 h-5 rounded-full bg-[#00236f] text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-[#0b1c30] dark:text-slate-100">Mode Sistem (Auto)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Otomatis menyesuaikan mode terang atau gelap sesuai preferensi sistem operasi & perangkat Anda.
              </p>
            </button>

            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => {
                setThemeMode('dark');
                setFormData((prev) => ({ ...prev, themeMode: 'dark' }));
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                themeMode === 'dark'
                  ? 'border-[#00236f] dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-[#00236f]/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-100 flex items-center justify-center font-bold">
                  <Moon className="w-5 h-5 text-blue-300" />
                </div>
                {themeMode === 'dark' && (
                  <span className="w-5 h-5 rounded-full bg-[#00236f] dark:bg-blue-500 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-[#0b1c30] dark:text-slate-100">Mode Gelap (Dark)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Warna redup nyaman di mata untuk pencahayaan minim, shift kasir malam, dan menghemat baterai.
              </p>
            </button>
          </div>
        </div>

        {/* Store Profile */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#c5c5d3]/60 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#c5c5d3]/60 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <h3 className="text-base font-bold text-[#00236f] dark:text-blue-300 flex items-center gap-2">
            <span className="material-symbols-outlined">receipt</span>
            Tax & Pricing
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0b1c30] dark:text-slate-300 uppercase mb-1.5">
                Sales Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={Math.round(formData.taxRate * 10000) / 100}
                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) / 100 })}
                className="w-full h-11 px-3.5 bg-[#f8f9ff] dark:bg-slate-800/80 border border-[#c5c5d3] dark:border-slate-700 rounded-lg text-sm font-semibold text-[#0b1c30] dark:text-slate-100 focus:border-[#00236f] dark:focus:border-blue-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] dark:text-slate-300 uppercase mb-1.5">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full h-11 px-3.5 bg-[#f8f9ff] dark:bg-slate-800/80 border border-[#c5c5d3] dark:border-slate-700 rounded-lg text-sm font-bold text-[#0b1c30] dark:text-slate-100 focus:border-[#00236f] dark:focus:border-blue-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] dark:text-slate-300 uppercase mb-1.5">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="1"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                className="w-full h-11 px-3.5 bg-[#f8f9ff] dark:bg-slate-800/80 border border-[#c5c5d3] dark:border-slate-700 rounded-lg text-sm font-semibold text-[#0b1c30] dark:text-slate-100 focus:border-[#00236f] dark:focus:border-blue-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0b1c30] dark:text-slate-300 uppercase mb-1.5">
              Receipt Footer Message
            </label>
            <input
              type="text"
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              className="w-full h-11 px-3.5 bg-[#f8f9ff] dark:bg-slate-800/80 border border-[#c5c5d3] dark:border-slate-700 rounded-lg text-sm text-[#0b1c30] dark:text-slate-100 focus:border-[#00236f] dark:focus:border-blue-400 outline-none"
            />
          </div>
        </div>

        {/* Audio & Feedback */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-[#c5c5d3]/60 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <h4 className="font-bold text-sm text-[#0b1c30] dark:text-slate-100">POS Audio Feedback</h4>
            <p className="text-xs text-[#757682] dark:text-slate-400">Play scanner beep and cash register chime on checkout</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, enableSound: !formData.enableSound })}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              formData.enableSound ? 'bg-[#00236f] dark:bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'
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
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Settings saved successfully!
            </span>
          ) : <span />}

          <button
            type="submit"
            className="px-6 h-11 bg-[#00236f] dark:bg-blue-600 hover:bg-[#1e3a8a] dark:hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save Settings
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-red-200 dark:border-red-900/50 shadow-xs mt-8 transition-colors">
        <h3 className="text-base font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined">dangerous</span>
          Data Reset & Seed Defaults
        </h3>
        <p className="text-xs text-[#757682] dark:text-slate-400 mb-4">
          Reset all products, stock counts, and sales history back to the initial sample stationery store data.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to reset all inventory and transaction history to initial defaults?')) {
              onResetData();
            }
          }}
          className="px-4 h-10 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          Reset to Factory Initial Data
        </button>
      </div>
    </div>
  );
};

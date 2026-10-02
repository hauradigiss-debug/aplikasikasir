import React, { useState } from 'react';
import { User, StoreSettings } from '../types';
import { api, DatabaseStatus } from '../services/api';
import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  UserPlus,
  RefreshCw,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  History,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface SuperAdminSecurityViewProps {
  users: User[];
  currentUser: User | null;
  settings: StoreSettings;
  onSaveUsers: (newUsers: User[]) => void;
  onUpdateUserPassword: (
    userId: string,
    newPassword: string,
    oldPassword?: string,
    forceReset?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  targetUsername: string;
  performedBy: string;
  status: 'success' | 'warning' | 'error';
}

export const SuperAdminSecurityView: React.FC<SuperAdminSecurityViewProps> = ({
  users,
  currentUser,
  settings,
  onSaveUsers,
  onUpdateUserPassword,
}) => {
  // Filter only super admin users
  const superAdmins = users.filter((u) => u.role === 'super_admin');
  const otherUsers = users.filter((u) => u.role !== 'super_admin');

  // Password visibility state map
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Self password change state
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSubmittingSelf, setIsSubmittingSelf] = useState(false);
  const [selfSuccessMsg, setSelfSuccessMsg] = useState('');
  const [selfErrorMsg, setSelfErrorMsg] = useState('');

  // Target User Modal for Update / Reset Password
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [modalNewPassword, setModalNewPassword] = useState('');
  const [modalConfirmPassword, setModalConfirmPassword] = useState('');
  const [showModalPass, setShowModalPass] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [modalErrorMsg, setModalErrorMsg] = useState('');

  // Add New Super Admin Modal
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [showAddAdminPass, setShowAddAdminPass] = useState(false);
  const [addAdminError, setAddAdminError] = useState('');
  const [isSubmittingNewAdmin, setIsSubmittingNewAdmin] = useState(false);

  // Audit Logs (stored in local state & localStorage)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('stationery_admin_audit_logs');
      return saved ? JSON.parse(saved) : [
        {
          id: 'log-init',
          timestamp: new Date().toISOString(),
          action: 'Akses Menu Keamanan Super Admin',
          targetUsername: currentUser?.username || 'haura',
          performedBy: currentUser?.fullName || 'Super Admin',
          status: 'success',
        },
      ];
    } catch {
      return [];
    }
  });

  const addAuditLog = (
    action: string,
    targetUsername: string,
    status: 'success' | 'warning' | 'error' = 'success'
  ) => {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      targetUsername,
      performedBy: currentUser?.fullName || 'Super Admin',
      status,
    };
    const updated = [entry, ...auditLogs].slice(0, 30);
    setAuditLogs(updated);
    try {
      localStorage.setItem('stationery_admin_audit_logs', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save audit logs:', e);
    }
  };

  // Turso Ping Check
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

  // Password generator helper
  const generateStrongPassword = (length = 10): string => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Password strength calculator
  const calculateStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Kosong', color: 'bg-slate-200', text: 'text-slate-500' };
    let score = 0;
    if (pwd.length >= 4) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Lemah', color: 'bg-red-500', text: 'text-red-700' };
    if (score === 2) return { score: 2, label: 'Cukup', color: 'bg-amber-500', text: 'text-amber-700' };
    if (score === 3 || score === 4) return { score: 3, label: 'Kuat', color: 'bg-emerald-500', text: 'text-emerald-700' };
    return { score: 4, label: 'Sangat Kuat', color: 'bg-blue-600', text: 'text-blue-700' };
  };

  const togglePasswordVisible = (userId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleCopyPassword = (userId: string, passwordText?: string) => {
    if (!passwordText) return;
    navigator.clipboard.writeText(passwordText);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Submit Self Password Change
  const handleSelfPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSelfErrorMsg('');
    setSelfSuccessMsg('');

    if (!newPasswordInput.trim()) {
      setSelfErrorMsg('Password baru tidak boleh kosong!');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setSelfErrorMsg('Konfirmasi password tidak cocok dengan password baru!');
      return;
    }

    if (newPasswordInput.length < 3) {
      setSelfErrorMsg('Password baru minimal 3 karakter!');
      return;
    }

    setIsSubmittingSelf(true);
    try {
      const result = await onUpdateUserPassword(
        currentUser.id,
        newPasswordInput.trim(),
        currentPasswordInput.trim(),
        false
      );

      if (result.success) {
        setSelfSuccessMsg('Password Super Admin Anda berhasil diubah dan disinkronkan ke database Turso!');
        addAuditLog('Update Password Mandiri', currentUser.username, 'success');
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setTimeout(() => setSelfSuccessMsg(''), 5000);
      } else {
        setSelfErrorMsg(result.error || 'Gagal mengubah password. Periksa password lama Anda.');
        addAuditLog('Gagal Update Password Mandiri', currentUser.username, 'error');
      }
    } catch (err: any) {
      setSelfErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmittingSelf(false);
    }
  };

  // 2. Submit Reset / Update Password on Selected Super Admin User (Admin Override)
  const handleModalPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    setModalErrorMsg('');

    if (!modalNewPassword.trim()) {
      setModalErrorMsg('Password baru tidak boleh kosong!');
      return;
    }

    if (modalNewPassword !== modalConfirmPassword) {
      setModalErrorMsg('Konfirmasi password tidak cocok!');
      return;
    }

    if (modalNewPassword.length < 3) {
      setModalErrorMsg('Password baru minimal 3 karakter!');
      return;
    }

    setIsSubmittingModal(true);
    try {
      const result = await onUpdateUserPassword(
        selectedUserForEdit.id,
        modalNewPassword.trim(),
        undefined,
        true // Force reset by Super Admin
      );

      if (result.success) {
        addAuditLog(
          `Update Password Akun @${selectedUserForEdit.username}`,
          selectedUserForEdit.username,
          'success'
        );
        setSelectedUserForEdit(null);
        setModalNewPassword('');
        setModalConfirmPassword('');
      } else {
        setModalErrorMsg(result.error || 'Gagal mengubah password pengguna.');
        addAuditLog(
          `Gagal Update Password @${selectedUserForEdit.username}`,
          selectedUserForEdit.username,
          'error'
        );
      }
    } catch (err: any) {
      setModalErrorMsg(err?.message || 'Terjadi kegagalan server.');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // 3. Create New Super Admin Account (C in CRUD)
  const handleCreateNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminError('');

    const cleanUsername = newAdminUsername.trim().toLowerCase();
    const cleanFullName = newAdminFullName.trim();
    const cleanPassword = newAdminPassword.trim();

    if (!cleanFullName || !cleanUsername || !cleanPassword) {
      setAddAdminError('Semua field wajib diisi!');
      return;
    }

    if (cleanPassword !== newAdminConfirmPassword.trim()) {
      setAddAdminError('Konfirmasi password tidak cocok!');
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setAddAdminError('Username tersebut sudah digunakan oleh akun lain!');
      return;
    }

    setIsSubmittingNewAdmin(true);
    try {
      const newAdmin: User = {
        id: `usr-admin-${Date.now()}`,
        username: cleanUsername,
        password: cleanPassword,
        fullName: cleanFullName,
        role: 'super_admin',
        avatar: 'shield_person',
        lastLogin: new Date().toISOString(),
      };

      // Save via API to Turso
      const apiSuccess = await api.saveUser(newAdmin);
      if (apiSuccess) {
        onSaveUsers([...users, newAdmin]);
        addAuditLog(`Tambah Akun Super Admin Baru @${cleanUsername}`, cleanUsername, 'success');
        setShowAddAdminModal(false);
        setNewAdminFullName('');
        setNewAdminUsername('');
        setNewAdminPassword('');
        setNewAdminConfirmPassword('');
      } else {
        setAddAdminError('Gagal menyimpan akun ke database Turso');
      }
    } catch (err: any) {
      setAddAdminError(err?.message || 'Gagal membuat akun');
    } finally {
      setIsSubmittingNewAdmin(false);
    }
  };

  // 4. Delete Super Admin Account (D in CRUD)
  const handleDeleteSuperAdmin = async (userId: string, username: string) => {
    if (username.toLowerCase() === 'haura') {
      alert('Akun Super Admin "haura" adalah akun induk sistem dan tidak dapat dihapus!');
      return;
    }

    if (currentUser?.id === userId) {
      alert('Anda tidak dapat menghapus akun Super Admin yang sedang Anda gunakan saat ini!');
      return;
    }

    const confirmDelete = window.confirm(
      `PENTING: Apakah Anda yakin ingin menghapus akun Super Admin @${username}? Tindakan ini permanen dan akan mencabut seluruh hak akses istimewa.`
    );

    if (confirmDelete) {
      try {
        await api.deleteUser(userId);
        const updated = users.filter((u) => u.id !== userId);
        onSaveUsers(updated);
        addAuditLog(`Hapus Akun Super Admin @${username}`, username, 'warning');
      } catch (err: any) {
        alert(`Gagal menghapus pengguna: ${err?.message}`);
      }
    }
  };

  const selfStrength = calculateStrength(newPasswordInput);

  return (
    <div className="w-full max-w-6xl space-y-8 pb-16">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#00236f] dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#00236f] dark:text-blue-400" />
              <span>SUPER ADMIN PRIVILEGED ACCESS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] dark:text-slate-100 tracking-tight">
              Manajemen Kredensial & CRUD Password Super Admin
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Pusat kendali otoritas tertinggi untuk mengelola kata sandi akun Super Admin,
              menambah administrator baru, melakukan reset instan, dan memantau sinkronisasi database Turso Cloud.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Quick Theme Switcher */}
            <ThemeToggle variant="compact" />

            <button
              type="button"
              onClick={handlePingTurso}
              disabled={isPinging}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Menguji...' : 'Uji Database Turso'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddAdminModal(true)}
              className="px-5 py-2.5 rounded-xl bg-[#00236f] dark:bg-blue-600 hover:bg-[#12398c] dark:hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Super Admin Baru</span>
            </button>
          </div>
        </div>

        {/* Database Status Pill if tested */}
        {tursoStatus && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between border ${
              tursoStatus.connected
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {tursoStatus.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span>
                {tursoStatus.connected
                  ? `Koneksi Turso Cloud Aktif (libSQL AWS Tokyo) • Latensi ${tursoStatus.latencyMs ?? '<40'} ms`
                  : `Koneksi Turso Terkendala: ${tursoStatus.error}`}
              </span>
            </div>
            <span className="font-mono text-[10px] opacity-75">
              mykasirdb-hauradigiss
            </span>
          </div>
        )}
      </div>

      {/* Grid: Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Super Admin Aktif</p>
            <h3 className="text-2xl font-bold text-[#00236f] dark:text-blue-300 mt-1">{superAdmins.length} Akun</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Memiliki akses penuh POS</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#00236f] dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Login Saat Ini</p>
            <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 truncate max-w-[130px]">
              @{currentUser?.username || 'haura'}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Sesi Terverifikasi</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
            <Lock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Metode Enkripsi</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">ACID SQLite</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Turso Distributed SQL</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center border border-purple-100 dark:border-purple-900">
            <KeyRound className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Staf / Kasir</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">{otherUsers.length} Pengguna</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Kasir & Manajer Toko</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <History className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Content: Form Ganti Password Saya & Super Admin Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Ganti Password Super Admin Saya */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00236f] flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5 text-[#00236f]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0b1c30]">Ganti Password Saya</h2>
              <p className="text-xs text-slate-500">
                Ubah kata sandi akun Super Admin yang sedang aktif (@{currentUser?.username})
              </p>
            </div>
          </div>

          {selfSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{selfSuccessMsg}</span>
            </div>
          )}

          {selfErrorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{selfErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSelfPasswordSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password Saat Ini (Lama)
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Masukkan password lama Anda"
                  className="w-full h-10 px-3.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#00236f] focus:ring-2 focus:ring-[#00236f]/10 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Password Baru</label>
                <button
                  type="button"
                  onClick={() => {
                    const pwd = generateStrongPassword(10);
                    setNewPasswordInput(pwd);
                    setConfirmPasswordInput(pwd);
                    setShowNewPass(true);
                  }}
                  className="text-[11px] font-semibold text-[#00236f] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Generate Password Acak</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Minimal 3-4 karakter"
                  className="w-full h-10 px-3.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#00236f] focus:ring-2 focus:ring-[#00236f]/10 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {newPasswordInput && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Kekuatan Password:</span>
                    <span className={`font-bold ${selfStrength.text}`}>{selfStrength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        selfStrength.score >= 1 ? selfStrength.color : 'bg-transparent'
                      } ${selfStrength.score >= 1 ? 'w-1/4' : 'w-0'}`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        selfStrength.score >= 2 ? selfStrength.color : 'bg-transparent'
                      } ${selfStrength.score >= 2 ? 'w-1/4' : 'w-0'}`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        selfStrength.score >= 3 ? selfStrength.color : 'bg-transparent'
                      } ${selfStrength.score >= 3 ? 'w-1/4' : 'w-0'}`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        selfStrength.score >= 4 ? selfStrength.color : 'bg-transparent'
                      } ${selfStrength.score >= 4 ? 'w-1/4' : 'w-0'}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Konfirmasi Password Baru
              </label>
              <input
                type={showNewPass ? 'text' : 'password'}
                required
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="Ketik ulang password baru"
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#00236f] focus:ring-2 focus:ring-[#00236f]/10 transition-all font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingSelf}
                className="w-full h-10 bg-[#00236f] hover:bg-[#12398c] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmittingSelf ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{isSubmittingSelf ? 'Menyimpan...' : 'Perbarui Password Saya'}</span>
              </button>
            </div>
          </form>

          {/* Quick tips */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] space-y-1.5">
            <p className="font-bold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#00236f]" />
              <span>Standar Keamanan Super Admin:</span>
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500 pl-1">
              <li>Perubahan password otomatis tersinkron ke cloud Turso DB.</li>
              <li>Akun utama <strong>@haura</strong> dilindungi dari penghapusan.</li>
              <li>Gunakan kombinasi karakter huruf besar, angka, dan simbol.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Daftar Akun Super Admin (CRUD Read, Update, Delete) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#00236f]" />
                  <span>Daftar Kredensial Super Admin</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar seluruh akun tingkat master dengan hak akses administratif penuh
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-[#00236f] border border-blue-200">
                {superAdmins.length} Administrator
              </span>
            </div>

            {/* Super Admin Cards / Table */}
            <div className="space-y-3.5">
              {superAdmins.map((admin) => {
                const isCurrentUser = currentUser?.id === admin.id;
                const isPassVisible = visiblePasswords[admin.id];
                const isHauraMaster = admin.username.toLowerCase() === 'haura';
                const strength = calculateStrength(admin.password || '');

                return (
                  <div
                    key={admin.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrentUser
                        ? 'border-blue-300 bg-blue-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Avatar & Info */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                            isHauraMaster
                              ? 'bg-[#00236f] text-white ring-2 ring-blue-300'
                              : 'bg-slate-800 text-white'
                          }`}
                        >
                          {admin.fullName.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-[#0b1c30]">{admin.fullName}</h3>
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Sesi Anda
                              </span>
                            )}
                            {isHauraMaster && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Root / Induk
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono font-semibold text-[#00236f] mt-0.5">
                            @{admin.username}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForEdit(admin);
                            setModalNewPassword('');
                            setModalConfirmPassword('');
                            setModalErrorMsg('');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Ubah / Reset Password Akun Ini"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-[#00236f]" />
                          <span>Ubah Password</span>
                        </button>

                        {!isHauraMaster && !isCurrentUser && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSuperAdmin(admin.id, admin.username)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                            title="Hapus Super Admin"
                            aria-label={`Hapus Super Admin ${admin.username}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Password Display & Details Bar */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      {/* Password snippet with visibility & copy */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Password:</span>
                        <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-mono font-bold text-slate-800">
                          <span>{isPassVisible ? admin.password : '••••••••'}</span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisible(admin.id)}
                            className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer"
                            title={isPassVisible ? 'Sembunyikan' : 'Tampilkan password'}
                          >
                            {isPassVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(admin.id, admin.password)}
                            className="text-slate-400 hover:text-slate-700 ml-0.5 cursor-pointer"
                            title="Salin password"
                          >
                            {copiedId === admin.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            strength.score >= 3
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {strength.label}
                        </span>
                      </div>

                      {/* Timestamps */}
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <History className="w-3 h-3" />
                        <span>Login: {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString('id-ID') : 'Belum pernah'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security Audit Activity Log */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#00236f]" />
                <h3 className="text-sm font-bold text-[#0b1c30]">Audit Trail Aktivitas Password</h3>
              </div>
              <span className="text-[11px] text-slate-400">Tercatat Otomatis</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        log.status === 'success'
                          ? 'bg-emerald-500'
                          : log.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="text-[11px] text-slate-500 font-mono">(@{log.targetUsername})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Edit / Reset Password Super Admin (U in CRUD) */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#00236f] flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5 text-[#00236f]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0b1c30]">Ubah Password Admin</h3>
                  <p className="text-xs text-slate-500">
                    Target: @{selectedUserForEdit.username} ({selectedUserForEdit.fullName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForEdit(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {modalErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleModalPasswordSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Password Baru</label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateStrongPassword(10);
                      setModalNewPassword(pwd);
                      setModalConfirmPassword(pwd);
                      setShowModalPass(true);
                    }}
                    className="text-[11px] font-semibold text-[#00236f] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Generate Acak</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showModalPass ? 'text' : 'password'}
                    required
                    value={modalNewPassword}
                    onChange={(e) => setModalNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="w-full h-10 px-3.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:border-[#00236f]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPass(!showModalPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showModalPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <input
                  type={showModalPass ? 'text' : 'password'}
                  required
                  value={modalConfirmPassword}
                  onChange={(e) => setModalConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:border-[#00236f]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 h-9 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingModal}
                  className="px-5 h-9 bg-[#00236f] hover:bg-[#12398c] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingModal ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmittingModal ? 'Menyimpan...' : 'Simpan Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create New Super Admin (C in CRUD) */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#00236f] flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5 text-[#00236f]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0b1c30]">Tambah Super Admin Baru</h3>
                  <p className="text-xs text-slate-500">Mendaftarkan hak akses penuh sistem POS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {addAdminError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addAdminError}</span>
              </div>
            )}

            <form onSubmit={handleCreateNewAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newAdminFullName}
                  onChange={(e) => setNewAdminFullName(e.target.value)}
                  placeholder="Contoh: Raditya Pratama"
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-[#00236f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Username (Unik)</label>
                <input
                  type="text"
                  required
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="Contoh: radit_admin"
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:border-[#00236f]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateStrongPassword(10);
                      setNewAdminPassword(pwd);
                      setNewAdminConfirmPassword(pwd);
                      setShowAddAdminPass(true);
                    }}
                    className="text-[11px] font-semibold text-[#00236f] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Generate Acak</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAddAdminPass ? 'text' : 'password'}
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Minimal 3 karakter"
                    className="w-full h-10 px-3.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:border-[#00236f]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddAdminPass(!showAddAdminPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showAddAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Konfirmasi Password</label>
                <input
                  type={showAddAdminPass ? 'text' : 'password'}
                  required
                  value={newAdminConfirmPassword}
                  onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password"
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:border-[#00236f]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 h-9 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewAdmin}
                  className="px-5 h-9 bg-[#00236f] hover:bg-[#12398c] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingNewAdmin ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmittingNewAdmin ? 'Mendaftarkan...' : 'Buat Super Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

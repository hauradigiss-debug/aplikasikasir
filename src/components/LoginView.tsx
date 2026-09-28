import React, { useState } from 'react';
import { User, Member } from '../types';
import { api } from '../services/api';

interface LoginViewProps {
  users: User[];
  members?: Member[];
  onLogin: (user: User) => void;
  onMemberCreated?: (member: Member) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  members = [],
  onLogin,
  onMemberCreated,
}) => {
  // Main Tab: 'staff' vs 'member'
  const [authMode, setAuthMode] = useState<'staff' | 'member'>('staff');

  // Member Sub-tab: 'signin' vs 'signup'
  const [memberAction, setMemberAction] = useState<'signin' | 'signup'>('signin');

  // Staff Login State
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffRememberMe, setStaffRememberMe] = useState(true);

  // Member Sign In State
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [showMemberPassword, setShowMemberPassword] = useState(false);

  // Member Sign Up State
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & Feedback States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Handle Staff Login
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      // 1. Authenticate against Turso Cloud database first
      const res = await api.login(staffUsername, staffPassword);
      if (res.success && res.user) {
        setIsLoading(false);
        onLogin(res.user);
        return;
      }

      // 2. Offline fallback
      const trimmedUser = staffUsername.trim().toLowerCase();
      const trimmedPass = staffPassword.trim();
      const matched = users.find(
        (u) => u.username.toLowerCase() === trimmedUser && u.password === trimmedPass
      );

      if (matched) {
        setIsLoading(false);
        onLogin(matched);
      } else {
        setIsLoading(false);
        setErrorMsg(res.error || 'Username atau password tidak cocok. Silakan periksa kredensial.');
      }
    } catch {
      const trimmedUser = staffUsername.trim().toLowerCase();
      const trimmedPass = staffPassword.trim();
      const matched = users.find(
        (u) => u.username.toLowerCase() === trimmedUser && u.password === trimmedPass
      );
      if (matched) {
        setIsLoading(false);
        onLogin(matched);
      } else {
        setIsLoading(false);
        setErrorMsg('Gagal memverifikasi login staff.');
      }
    }
  };

  // 2. Handle Member Sign In
  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      // 1. Call Turso DB Member Login
      const res = await api.loginMember(memberIdentifier, memberPassword);
      if (res.success && res.member) {
        setIsLoading(false);
        const memberUser: User = {
          id: res.member.id,
          username: res.member.username,
          fullName: res.member.fullName,
          role: 'member',
          avatar: res.member.avatar || 'face',
          lastLogin: new Date().toISOString(),
          memberData: res.member,
        };
        onLogin(memberUser);
        return;
      }

      // 2. Local fallback check
      const trimmedIdent = memberIdentifier.trim().toLowerCase();
      const trimmedPass = memberPassword.trim();
      const matchedMember = members.find(
        (m) =>
          (m.username.toLowerCase() === trimmedIdent ||
            m.memberCode.toLowerCase() === trimmedIdent ||
            (m.email && m.email.toLowerCase() === trimmedIdent) ||
            (m.phone && m.phone === memberIdentifier.trim())) &&
          m.password === trimmedPass
      );

      if (matchedMember) {
        setIsLoading(false);
        const memberUser: User = {
          id: matchedMember.id,
          username: matchedMember.username,
          fullName: matchedMember.fullName,
          role: 'member',
          avatar: matchedMember.avatar || 'face',
          lastLogin: new Date().toISOString(),
          memberData: matchedMember,
        };
        onLogin(memberUser);
      } else {
        setIsLoading(false);
        setErrorMsg(res.error || 'Kredensial member tidak ditemukan atau kata sandi salah.');
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('Gagal menghubungi database member.');
    }
  };

  // 3. Handle Member Sign Up (Register to Turso DB)
  const handleMemberRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
      return;
    }

    if (regPassword.length < 3) {
      setErrorMsg('Kata sandi minimal 3 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.registerMember({
        fullName: regFullName,
        username: regUsername,
        password: regPassword,
        phone: regPhone || undefined,
        email: regEmail || undefined,
      });

      if (res.success && res.member) {
        setIsLoading(false);
        setSuccessMsg(
          `Selamat ${res.member.fullName}! Akun member berhasil dibuat dengan Kode ${res.member.memberCode} & bonus 50 poin.`
        );

        if (onMemberCreated) {
          onMemberCreated(res.member);
        }

        // Auto login after 1.5 seconds or immediately
        setTimeout(() => {
          const memberUser: User = {
            id: res.member!.id,
            username: res.member!.username,
            fullName: res.member!.fullName,
            role: 'member',
            avatar: res.member!.avatar || 'face',
            lastLogin: new Date().toISOString(),
            memberData: res.member,
          };
          onLogin(memberUser);
        }, 1200);
      } else {
        setIsLoading(false);
        setErrorMsg(res.error || 'Gagal mendaftar member.');
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('Terjadi kesalahan koneksi saat registrasi member.');
    }
  };

  // Quick Select Helper for Staff
  const handleSelectStaffCred = (u: User) => {
    setAuthMode('staff');
    setStaffUsername(u.username);
    setStaffPassword(u.password || '');
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Quick Select Helper for Member
  const handleSelectMemberCred = (m: Member) => {
    setAuthMode('member');
    setMemberAction('signin');
    setMemberIdentifier(m.username);
    setMemberPassword(m.password || '123');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const superAdmin = users.find((u) => u.role === 'super_admin') || {
    id: 'usr-super-admin',
    username: 'haura',
    password: '231',
    fullName: 'Haura',
    role: 'super_admin' as const,
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f6fb] flex flex-col justify-between items-center p-3 sm:p-6 lg:p-8 selection:bg-[#d3e4fe]">
      {/* Top Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between pb-4 border-b border-[#d8dce6]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00236f] flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-2xl">point_of_sale</span>
          </div>
          <div>
            <h1 className="font-bold text-base text-[#0b1c30] leading-tight flex items-center gap-2">
              <span>StationeryPOS</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                Hub & Member
              </span>
            </h1>
            <p className="text-xs text-[#5a6072]">
              Sistem Kasir Ritel & Portal Keanggotaan Member
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-[#5a6072]">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#d8dce6] rounded-lg font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Register: POS-01
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-medium text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Turso DB: Sinkron
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 py-6 items-start">
        {/* Left Column: Form Tab (7 cols) */}
        <section className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-[#d8dce6] shadow-xs">
          {/* Main Mode Toggle: Staff vs Member */}
          <div className="flex p-1 bg-[#f0f3fa] rounded-xl mb-6 border border-[#d8dce6]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('staff');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'staff'
                  ? 'bg-white text-[#00236f] shadow-xs'
                  : 'text-[#5a6072] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              <span>Kasir & Staff</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('member');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'member'
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'text-[#5a6072] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">card_membership</span>
              <span>Member Loyalty</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in-50">
              <span className="material-symbols-outlined text-base text-red-700 mt-0.5">error</span>
              <div>
                <strong className="block font-semibold">Perhatian</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in-50">
              <span className="material-symbols-outlined text-base text-emerald-700 mt-0.5">check_circle</span>
              <div>
                <strong className="block font-semibold">Berhasil</strong>
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAFF LOGIN VIEW */}
          {/* ============================================================== */}
          {authMode === 'staff' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0b1c30]">
                  Masuk Kasir / Staff
                </h2>
                <p className="text-xs sm:text-sm text-[#5a6072] mt-1">
                  Gunakan username dan kata sandi staff untuk membuka register kasir POS & manajemen toko.
                </p>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-4">
                <div>
                  <label htmlFor="staff-username" className="block text-xs font-semibold text-[#0b1c30] mb-1.5">
                    Username Staff
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682] text-lg">
                      person
                    </span>
                    <input
                      id="staff-username"
                      type="text"
                      required
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      placeholder="Contoh: haura / sarah / manager"
                      className="w-full h-11 pl-10 pr-3 bg-white border border-[#c5c5d3] rounded-xl text-sm text-[#0b1c30] font-medium focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="staff-password" className="block text-xs font-semibold text-[#0b1c30] mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682] text-lg">
                      lock
                    </span>
                    <input
                      id="staff-password"
                      type={showStaffPassword ? 'text' : 'password'}
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="Masukkan kata sandi staff"
                      className="w-full h-11 pl-10 pr-11 bg-white border border-[#c5c5d3] rounded-xl text-sm text-[#0b1c30] font-medium focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757682] hover:text-[#00236f] p-1 rounded cursor-pointer"
                      title={showStaffPassword ? 'Sembunyikan' : 'Lihat'}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showStaffPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#444651]">
                    <input
                      type="checkbox"
                      checked={staffRememberMe}
                      onChange={(e) => setStaffRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00236f] border-[#c5c5d3] focus:ring-[#00236f]"
                    />
                    <span>Ingat sesi di perangkat ini</span>
                  </label>

                  <span className="text-xs text-[#5a6072] flex items-center gap-1 font-mono">
                    POS-SF-01
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 mt-2 bg-[#00236f] hover:bg-[#12398c] active:bg-[#001b57] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60 shadow-xs"
                >
                  {isLoading ? (
                    <span>Memverifikasi kredensial...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">login</span>
                      <span>Buka Register Kasir</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* MEMBER PORTAL VIEW (SIGN IN & SIGN UP) */}
          {/* ============================================================== */}
          {authMode === 'member' && (
            <div>
              {/* Sub Navigation: Sign In vs Sign Up */}
              <div className="flex items-center justify-between border-b border-[#d8dce6] pb-3 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0b1c30]">
                    {memberAction === 'signin' ? 'Masuk Akun Member' : 'Pendaftaran Member Baru'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5a6072] mt-0.5">
                    {memberAction === 'signin'
                      ? 'Dapatkan diskon belanja loyalitas & tukar poin reward di kasir.'
                      : 'Daftar sekarang & dapatkan bonus 50 poin + diskon belanja 5% langsung!'}
                  </p>
                </div>

                <div className="flex bg-[#f0f3fa] p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMemberAction('signin');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      memberAction === 'signin'
                        ? 'bg-white text-[#00236f] shadow-xs'
                        : 'text-[#5a6072] hover:text-[#0b1c30]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMemberAction('signup');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      memberAction === 'signup'
                        ? 'bg-[#00236f] text-white shadow-xs'
                        : 'text-[#5a6072] hover:text-[#0b1c30]'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* MEMBER SIGN IN FORM */}
              {memberAction === 'signin' && (
                <form onSubmit={handleMemberLogin} className="space-y-4">
                  <div>
                    <label htmlFor="member-ident" className="block text-xs font-semibold text-[#0b1c30] mb-1.5">
                      Username / Email / No. HP / Kode Member
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682] text-lg">
                        badge
                      </span>
                      <input
                        id="member-ident"
                        type="text"
                        required
                        value={memberIdentifier}
                        onChange={(e) => setMemberIdentifier(e.target.value)}
                        placeholder="Contoh: anita / bambang / MBR-8801"
                        className="w-full h-11 pl-10 pr-3 bg-white border border-[#c5c5d3] rounded-xl text-sm text-[#0b1c30] font-medium focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="member-password" className="block text-xs font-semibold text-[#0b1c30] mb-1.5">
                      Kata Sandi Member
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682] text-lg">
                        lock
                      </span>
                      <input
                        id="member-password"
                        type={showMemberPassword ? 'text' : 'password'}
                        required
                        value={memberPassword}
                        onChange={(e) => setMemberPassword(e.target.value)}
                        placeholder="Masukkan kata sandi member"
                        className="w-full h-11 pl-10 pr-11 bg-white border border-[#c5c5d3] rounded-xl text-sm text-[#0b1c30] font-medium focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMemberPassword(!showMemberPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757682] hover:text-[#00236f] p-1 rounded cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showMemberPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-base text-amber-700">stars</span>
                      <span>Belum punya akun member?</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setMemberAction('signup')}
                      className="font-bold text-[#00236f] hover:underline cursor-pointer"
                    >
                      Daftar Gratis Disini
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-[#00236f] hover:bg-[#12398c] active:bg-[#001b57] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60 shadow-xs"
                  >
                    {isLoading ? (
                      <span>Memproses masuk...</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">card_membership</span>
                        <span>Masuk ke Akun Member</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* MEMBER SIGN UP FORM */}
              {memberAction === 'signup' && (
                <form onSubmit={handleMemberRegister} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="reg-fullname" className="block text-xs font-semibold text-[#0b1c30] mb-1">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="reg-fullname"
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Contoh: Dini Lestari"
                        className="w-full h-10 px-3 bg-white border border-[#c5c5d3] rounded-xl text-xs sm:text-sm text-[#0b1c30] font-medium focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-username" className="block text-xs font-semibold text-[#0b1c30] mb-1">
                        Username Login <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="reg-username"
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="Contoh: dini_l"
                        className="w-full h-10 px-3 bg-white border border-[#c5c5d3] rounded-xl text-xs sm:text-sm text-[#0b1c30] font-medium focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="reg-phone" className="block text-xs font-semibold text-[#0b1c30] mb-1">
                        Nomor HP / WhatsApp
                      </label>
                      <input
                        id="reg-phone"
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        className="w-full h-10 px-3 bg-white border border-[#c5c5d3] rounded-xl text-xs sm:text-sm text-[#0b1c30] font-medium focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-email" className="block text-xs font-semibold text-[#0b1c30] mb-1">
                        Alamat Email
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full h-10 px-3 bg-white border border-[#c5c5d3] rounded-xl text-xs sm:text-sm text-[#0b1c30] font-medium focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="reg-password" className="block text-xs font-semibold text-[#0b1c30] mb-1">
                        Kata Sandi <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="reg-password"
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 3 karakter"
                          className="w-full h-10 pl-3 pr-9 bg-white border border-[#c5c5d3] rounded-xl text-xs sm:text-sm text-[#0b1c30] font-medium focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#757682] hover:text-[#00236f] p-1 rounded cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">
                            {showRegPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-confirm-pass" className="block text-xs font-semibold text-[#0b1c30] mb-1">
                        Ulangi Kata Sandi <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="reg-confirm-pass"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi"
                        className="w-full h-10 px-3 bg-white border border-[#c5c5d3] rounded-xl text-xs sm:text-sm text-[#0b1c30] font-medium focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Bonus Reward Badge */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-700 text-xl shrink-0">redeem</span>
                    <div>
                      <strong className="block font-semibold">Bonus Member Langsung Aktif:</strong>
                      <span className="text-emerald-800">
                        +50 Poin Selamat Datang • Diskon Belanja Otomatis 5% • Barcode Member Digital
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60 shadow-xs"
                  >
                    {isLoading ? (
                      <span>Menyimpan ke Database Turso...</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">how_to_reg</span>
                        <span>Daftar Member Sekarang</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </section>

        {/* Right Column: Database Records & Quick Fill (5 cols) */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#d8dce6] shadow-xs flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0b1c30]">
                {authMode === 'staff' ? 'Kredensial Staff' : 'Akun Member Terdaftar'}
              </h3>
              <p className="text-xs text-[#5a6072] mt-0.5">
                {authMode === 'staff'
                  ? 'Klik tombol pilih untuk langsung mengisi form kasir.'
                  : 'Data disinkronkan langsung dengan tabel Turso SQL.'}
              </p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-md">
              Turso Sync
            </span>
          </div>

          {/* STAFF CREDENTIALS LIST */}
          {authMode === 'staff' && (
            <div className="space-y-3">
              {/* Super Admin */}
              <div className="p-3.5 rounded-xl border border-[#00236f]/30 bg-[#f4f7ff]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#00236f]">
                        {superAdmin.fullName}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#00236f] text-white uppercase">
                        Super Admin
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-mono text-[#0b1c30] space-y-0.5">
                      <div>User: <strong className="text-[#00236f]">{superAdmin.username}</strong></div>
                      <div>Pass: <strong className="text-[#00236f]">{superAdmin.password}</strong></div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectStaffCred(superAdmin)}
                    className="px-3 h-8 bg-[#00236f] hover:bg-[#12398c] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shrink-0"
                  >
                    Pilih
                  </button>
                </div>
              </div>

              {/* Cashiers and Managers */}
              {users
                .filter((u) => u.id !== superAdmin.id && u.role !== 'member')
                .map((u) => (
                  <div key={u.id} className="p-3 rounded-xl border border-[#d8dce6] bg-[#fafbfc]">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-[#0b1c30]">{u.fullName}</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[#e8ecf4] text-[#444651] uppercase">
                            {u.role === 'cashier' ? 'Kasir' : 'Manajer'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs font-mono text-[#5a6072]">
                          user: <strong>{u.username}</strong> • pass: <strong>{u.password}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectStaffCred(u)}
                        className="px-2.5 h-7 bg-white hover:bg-[#eff4ff] border border-[#c5c5d3] text-[#00236f] text-xs font-medium rounded-lg cursor-pointer transition-colors shrink-0"
                      >
                        Pilih
                      </button>
                    </div>
                  </div>
                ))}

              <div className="pt-2 border-t border-[#d8dce6] text-xs text-[#5a6072] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[#0b1c30]">
                  <span className="material-symbols-outlined text-sm text-emerald-700">security</span>
                  <span>Hak Akses Terintegrasi</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Akun <strong>haura</strong> memiliki wewenang penuh pada Kasir POS, Barcode Scanner, Stok, dan Pengaturan.
                </p>
              </div>
            </div>
          )}

          {/* MEMBER LIST */}
          {authMode === 'member' && (
            <div className="space-y-3">
              <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
                {members.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    Belum ada member terdaftar. Buat baru di tab Sign Up!
                  </div>
                ) : (
                  members.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl border border-[#d8dce6] bg-[#fafbfc] hover:border-[#00236f]/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#0b1c30]">{m.fullName}</span>
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded uppercase bg-amber-100 text-amber-900 border border-amber-300">
                              {m.tier}
                            </span>
                          </div>

                          <div className="mt-1 text-[11px] font-mono text-[#00236f] font-semibold">
                            {m.memberCode}
                          </div>

                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Saldo: <strong className="text-amber-700">{m.points} Poin</strong> • Diskon: <strong className="text-emerald-700">{Math.round(m.discountRate * 100)}%</strong>
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            user: {m.username} | pass: {m.password || '123'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectMemberCred(m)}
                          className="px-2.5 h-7 bg-[#00236f] hover:bg-[#12398c] text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shrink-0 shadow-xs"
                        >
                          Pilih
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Member Benefits Card */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs text-amber-950">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <span className="material-symbols-outlined text-amber-700 text-sm">workspace_premium</span>
                  <span>Benefit Member Loyalty</span>
                </div>
                <ul className="text-[11px] space-y-0.5 text-amber-900 list-disc list-inside">
                  <li>Diskon kasir instan saat kode member diinput/discan</li>
                  <li>1 Poin belanja per kelipatan Rp 1.000 / $1</li>
                  <li>Kartu Barcode Digital untuk scan langsung di POS</li>
                </ul>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl py-3 border-t border-[#d8dce6] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5a6072] gap-2">
        <span>StationeryPOS • Sistem Manajemen Kasir Ritel & Keanggotaan Member</span>
        <div className="flex items-center gap-2">
          <span>Database: <strong className="text-emerald-700 font-semibold">Turso LibSQL Active</strong></span>
        </div>
      </footer>
    </div>
  );
};

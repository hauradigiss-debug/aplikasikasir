import React, { useState } from 'react';
import { User } from '../types';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const trimmedUser = username.trim();
      const trimmedPass = password.trim();

      const matchedUser = users.find(
        (u) => u.username.toLowerCase() === trimmedUser.toLowerCase() && u.password === trimmedPass
      );

      if (matchedUser) {
        setIsLoading(false);
        onLogin(matchedUser);
      } else {
        setIsLoading(false);
        setErrorMsg('Username atau password tidak cocok. Silakan periksa kredensial.');
      }
    }, 250);
  };

  const handleSelectCredential = (userCred: User) => {
    setUsername(userCred.username);
    setPassword(userCred.password);
    setErrorMsg('');
  };

  const superAdmin = users.find((u) => u.role === 'super_admin') || {
    id: 'usr-super-admin',
    username: 'haura',
    password: '231',
    fullName: 'Haura',
    role: 'super_admin',
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f6fb] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-10 selection:bg-[#d3e4fe]">
      {/* Top Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between pb-4 border-b border-[#d8dce6]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#00236f] flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl">point_of_sale</span>
          </div>
          <div>
            <h1 className="font-bold text-base text-[#0b1c30] leading-tight">
              StationeryPOS
            </h1>
            <p className="text-xs text-[#5a6072]">
              Sistem Kasir Ritel & Inventaris
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#5a6072]">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#d8dce6] rounded-md font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Register: POS-01
          </span>
          <span className="hidden sm:inline">Basis Data Lokal Aktif</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 py-6 items-start">
        {/* Left Column: Form Login (7 cols) */}
        <section className="lg:col-span-7 bg-white rounded-xl p-6 sm:p-8 border border-[#d8dce6] shadow-xs">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0b1c30]">
              Masuk Kasir
            </h2>
            <p className="text-sm text-[#5a6072] mt-1">
              Masukkan nama pengguna dan kata sandi untuk membuka sesi register penjualan.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base text-red-700 mt-0.5">error</span>
              <div>
                <strong className="block font-semibold">Gagal Masuk</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-xs font-semibold text-[#0b1c30] mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682] text-lg">
                  person
                </span>
                <input
                  id="login-username"
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: haura"
                  className="w-full h-11 pl-10 pr-3 bg-white border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] font-medium focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-[#0b1c30] mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682] text-lg">
                  lock
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full h-11 pl-10 pr-11 bg-white border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] font-medium focus:border-[#00236f] focus:ring-1 focus:ring-[#00236f] outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#757682] hover:text-[#00236f] p-1 rounded cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#444651]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00236f] border-[#c5c5d3] focus:ring-[#00236f]"
                />
                <span>Simpan sesi pada perangkat ini</span>
              </label>

              <span className="text-xs text-[#5a6072] flex items-center gap-1 font-mono">
                ID: POS-SF-01
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 bg-[#00236f] hover:bg-[#12398c] active:bg-[#001b57] text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
            >
              {isLoading ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span>Buka Register Kasir</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right Column: Daftar Kredensial Terdaftar (5 cols) */}
        <section className="lg:col-span-5 bg-white rounded-xl p-6 border border-[#d8dce6] shadow-xs flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-[#0b1c30]">
              Kredensial Terdaftar
            </h3>
            <p className="text-xs text-[#5a6072] mt-0.5">
              Pilih akun untuk mengisi kolom login secara langsung.
            </p>
          </div>

          <div className="space-y-3">
            {/* Super Admin Haura */}
            <div className="p-3.5 rounded-lg border border-[#00236f]/30 bg-[#f4f7ff]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#00236f]">
                      {superAdmin.fullName}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#00236f] text-white uppercase">
                      Super Admin
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-mono text-[#0b1c30] space-y-0.5">
                    <div>Username: <strong className="text-[#00236f]">{superAdmin.username}</strong></div>
                    <div>Password: <strong className="text-[#00236f]">{superAdmin.password}</strong></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectCredential(superAdmin)}
                  className="px-3 h-8 bg-[#00236f] hover:bg-[#12398c] text-white text-xs font-semibold rounded cursor-pointer transition-colors shrink-0"
                >
                  Pilih Akun
                </button>
              </div>
            </div>

            {/* Other Users */}
            {users
              .filter((u) => u.id !== superAdmin.id)
              .map((u) => (
                <div key={u.id} className="p-3 rounded-lg border border-[#d8dce6] bg-[#fafbfc]">
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
                      onClick={() => handleSelectCredential(u)}
                      className="px-2.5 h-7 bg-white hover:bg-[#eff4ff] border border-[#c5c5d3] text-[#00236f] text-xs font-medium rounded cursor-pointer transition-colors shrink-0"
                    >
                      Pilih
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="pt-2 border-t border-[#d8dce6] text-xs text-[#5a6072] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#0b1c30]">
              <span className="material-symbols-outlined text-sm text-emerald-700">security</span>
              <span>Hak Akses Super Admin</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Akun <strong>haura</strong> memiliki hak akses penuh ke modul Kasir POS, Inventaris Stok, Laporan Penjualan, Manajemen Kredensial, dan Pengaturan Toko.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl py-3 border-t border-[#d8dce6] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5a6072] gap-2">
        <span>StationeryPOS • Sistem Manajemen Kasir Ritel</span>
        <div className="flex items-center gap-2">
          <span>Status: <strong className="text-emerald-700 font-semibold">Siap Operasional</strong></span>
        </div>
      </footer>
    </div>
  );
};

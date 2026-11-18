import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import {
  ShieldCheck,
  UserCheck,
  Building2,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { UserProfile, UserRole, SekolahItem } from '../types.ts';

interface LoginViewProps {
  currentUser: UserProfile | null;
  schools: SekolahItem[];
  onAuthSuccess: (user: UserProfile, token: string) => void;
  onLogout: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  currentUser,
  schools,
  onAuthSuccess,
  onLogout,
}) => {
  const [tabMode, setTabMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('admin.sertifikasi@disdik.go.id');
  const [password, setPassword] = useState('');

  // Registration states
  const [regNama, setRegNama] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('guru');
  const [regNpsn, setRegNpsn] = useState('20219231');
  const [regNuptk, setRegNuptk] = useState('');
  const [regNoHp, setRegNoHp] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCredentialLogin = async (targetEmail?: string, targetPass?: string) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail || email,
          password: targetPass || password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal masuk ke sistem.');
      }
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal melakukan autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: regNama,
          email: regEmail,
          password: regPassword,
          role: regRole,
          npsn: regNpsn,
          nuptk: regNuptk,
          noHp: regNoHp,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mendaftarkan akun.');
      }
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat registrasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (preferredRole: UserRole) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          nama: result.user.displayName || result.user.email,
          role: preferredRole,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyinkronkan akun Google.');
      }
      onAuthSuccess(data.user, idToken);
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Login Google dibatalkan atau gagal. Anda juga dapat menggunakan tombol Akses Cepat Akun di bawah.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {currentUser && (
        <div className="bg-emerald-900 text-white rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sesi Autentikasi Aktif</span>
            </div>
            <h2 className="text-lg font-display font-bold">{currentUser.nama}</h2>
            <p className="text-xs text-emerald-100">
              Email: {currentUser.email} · Peran: <span className="font-mono font-bold uppercase">{currentUser.role}</span> · NPSN: {currentUser.npsn || '-'}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Keluar (Logout)
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Quick Login Exclusively for Admin Dinas */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-semibold text-emerald-700">Akses Khusus Administrator</p>
            <h2 className="text-lg font-display font-bold text-slate-900 mt-1">
              Login Cepat Admin Dinas Pendidikan
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Menu akses cepat ini dikhususkan untuk Admin Dinas Pendidikan guna memeriksa, memvalidasi laporan, serta mengunduh rekapitulasi pengaduan.
            </p>
          </div>

          <div className="space-y-3">
            {/* Hanya Admin Dinas */}
            <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-400 transition-colors space-y-2.5 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Admin Dinas Pendidikan</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">Akses Penuh</span>
              </div>
              <p className="text-xs text-slate-600">
                Memvalidasi seluruh laporan pengaduan sertifikasi, mengubah status penyelesaian, mengelola akun pengguna, serta mengunduh laporan Excel dan PDF.
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleCredentialLogin('admin.sertifikasi@disdik.go.id', 'admin26@')
                }
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Masuk sebagai Admin Dinas
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Standard Form Login / Registration & Google OAuth */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => {
                setTabMode('login');
                setErrorMsg('');
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tabMode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Login Akun Terdaftar
            </button>
            <button
              type="button"
              onClick={() => {
                setTabMode('register');
                setErrorMsg('');
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tabMode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Registrasi Akun Guru / Operator Baru
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tabMode === 'login' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCredentialLogin();
              }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900">
                  Masuk ke Portal Layanan Sertifikasi
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Autentikasi aman dengan enkripsi hash password & verifikasi peran pengguna.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Email Resmi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kata Sandi (Password Terenkripsi & Tersembunyi)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ketik kata sandi..."
                    autoComplete="off"
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
              </button>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <p className="text-xs text-slate-500 text-center">
                  Atau masuk menggunakan Single Sign-On (Google belajar.id):
                </p>
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn('guru')}
                  className="w-full py-2.5 px-4 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Masuk dengan Akun Google (SSO Pendidik)
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900">
                  Registrasi Akun Baru
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Buat akun Guru atau Operator Sekolah untuk memantau riwayat tiket pengaduan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={regNama}
                    onChange={(e) => setRegNama(e.target.value)}
                    placeholder="Contoh: Drs. Ahmad Subarjo"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peran Pengguna *
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="guru">Guru Sertifikasi</option>
                    <option value="operator_sekolah">Operator Sekolah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Aktif *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@guru.belajar.id"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NPSN Sekolah Induk *
                  </label>
                  <select
                    value={regNpsn}
                    onChange={(e) => setRegNpsn(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.npsn}>
                        {s.namaSekolah} ({s.npsn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NUPTK (Khusus Guru)
                  </label>
                  <input
                    type="text"
                    value={regNuptk}
                    onChange={(e) => setRegNuptk(e.target.value)}
                    placeholder="16 Digit NUPTK"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor HP / WhatsApp Notifikasi
                  </label>
                  <input
                    type="text"
                    value={regNoHp}
                    onChange={(e) => setRegNoHp(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Mendaftarkan...' : 'Daftar & Masuk Sekarang'}</span>
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sistem Verifikasi Sertifikasi Terpadu</span>
            <span className="font-mono font-bold text-slate-700">Powered by ENAL MKC</span>
          </div>
        </div>
      </div>
    </div>
  );
};

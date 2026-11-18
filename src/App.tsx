import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  FilePlus2,
  Search,
  History,
  BookOpen,
  HelpCircle,
  Lock,
  LayoutDashboard,
  Bell,
  Menu,
  X,
  CheckCheck,
} from 'lucide-react';
import {
  MenuTab,
  UserProfile,
  KategoriPengaduanItem,
  SekolahItem,
  PengaduanItem,
  NotifikasiItem,
  LogAktivitasItem,
} from './types.ts';
import { BerandaView } from './components/BerandaView.tsx';
import { BuatPengaduanView } from './components/BuatPengaduanView.tsx';
import { CekStatusDanRiwayatView } from './components/CekStatusDanRiwayatView.tsx';
import { PanduanDanBantuanView } from './components/PanduanDanBantuanView.tsx';
import { LoginView } from './components/LoginView.tsx';
import { DashboardView } from './components/DashboardView.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<MenuTab>('beranda');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  // Auth State (stored in memory as required)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string>('');

  // Database Data State
  const [categories, setCategories] = useState<KategoriPengaduanItem[]>([]);
  const [schools, setSchools] = useState<SekolahItem[]>([]);
  const [allPengaduan, setAllPengaduan] = useState<PengaduanItem[]>([]);
  const [notifications, setNotifications] = useState<NotifikasiItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<LogAktivitasItem[]>([]);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<PengaduanItem | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const fetchAllPortalData = useCallback(async () => {
    try {
      const [catRes, pengRes, notifRes] = await Promise.all([
        fetch('/api/catalog'),
        fetch('/api/pengaduan'),
        fetch('/api/notifikasi'),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
        setSchools(catData.schools || []);
      }

      if (pengRes.ok) {
        const pengData = await pengRes.json();
        setAllPengaduan(pengData.items || []);
      }

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
        setActivityLogs(notifData.logs || []);
      }
    } catch (error) {
      console.error('Gagal memuat data portal:', error);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPortalData();
  }, [fetchAllPortalData]);

  // Auto-authenticate default Admin Dinas session token in background if none exists so Dashboard works immediately out of the box, while still allowing 1-click switch to Guru / Operator / Admin
  useEffect(() => {
    if (!authToken) {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin.sertifikasi@disdik.go.id',
          password: 'admin26@',
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.token && d.user) {
            setAuthToken(d.token);
            setCurrentUser(d.user);
          }
        })
        .catch(() => {});
    }
  }, [authToken]);

  const unreadCount = notifications.filter((n) => n.dibaca === 'belum').length;

  const handleMarkNotificationsRead = async () => {
    try {
      await fetch('/api/notifikasi/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, dibaca: 'sudah' })));
    } catch (e) {
      console.error(e);
    }
  };

  const menuItems: Array<{ id: MenuTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'beranda', label: '1. Beranda', icon: Home },
    { id: 'buat_pengaduan', label: '2. Buat Pengaduan', icon: FilePlus2 },
    { id: 'cek_status', label: '3. Cek Status Pengaduan', icon: Search },
    { id: 'riwayat_pengaduan', label: '4. Riwayat Pengaduan', icon: History },
    { id: 'panduan_pengaduan', label: '5. Panduan Pengaduan', icon: BookOpen },
    { id: 'pusat_bantuan', label: '6. Pusat Bantuan', icon: HelpCircle },
    { id: 'login_admin', label: '7. Login Admin', icon: Lock },
    { id: 'dashboard', label: '8. Dashboard', icon: LayoutDashboard },
  ];

  const statsSummary = {
    total: allPengaduan.length,
    menunggu: allPengaduan.filter((p) => p.status === 'Menunggu Verifikasi').length,
    diproses: allPengaduan.filter(
      (p) => p.status === 'Sedang Diverifikasi' || p.status === 'Dalam Proses Tindak Lanjut'
    ).length,
    perbaikan: allPengaduan.filter((p) => p.status === 'Menunggu Perbaikan Data').length,
    selesai: allPengaduan.filter((p) => p.status === 'Selesai').length,
    ditolak: allPengaduan.filter((p) => p.status === 'Ditolak').length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* TOP BAR CONTRACT: Strictly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="Buka Navigasi"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <a
            href="#beranda"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('beranda');
            }}
            className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            PORTAL PENGADUAN SERTIFIKASI GURU BELUM VALID
          </a>
        </div>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden xl:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <a
            href="#beranda"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('beranda');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'beranda' ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            Beranda
          </a>
          <a
            href="#buat-pengaduan"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('buat_pengaduan');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'buat_pengaduan' ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            Buat Pengaduan
          </a>
          <a
            href="#cek-status"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('cek_status');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'cek_status' ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            Cek Status
          </a>
          <a
            href="#panduan"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('panduan_pengaduan');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'panduan_pengaduan' ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            Panduan
          </a>
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dashboard' ? 'text-slate-900 underline underline-offset-8' : ''
            }`}
          >
            Dashboard
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('buat_pengaduan')}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Buat Pengaduan
          </button>
        </div>
      </header>

      {/* WORKSPACE CANVAS: Sidebar Navigation + Main Content Viewport */}
      <div className="flex-1 flex relative">
        {/* Sidebar Navigation (8 Official Menu Items + Role Switcher + Notifications Trigger) */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:static inset-y-0 left-0 z-20 w-68 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-transform duration-150 shrink-0`}
        >
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Active User Profile Summary in Sidebar */}
            <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                <span>HAK AKSES AKTIF</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login_admin');
                    setSidebarOpen(false);
                  }}
                  className="underline hover:text-white cursor-pointer"
                >
                  Ganti Peran
                </button>
              </div>
              <p className="text-xs font-bold text-white truncate">
                {currentUser && currentUser.role !== 'admin_dinas' ? currentUser.nama : 'M.AMRIANSYAH, AMa'}
              </p>
              <p className="text-[11px] font-mono text-slate-300">
                Peran: {currentUser ? currentUser.role.toUpperCase() : 'ADMIN_DINAS'}
              </p>
            </div>

            {/* 8 Menu Utama */}
            <div className="space-y-1">
              <div className="px-3 pb-1.5 text-[11px] font-semibold text-slate-400">
                MENU NAVIGASI UTAMA
              </div>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Notification Drawer Trigger inside Sidebar */}
            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setNotifDrawerOpen(!notifDrawerOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>Notifikasi Sistem</span>
                </span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {unreadCount} Baru
                </span>
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Dinas Pendidikan & Kebudayaan</p>
            <p>Sistem Informasi Verifikasi Sertifikasi Guru Terpadu</p>
            <p className="pt-1 font-mono font-bold text-emerald-400 tracking-wide">
              Powered by ENAL MKC
            </p>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
          {/* Notification Banner Drawer if toggled */}
          {notifDrawerOpen && (
            <div className="mb-6 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-display font-bold text-slate-900">
                    Pusat Notifikasi Pengaduan Sertifikasi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Terintegrasi dengan Dashboard, WhatsApp & Email Pelapor
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleMarkNotificationsRead}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Tandai Semua Dibaca</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifDrawerOpen(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-200 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900">
                        {n.judul}{' '}
                        {n.dibaca === 'belum' && (
                          <span className="text-emerald-700 font-mono">(Baru)</span>
                        )}
                      </p>
                      <p className="text-slate-600">{n.pesan}</p>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">
                      {n.kanalIntegrasi}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingInitial ? (
            <div className="space-y-4">
              <div className="h-48 bg-slate-200/70 rounded-xl animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-32 bg-slate-200/70 rounded-xl animate-pulse" />
                <div className="h-32 bg-slate-200/70 rounded-xl animate-pulse" />
                <div className="h-32 bg-slate-200/70 rounded-xl animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'beranda' && (
                <BerandaView
                  onNavigate={(tab) => setActiveTab(tab)}
                  onSelectTicket={(ticket) => {
                    setSelectedTicketForDetail(ticket);
                    setActiveTab('cek_status');
                  }}
                  categories={categories}
                  recentPengaduan={allPengaduan}
                  stats={statsSummary}
                  onRefreshData={fetchAllPortalData}
                />
              )}

              {activeTab === 'buat_pengaduan' && (
                <BuatPengaduanView
                  currentUser={currentUser}
                  schools={schools}
                  onCreated={(newTicket) => {
                    setSelectedTicketForDetail(newTicket);
                    fetchAllPortalData();
                  }}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {(activeTab === 'cek_status' || activeTab === 'riwayat_pengaduan') && (
                <CekStatusDanRiwayatView
                  mode={activeTab}
                  allPengaduan={allPengaduan}
                  currentUser={currentUser}
                  selectedInitialTicket={selectedTicketForDetail}
                  onRefreshData={fetchAllPortalData}
                />
              )}

              {(activeTab === 'panduan_pengaduan' || activeTab === 'pusat_bantuan') && (
                <PanduanDanBantuanView
                  mode={activeTab}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'login_admin' && (
                <LoginView
                  currentUser={currentUser}
                  schools={schools}
                  onAuthSuccess={(user, token) => {
                    setCurrentUser(user);
                    setAuthToken(token);
                    setActiveTab('dashboard');
                  }}
                  onLogout={() => {
                    setCurrentUser(null);
                    setAuthToken('');
                  }}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardView
                  currentUser={currentUser}
                  authToken={authToken}
                  allPengaduan={allPengaduan}
                  notifications={notifications}
                  activityLogs={activityLogs}
                  onRefreshData={fetchAllPortalData}
                  onNavigateLogin={() => setActiveTab('login_admin')}
                />
              )}
            </>
          )}

          {/* Quiet Footer */}
          <footer className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span>© 2026 Portal Pengaduan Sertifikasi Guru Belum Valid — Layanan Resmi Dinas Pendidikan.</span>
              <span className="hidden sm:inline">·</span>
              <span className="font-mono font-bold text-slate-800">Powered by ENAL MKC</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('panduan_pengaduan')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Panduan Layanan
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setActiveTab('pusat_bantuan')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Pusat Bantuan
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setActiveTab('cek_status')}
                className="hover:text-slate-900 cursor-pointer"
              >
                Lacak Nomor Tiket
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

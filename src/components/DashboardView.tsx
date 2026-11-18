import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  FileDown,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Users,
  Bell,
  Database,
  Send,
  FileText,
  ShieldCheck,
  Building2,
  Calendar,
  Eye,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import {
  PengaduanItem,
  UserProfile,
  NotifikasiItem,
  LogAktivitasItem,
  DAFTAR_STATUS_PENGADUAN,
  DAFTAR_KATEGORI_PERMASALAHAN,
} from '../types.ts';
import {
  exportLaporanToExcel,
  exportLaporanToPDF,
  exportDetailPengaduanToPDF,
  RekapType,
} from '../utils/exportReports.ts';

interface DashboardViewProps {
  currentUser: UserProfile | null;
  authToken: string;
  allPengaduan: PengaduanItem[];
  notifications: NotifikasiItem[];
  activityLogs: LogAktivitasItem[];
  onRefreshData: () => Promise<void>;
  onNavigateLogin: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  authToken,
  allPengaduan,
  notifications,
  activityLogs,
  onRefreshData,
  onNavigateLogin,
}) => {
  const [subTab, setSubTab] = useState<
    'ringkasan' | 'manajemen' | 'laporan' | 'pengguna' | 'notifikasi_keamanan'
  >('ringkasan');

  // Search and Filter States
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterKecamatan, setFilterKecamatan] = useState('Semua');
  const [filterKategori, setFilterKategori] = useState('Semua');

  // Selected Pengaduan for Admin / Operator Action
  const [selectedItem, setSelectedItem] = useState<PengaduanItem | null>(
    allPengaduan[0] || null
  );
  const [statusInput, setStatusInput] = useState(
    allPengaduan[0]?.status || 'Sedang Diverifikasi'
  );
  const [rekomendasiOperatorInput, setRekomendasiOperatorInput] = useState(
    allPengaduan[0]?.rekomendasiOperator || 'Direkomendasikan Valid'
  );
  const [catatanOperatorInput, setCatatanOperatorInput] = useState('');
  const [catatanAdminInput, setCatatanAdminInput] = useState('');
  const [alasanPenolakanInput, setAlasanPenolakanInput] = useState('');
  const [tanggalTindakLanjutInput, setTanggalTindakLanjutInput] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isiTanggapanInput, setIsiTanggapanInput] = useState('');
  const [statusValidasiDokumenInput, setStatusValidasiDokumenInput] = useState(
    'Terverifikasi Lengkap'
  );
  const [kanalNotifikasi, setKanalNotifikasi] = useState(
    'Dashboard, WhatsApp & Email'
  );
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [deleteNotice, setDeleteNotice] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [lastWaBroadcast, setLastWaBroadcast] = useState<any | null>(null);
  const [testingWaGateway, setTestingWaGateway] = useState(false);

  // Admin User Management
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Report Export Options
  const [selectedRekapType, setSelectedRekapType] = useState<RekapType>('semua');
  const [periodeLaporan, setPeriodeLaporan] = useState('Semua');

  const activeRole = currentUser?.role || 'admin_dinas';

  // Scope Pengaduan by Role (Operator Sekolah only sees their school's NPSN unless toggled)
  const [operatorFilterSchoolOnly, setOperatorFilterSchoolOnly] = useState(true);
  const scopedPengaduan = allPengaduan.filter((p) => {
    if (
      activeRole === 'operator_sekolah' &&
      operatorFilterSchoolOnly &&
      currentUser?.npsn &&
      currentUser.npsn !== 'DINAS-001'
    ) {
      return p.npsn === currentUser.npsn;
    }
    if (
      activeRole === 'guru' &&
      operatorFilterSchoolOnly &&
      currentUser?.nuptk &&
      currentUser.nuptk !== '-'
    ) {
      return p.nuptk === currentUser.nuptk || p.userId === currentUser.id;
    }
    return true;
  });

  const filteredPengaduan = scopedPengaduan.filter((p) => {
    const q = searchQ.toLowerCase().trim();
    const matchQ =
      !q ||
      p.nomorTiket.toLowerCase().includes(q) ||
      p.namaLengkap.toLowerCase().includes(q) ||
      p.nuptk.toLowerCase().includes(q) ||
      p.namaSekolah.toLowerCase().includes(q) ||
      p.npsn.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'Semua' || p.status === filterStatus;
    const matchKec = filterKecamatan === 'Semua' || p.kecamatan === filterKecamatan;
    const matchKat =
      filterKategori === 'Semua' || p.jenisPermasalahan === filterKategori;
    return matchQ && matchStatus && matchKec && matchKat;
  });

  // Compute 6 KPI Cards
  const kpiStats = {
    total: scopedPengaduan.length,
    baru: scopedPengaduan.filter((p) => p.status === 'Menunggu Verifikasi').length,
    diproses: scopedPengaduan.filter(
      (p) =>
        p.status === 'Sedang Diverifikasi' ||
        p.status === 'Dalam Proses Tindak Lanjut'
    ).length,
    perbaikan: scopedPengaduan.filter(
      (p) => p.status === 'Menunggu Perbaikan Data'
    ).length,
    selesai: scopedPengaduan.filter((p) => p.status === 'Selesai').length,
    ditolak: scopedPengaduan.filter((p) => p.status === 'Ditolak').length,
  };

  // Groupings for 5 Charts
  const countByMap = (getter: (p: PengaduanItem) => string) => {
    const map: Record<string, number> = {};
    for (const item of scopedPengaduan) {
      const k = getter(item) || 'Lainnya';
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };

  const chartByKecamatan = countByMap((p) => p.kecamatan);
  const chartBySekolah = countByMap((p) => p.namaSekolah);
  const chartByKategori = countByMap((p) => p.jenisPermasalahan);
  const chartByStatus = countByMap((p) => p.status);
  const chartByBulanan = countByMap((p) => p.periodeBulan);

  useEffect(() => {
    if (subTab === 'pengguna' && authToken) {
      setLoadingUsers(true);
      fetch('/api/users', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.users) setUserList(d.users);
        })
        .catch(console.error)
        .finally(() => setLoadingUsers(false));
    }
  }, [subTab, authToken]);

  const handleSelectRow = (item: PengaduanItem) => {
    setSelectedItem(item);
    setStatusInput(item.status);
    setRekomendasiOperatorInput(item.rekomendasiOperator || 'Direkomendasikan Valid');
    setCatatanOperatorInput(item.catatanOperator || '');
    setCatatanAdminInput(item.catatanAdmin || '');
    setAlasanPenolakanInput(item.alasanPenolakan || '');
    setTanggalTindakLanjutInput(
      item.tanggalTindakLanjut || new Date().toISOString().split('T')[0]
    );
    setIsiTanggapanInput('');
    setActionNotice('');
  };

  const handleSaveStatusAndNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (!authToken) {
      setActionNotice(
        'Silakan masuk terlebih dahulu melalui menu Login untuk menyimpan validasi.'
      );
      return;
    }

    setSavingUpdate(true);
    setActionNotice('');
    try {
      const res = await fetch(`/api/pengaduan/${selectedItem.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          actorUserId: currentUser?.id,
          actorNama: currentUser?.nama || 'Tim Verifikator Dinas',
          actorRole: currentUser?.role || 'admin_dinas',
          status: statusInput,
          rekomendasiOperator: rekomendasiOperatorInput,
          catatanOperator: catatanOperatorInput,
          catatanAdmin: catatanAdminInput,
          alasanPenolakan:
            statusInput === 'Ditolak' ? alasanPenolakanInput : '',
          tanggalTindakLanjut: tanggalTindakLanjutInput,
          isiTanggapan: isiTanggapanInput,
          statusValidasiDokumen: statusValidasiDokumenInput,
          kanalNotifikasi,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan pembaruan.');
      }
      if (data.pengaduan?.waBroadcast) {
        setLastWaBroadcast(data.pengaduan.waBroadcast);
      }
      await onRefreshData();
      setActionNotice(
        `Berhasil memperbarui tiket ${selectedItem.nomorTiket} menjadi "${statusInput}" & mengirimkan notifikasi otomatis API WhatsApp ke Guru, Operator Sekolah, dan Admin Dinas.`
      );
      setIsiTanggapanInput('');
    } catch (err: any) {
      setActionNotice(err.message || 'Gagal memperbarui status.');
    } finally {
      setSavingUpdate(false);
    }
  };

  const handleTestBroadcastWhatsApp = async () => {
    setTestingWaGateway(true);
    try {
      const target = activeSelected;
      const res = await fetch('/api/whatsapp/send-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pengaduanId: target?.id || 1,
          nomorTiket: target?.nomorTiket || 'SRT-2026-WA-TEST',
          namaGuru: target?.namaLengkap || 'Guru Sertifikasi',
          noHpGuru: target?.noHp || '081321456789',
          namaSekolah: target?.namaSekolah || 'SMAN 1 Bandung',
          npsn: target?.npsn || '20219231',
          jenisPermasalahan: target?.jenisPermasalahan || 'Status sertifikasi belum valid',
          statusBaru: statusInput || target?.status || 'Dalam Proses Tindak Lanjut',
          catatan:
            isiTanggapanInput ||
            catatanAdminInput ||
            'Pesan uji coba pengiriman real-time API WhatsApp otomatis ke Guru, Operator Sekolah, dan Admin Dinas.',
          actorNama: currentUser?.nama || 'Admin Dinas Pendidikan',
        }),
      });
      const data = await res.json();
      if (data.broadcast) {
        setLastWaBroadcast(data.broadcast);
        await onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTestingWaGateway(false);
    }
  };

  const handleUpdateUserAccount = async (
    userId: number,
    newRole: string,
    newStatus: string
  ) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ role: newRole, statusAktif: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUserList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...updated.user } : u))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePengaduan = async (id: number, nomorTiket: string) => {
    setDeletingId(id);
    setDeleteNotice('');
    try {
      const res = await fetch(`/api/pengaduan/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus data pengaduan.');
      }
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      await onRefreshData();
      setDeleteNotice(`Tiket pengaduan ${nomorTiket} berhasil dihapus dari sistem.`);
    } catch (err: any) {
      setDeleteNotice(err.message || 'Gagal menghapus pengaduan.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAllPengaduan = async () => {
    setDeleteNotice('');
    try {
      const res = await fetch('/api/pengaduan', {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Gagal menghapus seluruh pengaduan.');
      }
      setSelectedItem(null);
      setConfirmClearAll(false);
      await onRefreshData();
      setDeleteNotice('Seluruh data laporan pengaduan berhasil dihapus dan dikosongkan.');
    } catch (err: any) {
      setDeleteNotice(err.message || 'Gagal menghapus seluruh data.');
    }
  };

  const handleDeleteUserAccount = async (userId: number, nama: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setActionNotice(data.error || 'Gagal menghapus akun pengguna.');
        return;
      }
      setUserList((prev) => prev.filter((u) => u.id !== userId));
      await onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadDatabaseBackup = async () => {
    if (!authToken) {
      onNavigateLogin();
      return;
    }
    try {
      const res = await fetch('/api/admin/backup', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const snapshot = await res.json();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_Database_Portal_Sertifikasi_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const activeSelected =
    allPengaduan.find((p) => p.id === selectedItem?.id) ||
    filteredPengaduan[0] ||
    null;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Role Banner & Dashboard Sub-Navigation */}
      <div className="bg-slate-900 text-white rounded-xl p-6 space-y-5 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>
                {activeRole === 'admin_dinas'
                  ? 'DASHBOARD EKSEKUTIF ADMIN DINAS PENDIDIKAN'
                  : activeRole === 'operator_sekolah'
                  ? `DASHBOARD VERIFIKASI OPERATOR SEKOLAH (NPSN: ${currentUser?.npsn || '20219231'})`
                  : 'DASHBOARD PEMANTAUAN GURU SERTIFIKASI'}
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold">
              Pusat Kendali, Validasi & Analitik Pengaduan Sertifikasi
            </h1>
            <p className="text-xs text-slate-300">
              Pengguna Aktif:{' '}
              <span className="font-semibold text-white">
                {currentUser ? currentUser.nama : 'Mode Pratinjau Admin Dinas'}
              </span>{' '}
              {!currentUser && (
                <button
                  onClick={onNavigateLogin}
                  className="ml-2 underline text-emerald-400 cursor-pointer"
                >
                  (Klik untuk Login Akun Resmi)
                </button>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeRole === 'operator_sekolah' && (
              <button
                type="button"
                onClick={() => setOperatorFilterSchoolOnly(!operatorFilterSchoolOnly)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer"
              >
                {operatorFilterSchoolOnly
                  ? `Hanya Sekolah Saya (${currentUser?.npsn})`
                  : 'Menampilkan Seluruh Sekolah'}
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                exportLaporanToExcel(
                  filteredPengaduan,
                  'semua',
                  'Rekap_Dashboard'
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh Excel</span>
            </button>
            <button
              type="button"
              onClick={() =>
                exportLaporanToPDF(
                  filteredPengaduan,
                  'semua',
                  'Laporan Eksekutif Pengaduan Sertifikasi'
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
          {[
            { id: 'ringkasan', label: 'Statistik & 5 Grafik Analitik', icon: BarChart3 },
            { id: 'manajemen', label: 'Manajemen & Validasi Pengaduan', icon: FileText },
            { id: 'laporan', label: 'Pusat Ekspor Laporan & Rekapitulasi', icon: FileSpreadsheet },
            { id: 'pengguna', label: 'Kelola Akun Pengguna', icon: Users },
            { id: 'notifikasi_keamanan', label: 'Notifikasi, Log Aktivitas & Backup DB', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6 KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500">Total Pengaduan</span>
          <p className="text-2xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
            {kpiStats.total}
          </p>
          <span className="text-[11px] text-slate-500">Seluruh tiket masuk</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500">Pengaduan Baru</span>
          <p className="text-2xl font-mono font-bold text-amber-600 mt-1 tabular-nums">
            {kpiStats.baru}
          </p>
          <span className="text-[11px] text-slate-500">Menunggu verifikasi</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500">Sedang Diproses</span>
          <p className="text-2xl font-mono font-bold text-sky-600 mt-1 tabular-nums">
            {kpiStats.diproses}
          </p>
          <span className="text-[11px] text-slate-500">Verifikasi & tindak lanjut</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500">Menunggu Perbaikan</span>
          <p className="text-2xl font-mono font-bold text-orange-600 mt-1 tabular-nums">
            {kpiStats.perbaikan}
          </p>
          <span className="text-[11px] text-slate-500">Revisi dokumen guru</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500">Pengaduan Selesai</span>
          <p className="text-2xl font-mono font-bold text-emerald-600 mt-1 tabular-nums">
            {kpiStats.selesai}
          </p>
          <span className="text-[11px] text-slate-500">Data sertifikasi valid</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500">Pengaduan Ditolak</span>
          <p className="text-2xl font-mono font-bold text-rose-600 mt-1 tabular-nums">
            {kpiStats.ditolak}
          </p>
          <span className="text-[11px] text-slate-500">Disertai alasan resmi</span>
        </div>
      </div>

      {/* SUB-TAB 1: RINGKASAN & 5 GRAFIK ANALITIK */}
      {subTab === 'ringkasan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Grafik 1: Berdasarkan Jenis Permasalahan */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-display font-bold text-slate-900">
                    1. Grafik Pengaduan Berdasarkan Jenis Permasalahan Sertifikasi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Distribusi kategori ketidakvalidan data Info GTK & Dapodik
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">Real-Time Database</span>
              </div>
              <div className="space-y-3">
                {chartByKategori.map(([kat, count]) => {
                  const pct = Math.max(8, Math.round((count / Math.max(1, kpiStats.total)) * 100));
                  return (
                    <div key={kat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{kat}</span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {count} Laporan ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grafik 2: Berdasarkan Status Penyelesaian */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-display font-bold text-slate-900">
                  2. Grafik Berdasarkan Status Penyelesaian
                </h2>
                <p className="text-xs text-slate-500">Proporsi progres penanganan laporan</p>
              </div>
              <div className="space-y-3">
                {chartByStatus.map(([st, count]) => {
                  const pct = Math.max(8, Math.round((count / Math.max(1, kpiStats.total)) * 100));
                  const barColor =
                    st === 'Selesai'
                      ? 'bg-emerald-600'
                      : st === 'Ditolak'
                      ? 'bg-rose-600'
                      : st === 'Menunggu Perbaikan Data'
                      ? 'bg-amber-500'
                      : 'bg-sky-600';
                  return (
                    <div key={st} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{st}</span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {count} Tiket ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 2 of Charts: Kecamatan, Sekolah, Periode Bulanan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Grafik 3: Berdasarkan Kecamatan */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-sm font-display font-bold text-slate-900">
                  3. Grafik Berdasarkan Kecamatan
                </h3>
                <p className="text-xs text-slate-500">Sebaran wilayah satuan pendidikan</p>
              </div>
              <div className="space-y-3">
                {chartByKecamatan.map(([kec, count]) => {
                  const pct = Math.max(10, Math.round((count / Math.max(1, kpiStats.total)) * 100));
                  return (
                    <div key={kec} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-800">Kec. {kec}</span>
                        <span className="font-mono font-bold tabular-nums">{count} laporan</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grafik 4: Berdasarkan Sekolah */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-sm font-display font-bold text-slate-900">
                  4. Grafik Berdasarkan Sekolah
                </h3>
                <p className="text-xs text-slate-500">Frekuensi pengaduan per sekolah induk</p>
              </div>
              <div className="space-y-3">
                {chartBySekolah.map(([sek, count]) => {
                  const pct = Math.max(10, Math.round((count / Math.max(1, kpiStats.total)) * 100));
                  return (
                    <div key={sek} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-800 truncate">{sek}</span>
                        <span className="font-mono font-bold tabular-nums shrink-0">{count} guru</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-800 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grafik 5: Berdasarkan Periode Bulanan */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-sm font-display font-bold text-slate-900">
                  5. Grafik Berdasarkan Periode Bulanan
                </h3>
                <p className="text-xs text-slate-500">Tren laporan masuk bulanan (Tahun 2026)</p>
              </div>
              <div className="space-y-3">
                {chartByBulanan.map(([bln, count]) => {
                  const pct = Math.max(12, Math.round((count / Math.max(1, kpiStats.total)) * 100));
                  return (
                    <div key={bln} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-mono font-semibold text-slate-800">Periode {bln}</span>
                        <span className="font-mono font-bold tabular-nums">{count} tiket</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MANAJEMEN & VALIDASI PENGADUAN */}
      {(subTab === 'manajemen' || subTab === 'ringkasan') && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900">
                  Tabel Manajemen & Pemeriksaan Pengaduan Sertifikasi
                </h2>
                <span className="text-xs text-slate-500">
                  Menampilkan {filteredPengaduan.length} dari {scopedPengaduan.length} laporan
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!confirmClearAll ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Semua Data</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                    <span className="text-xs font-semibold text-rose-800">Yakin hapus semua?</span>
                    <button
                      type="button"
                      onClick={handleDeleteAllPengaduan}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded cursor-pointer"
                    >
                      Ya, Hapus Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(false)}
                      className="px-2 py-1 bg-white text-slate-700 border border-slate-200 text-xs font-semibold rounded cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {deleteNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg font-medium flex items-center justify-between">
                <span>{deleteNotice}</span>
                <button
                  type="button"
                  onClick={() => setDeleteNotice('')}
                  className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Cari nama guru, NUPTK, sekolah, NPSN, atau nomor tiket..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="lg:col-span-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Semua">Semua Status</option>
                  {DAFTAR_STATUS_PENGADUAN.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2">
                <select
                  value={filterKecamatan}
                  onChange={(e) => setFilterKecamatan(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Semua">Semua Kecamatan</option>
                  {chartByKecamatan.map(([kec]) => (
                    <option key={kec} value={kec}>
                      Kec. {kec}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2">
                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Semua">Semua Kategori</option>
                  {DAFTAR_KATEGORI_PERMASALAHAN.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-3 px-4">No. Tiket</th>
                    <th className="py-3 px-4">Nama Guru & NUPTK</th>
                    <th className="py-3 px-4">Sekolah & Kecamatan</th>
                    <th className="py-3 px-4">Permasalahan</th>
                    <th className="py-3 px-4">Rekomendasi Operator</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredPengaduan.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 px-4 text-center text-slate-500">
                        Belum ada data laporan pengaduan pada daftar ini.
                      </td>
                    </tr>
                  ) : (
                    filteredPengaduan.map((item) => {
                      const isSelected = activeSelected?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleSelectRow(item)}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap tabular-nums">
                            {item.nomorTiket}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{item.namaLengkap}</div>
                            <div className="font-mono text-slate-500 text-[11px] tabular-nums">
                              NUPTK: {item.nuptk}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{item.namaSekolah}</div>
                            <div className="text-slate-500 text-[11px]">
                              NPSN {item.npsn} · Kec. {item.kecamatan}
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-medium text-slate-900 truncate">
                              {item.jenisPermasalahan}
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              {item.dokumenList?.length || 0} berkas lampiran
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-700">
                              {item.rekomendasiOperator || 'Belum Diperiksa'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900">{item.status}</span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportDetailPengaduanToPDF(item);
                                }}
                                title="Unduh Arsip Detail Pengaduan (PDF)"
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md inline-flex items-center gap-1 cursor-pointer"
                              >
                                <FileDown className="w-3.5 h-3.5 text-slate-700" />
                                <span>Arsip PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectRow(item);
                                  setSubTab('manajemen');
                                }}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md cursor-pointer"
                              >
                                Periksa & Validasi
                              </button>
                              <button
                                type="button"
                                disabled={deletingId === item.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePengaduan(item.id, item.nomorTiket);
                                }}
                                title="Hapus Laporan Pengaduan"
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{deletingId === item.id ? 'Menghapus...' : 'Hapus'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inspector & Validation Form for Selected Ticket */}
          {activeSelected && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-700">
                    Panel Pemeriksaan & Tindak Lanjut Laporan
                  </span>
                  <h3 className="text-xl font-display font-bold text-slate-900 mt-0.5">
                    Tiket {activeSelected.nomorTiket} — {activeSelected.namaLengkap}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {activeSelected.namaSekolah} (NPSN: {activeSelected.npsn}) · NUPTK:{' '}
                    <span className="font-mono">{activeSelected.nuptk}</span> · WA:{' '}
                    <span className="font-mono">{activeSelected.noHp}</span>
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <div className="text-xs font-mono text-slate-600">
                    Status Saat Ini:{' '}
                    <span className="font-bold text-slate-900">{activeSelected.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => exportDetailPengaduanToPDF(activeSelected)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Unduh Arsip Detail PDF</span>
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === activeSelected.id}
                      onClick={() =>
                        handleDeletePengaduan(activeSelected.id, activeSelected.nomorTiket)
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {deletingId === activeSelected.id ? 'Menghapus...' : 'Hapus Pengaduan'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {actionNotice && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg font-medium">
                  {actionNotice}
                </div>
              )}

              {lastWaBroadcast && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>
                        Bukti Pengiriman Real-Time API WhatsApp ({lastWaBroadcast.nomorTiket})
                      </span>
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-emerald-800">
                      {lastWaBroadcast.gatewayMode}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {lastWaBroadcast.deliveries?.map((d: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white border border-emerald-200 rounded-lg p-2.5 space-y-0.5"
                      >
                        <div className="font-bold text-slate-900">{d.role}</div>
                        <div className="text-slate-600 truncate">{d.nama}</div>
                        <div className="font-mono text-[11px] text-emerald-700 font-semibold">
                          {d.phoneFormatted} · {d.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Detail & Dokumen */}
                <div className="lg:col-span-5 space-y-4 text-xs">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900">Rincian Laporan Guru:</div>
                    <p>
                      <span className="text-slate-500">Kategori:</span>{' '}
                      <span className="font-semibold text-slate-900">
                        {activeSelected.jenisPermasalahan}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">No. Serdik / Tahun:</span>{' '}
                      <span className="font-mono">
                        {activeSelected.noSertifikatPendidik || '-'} /{' '}
                        {activeSelected.tahunSertifikasi || '-'}
                      </span>
                    </p>
                    <p className="text-slate-700 leading-relaxed pt-1 border-t border-slate-200">
                      {activeSelected.deskripsiPermasalahan}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-900">
                      Pemeriksaan Dokumen yang Diunggah ({activeSelected.dokumenList?.length || 0})
                    </div>
                    {activeSelected.dokumenList?.map((d) => (
                      <div
                        key={d.id}
                        className="p-3 border border-slate-200 rounded-lg flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{d.namaFile}</p>
                          <p className="text-slate-500">
                            {d.jenisDokumen} · {d.statusValidasi}
                          </p>
                        </div>
                        <a
                          href={d.fileUrl}
                          download={d.namaFile}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-md inline-flex items-center gap-1 shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Buka</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Form Ubah Status, Rekomendasi Operator, Catatan Admin */}
                <form
                  onSubmit={handleSaveStatusAndNotes}
                  className="lg:col-span-7 space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Ubah Status Pengaduan
                      </label>
                      <select
                        value={statusInput}
                        onChange={(e) => setStatusInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                      >
                        {DAFTAR_STATUS_PENGADUAN.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Tanggal Tindak Lanjut
                      </label>
                      <input
                        type="date"
                        value={tanggalTindakLanjutInput}
                        onChange={(e) => setTanggalTindakLanjutInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Rekomendasi Operator Sekolah
                      </label>
                      <select
                        value={rekomendasiOperatorInput}
                        onChange={(e) => setRekomendasiOperatorInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Direkomendasikan Valid">Direkomendasikan Valid</option>
                        <option value="Perlu Perbaikan Dokumen">Perlu Perbaikan Dokumen</option>
                        <option value="Data Dapodik Sudah Diperbaiki">
                          Data Dapodik Sudah Diperbaiki
                        </option>
                        <option value="Tidak Memenuhi Syarat">Tidak Memenuhi Syarat</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Status Validasi Berkas Lampiran
                      </label>
                      <select
                        value={statusValidasiDokumenInput}
                        onChange={(e) => setStatusValidasiDokumenInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Terverifikasi Lengkap">Terverifikasi Lengkap</option>
                        <option value="Perlu Perbaikan">Perlu Perbaikan / Unggah Ulang</option>
                        <option value="Dokumen Tidak Sesuai">Dokumen Tidak Sesuai</option>
                      </select>
                    </div>
                  </div>

                  {statusInput === 'Ditolak' && (
                    <div>
                      <label className="block text-xs font-bold text-rose-700 mb-1">
                        Alasan Penolakan (Wajib Diisi Jika Status Ditolak)
                      </label>
                      <input
                        type="text"
                        required
                        value={alasanPenolakanInput}
                        onChange={(e) => setAlasanPenolakanInput(e.target.value)}
                        placeholder="Jelaskan alasan penolakan laporan..."
                        className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg bg-white"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Catatan Pemeriksaan Operator Sekolah
                      </label>
                      <textarea
                        rows={2}
                        value={catatanOperatorInput}
                        onChange={(e) => setCatatanOperatorInput(e.target.value)}
                        placeholder="Catatan hasil pengecekan Dapodik sekolah..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Catatan Penyelesaian Admin Dinas
                      </label>
                      <textarea
                        rows={2}
                        value={catatanAdminInput}
                        onChange={(e) => setCatatanAdminInput(e.target.value)}
                        placeholder="Catatan verifikasi SIMTUN / instruksi perbaikan..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Kirim Pesan Tanggapan Langsung ke Akun Guru & Broadcast API WhatsApp (Guru, Operator, Admin)
                    </label>
                    <input
                      type="text"
                      value={isiTanggapanInput}
                      onChange={(e) => setIsiTanggapanInput(e.target.value)}
                      placeholder="Tuliskan pesan update status real-time yang akan dikirim via API WhatsApp & tampil pada riwayat guru..."
                      className="w-full px-3.5 py-2.5 text-xs border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-lg bg-white transition-all outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-700">Integrasi Notifikasi:</span>
                      <select
                        value={kanalNotifikasi}
                        onChange={(e) => setKanalNotifikasi(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                      >
                        <option value="Dashboard, WhatsApp & Email">
                          Dashboard, WhatsApp & Email
                        </option>
                        <option value="Dashboard & WhatsApp">Dashboard & WhatsApp</option>
                        <option value="Dashboard Portal Saja">Dashboard Portal Saja</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={savingUpdate}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {savingUpdate
                          ? 'Menyimpan...'
                          : 'Simpan Validasi & Kirim Notifikasi'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PUSAT EKSPOR LAPORAN & REKAPITULASI */}
      {subTab === 'laporan' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-semibold text-emerald-700">
              Dokumen Pelaporan Resmi Dinas Pendidikan
            </p>
            <h2 className="text-xl font-display font-bold text-slate-900 mt-1">
              Ekspor Laporan Excel (.xlsx) dan PDF (.pdf)
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Unduh rekapitulasi permasalahan sertifikasi guru per kecamatan, per sekolah, per kategori masalah, per status, serta laporan bulanan dan tahunan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                type: 'kecamatan' as RekapType,
                title: '1. Rekapitulasi Per Kecamatan',
                desc: 'Mengelompokkan jumlah pengaduan masuk, sedang diproses, menunggu perbaikan, selesai, dan ditolak di setiap kecamatan.',
              },
              {
                type: 'sekolah' as RekapType,
                title: '2. Rekapitulasi Per Sekolah (NPSN)',
                desc: 'Menampilkan daftar satuan pendidikan beserta total guru yang melapor dan tingkat penyelesaian per sekolah.',
              },
              {
                type: 'kategori' as RekapType,
                title: '3. Rekapitulasi Berdasarkan Kategori Masalah',
                desc: 'Merinci jumlah kasus pada ke-10 kategori ketidakvalidan sertifikasi pendidik (NRG, JTM, NUPTK, Rekening, dll).',
              },
              {
                type: 'status' as RekapType,
                title: '4. Rekapitulasi Berdasarkan Status',
                desc: 'Laporan rincian tiket berdasarkan status verifikasi untuk evaluasi kinerja penanganan pengaduan.',
              },
              {
                type: 'bulanan_tahunan' as RekapType,
                title: '5. Laporan Bulanan dan Tahunan',
                desc: 'Rekapitulasi tren pengaduan sertifikasi guru berdasarkan periode bulan dan tahun anggaran berjalan.',
              },
              {
                type: 'semua' as RekapType,
                title: '6. Master Data Lengkap Seluruh Pengaduan',
                desc: 'Ekspor seluruh kolom formulir, rekomendasi operator sekolah, dan catatan penyelesaian admin dinas.',
              },
            ].map((card) => (
              <div
                key={card.type}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-1.5">
                  <h3 className="text-sm font-display font-bold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() =>
                      exportLaporanToExcel(scopedPengaduan, card.type, card.title)
                    }
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Unduh Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      exportLaporanToPDF(scopedPengaduan, card.type, card.title)
                    }
                    className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Unduh PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: KELOLA AKUN PENGGUNA */}
      {subTab === 'pengguna' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">
                Manajemen Akun Pengguna & Hak Akses (Guru, Operator Sekolah, Admin Dinas)
              </h2>
              <p className="text-xs text-slate-600">
                Kelola peran pengguna dan status keaktifan akun pada sistem.
              </p>
            </div>
            {!authToken && (
              <button
                onClick={onNavigateLogin}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Login Admin untuk Mengelola User
              </button>
            )}
          </div>

          {loadingUsers ? (
            <p className="text-xs text-slate-500 py-6">Memuat daftar pengguna...</p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">Nama Pengguna</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">NPSN / NUPTK</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {userList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{u.nama}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        NPSN: {u.npsn || '-'} · NUPTK: {u.nuptk || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleUpdateUserAccount(u.id, e.target.value, u.statusAktif)
                          }
                          className="px-2.5 py-1 border border-slate-300 rounded-md bg-white font-semibold"
                        >
                          <option value="guru">guru</option>
                          <option value="operator_sekolah">operator_sekolah</option>
                          <option value="admin_dinas">admin_dinas</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={u.statusAktif}
                          onChange={(e) =>
                            handleUpdateUserAccount(u.id, u.role, e.target.value)
                          }
                          className="px-2.5 py-1 border border-slate-300 rounded-md bg-white font-semibold"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.email !== 'admin.sertifikasi@disdik.go.id' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUserAccount(u.id, u.nama)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: NOTIFIKASI, LOG AKTIVITAS & BACKUP DATABASE */}
      {subTab === 'notifikasi_keamanan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-display font-bold text-slate-900">
                  Riwayat Notifikasi Terintegrasi API WhatsApp (Real-Time)
                </h3>
                <p className="text-xs text-slate-500">
                  Otomatis mengirim pesan WA ke Guru, Operator Sekolah, & Admin Dinas saat status berubah
                </p>
              </div>
              <button
                type="button"
                disabled={testingWaGateway}
                onClick={handleTestBroadcastWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{testingWaGateway ? 'Mengirim WA...' : 'Uji Broadcast API WhatsApp'}</span>
              </button>
            </div>
            <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Belum ada riwayat notifikasi. Klik tombol <strong>Uji Broadcast API WhatsApp</strong> di atas atau kirim pengaduan baru untuk menguji pengiriman otomatis ke 3 peran.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="py-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{n.judul}</span>
                      <span className="font-mono text-[11px] text-emerald-700">
                        {n.kanalIntegrasi}
                      </span>
                    </div>
                    <p className="text-slate-600">{n.pesan}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-display font-bold text-slate-900">
                    Keamanan Sistem & Backup Database Relasional
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unduh salinan cadangan (snapshot JSON) dari ke-10 tabel database PostgreSQL
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadDatabaseBackup}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Backup Database (.JSON)</span>
                </button>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  · Password pengguna dienkripsi dengan algoritma cryptographic scrypt hash.
                </p>
                <p>
                  · Hak akses dibatasi berdasarkan peran (Guru, Operator Sekolah, Admin Dinas).
                </p>
                <p>
                  · Setiap perubahan status pengaduan dan manajemen akun tercatat pada tabel{' '}
                  <span className="font-mono font-semibold">log_aktivitas</span>.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="text-base font-display font-bold text-slate-900 border-b border-slate-200 pb-2">
                Pencatatan Log Aktivitas Sistem (Audit Trail)
              </h3>
              <div className="divide-y divide-slate-200 max-h-64 overflow-y-auto text-xs">
                {activityLogs.map((log) => (
                  <div key={log.id} className="py-2.5 space-y-0.5">
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                      <span className="font-bold text-slate-900">
                        {log.aksi} ({log.roleUser})
                      </span>
                      <span>{new Date(log.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                    <p className="text-slate-700">{log.detail}</p>
                    <p className="text-[11px] text-slate-500">
                      Pelaku: {log.namaUser} · Entitas: {log.entitas}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

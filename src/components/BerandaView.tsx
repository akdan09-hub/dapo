import React from 'react';
import {
  CheckCircle2,
  Clock,
  FileSearch,
  AlertTriangle,
  XCircle,
  ArrowRight,
  FilePlus2,
  Search,
  ShieldCheck,
  Building2,
  Trash2,
} from 'lucide-react';
import {
  MenuTab,
  KategoriPengaduanItem,
  PengaduanItem,
} from '../types.ts';

interface BerandaViewProps {
  onNavigate: (tab: MenuTab) => void;
  onSelectTicket: (ticket: PengaduanItem) => void;
  categories: KategoriPengaduanItem[];
  recentPengaduan: PengaduanItem[];
  stats: {
    total: number;
    menunggu: number;
    diproses: number;
    perbaikan: number;
    selesai: number;
    ditolak: number;
  };
  onRefreshData?: () => Promise<void>;
}

export const BerandaView: React.FC<BerandaViewProps> = ({
  onNavigate,
  onSelectTicket,
  categories,
  recentPengaduan,
  stats,
  onRefreshData,
}) => {
  const handleDeleteRecentTicket = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/pengaduan/${id}`, { method: 'DELETE' });
      if (res.ok && onRefreshData) {
        await onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="space-y-12 pb-12">
      {/* HERO SECTION - 2 Column Split with Full-Width KPI Row Below */}
      <section className="bg-slate-900 text-white rounded-xl border border-slate-800 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="text-xs font-medium text-emerald-400 tracking-wide">
                Layanan Resmi Direktorat & Dinas Pendidikan · Terintegrasi Info GTK & Dapodik
              </div>
              <h1
                className="font-display font-bold tracking-tight text-white leading-tight"
                style={{ fontSize: 'clamp(2rem, 3.5vw, 3.1rem)', textWrap: 'balance' }}
              >
                Portal Pengaduan Sertifikasi Guru Belum Valid
              </h1>
              <p className="text-slate-300 text-base leading-relaxed max-w-2xl">
                Layanan terpadu bagi Guru, Operator Sekolah, dan Admin Dinas Pendidikan untuk menyampaikan,
                memeriksa, memantau, dan menyelesaikan permasalahan validasi data sertifikasi pendidik (NRG,
                NUPTK, Beban Mengajar JTM, Rekening TPG, hingga Status Info GTK) secara transparan dan terukur.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('buat_pengaduan')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <FilePlus2 className="w-4 h-4" />
                <span>BUAT PENGADUAN</span>
              </button>
              <button
                onClick={() => onNavigate('cek_status')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Search className="w-4 h-4 text-emerald-400" />
                <span>CEK STATUS PENGADUAN</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
              <span>Nomor Tiket Otomatis & Unik</span>
              <span aria-hidden="true">·</span>
              <span>Verifikasi Berjenjang Operator & Dinas</span>
              <span aria-hidden="true">·</span>
              <span>Notifikasi Status Langsung</span>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[380px] lg:min-h-full bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden">
            <div className="relative w-full h-full min-h-[180px] overflow-hidden bg-slate-900">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-11-12_at_19.02.06_5403b34e.jpeg"
                alt="Tim Layanan Sertifikasi Pendidik — Balai Penjaminan Mutu Pendidikan (BPMP) Kalimantan Barat"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="relative w-full h-full min-h-[180px] overflow-hidden bg-slate-900">
              <img
                src="/assets/aistudio/images__7__12a48957.jpg"
                alt="Gedung Kantor Dinas Pendidikan dan Kebudayaan"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="relative w-full h-full min-h-[180px] overflow-hidden bg-slate-900">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-11-18_at_13.40.59_aa3643e4.jpeg"
                alt="Kegiatan Verifikasi & Sinkronisasi Data Sertifikasi Guru dan Operator Sekolah"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="relative w-full h-full min-h-[180px] overflow-hidden bg-slate-900">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-11-18_at_13.44.44_d1ac98f8.jpeg"
                alt="Pengimbasan Peningkatan Indeks Kualitas Data Pokok Pendidikan (Dapodik) di Kabupaten Mempawah"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* Full-Width 6-Metric Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-slate-800 bg-slate-950/60 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
          <div className="p-5">
            <p className="text-xs text-slate-400">Total Pengaduan</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-white mt-1">{stats.total}</p>
            <p className="text-xs text-slate-400 mt-1">Laporan terdaftar</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-slate-400">Menunggu Verifikasi</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">{stats.menunggu}</p>
            <p className="text-xs text-slate-400 mt-1">Antrean baru</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-slate-400">Sedang Diproses</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-sky-400 mt-1">{stats.diproses}</p>
            <p className="text-xs text-slate-400 mt-1">Verifikasi & tindak lanjut</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-slate-400">Menunggu Perbaikan</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-orange-400 mt-1">{stats.perbaikan}</p>
            <p className="text-xs text-slate-400 mt-1">Revisi dokumen guru</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-slate-400">Pengaduan Selesai</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">{stats.selesai}</p>
            <p className="text-xs text-slate-400 mt-1">Data sertifikasi valid</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-slate-400">Pengaduan Ditolak</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-rose-400 mt-1">{stats.ditolak}</p>
            <p className="text-xs text-slate-400 mt-1">Tidak memenuhi syarat</p>
          </div>
        </div>
      </section>

      {/* ALUR PELAYANAN PENGADUAN */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold text-emerald-700">Mekanisme Terstruktur</p>
            <h2 className="text-2xl font-display font-bold text-slate-900 mt-1">
              Informasi Alur Pelayanan Pengaduan Sertifikasi
            </h2>
          </div>
          <button
            onClick={() => onNavigate('panduan_pengaduan')}
            className="text-sm font-medium text-slate-700 hover:text-slate-950 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Pelajari Panduan Lengkap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              step: '01. Pengisian Formulir',
              title: 'Lapor & Unggah Bukti',
              desc: 'Guru mengisi identitas NUPTK, memilih kategori kendala Info GTK, serta mengunggah PDF Sertifikat Pendidik atau SK Pembagian Tugas.',
            },
            {
              step: '02. Nomor Tiket Otomatis',
              title: 'Penerbitan Tiket Unik',
              desc: 'Sistem menerbitkan Nomor Tiket resmi (contoh: SRT-2026-0841) untuk pelacakan status penanganan secara real-time.',
            },
            {
              step: '03. Pemeriksaan Operator',
              title: 'Pra-Validasi Sekolah',
              desc: 'Operator Sekolah memeriksa kesesuaian input Dapodik tingkat satuan pendidikan dan memberikan rekomendasi kelengkapan.',
            },
            {
              step: '04. Validasi Admin Dinas',
              title: 'Tindak Lanjut SIMTUN',
              desc: 'Admin Dinas Pendidikan memeriksa dokumen, menyinkronkan data dengan Puslapdik/BKN, atau meminta perbaikan jika kurang lengkap.',
            },
            {
              step: '05. Penyelesaian Valid',
              title: 'Data Sertifikasi Valid',
              desc: 'Status pengaduan dinyatakan Selesai disertai catatan penyelesaian resmi. Guru menerima notifikasi pada dashboard.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="text-xs font-mono font-semibold text-emerald-700">{item.step}</div>
                <h3 className="text-base font-display font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                Terpantau transparan di akun Guru
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10 KATEGORI PERMASALAHAN SERTIFIKASI & AKSES PERAN */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-semibold text-emerald-700">Klasifikasi Kendala</p>
            <h2 className="text-xl font-display font-bold text-slate-900 mt-1">
              10 Kategori Permasalahan Sertifikasi yang Dilayani
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {categories.map((kat, idx) => (
              <div key={kat.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-500 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">{kat.namaKategori}</h3>
                  </div>
                  <p className="text-xs text-slate-600 pl-6">{kat.deskripsi}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-slate-600 tabular-nums">
                    Estimasi {kat.estimasiHari} hari kerja
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 HAK AKSES PENGGUNA & TRANSPARANSI TIKET TERBARU */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <p className="text-xs font-semibold text-emerald-700">Integrasi 3 Peran Pengguna</p>
              <h2 className="text-lg font-display font-bold text-slate-900 mt-0.5">
                Hak Akses Portal Pengaduan
              </h2>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">A. Akun Guru Sertifikasi</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <p>
                  Mengisi formulir pengaduan, mengunggah dokumen pendukung, memantau nomor tiket, melihat tanggapan admin, dan memperbaiki laporan jika diminta.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">B. Akun Operator Sekolah</span>
                  <Building2 className="w-4 h-4 text-slate-700" />
                </div>
                <p>
                  Melihat daftar pengaduan guru dari sekolahnya (berdasarkan NPSN), memeriksa kelengkapan berkas Dapodik, dan memberikan catatan rekomendasi ke Dinas.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">C. Akun Admin Dinas Pendidikan</span>
                  <FileSearch className="w-4 h-4 text-slate-900" />
                </div>
                <p>
                  Memvalidasi seluruh laporan, mengubah status penyelesaian, mengelola akun pengguna, melihat grafik analitik, serta mengunduh rekapitulasi laporan Excel dan PDF.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('login_admin')}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Masuk / Pilih Akun Peran (Guru, Operator, Admin Dinas)
              </button>
            </div>
          </div>

          {/* Pantauan Pengaduan Terbaru */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-display font-bold text-slate-900">
                  Aktivitas Tiket Pengaduan Terbaru
                </h3>
                <p className="text-xs text-slate-500">Klik tiket untuk melihat detail progres penanganan</p>
              </div>
              <button
                onClick={() => onNavigate('riwayat_pengaduan')}
                className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                Lihat Semua
              </button>
            </div>

            <div className="divide-y divide-slate-200">
              {recentPengaduan.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Belum ada data pengaduan guru yang terdaftar
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Seluruh data pengaduan guru telah dikosongkan. Silakan ajukan laporan baru melalui formulir pengaduan.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('buat_pengaduan')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <FilePlus2 className="w-3.5 h-3.5" />
                    <span>Buat Pengaduan Pertama</span>
                  </button>
                </div>
              ) : (
                recentPengaduan.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectTicket(item)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                        <span className="font-semibold text-slate-900">{item.nomorTiket}</span>
                        <span>·</span>
                        <span className="truncate">{item.namaSekolah}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 truncate mt-0.5">{item.namaLengkap}</p>
                      <p className="text-xs text-slate-600 truncate">{item.jenisPermasalahan}</p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                        {item.status === 'Selesai' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {item.status === 'Menunggu Perbaikan Data' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        {item.status === 'Ditolak' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {item.status !== 'Selesai' &&
                          item.status !== 'Menunggu Perbaikan Data' &&
                          item.status !== 'Ditolak' && <Clock className="w-3.5 h-3.5 text-sky-600" />}
                        <span>{item.status}</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRecentTicket(e, item.id)}
                        title="Hapus Pengaduan"
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold rounded inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

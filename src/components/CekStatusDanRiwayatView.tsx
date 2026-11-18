import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Upload,
  Send,
  History,
  MessageSquare,
  Building2,
  Eye,
  Filter,
  FileDown,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import {
  PengaduanItem,
  UserProfile,
  DAFTAR_STATUS_PENGADUAN,
} from '../types.ts';
import { exportDetailPengaduanToPDF } from '../utils/exportReports.ts';

interface CekStatusDanRiwayatViewProps {
  mode: 'cek_status' | 'riwayat_pengaduan';
  allPengaduan: PengaduanItem[];
  currentUser: UserProfile | null;
  selectedInitialTicket: PengaduanItem | null;
  onRefreshData: () => Promise<void>;
}

export const CekStatusDanRiwayatView: React.FC<CekStatusDanRiwayatViewProps> = ({
  mode,
  allPengaduan,
  currentUser,
  selectedInitialTicket,
  onRefreshData,
}) => {
  const [queryStr, setQueryStr] = useState(
    selectedInitialTicket?.nomorTiket || ''
  );
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [selectedTicket, setSelectedTicket] = useState<PengaduanItem | null>(
    selectedInitialTicket || allPengaduan[0] || null
  );

  // State for Guru Revision Form
  const [revisiDeskripsi, setRevisiDeskripsi] = useState('');
  const [revisiCatatan, setRevisiCatatan] = useState('');
  const [revisiFileName, setRevisiFileName] = useState('');
  const [revisiFileUrl, setRevisiFileUrl] = useState('');
  const [revisiFileSize, setRevisiFileSize] = useState(0);
  const [submittingRevisi, setSubmittingRevisi] = useState(false);
  const [revisiSuccessMsg, setRevisiSuccessMsg] = useState('');
  const [lastWaBroadcast, setLastWaBroadcast] = useState<any | null>(null);
  const [sendingManualWa, setSendingManualWa] = useState(false);
  const [deletingTicketId, setDeletingTicketId] = useState<number | null>(null);

  const handleDeleteTicket = async (id: number) => {
    setDeletingTicketId(id);
    try {
      const res = await fetch(`/api/pengaduan/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (selectedTicket?.id === id) {
          setSelectedTicket(null);
        }
        await onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingTicketId(null);
    }
  };

  const filteredList = allPengaduan.filter((item) => {
    const q = queryStr.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.nomorTiket.toLowerCase().includes(q) ||
      item.nuptk.toLowerCase().includes(q) ||
      item.namaLengkap.toLowerCase().includes(q) ||
      item.namaSekolah.toLowerCase().includes(q) ||
      item.npsn.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'Semua' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectTicket = (item: PengaduanItem) => {
    setSelectedTicket(item);
    setRevisiDeskripsi(item.deskripsiPermasalahan);
    setRevisiCatatan('');
    setRevisiSuccessMsg('');
  };

  const handleFileRevisiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRevisiFileName(file.name);
    setRevisiFileSize(file.size);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRevisiFileUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSubmittingRevisi(true);
    setRevisiSuccessMsg('');
    try {
      const res = await fetch(`/api/pengaduan/${selectedTicket.id}/perbaikan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorUserId: currentUser?.id,
          actorNama: currentUser?.nama || selectedTicket.namaLengkap,
          deskripsiPermasalahan: revisiDeskripsi || selectedTicket.deskripsiPermasalahan,
          catatanPerbaikan:
            revisiCatatan || 'Telah memperbaiki data dan mengunggah dokumen pendukung tambahan.',
          dokumenBaru: revisiFileName
            ? {
                namaFile: revisiFileName,
                jenisDokumen: 'Dokumen Perbaikan Guru',
                tipeFile: 'application/pdf',
                ukuranByte: revisiFileSize || 245000,
                fileUrl:
                  revisiFileUrl ||
                  'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLU01jBQsjBUsTIwV9AwB5acIawplbmRzdHJlYW0KZW5kb2JqCg==',
              }
            : undefined,
        }),
      });
      if (!res.ok) {
        throw new Error('Gagal mengirim perbaikan');
      }
      const data = await res.json();
      if (data.pengaduan?.waBroadcast) {
        setLastWaBroadcast(data.pengaduan.waBroadcast);
      }
      await onRefreshData();
      setRevisiSuccessMsg(
        'Perbaikan laporan berhasil dikirim & notifikasi otomatis API WhatsApp telah diteruskan secara real-time kepada Guru, Operator Sekolah, dan Admin Dinas!'
      );
      setRevisiCatatan('');
      setRevisiFileName('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRevisi(false);
    }
  };

  const handleManualWhatsAppPing = async () => {
    if (!activeTicket) return;
    setSendingManualWa(true);
    try {
      const res = await fetch('/api/whatsapp/send-realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pengaduanId: activeTicket.id,
          nomorTiket: activeTicket.nomorTiket,
          namaGuru: activeTicket.namaLengkap,
          noHpGuru: activeTicket.noHp,
          namaSekolah: activeTicket.namaSekolah,
          npsn: activeTicket.npsn,
          jenisPermasalahan: activeTicket.jenisPermasalahan,
          statusBaru: activeTicket.status,
          catatan:
            revisiCatatan ||
            `Update status real-time tiket ${activeTicket.nomorTiket} (${activeTicket.status})`,
          actorNama: currentUser?.nama || activeTicket.namaLengkap,
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
      setSendingManualWa(false);
    }
  };

  // Sync selectedTicket with updated allPengaduan
  const activeTicket =
    allPengaduan.find((p) => p.id === selectedTicket?.id) ||
    filteredList[0] ||
    null;

  return (
    <div className="space-y-6 pb-12">
      {/* Search & Filter Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-emerald-700">
              {mode === 'cek_status'
                ? 'Pelacakan Progres Tiket Secara Real-Time'
                : 'Arsip & Riwayat Pengaduan Sertifikasi'}
            </p>
            <h1 className="text-2xl font-display font-bold text-slate-900 mt-0.5">
              {mode === 'cek_status'
                ? 'Cek Status & Tanggapan Pengaduan'
                : 'Daftar Riwayat Pengaduan Sertifikasi Guru'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Contoh Tiket Cepat:</span>
            {['SRT-2026-0841', 'SRT-2026-0842', 'SRT-2026-0843', 'SRT-2026-0846'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setQueryStr(t);
                  const found = allPengaduan.find((p) => p.nomorTiket === t);
                  if (found) handleSelectTicket(found);
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-semibold rounded-md transition-colors cursor-pointer"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryStr}
              onChange={(e) => setQueryStr(e.target.value)}
              placeholder="Cari berdasarkan Nomor Tiket (misal: SRT-2026-0841), NUPTK, Nama Guru, atau NPSN Sekolah..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>
          <div className="md:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900"
            >
              <option value="Semua">Semua Status ({allPengaduan.length})</option>
              {DAFTAR_STATUS_PENGADUAN.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {queryStr && (
              <button
                type="button"
                onClick={() => setQueryStr('')}
                className="px-3 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg cursor-pointer shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Split View: Left Table/List + Right Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-bold text-slate-800">
              Hasil Pencarian ({filteredList.length} Laporan)
            </span>
            <span className="text-xs text-slate-500">Klik baris untuk detail</span>
          </div>

          {filteredList.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800">Tidak ada tiket yang ditemukan</p>
              <p className="text-xs text-slate-500">
                Coba gunakan kata kunci Nomor Tiket, NUPTK, atau tekan tombol Reset.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 max-h-[680px] overflow-y-auto">
              {filteredList.map((item) => {
                const isSelected = activeTicket?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectTicket(item)}
                    className={`p-4 transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                      <span className={isSelected ? 'text-emerald-400 font-bold' : 'text-slate-900 font-bold'}>
                        {item.nomorTiket}
                      </span>
                      <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                        {new Date(item.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mt-1">{item.namaLengkap}</p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                      {item.namaSekolah} · NUPTK {item.nuptk}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-200/20 flex items-center justify-between gap-2 text-xs">
                      <span className={`truncate ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item.jenisPermasalahan}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-semibold ${
                            isSelected ? 'text-emerald-300' : 'text-slate-800'
                          }`}
                        >
                          {item.status}
                        </span>
                        <button
                          type="button"
                          disabled={deletingTicketId === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTicket(item.id);
                          }}
                          title="Hapus Laporan"
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold rounded inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-7 space-y-6">
          {!activeTicket ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <p className="text-sm text-slate-600">Pilih salah satu tiket di sebelah kiri untuk melihat rincian.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              {/* Ticket Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                    <span className="font-bold text-slate-900 text-sm">{activeTicket.nomorTiket}</span>
                    <span>·</span>
                    <span>Dilaporkan {new Date(activeTicket.createdAt).toLocaleDateString('id-ID')}</span>
                    <span>·</span>
                    <span>Kec. {activeTicket.kecamatan}</span>
                  </div>
                  <h2 className="text-xl font-display font-bold text-slate-900 mt-1">
                    {activeTicket.namaLengkap}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    NUPTK: <span className="font-mono font-semibold">{activeTicket.nuptk}</span> · Sekolah:{' '}
                    <span className="font-semibold">{activeTicket.namaSekolah}</span> (NPSN: {activeTicket.npsn})
                  </p>
                </div>

                <div className="shrink-0 flex flex-col sm:items-end gap-2">
                  <div>
                    <span className="text-xs text-slate-500 block sm:text-right">Status Penanganan</span>
                    <div className="inline-flex items-center gap-1.5 mt-0.5 text-sm font-bold text-slate-900">
                      {activeTicket.status === 'Selesai' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {activeTicket.status === 'Menunggu Perbaikan Data' && (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      {activeTicket.status === 'Ditolak' && <XCircle className="w-4 h-4 text-rose-600" />}
                      {activeTicket.status !== 'Selesai' &&
                        activeTicket.status !== 'Menunggu Perbaikan Data' &&
                        activeTicket.status !== 'Ditolak' && <Clock className="w-4 h-4 text-sky-600" />}
                      <span>{activeTicket.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => exportDetailPengaduanToPDF(activeTicket)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Unduh Arsip Detail PDF</span>
                    </button>
                    <button
                      type="button"
                      disabled={deletingTicketId === activeTicket.id}
                      onClick={() => handleDeleteTicket(activeTicket.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {deletingTicketId === activeTicket.id ? 'Menghapus...' : 'Hapus Pengaduan'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Stepper 5 Tahap */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-800 mb-3">Tahapan Verifikasi & Penyelesaian</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {[
                    'Menunggu Verifikasi',
                    'Sedang Diverifikasi',
                    'Dalam Proses Tindak Lanjut',
                    'Menunggu Perbaikan Data',
                    'Selesai',
                  ].map((st, idx) => {
                    const isCurrent = activeTicket.status === st;
                    const isFinished = activeTicket.status === 'Selesai';
                    return (
                      <div
                        key={st}
                        className={`p-2.5 rounded-lg border ${
                          isCurrent
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : isFinished
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        <div className="font-mono text-[11px] opacity-75">Tahap 0{idx + 1}</div>
                        <div className="mt-0.5 leading-snug">{st}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detail Permasalahan & Tanggapan Resmi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500">Kategori Permasalahan Sertifikasi:</span>
                  <p className="text-sm font-bold text-slate-900">{activeTicket.jenisPermasalahan}</p>
                  <p className="text-slate-600 pt-1">
                    No. Serdik: <span className="font-mono">{activeTicket.noSertifikatPendidik || '-'}</span> · Tahun:{' '}
                    <span className="font-mono">{activeTicket.tahunSertifikasi || '-'}</span>
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500">Pemeriksaan Operator Sekolah:</span>
                  <p className="text-sm font-bold text-slate-900">
                    {activeTicket.rekomendasiOperator || 'Belum Diperiksa'}
                  </p>
                  <p className="text-slate-600 pt-1">
                    {activeTicket.catatanOperator || 'Menunggu pemeriksaan kelengkapan berkas oleh operator sekolah.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800">Deskripsi Kronologi Permasalahan Guru</h3>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
                  {activeTicket.deskripsiPermasalahan}
                </div>
              </div>

              {/* Catatan Admin Dinas / Alasan Penolakan */}
              {(activeTicket.catatanAdmin || activeTicket.alasanPenolakan) && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950">
                      Tanggapan & Catatan Penyelesaian Admin Dinas Pendidikan
                    </span>
                    {activeTicket.tanggalTindakLanjut && (
                      <span className="font-mono text-emerald-800">
                        Tindak Lanjut: {activeTicket.tanggalTindakLanjut}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {activeTicket.catatanAdmin || activeTicket.alasanPenolakan}
                  </p>
                </div>
              )}

              {/* Form Perbaikan Laporan oleh Guru (Aktif terutama bila diminta perbaikan atau ingin melengkapi berkas) */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-display font-bold text-slate-900">
                      Formulir Perbaikan Data & Integrasi Notifikasi API WhatsApp Real-Time
                    </h3>
                    <p className="text-xs text-slate-600">
                      Setiap pengiriman catatan perbaikan akan langsung memicu pesan API WhatsApp otomatis ke nomor Guru, Operator Sekolah, dan Admin Dinas.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={sendingManualWa}
                    onClick={handleManualWhatsAppPing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{sendingManualWa ? 'Mengirim WA...' : 'Kirim Update WA Sekarang'}</span>
                  </button>
                </div>

                {revisiSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
                    {revisiSuccessMsg}
                  </div>
                )}

                {lastWaBroadcast && (
                  <div className="p-3.5 bg-white border border-emerald-200 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Log Pengiriman Real-Time API WhatsApp ({lastWaBroadcast.nomorTiket})</span>
                      </span>
                      <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                        {lastWaBroadcast.gatewayMode}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {lastWaBroadcast.deliveries?.map((d: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5">
                          <div className="font-semibold text-slate-900">{d.role}</div>
                          <div className="text-slate-600 truncate">{d.nama}</div>
                          <div className="font-mono text-[11px] text-emerald-700 font-semibold">
                            {d.phoneFormatted} · {d.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmitRevision} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Perbaikan / Klarifikasi Guru (Terkirim Otomatis ke API WhatsApp Operator & Admin)
                    </label>
                    <input
                      type="text"
                      required
                      value={revisiCatatan}
                      onChange={(e) => setRevisiCatatan(e.target.value)}
                      placeholder="Ketik catatan perbaikan atau pesan WhatsApp untuk Operator Sekolah & Admin Dinas..."
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-lg transition-all outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{revisiFileName ? `File: ${revisiFileName}` : 'Pilih Dokumen Perbaikan (PDF/JPG)'}</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileRevisiUpload} className="hidden" />
                    </label>

                    <button
                      type="submit"
                      disabled={submittingRevisi}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingRevisi ? 'Mengirim & Broadcast WA...' : 'Kirim Perbaikan & Notifikasi WA'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Dokumen yang Diunggah */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800">
                  Dokumen Bukti Pendukung ({activeTicket.dokumenList?.length || 0} Berkas)
                </h3>
                {activeTicket.dokumenList && activeTicket.dokumenList.length > 0 ? (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                    {activeTicket.dokumenList.map((doc) => (
                      <div key={doc.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-slate-700 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{doc.namaFile}</p>
                            <p className="text-slate-500">
                              {doc.jenisDokumen} · {(doc.ukuranByte / 1024).toFixed(1)} KB · Status:{' '}
                              <span className="font-semibold text-slate-800">{doc.statusValidasi}</span>
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          download={doc.namaFile}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-md shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Unduh / Periksa</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Belum ada dokumen lampiran.</p>
                )}
              </div>

              {/* Diskusi Tanggapan & Riwayat Perubahan Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Catatan Komunikasi ({activeTicket.tanggapanList?.length || 0})</span>
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeTicket.tanggapanList?.map((t) => (
                      <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-semibold text-slate-900">{t.namaPengirim}</span>
                          <span className="font-mono text-[11px]">
                            {new Date(t.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <p className="text-slate-700">{t.isiTanggapan}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Log Riwayat Perubahan Status ({activeTicket.riwayatList?.length || 0})</span>
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activeTicket.riwayatList?.map((r) => (
                      <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            {r.statusSebelumnya} → {r.statusBaru}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {new Date(r.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <p className="text-slate-600">{r.catatan}</p>
                        <p className="text-[11px] text-slate-500">Oleh: {r.diubahOlehNama}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  FilePlus2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileText,
  ArrowRight,
  Copy,
  Check,
  FileDown,
} from 'lucide-react';
import {
  DAFTAR_KATEGORI_PERMASALAHAN,
  SekolahItem,
  UserProfile,
  PengaduanItem,
  MenuTab,
} from '../types.ts';
import { exportDetailPengaduanToPDF } from '../utils/exportReports.ts';

interface BuatPengaduanViewProps {
  currentUser: UserProfile | null;
  schools: SekolahItem[];
  onCreated: (newTicket: PengaduanItem) => void;
  onNavigate: (tab: MenuTab) => void;
}

interface UploadedFileState {
  namaFile: string;
  jenisDokumen: string;
  tipeFile: string;
  ukuranByte: number;
  fileUrl: string;
}

export const BuatPengaduanView: React.FC<BuatPengaduanViewProps> = ({
  currentUser,
  schools,
  onCreated,
  onNavigate,
}) => {
  const [namaLengkap, setNamaLengkap] = useState(currentUser?.nama || '');
  const [nuptk, setNuptk] = useState(currentUser?.nuptk && currentUser.nuptk !== '-' ? currentUser.nuptk : '');
  const [nik, setNik] = useState('');
  const [nip, setNip] = useState('');
  const [namaSekolah, setNamaSekolah] = useState('');
  const [npsn, setNpsn] = useState(currentUser?.npsn && currentUser.npsn !== 'DINAS-001' ? currentUser.npsn : '');
  const [kecamatan, setKecamatan] = useState('Coblong');
  const [kabupatenKota, setKabupatenKota] = useState('Kota Bandung');
  const [noHp, setNoHp] = useState(currentUser?.noHp || '');
  const [jenisPermasalahan, setJenisPermasalahan] = useState(DAFTAR_KATEGORI_PERMASALAHAN[0]);
  const [noSertifikatPendidik, setNoSertifikatPendidik] = useState('');
  const [tahunSertifikasi, setTahunSertifikasi] = useState('2024');
  const [deskripsiPermasalahan, setDeskripsiPermasalahan] = useState('');
  const [jenisDokumenPilihan, setJenisDokumenPilihan] = useState('Cetakan Info GTK Terbaru');
  const [dokumenList, setDokumenList] = useState<UploadedFileState[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdTicket, setCreatedTicket] = useState<PengaduanItem | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectPresetSchool = (selectedNpsn: string) => {
    const found = schools.find((s) => s.npsn === selectedNpsn);
    if (found) {
      setNpsn(found.npsn);
      setNamaSekolah(found.namaSekolah);
      setKecamatan(found.kecamatan);
      setKabupatenKota(found.kabupatenKota);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Format file tidak didukung. Harap unggah dokumen berformat PDF, JPG, atau PNG.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal adalah 4 MB per dokumen.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultUrl = typeof reader.result === 'string' ? reader.result : '';
      setDokumenList((prev) => [
        ...prev,
        {
          namaFile: file.name,
          jenisDokumen: jenisDokumenPilihan,
          tipeFile: file.type,
          ukuranByte: file.size,
          fileUrl: resultUrl,
        },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddSampleDocument = () => {
    setDokumenList((prev) => [
      ...prev,
      {
        namaFile: `Lampiran_${jenisDokumenPilihan.replace(/\s+/g, '_')}_2026.pdf`,
        jenisDokumen: jenisDokumenPilihan,
        tipeFile: 'application/pdf',
        ukuranByte: 342800,
        fileUrl:
          'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLU01jBQsjBUsTIwV9AwB5acIawplbmRzdHJlYW0KZW5kb2JqCg==',
      },
    ]);
  };

  const handleRemoveDoc = (idx: number) => {
    setDokumenList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!namaLengkap.trim() || !nuptk.trim() || !namaSekolah.trim() || !npsn.trim() || !noHp.trim() || !deskripsiPermasalahan.trim()) {
      setErrorMsg('Mohon lengkapi seluruh kolom bertanda wajib (*) sebelum mengirim pengaduan.');
      return;
    }

    if (nuptk.trim().length < 10) {
      setErrorMsg('Nomor NUPTK harus berisi minimal 10–16 digit angka yang valid.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/pengaduan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          namaLengkap,
          nuptk,
          nik,
          nip,
          namaSekolah,
          npsn,
          kecamatan,
          kabupatenKota,
          noHp,
          jenisPermasalahan,
          noSertifikatPendidik,
          tahunSertifikasi,
          deskripsiPermasalahan,
          dokumenList,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan formulir pengaduan.');
      }

      setCreatedTicket(data.pengaduan);
      onCreated(data.pengaduan);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengirim laporan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyTicket = () => {
    if (!createdTicket) return;
    navigator.clipboard.writeText(createdTicket.nomorTiket);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdTicket) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-8 space-y-6">
        <div className="flex items-start gap-4 border-b border-slate-200 pb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-emerald-700">Laporan Pengaduan Terkirim</p>
            <h2 className="text-2xl font-display font-bold text-slate-900">
              Nomor Tiket Pengaduan Berhasil Diterbitkan
            </h2>
            <p className="text-sm text-slate-600">
              Simpan Nomor Tiket di bawah ini untuk memantau perkembangan verifikasi oleh Operator Sekolah dan Admin Dinas Pendidikan.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">Nomor Tiket Resmi Anda</p>
            <p className="text-3xl font-mono font-bold tracking-tight text-emerald-400 mt-1 tabular-nums">
              {createdTicket.nomorTiket}
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Status Saat Ini: <span className="font-semibold text-white">{createdTicket.status}</span>
            </p>
          </div>
          <button
            onClick={handleCopyTicket}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Nomor Tiket Disalin' : 'Salin Nomor Tiket'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-6">
          <div>
            <span className="text-slate-500">Nama Lengkap Guru:</span>
            <p className="font-semibold text-slate-900 text-sm mt-0.5">{createdTicket.namaLengkap}</p>
          </div>
          <div>
            <span className="text-slate-500">NUPTK / NIP:</span>
            <p className="font-mono font-semibold text-slate-900 text-sm mt-0.5 tabular-nums">
              {createdTicket.nuptk} {createdTicket.nip ? `/ ${createdTicket.nip}` : ''}
            </p>
          </div>
          <div>
            <span className="text-slate-500">Satuan Pendidikan (NPSN):</span>
            <p className="font-semibold text-slate-900 text-sm mt-0.5">
              {createdTicket.namaSekolah} ({createdTicket.npsn})
            </p>
          </div>
          <div>
            <span className="text-slate-500">Kategori Permasalahan:</span>
            <p className="font-semibold text-emerald-700 text-sm mt-0.5">{createdTicket.jenisPermasalahan}</p>
          </div>
        </div>

        {/* Bukti Pengiriman Notifikasi Otomatis API WhatsApp ke 3 Peran */}
        {(createdTicket as any).waBroadcast && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950">
                Status Notifikasi Otomatis API WhatsApp (Real-Time Multi-Role)
              </span>
              <span className="font-mono text-[11px] font-semibold text-emerald-800">
                {(createdTicket as any).waBroadcast.gatewayMode}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(createdTicket as any).waBroadcast.deliveries?.map((d: any, idx: number) => (
                <div key={idx} className="bg-white border border-emerald-200/80 rounded-lg p-2.5 space-y-0.5">
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

        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => {
              setCreatedTicket(null);
              setDeskripsiPermasalahan('');
              setDokumenList([]);
            }}
            className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Buat Laporan Pengaduan Lainnya
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => exportDetailPengaduanToPDF(createdTicket)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>Unduh Bukti Pengaduan (PDF)</span>
            </button>
            <button
              onClick={() => onNavigate('cek_status')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Lacak Status Tiket Ini</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="border-b border-slate-200 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-emerald-700">Layanan Pelaporan Data Sertifikasi</p>
            <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">
              Formulir Pengaduan Sertifikasi Guru Belum Valid
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Isi seluruh data sesuai dokumen resmi Dapodik, Info GTK, dan Sertifikat Pendidik (Serdik).
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs">
            <span className="text-slate-500 block">Pilih Cepat Sekolah Terdaftar:</span>
            <select
              onChange={(e) => handleSelectPresetSchool(e.target.value)}
              defaultValue=""
              className="mt-1 font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="" disabled>
                -- Isi Otomatis dari Daftar Sekolah --
              </option>
              {schools.map((s) => (
                <option key={s.id} value={s.npsn}>
                  {s.namaSekolah} (NPSN: {s.npsn})
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* BAGIAN I: IDENTITAS PENDIDIK */}
          <div className="space-y-4">
            <h2 className="text-sm font-display font-bold text-slate-900 border-b border-slate-100 pb-2">
              01. Identitas Lengkap Guru Pelapor
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  1. Nama Lengkap Guru (Beserta Gelar) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Contoh: Hj. Siti Aminah, S.Pd."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  2. NUPTK (16 Digit) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nuptk}
                  onChange={(e) => setNuptk(e.target.value)}
                  placeholder="Contoh: 4538756658300012"
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  3. NIK KTP (Opsional)
                </label>
                <input
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="16 Digit NIK Kependudukan"
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  4. NIP ASN / PPPK (Opsional)
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="18 Digit NIP (Jika PNS/PPPK)"
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  9. Nomor HP / WhatsApp Aktif <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="Contoh: 081321456789"
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* BAGIAN II: DATA SATUAN PENDIDIKAN */}
          <div className="space-y-4">
            <h2 className="text-sm font-display font-bold text-slate-900 border-b border-slate-100 pb-2">
              02. Data Satuan Pendidikan (Sekolah Induk)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  5. Nama Sekolah <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaSekolah}
                  onChange={(e) => setNamaSekolah(e.target.value)}
                  placeholder="Contoh: SMAN 1 Bandung"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  6. NPSN Sekolah <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={npsn}
                  onChange={(e) => setNpsn(e.target.value)}
                  placeholder="8 Digit NPSN"
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  7. Kecamatan <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  placeholder="Contoh: Coblong"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  8. Kabupaten / Kota <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kabupatenKota}
                  onChange={(e) => setKabupatenKota(e.target.value)}
                  placeholder="Contoh: Kota Bandung"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* BAGIAN III: RINCIAN PERMASALAHAN SERTIFIKASI */}
          <div className="space-y-4">
            <h2 className="text-sm font-display font-bold text-slate-900 border-b border-slate-100 pb-2">
              03. Rincian Permasalahan Sertifikasi Pendidik
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  10. Jenis Permasalahan Sertifikasi <span className="text-rose-600">*</span>
                </label>
                <select
                  value={jenisPermasalahan}
                  onChange={(e) => setJenisPermasalahan(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-slate-900"
                >
                  {DAFTAR_KATEGORI_PERMASALAHAN.map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  11. Nomor Sertifikat Pendidik (Jika Tersedia)
                </label>
                <input
                  type="text"
                  value={noSertifikatPendidik}
                  onChange={(e) => setNoSertifikatPendidik(e.target.value)}
                  placeholder="Contoh: 1011402104591"
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  12. Tahun Sertifikasi
                </label>
                <input
                  type="text"
                  value={tahunSertifikasi}
                  onChange={(e) => setTahunSertifikasi(e.target.value)}
                  placeholder="Contoh: 2024"
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                13. Deskripsi Permasalahan Secara Lengkap <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={deskripsiPermasalahan}
                onChange={(e) => setDeskripsiPermasalahan(e.target.value)}
                placeholder="Jelaskan secara spesifik kode status yang tampil di Info GTK, kendala yang dialami, serta upaya yang sudah dilakukan bersama Operator Sekolah..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* BAGIAN IV: UNGGAH DOKUMEN PENDUKUNG */}
          <div className="space-y-4">
            <h2 className="text-sm font-display font-bold text-slate-900 border-b border-slate-100 pb-2">
              04. Unggah Dokumen Bukti Pendukung (Validasi Format PDF/JPG/PNG, Maks. 4 MB)
            </h2>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Jenis Dokumen yang Diunggah
                  </label>
                  <select
                    value={jenisDokumenPilihan}
                    onChange={(e) => setJenisDokumenPilihan(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Cetakan Info GTK Terbaru">Cetakan Info GTK Terbaru</option>
                    <option value="Sertifikat Pendidik (Serdik)">Sertifikat Pendidik (Serdik)</option>
                    <option value="SK Pembagian Tugas Mengajar">SK Pembagian Tugas Mengajar</option>
                    <option value="Buku Tabungan / Rekening TPG">Buku Tabungan / Rekening TPG</option>
                    <option value="SK Kenaikan Pangkat / KGB">SK Kenaikan Pangkat / KGB</option>
                    <option value="Bukti Verval PTK / NUPTK">Bukti Verval PTK / NUPTK</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Pilih File dari Perangkat</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={handleAddSampleDocument}
                    className="w-full px-3 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    + Lampirkan Contoh PDF
                  </button>
                </div>
              </div>

              {dokumenList.length > 0 && (
                <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-lg">
                  {dokumenList.map((doc, i) => (
                    <div key={i} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{doc.namaFile}</p>
                          <p className="text-slate-500">
                            {doc.jenisDokumen} · {(doc.ukuranByte / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(i)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        title="Hapus dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => onNavigate('beranda')}
              className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>{submitting ? 'Mengirim Pengaduan...' : 'Kirim Laporan Pengaduan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

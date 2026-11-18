import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  PhoneCall,
  Mail,
  MessageCircle,
  CheckCircle2,
  FilePlus2,
  Search,
} from 'lucide-react';
import { MenuTab } from '../types.ts';

interface PanduanDanBantuanViewProps {
  mode: 'panduan_pengaduan' | 'pusat_bantuan';
  onNavigate: (tab: MenuTab) => void;
}

export const PanduanDanBantuanView: React.FC<PanduanDanBantuanViewProps> = ({
  mode,
  onNavigate,
}) => {
  const [selectedFaqIdx, setSelectedFaqIdx] = useState<number>(0);

  const faqs = [
    {
      q: 'Mengapa status Info GTK saya masih tertulis "Belum Valid (Kode 02)" padahal beban mengajar sudah 24 JP?',
      a: 'Kode 02 berarti data beban mengajar atau kelengkapan kepegawaian di Dapodik baru saja diperbarui oleh Operator Sekolah namun belum ditarik ke server pusat Puslapdik. Pastikan Operator Sekolah melakukan Sinkronisasi Dapodik, lalu ajukan tiket pengaduan dengan melampirkan SK Pembagian Tugas dan lembar Info GTK terbaru.',
    },
    {
      q: 'Bagaimana prosedur jika Nomor Registrasi Guru (NRG) lulusan PPG belum terbit?',
      a: 'Pilih kategori "Data NRG belum muncul" pada formulir pengaduan. Unggah scan Sertifikat Pendidik (Serdik) asli dari LPTK beserta bukti input Riwayat Sertifikasi pada aplikasi Dapodik sekolah. Admin Dinas akan memverifikasi dan meneruskan usulan penerbitan NRG ke sistem SIMTUN.',
    },
    {
      q: 'Apa yang harus dilakukan jika status tiket saya berubah menjadi "Menunggu Perbaikan Data"?',
      a: 'Buka menu Cek Status Pengaduan atau Riwayat Pengaduan, klik Nomor Tiket Anda, lalu baca catatan yang diberikan oleh Operator Sekolah atau Admin Dinas. Unggah dokumen revisi melalui bagian "Formulir Perbaikan Data / Unggah Dokumen Tambahan Guru" pada detail tiket tersebut.',
    },
    {
      q: 'Mengapa rekening penyaluran Tunjangan Profesi Guru (TPG) saya berstatus Belum Valid?',
      a: 'Umumnya terjadi karena perbedaan ejaan nama atau gelar akademik antara buku tabungan bank penyalur dengan data induk Dapodik. Unggah scan halaman depan buku tabungan dan Surat Keterangan Beda Nama dari bank penyalur agar Admin Dinas dapat melakukan validasi di aplikasi SIMBAR/SIMTUN.',
    },
    {
      q: 'Berapa lama waktu penyelesaian satu laporan pengaduan sertifikasi?',
      a: 'Pemeriksaan awal oleh Operator Sekolah membutuhkan 1 hari kerja, sedangkan verifikasi dan tindak lanjut oleh Admin Dinas Pendidikan berkisar antara 2 hingga 5 hari kerja tergantung jenis permasalahan dan jadwal penarikan data pusat.',
    },
  ];

  if (mode === 'panduan_pengaduan') {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-700">Pedoman Resmi Pelaporan</p>
              <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">
                Panduan Lengkap Pengaduan Sertifikasi Guru Belum Valid
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Ikuti tahapan berikut agar laporan kendala sertifikasi Anda dapat segera diverifikasi tanpa penolakan berkas.
              </p>
            </div>
            <button
              onClick={() => onNavigate('buat_pengaduan')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Mulai Buat Pengaduan</span>
            </button>
          </div>

          {/* Persyaratan Dokumen per Kategori */}
          <div className="space-y-4">
            <h2 className="text-base font-display font-bold text-slate-900">
              A. Daftar Dokumen Bukti Pendukung yang Wajib Disiapkan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {[
                {
                  title: '1. Kendala Status Info GTK & Beban Mengajar (JTM)',
                  docs: [
                    'Cetakan PDF Info GTK terbaru yang menampilkan rincian kode belum valid',
                    'SK Pembagian Tugas Mengajar semester berjalan yang ditandatangani Kepala Sekolah',
                    'Tangkapan layar rincian rombongan belajar pada aplikasi Dapodik',
                  ],
                },
                {
                  title: '2. Kendala Sertifikat Pendidik & Penerbitan NRG',
                  docs: [
                    'Scan asli Sertifikat Pendidik (Serdik) yang diterbitkan oleh LPTK Penyelenggara PPG',
                    'Bukti input Riwayat Sertifikasi dan Riwayat Pendidikan Formal pada Dapodik',
                    'Scan Ijazah S1/D4 linier dan KTP',
                  ],
                },
                {
                  title: '3. Kendala NUPTK & Identitas Kepegawaian (NIP/Pangkat/KGB)',
                  docs: [
                    'Bukti status Verval PTK (NUPTK) dari portal Pusdatin Kemendikdasmen',
                    'Scan SK Pengangkatan CPNS/PNS/PPPK atau SK Yayasan bagi Guru Tetap Yayasan',
                    'Scan SK Kenaikan Pangkat terakhir atau Surat Kenaikan Gaji Berkala (KGB)',
                  ],
                },
                {
                  title: '4. Kendala Rekening & Penyaluran Tunjangan Profesi (TPG)',
                  docs: [
                    'Scan halaman depan Buku Tabungan Bank Penyalur yang menampilkan Nomor Rekening aktif',
                    'Surat Keterangan Bank jika terdapat perbedaan ejaan gelar atau tanda baca nama',
                    'Cetakan SKTP (Surat Keputusan Tunjangan Profesi) jika sudah terbit',
                  ],
                },
              ].map((group) => (
                <div key={group.title} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900">{group.title}</h3>
                  <ul className="space-y-1.5 text-slate-700">
                    {group.docs.map((d) => (
                      <li key={d} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Ketentuan Teknis Unggah File */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h2 className="text-base font-display font-bold text-slate-900">
              B. Standar Operasional Verifikasi Berjenjang
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-mono font-bold text-emerald-700">Tahap 1 · Guru Pelapor</div>
                <p className="font-semibold text-slate-900 text-sm">Pengajuan & Bukti Digital</p>
                <p className="text-slate-600 leading-relaxed">
                  Pastikan hasil pindaian (scan) dokumen terbaca jelas, tidak buram, berformat PDF/JPG/PNG dengan ukuran maksimal 4 MB per file.
                </p>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-mono font-bold text-emerald-700">Tahap 2 · Operator Sekolah</div>
                <p className="font-semibold text-slate-900 text-sm">Pengecekan Sinkronisasi Dapodik</p>
                <p className="text-slate-600 leading-relaxed">
                  Operator Sekolah memeriksa apakah data di tingkat sekolah sudah sinkron, lalu memberikan rekomendasi kelengkapan ke Dinas Pendidikan.
                </p>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl space-y-1.5">
                <div className="font-mono font-bold text-emerald-700">Tahap 3 · Admin Dinas Pendidikan</div>
                <p className="font-semibold text-slate-900 text-sm">Validasi SIMTUN & SIMBAR</p>
                <p className="text-slate-600 leading-relaxed">
                  Admin Dinas memvalidasi laporan, melakukan pembaruan di SIMTUN/SIMBAR, dan mengubah status tiket menjadi Selesai.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-emerald-700">Layanan Konsultasi & Bantuan Teknis</p>
            <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">
              Pusat Bantuan Sertifikasi Pendidik (Helpdesk Dinas)
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Temukan jawaban atas pertanyaan umum seputar ketidakvalidan Info GTK atau hubungi tim verifikator kami.
            </p>
          </div>
          <button
            onClick={() => onNavigate('cek_status')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Cek Status Tiket</span>
          </button>
        </div>

        {/* Tanya Jawab (FAQ) Interaktif */}
        <div className="space-y-3">
          <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Pertanyaan yang Sering Diajukan (FAQ Sertifikasi Guru)</span>
          </h2>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            {faqs.map((item, idx) => {
              const isOpen = selectedFaqIdx === idx;
              return (
                <div key={idx} className="bg-white">
                  <button
                    type="button"
                    onClick={() => setSelectedFaqIdx(isOpen ? -1 : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                    <span className="text-xs font-mono font-bold text-emerald-700 shrink-0">
                      {isOpen ? 'Tutup' : 'Baca Solusi'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed bg-slate-50/60 border-t border-slate-100">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Kanal Kontak Resmi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Layanan GTK</span>
            </div>
            <p className="text-xs text-slate-600">
              Notifikasi otomatis & konsultasi jam kerja (Senin–Jumat, 08.00–16.00 WIB)
            </p>
            <p className="text-sm font-mono font-bold text-slate-900 pt-1">0811-2200-9910 (Simtun Disdik)</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Mail className="w-4 h-4 text-slate-700" />
              <span>Surat Elektronik Resmi</span>
            </div>
            <p className="text-xs text-slate-600">
              Pengiriman berkas kolektif dari Operator Sekolah tingkat Kecamatan/Kabupaten
            </p>
            <p className="text-sm font-mono font-bold text-slate-900 pt-1">sertifikasi.gtk@disdik.go.id</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <PhoneCall className="w-4 h-4 text-slate-700" />
              <span>Loket Pelayanan Terpadu</span>
            </div>
            <p className="text-xs text-slate-600">
              Bidang Pembinaan GTK Dinas Pendidikan, Gedung Pelayanan Publik Lt. 2
            </p>
            <p className="text-sm font-mono font-bold text-slate-900 pt-1">(022) 4264-8192</p>
          </div>
        </div>
      </div>
    </div>
  );
};

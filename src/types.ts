export type MenuTab =
  | 'beranda'
  | 'buat_pengaduan'
  | 'cek_status'
  | 'riwayat_pengaduan'
  | 'panduan_pengaduan'
  | 'pusat_bantuan'
  | 'login_admin'
  | 'dashboard';

export type UserRole = 'guru' | 'operator_sekolah' | 'admin_dinas';

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  nama: string;
  role: UserRole;
  npsn: string;
  nuptk: string;
  noHp: string;
  statusAktif: string;
  createdAt?: string;
}

export interface KategoriPengaduanItem {
  id: number;
  kodeKategori: string;
  namaKategori: string;
  deskripsi: string;
  estimasiHari: number;
}

export interface SekolahItem {
  id: number;
  npsn: string;
  namaSekolah: string;
  jenjang: string;
  kecamatan: string;
  kabupatenKota: string;
  alamat: string;
  operatorNama: string;
  operatorHp: string;
}

export interface DokumenItem {
  id: number;
  pengaduanId: number;
  namaFile: string;
  jenisDokumen: string;
  tipeFile: string;
  ukuranByte: number;
  fileUrl: string;
  statusValidasi: string;
  createdAt: string;
}

export interface RiwayatStatusItem {
  id: number;
  pengaduanId: number;
  statusSebelumnya: string;
  statusBaru: string;
  catatan: string;
  diubahOlehNama: string;
  diubahOlehRole: string;
  createdAt: string;
}

export interface TanggapanItem {
  id: number;
  pengaduanId: number;
  userId?: number;
  namaPengirim: string;
  peranPengirim: string;
  isiTanggapan: string;
  tindakLanjut: string;
  createdAt: string;
}

export interface PengaduanItem {
  id: number;
  nomorTiket: string;
  userId?: number;
  guruId?: number;
  sekolahId?: number;
  kategoriId?: number;
  namaLengkap: string;
  nuptk: string;
  nik: string;
  nip: string;
  namaSekolah: string;
  npsn: string;
  kecamatan: string;
  kabupatenKota: string;
  noHp: string;
  jenisPermasalahan: string;
  noSertifikatPendidik: string;
  tahunSertifikasi: string;
  deskripsiPermasalahan: string;
  status: string;
  alasanPenolakan: string;
  catatanOperator: string;
  rekomendasiOperator: string;
  catatanAdmin: string;
  tanggalTindakLanjut: string;
  periodeBulan: string;
  createdAt: string;
  updatedAt: string;
  dokumenList: DokumenItem[];
  riwayatList: RiwayatStatusItem[];
  tanggapanList: TanggapanItem[];
}

export interface NotifikasiItem {
  id: number;
  userId?: number;
  pengaduanId?: number;
  nomorTiket: string;
  judul: string;
  pesan: string;
  tipe: string;
  kanalIntegrasi: string;
  dibaca: string;
  createdAt: string;
}

export interface LogAktivitasItem {
  id: number;
  userId?: number;
  namaUser: string;
  roleUser: string;
  aksi: string;
  entitas: string;
  detail: string;
  ipAddress: string;
  createdAt: string;
}

export const DAFTAR_KATEGORI_PERMASALAHAN = [
  'Status sertifikasi belum valid',
  'Data sertifikat pendidik belum terbaca',
  'Data NUPTK tidak sesuai',
  'Data NRG belum muncul',
  'Data rekening belum valid',
  'Data beban mengajar bermasalah',
  'Data sekolah tidak sesuai',
  'Data kepegawaian tidak sesuai',
  'Data pembayaran tunjangan belum valid',
  'Permasalahan lainnya',
];

export const DAFTAR_STATUS_PENGADUAN = [
  'Menunggu Verifikasi',
  'Sedang Diverifikasi',
  'Dalam Proses Tindak Lanjut',
  'Menunggu Perbaikan Data',
  'Selesai',
  'Ditolak',
];

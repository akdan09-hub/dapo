import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Tabel users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID atau custom UID
  email: text('email').notNull(),
  nama: text('nama').notNull().default('Pengguna Baru'),
  passwordHash: text('password_hash').notNull().default(''),
  role: text('role').notNull().default('guru'), // 'guru' | 'operator_sekolah' | 'admin_dinas'
  npsn: text('npsn').default(''),
  nuptk: text('nuptk').default(''),
  noHp: text('no_hp').default(''),
  statusAktif: text('status_aktif').notNull().default('Aktif'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Tabel sekolah
export const sekolah = pgTable('sekolah', {
  id: serial('id').primaryKey(),
  npsn: text('npsn').notNull().unique(),
  namaSekolah: text('nama_sekolah').notNull(),
  jenjang: text('jenjang').notNull().default('SMA'),
  kecamatan: text('kecamatan').notNull(),
  kabupatenKota: text('kabupaten_kota').notNull(),
  alamat: text('alamat').default(''),
  operatorNama: text('operator_nama').default(''),
  operatorHp: text('operator_hp').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Tabel guru
export const guru = pgTable('guru', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  namaLengkap: text('nama_lengkap').notNull(),
  nuptk: text('nuptk').notNull(),
  nik: text('nik').default(''),
  nip: text('nip').default(''),
  noSertifikatPendidik: text('no_sertifikat_pendidik').default(''),
  tahunSertifikasi: text('tahun_sertifikasi').default(''),
  sekolahId: integer('sekolah_id').references(() => sekolah.id),
  npsn: text('npsn').notNull(),
  namaSekolah: text('nama_sekolah').notNull(),
  kecamatan: text('kecamatan').notNull(),
  kabupatenKota: text('kabupaten_kota').notNull(),
  noHp: text('no_hp').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Tabel kategori_pengaduan
export const kategoriPengaduan = pgTable('kategori_pengaduan', {
  id: serial('id').primaryKey(),
  kodeKategori: text('kode_kategori').notNull().unique(),
  namaKategori: text('nama_kategori').notNull(),
  deskripsi: text('deskripsi').notNull(),
  estimasiHari: integer('estimasi_hari').notNull().default(3),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Tabel pengaduan
export const pengaduan = pgTable('pengaduan', {
  id: serial('id').primaryKey(),
  nomorTiket: text('nomor_tiket').notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  guruId: integer('guru_id').references(() => guru.id),
  sekolahId: integer('sekolah_id').references(() => sekolah.id),
  kategoriId: integer('kategori_id').references(() => kategoriPengaduan.id),
  namaLengkap: text('nama_lengkap').notNull(),
  nuptk: text('nuptk').notNull(),
  nik: text('nik').default(''),
  nip: text('nip').default(''),
  namaSekolah: text('nama_sekolah').notNull(),
  npsn: text('npsn').notNull(),
  kecamatan: text('kecamatan').notNull(),
  kabupatenKota: text('kabupaten_kota').notNull(),
  noHp: text('no_hp').notNull(),
  jenisPermasalahan: text('jenis_permasalahan').notNull(),
  noSertifikatPendidik: text('no_sertifikat_pendidik').default(''),
  tahunSertifikasi: text('tahun_sertifikasi').default(''),
  deskripsiPermasalahan: text('deskripsi_permasalahan').notNull(),
  status: text('status').notNull().default('Menunggu Verifikasi'),
  // Pilihan status:
  // - Menunggu Verifikasi
  // - Sedang Diverifikasi
  // - Dalam Proses Tindak Lanjut
  // - Menunggu Perbaikan Data
  // - Selesai
  // - Ditolak
  alasanPenolakan: text('alasan_penolakan').default(''),
  catatanOperator: text('catatan_operator').default(''),
  rekomendasiOperator: text('rekomendasi_operator').default('Belum Diperiksa'),
  catatanAdmin: text('catatan_admin').default(''),
  tanggalTindakLanjut: text('tanggal_tindak_lanjut').default(''),
  periodeBulan: text('periode_bulan').notNull(), // Format YYYY-MM
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 6. Tabel dokumen_pengaduan
export const dokumenPengaduan = pgTable('dokumen_pengaduan', {
  id: serial('id').primaryKey(),
  pengaduanId: integer('pengaduan_id')
    .references(() => pengaduan.id)
    .notNull(),
  namaFile: text('nama_file').notNull(),
  jenisDokumen: text('jenis_dokumen').notNull(), // misal: Sertifikat Pendidik, SK Pembagian Tugas, Info GTK, Rekening Koran
  tipeFile: text('tipe_file').notNull(),
  ukuranByte: integer('ukuran_byte').notNull(),
  fileUrl: text('file_url').notNull(), // Data URI atau URL aman
  statusValidasi: text('status_validasi').notNull().default('Menunggu Pemeriksaan'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Tabel riwayat_status
export const riwayatStatus = pgTable('riwayat_status', {
  id: serial('id').primaryKey(),
  pengaduanId: integer('pengaduan_id')
    .references(() => pengaduan.id)
    .notNull(),
  statusSebelumnya: text('status_sebelumnya').notNull(),
  statusBaru: text('status_baru').notNull(),
  catatan: text('catatan').notNull(),
  diubahOlehNama: text('diubah_oleh_nama').notNull(),
  diubahOlehRole: text('diubah_oleh_role').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Tabel tanggapan_admin
export const tanggapanAdmin = pgTable('tanggapan_admin', {
  id: serial('id').primaryKey(),
  pengaduanId: integer('pengaduan_id')
    .references(() => pengaduan.id)
    .notNull(),
  userId: integer('user_id').references(() => users.id),
  namaPengirim: text('nama_pengirim').notNull(),
  peranPengirim: text('peran_pengirim').notNull(), // 'admin_dinas' | 'operator_sekolah' | 'guru'
  isiTanggapan: text('isi_tanggapan').notNull(),
  tindakLanjut: text('tindak_lanjut').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Tabel notifikasi
export const notifikasi = pgTable('notifikasi', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  pengaduanId: integer('pengaduan_id').references(() => pengaduan.id),
  nomorTiket: text('nomor_tiket').default(''),
  judul: text('judul').notNull(),
  pesan: text('pesan').notNull(),
  tipe: text('tipe').notNull().default('info'), // 'info' | 'success' | 'warning' | 'danger'
  kanalIntegrasi: text('kanal_integrasi').notNull().default('Dashboard & WhatsApp'),
  dibaca: text('dibaca').notNull().default('belum'), // 'belum' | 'sudah'
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Tabel log_aktivitas
export const logAktivitas = pgTable('log_aktivitas', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  namaUser: text('nama_user').notNull(),
  roleUser: text('role_user').notNull(),
  aksi: text('aksi').notNull(),
  entitas: text('entitas').notNull(),
  detail: text('detail').notNull(),
  ipAddress: text('ip_address').default('127.0.0.1'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relasi antar tabel
export const usersRelations = relations(users, ({ many }) => ({
  guruList: many(guru),
  pengaduanList: many(pengaduan),
  tanggapanList: many(tanggapanAdmin),
  notifikasiList: many(notifikasi),
  logList: many(logAktivitas),
}));

export const sekolahRelations = relations(sekolah, ({ many }) => ({
  guruList: many(guru),
  pengaduanList: many(pengaduan),
}));

export const guruRelations = relations(guru, ({ one, many }) => ({
  user: one(users, {
    fields: [guru.userId],
    references: [users.id],
  }),
  sekolah: one(sekolah, {
    fields: [guru.sekolahId],
    references: [sekolah.id],
  }),
  pengaduanList: many(pengaduan),
}));

export const kategoriPengaduanRelations = relations(kategoriPengaduan, ({ many }) => ({
  pengaduanList: many(pengaduan),
}));

export const pengaduanRelations = relations(pengaduan, ({ one, many }) => ({
  user: one(users, {
    fields: [pengaduan.userId],
    references: [users.id],
  }),
  guru: one(guru, {
    fields: [pengaduan.guruId],
    references: [guru.id],
  }),
  sekolah: one(sekolah, {
    fields: [pengaduan.sekolahId],
    references: [sekolah.id],
  }),
  kategori: one(kategoriPengaduan, {
    fields: [pengaduan.kategoriId],
    references: [kategoriPengaduan.id],
  }),
  dokumenList: many(dokumenPengaduan),
  riwayatList: many(riwayatStatus),
  tanggapanList: many(tanggapanAdmin),
  notifikasiList: many(notifikasi),
}));

export const dokumenPengaduanRelations = relations(dokumenPengaduan, ({ one }) => ({
  pengaduan: one(pengaduan, {
    fields: [dokumenPengaduan.pengaduanId],
    references: [pengaduan.id],
  }),
}));

export const riwayatStatusRelations = relations(riwayatStatus, ({ one }) => ({
  pengaduan: one(pengaduan, {
    fields: [riwayatStatus.pengaduanId],
    references: [pengaduan.id],
  }),
}));

export const tanggapanAdminRelations = relations(tanggapanAdmin, ({ one }) => ({
  pengaduan: one(pengaduan, {
    fields: [tanggapanAdmin.pengaduanId],
    references: [pengaduan.id],
  }),
  user: one(users, {
    fields: [tanggapanAdmin.userId],
    references: [users.id],
  }),
}));

export const notifikasiRelations = relations(notifikasi, ({ one }) => ({
  user: one(users, {
    fields: [notifikasi.userId],
    references: [users.id],
  }),
  pengaduan: one(pengaduan, {
    fields: [notifikasi.pengaduanId],
    references: [pengaduan.id],
  }),
}));

export const logAktivitasRelations = relations(logAktivitas, ({ one }) => ({
  user: one(users, {
    fields: [logAktivitas.userId],
    references: [users.id],
  }),
}));

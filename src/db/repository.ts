import { db } from './index.ts';
import {
  users,
  sekolah,
  guru,
  kategoriPengaduan,
  pengaduan,
  dokumenPengaduan,
  riwayatStatus,
  tanggapanAdmin,
  notifikasi,
  logAktivitas,
} from './schema.ts';
import { eq, desc, or, ilike } from 'drizzle-orm';
import { hashPassword } from '../middleware/auth.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  nama?: string,
  role?: string,
  npsn?: string,
  nuptk?: string,
  noHp?: string
) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid));
    if (existing.length > 0) {
      return existing[0];
    }

    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        nama: nama || email.split('@')[0] || 'Guru Sertifikasi',
        role: role || 'guru',
        npsn: npsn || '',
        nuptk: nuptk || '',
        noHp: noHp || '',
        passwordHash: hashPassword('admin26@'),
        statusAktif: 'Aktif',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Gagal menyinkronkan data pengguna.', { cause: error });
  }
}

export async function seedInitialDataIfEmpty() {
  try {
    const adminPassHash = hashPassword('admin26@');
    await db
      .update(users)
      .set({ passwordHash: adminPassHash, nama: 'M.AMRIANSYAH, AMa' })
      .where(eq(users.role, 'admin_dinas'));

    const existingCategories = await db.select().from(kategoriPengaduan);
    if (existingCategories.length > 0) {
      return;
    }

    // 1. Seed 10 Kategori Permasalahan
    await db
      .insert(kategoriPengaduan)
      .values([
        {
          kodeKategori: 'KAT-01',
          namaKategori: 'Status sertifikasi belum valid',
          deskripsi: 'Status validasi Info GTK menunjukkan kode belum valid meskipun data Dapodik sudah sinkron.',
          estimasiHari: 3,
        },
        {
          kodeKategori: 'KAT-02',
          namaKategori: 'Data sertifikat pendidik belum terbaca',
          deskripsi: 'Nomor sertifikat pendidik dari LPTK belum muncul atau belum terhubung pada pangkalan data.',
          estimasiHari: 4,
        },
        {
          kodeKategori: 'KAT-03',
          namaKategori: 'Data NUPTK tidak sesuai',
          deskripsi: 'Perbedaan penulisan nama, tanggal lahir, atau status NUPTK antara Verval PTK dan Serdik.',
          estimasiHari: 3,
        },
        {
          kodeKategori: 'KAT-04',
          namaKategori: 'Data NRG belum muncul',
          deskripsi: 'Nomor Registrasi Guru (NRG) lulusan PPG belum diterbitkan atau belum tampil di Info GTK.',
          estimasiHari: 5,
        },
        {
          kodeKategori: 'KAT-05',
          namaKategori: 'Data rekening belum valid',
          deskripsi: 'Rekening penyaluran TPG belum terverifikasi bank penyalur atau terdapat perbedaan nama rekening.',
          estimasiHari: 3,
        },
        {
          kodeKategori: 'KAT-06',
          namaKategori: 'Data beban mengajar bermasalah',
          deskripsi: 'Jumlah Jam Tatap Muka (JTM) linier kurang dari 24 jam atau rombel belum terhitung di Info GTK.',
          estimasiHari: 2,
        },
        {
          kodeKategori: 'KAT-07',
          namaKategori: 'Data sekolah tidak sesuai',
          deskripsi: 'Sekolah induk atau NPSN tempat bertugas di Dapodik belum sinkron dengan SK penugasan.',
          estimasiHari: 2,
        },
        {
          kodeKategori: 'KAT-08',
          namaKategori: 'Data kepegawaian tidak sesuai',
          deskripsi: 'Golongan/Pangkat, TMT Pengangkatan, atau Gaji Pokok berkala belum sesuai dengan BKN/SIMTUN.',
          estimasiHari: 4,
        },
        {
          kodeKategori: 'KAT-09',
          namaKategori: 'Data pembayaran tunjangan belum valid',
          deskripsi: 'SKTP sudah terbit namun penyaluran Tunjangan Profesi Guru (TPG) triwulan terkendala.',
          estimasiHari: 5,
        },
        {
          kodeKategori: 'KAT-10',
          namaKategori: 'Permasalahan lainnya',
          deskripsi: 'Kendala teknis atau administratif lainnya terkait pemberkasan sertifikasi pendidik.',
          estimasiHari: 3,
        },
      ]);

    // 2. Seed Master Sekolah
    await db
      .insert(sekolah)
      .values([
        {
          npsn: '20219231',
          namaSekolah: 'SMAN 1 Bandung',
          jenjang: 'SMA',
          kecamatan: 'Coblong',
          kabupatenKota: 'Kota Bandung',
          alamat: 'Jl. Ir. H. Juanda No.93, Lb. Siliwangi',
          operatorNama: 'Hendra Wijaya, S.Kom',
          operatorHp: '081223344551',
        },
        {
          npsn: '20219245',
          namaSekolah: 'SMAN 3 Bandung',
          jenjang: 'SMA',
          kecamatan: 'Sumur Bandung',
          kabupatenKota: 'Kota Bandung',
          alamat: 'Jl. Belitung No.8, Merdeka',
          operatorNama: 'Rina Marlina, A.Md',
          operatorHp: '081223344552',
        },
        {
          npsn: '20219310',
          namaSekolah: 'SMKN 4 Bandung',
          jenjang: 'SMK',
          kecamatan: 'Lengkong',
          kabupatenKota: 'Kota Bandung',
          alamat: 'Jl. Kliningan No.6, Buahbatu',
          operatorNama: 'Dedi Kurniawan, S.T',
          operatorHp: '081223344553',
        },
        {
          npsn: '20219108',
          namaSekolah: 'SMPN 2 Bandung',
          jenjang: 'SMP',
          kecamatan: 'Sumur Bandung',
          kabupatenKota: 'Kota Bandung',
          alamat: 'Jl. Sumatera No.42, Merdeka',
          operatorNama: 'Agus Supriyadi, S.Pd',
          operatorHp: '081223344554',
        },
        {
          npsn: '20245112',
          namaSekolah: 'SDN 015 Kresna Bandung',
          jenjang: 'SD',
          kecamatan: 'Cicendo',
          kabupatenKota: 'Kota Bandung',
          alamat: 'Jl. Kresna No.28, Arjuna',
          operatorNama: 'Taufik Hidayat, S.Kom',
          operatorHp: '081223344555',
        },
        {
          npsn: '20219884',
          namaSekolah: 'SMAN 8 Bandung',
          jenjang: 'SMA',
          kecamatan: 'Lengkong',
          kabupatenKota: 'Kota Bandung',
          alamat: 'Jl. Solontongan No.3, Turangga',
          operatorNama: 'Siti Nurhayati, S.Si',
          operatorHp: '081223344556',
        },
      ]);

    // 3. Seed Hanya Akun Sistem (Admin Dinas & Operator Sekolah), tanpa data guru dummy
    const defaultPassHash = hashPassword('admin26@');
    await db
      .insert(users)
      .values([
        {
          uid: 'role-admin-dinas-01',
          email: 'admin.sertifikasi@disdik.go.id',
          nama: 'M.AMRIANSYAH, AMa',
          passwordHash: defaultPassHash,
          role: 'admin_dinas',
          npsn: 'DINAS-001',
          nuptk: '-',
          noHp: '08112200991',
          statusAktif: 'Aktif',
        },
        {
          uid: 'role-operator-20219231',
          email: 'operator@sman1bandung.sch.id',
          nama: 'Operator Sekolah (SMAN 1 Bandung)',
          passwordHash: defaultPassHash,
          role: 'operator_sekolah',
          npsn: '20219231',
          nuptk: '-',
          noHp: '081223344551',
          statusAktif: 'Aktif',
        },
      ]);
  } catch (error) {
    console.error('Database seed check failed:', error);
  }
}

export async function getAllPengaduanWithDetails(filters?: {
  search?: string;
  status?: string;
  kecamatan?: string;
  npsn?: string;
  jenisPermasalahan?: string;
  periodeBulan?: string;
}) {
  try {
    await seedInitialDataIfEmpty();
    const allPengaduan = await db.select().from(pengaduan).orderBy(desc(pengaduan.createdAt));
    const allDokumen = await db.select().from(dokumenPengaduan).orderBy(desc(dokumenPengaduan.createdAt));
    const allRiwayat = await db.select().from(riwayatStatus).orderBy(desc(riwayatStatus.createdAt));
    const allTanggapan = await db.select().from(tanggapanAdmin).orderBy(desc(tanggapanAdmin.createdAt));

    let enriched = allPengaduan.map((item) => ({
      ...item,
      dokumenList: allDokumen.filter((d) => d.pengaduanId === item.id),
      riwayatList: allRiwayat.filter((r) => r.pengaduanId === item.id),
      tanggapanList: allTanggapan.filter((t) => t.pengaduanId === item.id),
    }));

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      enriched = enriched.filter(
        (p) =>
          p.nomorTiket.toLowerCase().includes(q) ||
          p.namaLengkap.toLowerCase().includes(q) ||
          p.nuptk.toLowerCase().includes(q) ||
          p.namaSekolah.toLowerCase().includes(q) ||
          p.npsn.toLowerCase().includes(q)
      );
    }

    if (filters?.status && filters.status !== 'Semua') {
      enriched = enriched.filter((p) => p.status === filters.status);
    }

    if (filters?.kecamatan && filters.kecamatan !== 'Semua') {
      enriched = enriched.filter((p) => p.kecamatan === filters.kecamatan);
    }

    if (filters?.npsn && filters.npsn.trim() !== '') {
      const targetNpsn = filters.npsn.trim();
      enriched = enriched.filter((p) => p.npsn === targetNpsn);
    }

    if (filters?.jenisPermasalahan && filters.jenisPermasalahan !== 'Semua') {
      enriched = enriched.filter((p) => p.jenisPermasalahan === filters.jenisPermasalahan);
    }

    if (filters?.periodeBulan && filters.periodeBulan !== 'Semua') {
      enriched = enriched.filter((p) => p.periodeBulan === filters.periodeBulan);
    }

    return enriched;
  } catch (error) {
    console.error('Database query failed in getAllPengaduanWithDetails:', error);
    throw new Error('Gagal mengambil data pengaduan dari database.', { cause: error });
  }
}

export async function getTicketByNomorOrNuptk(queryStr: string) {
  try {
    await seedInitialDataIfEmpty();
    const clean = queryStr.trim();
    const matches = await db
      .select()
      .from(pengaduan)
      .where(
        or(
          ilike(pengaduan.nomorTiket, `%${clean}%`),
          ilike(pengaduan.nuptk, `%${clean}%`),
          ilike(pengaduan.namaLengkap, `%${clean}%`)
        )
      )
      .orderBy(desc(pengaduan.createdAt));

    const allDokumen = await db.select().from(dokumenPengaduan);
    const allRiwayat = await db.select().from(riwayatStatus).orderBy(desc(riwayatStatus.createdAt));
    const allTanggapan = await db.select().from(tanggapanAdmin).orderBy(desc(tanggapanAdmin.createdAt));

    return matches.map((item) => ({
      ...item,
      dokumenList: allDokumen.filter((d) => d.pengaduanId === item.id),
      riwayatList: allRiwayat.filter((r) => r.pengaduanId === item.id),
      tanggapanList: allTanggapan.filter((t) => t.pengaduanId === item.id),
    }));
  } catch (error) {
    console.error('Database query failed in getTicketByNomorOrNuptk:', error);
    throw new Error('Gagal mencari tiket pengaduan.', { cause: error });
  }
}

export async function getMasterCatalog() {
  try {
    await seedInitialDataIfEmpty();
    const categories = await db.select().from(kategoriPengaduan);
    const schools = await db.select().from(sekolah);
    return { categories, schools };
  } catch (error) {
    console.error('Database query failed in getMasterCatalog:', error);
    throw new Error('Gagal memuat katalog kategori dan sekolah.', { cause: error });
  }
}

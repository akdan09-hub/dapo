import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  requireAuth,
  AuthRequest,
  createCustomToken,
} from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  getAllPengaduanWithDetails,
  getTicketByNomorOrNuptk,
  getMasterCatalog,
} from './src/db/repository.ts';
import {
  authenticateWithCredentials,
  registerUserAccount,
  createPengaduanRecord,
  updatePengaduanByAdminOrOperator,
  revisePengaduanByGuru,
  getAllUsersForAdmin,
  updateUserRoleOrStatus,
  getNotificationsAndLogs,
  markAllNotificationsRead,
  exportDatabaseBackupSnapshot,
  deletePengaduanById,
  deleteAllPengaduan,
  deleteUserById,
} from './src/db/mutations.ts';
import { dispatchMultiRoleWhatsAppNotification } from './src/services/whatsappService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Allow up to 15MB payload for PDF/image document uploads
  app.use(express.json({ limit: '15mb' }));

  // 1. Public Catalog & Initial Summary Endpoint
  app.get('/api/catalog', async (_req, res) => {
    try {
      const catalog = await getMasterCatalog();
      const allPengaduan = await getAllPengaduanWithDetails();
      res.json({
        categories: catalog.categories,
        schools: catalog.schools,
        publicStats: {
          total: allPengaduan.length,
          menunggu: allPengaduan.filter((p) => p.status === 'Menunggu Verifikasi').length,
          diproses: allPengaduan.filter(
            (p) => p.status === 'Sedang Diverifikasi' || p.status === 'Dalam Proses Tindak Lanjut'
          ).length,
          perbaikan: allPengaduan.filter((p) => p.status === 'Menunggu Perbaikan Data').length,
          selesai: allPengaduan.filter((p) => p.status === 'Selesai').length,
          ditolak: allPengaduan.filter((p) => p.status === 'Ditolak').length,
        },
      });
    } catch (error: any) {
      console.error('Error in GET /api/catalog:', error);
      res.status(500).json({ error: error.message || 'Gagal memuat katalog sistem' });
    }
  });

  // 2. Public Ticket & NUPTK Status Lookup
  app.get('/api/pengaduan/cek', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      if (!q) {
        return res.status(400).json({ error: 'Masukkan Nomor Tiket atau NUPTK terlebih dahulu.' });
      }
      const results = await getTicketByNomorOrNuptk(q);
      res.json({ results });
    } catch (error: any) {
      console.error('Error in GET /api/pengaduan/cek:', error);
      res.status(500).json({ error: error.message || 'Gagal mengecek status pengaduan' });
    }
  });

  // 3. Public / Authenticated Pengaduan List (supports filters)
  app.get('/api/pengaduan', async (req, res) => {
    try {
      const items = await getAllPengaduanWithDetails({
        search: req.query.search ? String(req.query.search) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        kecamatan: req.query.kecamatan ? String(req.query.kecamatan) : undefined,
        npsn: req.query.npsn ? String(req.query.npsn) : undefined,
        jenisPermasalahan: req.query.jenisPermasalahan
          ? String(req.query.jenisPermasalahan)
          : undefined,
        periodeBulan: req.query.periodeBulan ? String(req.query.periodeBulan) : undefined,
      });
      res.json({ items });
    } catch (error: any) {
      console.error('Error in GET /api/pengaduan:', error);
      res.status(500).json({ error: error.message || 'Gagal memuat daftar pengaduan' });
    }
  });

  // 4. Create New Pengaduan (Can be submitted by logged-in Guru or directly from form)
  app.post('/api/pengaduan', async (req, res) => {
    try {
      const body = req.body;
      if (!body.namaLengkap || !body.nuptk || !body.namaSekolah || !body.npsn || !body.deskripsiPermasalahan) {
        return res.status(400).json({
          error: 'Nama Lengkap, NUPTK, Nama Sekolah, NPSN, dan Deskripsi Permasalahan wajib diisi.',
        });
      }

      // Validate uploaded files if any
      if (Array.isArray(body.dokumenList)) {
        for (const doc of body.dokumenList) {
          if (doc.ukuranByte && doc.ukuranByte > 5 * 1024 * 1024) {
            return res.status(400).json({
              error: `Ukuran file ${doc.namaFile} melebihi batas maksimal 5 MB.`,
            });
          }
        }
      }

      const created = await createPengaduanRecord({
        userId: body.userId ? Number(body.userId) : undefined,
        namaLengkap: body.namaLengkap,
        nuptk: body.nuptk,
        nik: body.nik,
        nip: body.nip,
        namaSekolah: body.namaSekolah,
        npsn: body.npsn,
        kecamatan: body.kecamatan || 'Coblong',
        kabupatenKota: body.kabupatenKota || 'Kota Bandung',
        noHp: body.noHp || '-',
        jenisPermasalahan: body.jenisPermasalahan || 'Status sertifikasi belum valid',
        noSertifikatPendidik: body.noSertifikatPendidik,
        tahunSertifikasi: body.tahunSertifikasi,
        deskripsiPermasalahan: body.deskripsiPermasalahan,
        dokumenList: body.dokumenList,
      });

      res.status(201).json({ pengaduan: created });
    } catch (error: any) {
      console.error('Error in POST /api/pengaduan:', error);
      res.status(500).json({ error: error.message || 'Gagal mengirim laporan pengaduan' });
    }
  });

  // 5. Credential Login (Email & Password Hash or Quick Role Login)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      }
      const user = await authenticateWithCredentials(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Email atau kata sandi tidak sesuai.' });
      }
      if (user.statusAktif !== 'Aktif') {
        return res.status(403).json({ error: 'Akun Anda sedang dinonaktifkan oleh Admin Dinas.' });
      }

      const token = createCustomToken({
        uid: user.uid,
        email: user.email,
        nama: user.nama,
        role: user.role,
      });

      res.json({
        token,
        user: {
          id: user.id,
          uid: user.uid,
          email: user.email,
          nama: user.nama,
          role: user.role,
          npsn: user.npsn,
          nuptk: user.nuptk,
          noHp: user.noHp,
          statusAktif: user.statusAktif,
        },
      });
    } catch (error: any) {
      console.error('Error in POST /api/auth/login:', error);
      res.status(500).json({ error: error.message || 'Gagal melakukan proses login' });
    }
  });

  // 6. Account Registration (Guru / Operator)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, nama, role, npsn, nuptk, noHp } = req.body;
      if (!email || !password || !nama) {
        return res.status(400).json({ error: 'Nama lengkap, email, dan kata sandi wajib diisi.' });
      }
      const newUser = await registerUserAccount({
        email,
        passwordPlain: password,
        nama,
        role: role || 'guru',
        npsn,
        nuptk,
        noHp,
      });

      const token = createCustomToken({
        uid: newUser.uid,
        email: newUser.email,
        nama: newUser.nama,
        role: newUser.role,
      });

      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          uid: newUser.uid,
          email: newUser.email,
          nama: newUser.nama,
          role: newUser.role,
          npsn: newUser.npsn,
          nuptk: newUser.nuptk,
          noHp: newUser.noHp,
          statusAktif: newUser.statusAktif,
        },
      });
    } catch (error: any) {
      console.error('Error in POST /api/auth/register:', error);
      res.status(400).json({ error: error.message || 'Gagal mendaftarkan akun baru' });
    }
  });

  // 7. Sync Firebase Google Sign-In User with PostgreSQL
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@guru.belajar.id`;
      const nama = req.body.nama || req.user!.nama || email.split('@')[0];
      const requestedRole = req.body.role;

      const userRecord = await getOrCreateUser(uid, email, nama, requestedRole);
      res.json({
        user: {
          id: userRecord.id,
          uid: userRecord.uid,
          email: userRecord.email,
          nama: userRecord.nama,
          role: userRecord.role,
          npsn: userRecord.npsn,
          nuptk: userRecord.nuptk,
          noHp: userRecord.noHp,
          statusAktif: userRecord.statusAktif,
        },
      });
    } catch (error: any) {
      console.error('Error in POST /api/auth/sync:', error);
      res.status(500).json({ error: error.message || 'Gagal menyinkronkan profil pengguna' });
    }
  });

  // 8. Admin / Operator: Update Status, Validation, Notes, Recommendations
  app.patch('/api/pengaduan/:id/status', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await updatePengaduanByAdminOrOperator(id, {
        actorUserId: req.body.actorUserId ? Number(req.body.actorUserId) : undefined,
        actorNama: req.body.actorNama || req.user?.nama || 'Admin Dinas',
        actorRole: req.body.actorRole || req.user?.role || 'admin_dinas',
        status: req.body.status,
        alasanPenolakan: req.body.alasanPenolakan,
        catatanAdmin: req.body.catatanAdmin,
        catatanOperator: req.body.catatanOperator,
        rekomendasiOperator: req.body.rekomendasiOperator,
        tanggalTindakLanjut: req.body.tanggalTindakLanjut,
        isiTanggapan: req.body.isiTanggapan,
        statusValidasiDokumen: req.body.statusValidasiDokumen,
        kanalNotifikasi: req.body.kanalNotifikasi,
      });
      res.json({ pengaduan: updated });
    } catch (error: any) {
      console.error('Error in PATCH /api/pengaduan/:id/status:', error);
      res.status(500).json({ error: error.message || 'Gagal memperbarui pengaduan' });
    }
  });

  // 9. Guru: Revise / Fix Pengaduan & Re-upload Document
  app.patch('/api/pengaduan/:id/perbaikan', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await revisePengaduanByGuru(id, {
        actorUserId: req.body.actorUserId ? Number(req.body.actorUserId) : undefined,
        actorNama: req.body.actorNama || 'Guru Pelapor',
        deskripsiPermasalahan: req.body.deskripsiPermasalahan,
        noSertifikatPendidik: req.body.noSertifikatPendidik,
        tahunSertifikasi: req.body.tahunSertifikasi,
        catatanPerbaikan: req.body.catatanPerbaikan || 'Telah melengkapi dokumen perbaikan.',
        dokumenBaru: req.body.dokumenBaru,
      });
      res.json({ pengaduan: updated });
    } catch (error: any) {
      console.error('Error in PATCH /api/pengaduan/:id/perbaikan:', error);
      res.status(500).json({ error: error.message || 'Gagal mengirim perbaikan laporan' });
    }
  });

  // 10. Notifications & Activity Logs
  app.get('/api/notifikasi', async (_req, res) => {
    try {
      const data = await getNotificationsAndLogs();
      res.json(data);
    } catch (error: any) {
      console.error('Error in GET /api/notifikasi:', error);
      res.status(500).json({ error: error.message || 'Gagal memuat notifikasi' });
    }
  });

  app.post('/api/notifikasi/read-all', async (_req, res) => {
    try {
      const result = await markAllNotificationsRead();
      res.json(result);
    } catch (error: any) {
      console.error('Error in POST /api/notifikasi/read-all:', error);
      res.status(500).json({ error: error.message || 'Gagal memperbarui status notifikasi' });
    }
  });

  // 11. Admin User Management
  app.get('/api/users', requireAuth, async (_req: AuthRequest, res) => {
    try {
      const allUsers = await getAllUsersForAdmin();
      res.json({
        users: allUsers.map((u) => ({
          id: u.id,
          uid: u.uid,
          email: u.email,
          nama: u.nama,
          role: u.role,
          npsn: u.npsn,
          nuptk: u.nuptk,
          noHp: u.noHp,
          statusAktif: u.statusAktif,
          createdAt: u.createdAt,
        })),
      });
    } catch (error: any) {
      console.error('Error in GET /api/users:', error);
      res.status(500).json({ error: error.message || 'Gagal memuat daftar pengguna' });
    }
  });

  app.patch('/api/users/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const targetId = Number(req.params.id);
      const updated = await updateUserRoleOrStatus(targetId, {
        role: req.body.role,
        npsn: req.body.npsn,
        statusAktif: req.body.statusAktif,
        actorNama: req.user?.nama || 'Admin Dinas',
      });
      res.json({ user: updated });
    } catch (error: any) {
      console.error('Error in PATCH /api/users/:id:', error);
      res.status(500).json({ error: error.message || 'Gagal memperbarui pengguna' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const targetId = Number(req.params.id);
      const result = await deleteUserById(targetId, 'M.AMRIANSYAH, AMa');
      res.json(result);
    } catch (error: any) {
      console.error('Error in DELETE /api/users/:id:', error);
      res.status(400).json({ error: error.message || 'Gagal menghapus pengguna' });
    }
  });

  app.delete('/api/pengaduan/:id', async (req, res) => {
    try {
      const targetId = Number(req.params.id);
      const result = await deletePengaduanById(targetId, 'M.AMRIANSYAH, AMa');
      res.json(result);
    } catch (error: any) {
      console.error('Error in DELETE /api/pengaduan/:id:', error);
      res.status(400).json({ error: error.message || 'Gagal menghapus laporan pengaduan' });
    }
  });

  app.delete('/api/pengaduan', async (_req, res) => {
    try {
      const result = await deleteAllPengaduan('M.AMRIANSYAH, AMa');
      res.json(result);
    } catch (error: any) {
      console.error('Error in DELETE /api/pengaduan:', error);
      res.status(500).json({ error: error.message || 'Gagal menghapus seluruh pengaduan' });
    }
  });

  // 12. Admin Database Backup Snapshot
  app.get('/api/admin/backup', requireAuth, async (req: AuthRequest, res) => {
    try {
      const snapshot = await exportDatabaseBackupSnapshot(req.user?.nama || 'Admin Dinas');
      res.json(snapshot);
    } catch (error: any) {
      console.error('Error in GET /api/admin/backup:', error);
      res.status(500).json({ error: error.message || 'Gagal mengekspor cadangan database' });
    }
  });

  // 13. Real-Time WhatsApp API Broadcast Endpoint (Guru, Operator Sekolah, Admin Dinas)
  app.post('/api/whatsapp/send-realtime', async (req, res) => {
    try {
      const body = req.body;
      const result = await dispatchMultiRoleWhatsAppNotification({
        pengaduanId: Number(body.pengaduanId || 1),
        nomorTiket: body.nomorTiket || 'SRT-2026-TEST',
        eventType: 'MANUAL_TRIGGER',
        namaGuru: body.namaGuru || 'Guru Sertifikasi',
        noHpGuru: body.noHpGuru || '081321456789',
        namaSekolah: body.namaSekolah || 'SMAN 1 Bandung',
        npsn: body.npsn || '20219231',
        jenisPermasalahan: body.jenisPermasalahan || 'Status sertifikasi belum valid',
        statusBaru: body.statusBaru || 'Dalam Proses Tindak Lanjut',
        catatan:
          body.catatan ||
          'Pesan broadcast real-time melalui integrasi API WhatsApp ke Guru, Operator Sekolah, dan Admin Dinas.',
        actorNama: body.actorNama || 'Admin Dinas Pendidikan',
      });
      res.json({ broadcast: result });
    } catch (error: any) {
      console.error('Error in POST /api/whatsapp/send-realtime:', error);
      res.status(500).json({ error: error.message || 'Gagal mengirim notifikasi API WhatsApp' });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

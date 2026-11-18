import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PengaduanItem } from '../types.ts';

export type RekapType =
  | 'semua'
  | 'kecamatan'
  | 'sekolah'
  | 'kategori'
  | 'status'
  | 'bulanan_tahunan';

export function exportLaporanToExcel(
  items: PengaduanItem[],
  rekapType: RekapType,
  filterTitle = 'Seluruh Data Pengaduan'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Data Detail Pengaduan
  const detailRows = items.map((item, idx) => ({
    No: idx + 1,
    'Nomor Tiket': item.nomorTiket,
    'Tanggal Lapor': new Date(item.createdAt).toLocaleDateString('id-ID'),
    'Periode Bulan': item.periodeBulan,
    'Nama Lengkap Guru': item.namaLengkap,
    NUPTK: item.nuptk,
    NIK: item.nik || '-',
    NIP: item.nip || '-',
    'Nama Sekolah': item.namaSekolah,
    NPSN: item.npsn,
    Kecamatan: item.kecamatan,
    'Kabupaten/Kota': item.kabupatenKota,
    'No HP/WhatsApp': item.noHp,
    'Kategori Permasalahan': item.jenisPermasalahan,
    'No Sertifikat Pendidik': item.noSertifikatPendidik || '-',
    'Tahun Sertifikasi': item.tahunSertifikasi || '-',
    'Status Pengaduan': item.status,
    'Rekomendasi Operator': item.rekomendasiOperator || '-',
    'Catatan Operator': item.catatanOperator || '-',
    'Catatan Penyelesaian Admin': item.catatanAdmin || item.alasanPenolakan || '-',
    'Tanggal Tindak Lanjut': item.tanggalTindakLanjut || '-',
  }));

  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Daftar Pengaduan');

  // Sheet 2: Rekapitulasi Per Kecamatan
  const byKecamatan: Record<string, { total: number; selesai: number; proses: number; perbaikan: number; ditolak: number }> = {};
  for (const p of items) {
    if (!byKecamatan[p.kecamatan]) {
      byKecamatan[p.kecamatan] = { total: 0, selesai: 0, proses: 0, perbaikan: 0, ditolak: 0 };
    }
    byKecamatan[p.kecamatan].total++;
    if (p.status === 'Selesai') byKecamatan[p.kecamatan].selesai++;
    else if (p.status === 'Menunggu Perbaikan Data') byKecamatan[p.kecamatan].perbaikan++;
    else if (p.status === 'Ditolak') byKecamatan[p.kecamatan].ditolak++;
    else byKecamatan[p.kecamatan].proses++;
  }
  const kecRows = Object.entries(byKecamatan).map(([kec, st], i) => ({
    No: i + 1,
    Kecamatan: kec,
    'Total Pengaduan': st.total,
    'Sedang Diproses': st.proses,
    'Menunggu Perbaikan': st.perbaikan,
    Selesai: st.selesai,
    Ditolak: st.ditolak,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kecRows), 'Rekap Kecamatan');

  // Sheet 3: Rekapitulasi Per Sekolah
  const bySekolah: Record<string, { npsn: string; kecamatan: string; total: number; selesai: number; belumSelesai: number }> = {};
  for (const p of items) {
    if (!bySekolah[p.namaSekolah]) {
      bySekolah[p.namaSekolah] = { npsn: p.npsn, kecamatan: p.kecamatan, total: 0, selesai: 0, belumSelesai: 0 };
    }
    bySekolah[p.namaSekolah].total++;
    if (p.status === 'Selesai') bySekolah[p.namaSekolah].selesai++;
    else bySekolah[p.namaSekolah].belumSelesai++;
  }
  const sekRows = Object.entries(bySekolah).map(([sek, st], i) => ({
    No: i + 1,
    'Nama Sekolah': sek,
    NPSN: st.npsn,
    Kecamatan: st.kecamatan,
    'Total Laporan': st.total,
    Selesai: st.selesai,
    'Dalam Penanganan': st.belumSelesai,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sekRows), 'Rekap Sekolah');

  // Sheet 4: Rekapitulasi Kategori Masalah & Status
  const byKategori: Record<string, number> = {};
  for (const p of items) {
    byKategori[p.jenisPermasalahan] = (byKategori[p.jenisPermasalahan] || 0) + 1;
  }
  const katRows = Object.entries(byKategori).map(([kat, count], i) => ({
    No: i + 1,
    'Kategori Permasalahan Sertifikasi': kat,
    'Jumlah Kasus': count,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(katRows), 'Rekap Kategori');

  // Sheet 5: Rekapitulasi Bulanan & Tahunan
  const byBulan: Record<string, number> = {};
  for (const p of items) {
    byBulan[p.periodeBulan] = (byBulan[p.periodeBulan] || 0) + 1;
  }
  const bulanRows = Object.entries(byBulan).map(([bln, count], i) => ({
    No: i + 1,
    'Periode (Tahun-Bulan)': bln,
    'Jumlah Pengaduan': count,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bulanRows), 'Rekap Bulanan');

  const safeTitle = filterTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Laporan_Sertifikasi_Guru_${rekapType}_${safeTitle}.xlsx`);
}

export function exportLaporanToPDF(
  items: PengaduanItem[],
  rekapType: RekapType,
  filterTitle = 'Rekapitulasi Seluruh Pengaduan'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text('PORTAL PENGADUAN SERTIFIKASI GURU BELUM VALID', 14, 15);
  doc.setFontSize(10);
  doc.text(`Dinas Pendidikan — ${filterTitle} (Jenis: ${rekapType.toUpperCase()})`, 14, 21);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total Data: ${items.length} Laporan`, 14, 26);

  if (rekapType === 'kecamatan') {
    const grouped: Record<string, { total: number; proses: number; perbaikan: number; selesai: number; ditolak: number }> = {};
    for (const p of items) {
      if (!grouped[p.kecamatan]) {
        grouped[p.kecamatan] = { total: 0, proses: 0, perbaikan: 0, selesai: 0, ditolak: 0 };
      }
      grouped[p.kecamatan].total++;
      if (p.status === 'Selesai') grouped[p.kecamatan].selesai++;
      else if (p.status === 'Menunggu Perbaikan Data') grouped[p.kecamatan].perbaikan++;
      else if (p.status === 'Ditolak') grouped[p.kecamatan].ditolak++;
      else grouped[p.kecamatan].proses++;
    }
    autoTable(doc, {
      startY: 32,
      head: [['No', 'Kecamatan', 'Total Pengaduan', 'Diproses', 'Menunggu Perbaikan', 'Selesai', 'Ditolak']],
      body: Object.entries(grouped).map(([kec, st], idx) => [
        idx + 1,
        kec,
        st.total,
        st.proses,
        st.perbaikan,
        st.selesai,
        st.ditolak,
      ]),
      headStyles: { fillColor: [15, 23, 42] },
    });
  } else if (rekapType === 'sekolah') {
    const grouped: Record<string, { npsn: string; kecamatan: string; total: number; selesai: number }> = {};
    for (const p of items) {
      if (!grouped[p.namaSekolah]) {
        grouped[p.namaSekolah] = { npsn: p.npsn, kecamatan: p.kecamatan, total: 0, selesai: 0 };
      }
      grouped[p.namaSekolah].total++;
      if (p.status === 'Selesai') grouped[p.namaSekolah].selesai++;
    }
    autoTable(doc, {
      startY: 32,
      head: [['No', 'Nama Sekolah', 'NPSN', 'Kecamatan', 'Total Laporan', 'Selesai', 'Dalam Proses']],
      body: Object.entries(grouped).map(([sek, st], idx) => [
        idx + 1,
        sek,
        st.npsn,
        st.kecamatan,
        st.total,
        st.selesai,
        st.total - st.selesai,
      ]),
      headStyles: { fillColor: [15, 23, 42] },
    });
  } else if (rekapType === 'kategori') {
    const grouped: Record<string, { total: number; selesai: number }> = {};
    for (const p of items) {
      if (!grouped[p.jenisPermasalahan]) {
        grouped[p.jenisPermasalahan] = { total: 0, selesai: 0 };
      }
      grouped[p.jenisPermasalahan].total++;
      if (p.status === 'Selesai') grouped[p.jenisPermasalahan].selesai++;
    }
    autoTable(doc, {
      startY: 32,
      head: [['No', 'Kategori Permasalahan Sertifikasi', 'Jumlah Laporan', 'Selesai', 'Belum Selesai']],
      body: Object.entries(grouped).map(([kat, st], idx) => [
        idx + 1,
        kat,
        st.total,
        st.selesai,
        st.total - st.selesai,
      ]),
      headStyles: { fillColor: [15, 23, 42] },
    });
  } else {
    autoTable(doc, {
      startY: 32,
      head: [
        [
          'No',
          'No. Tiket',
          'Nama Guru',
          'NUPTK',
          'Sekolah (NPSN)',
          'Kecamatan',
          'Permasalahan',
          'Status',
          'Tindak Lanjut',
        ],
      ],
      body: items.map((p, idx) => [
        idx + 1,
        p.nomorTiket,
        p.namaLengkap,
        p.nuptk,
        `${p.namaSekolah} (${p.npsn})`,
        p.kecamatan,
        p.jenisPermasalahan,
        p.status,
        p.catatanAdmin || p.catatanOperator || '-',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
    });
  }

  doc.save(`Laporan_Pengaduan_Sertifikasi_${rekapType}.pdf`);
}

export function exportDetailPengaduanToPDF(ticket: PengaduanItem) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Kop Surat Dinas Pendidikan
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PORTAL PENGADUAN SERTIFIKASI GURU BELUM VALID', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'DINAS PENDIDIKAN — LEMBAR ARSIP RESMI DETAIL PENANGANAN PENGADUAN SERTIFIKASI PENDIDIK',
    14,
    19
  );
  doc.text(
    `Nomor Tiket: ${ticket.nomorTiket}   |   Status Saat Ini: ${ticket.status.toUpperCase()}   |   Periode: ${ticket.periodeBulan}`,
    14,
    25
  );

  // Box Ringkasan Tiket & Tanggal
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('I. IDENTITAS GURU PELAPOR & SATUAN PENDIDIKAN', 14, 41);

  autoTable(doc, {
    startY: 44,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [15, 23, 42] },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 45 },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 42 },
      3: { cellWidth: 45 },
    },
    body: [
      ['Nomor Tiket Resmi', ticket.nomorTiket, 'Tanggal Dilaporkan', new Date(ticket.createdAt).toLocaleString('id-ID')],
      ['Nama Lengkap Guru', ticket.namaLengkap, 'Status Pengaduan', ticket.status],
      ['NUPTK', ticket.nuptk || '-', 'NIK Kependudukan', ticket.nik || '-'],
      ['NIP ASN / PPPK', ticket.nip || '-', 'No. HP / WhatsApp', ticket.noHp || '-'],
      ['Nama Sekolah Induk', ticket.namaSekolah, 'NPSN Sekolah', ticket.npsn],
      ['Kecamatan', ticket.kecamatan, 'Kabupaten / Kota', ticket.kabupatenKota],
    ],
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;

  // Bagian II: Rincian Permasalahan Sertifikasi & Hasil Verifikasi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('II. RINCIAN PERMASALAHAN SERTIFIKASI & VERIFIKASI INSTANSI', 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [15, 23, 42] },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 48 },
      1: { cellWidth: 134 },
    },
    body: [
      ['Kategori Permasalahan', ticket.jenisPermasalahan],
      [
        'No. Sertifikat Pendidik / Tahun',
        `${ticket.noSertifikatPendidik || '-'}   (Tahun Sertifikasi: ${ticket.tahunSertifikasi || '-'})`,
      ],
      ['Deskripsi Kronologi Guru', ticket.deskripsiPermasalahan || '-'],
      ['Rekomendasi Operator Sekolah', ticket.rekomendasiOperator || 'Belum Diperiksa'],
      ['Catatan Operator Sekolah', ticket.catatanOperator || '-'],
      [
        'Catatan Penyelesaian Admin Dinas',
        ticket.catatanAdmin || ticket.alasanPenolakan || 'Menunggu catatan tindak lanjut Admin Dinas',
      ],
      ['Tanggal Tindak Lanjut Dinas', ticket.tanggalTindakLanjut || '-'],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Bagian III: Daftar Dokumen Bukti Pendukung
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    `III. DAFTAR DOKUMEN BUKTI PENDUKUNG (${ticket.dokumenList?.length || 0} BERKAS)`,
    14,
    currentY
  );

  const docRows =
    ticket.dokumenList && ticket.dokumenList.length > 0
      ? ticket.dokumenList.map((d, i) => [
          i + 1,
          d.namaFile,
          d.jenisDokumen,
          `${(d.ukuranByte / 1024).toFixed(1)} KB`,
          d.statusValidasi,
          new Date(d.createdAt).toLocaleDateString('id-ID'),
        ])
      : [['-', 'Belum ada dokumen bukti pendukung yang dilampirkan', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: currentY + 3,
    head: [['No', 'Nama File Dokumen', 'Jenis Dokumen', 'Ukuran', 'Status Validasi', 'Tgl Unggah']],
    body: docRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check if near bottom of page before rendering Section IV
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 20;
  }

  // Bagian IV: Riwayat Perubahan Status & Log Penanganan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    `IV. RIWAYAT PERUBAHAN STATUS & PENANGANAN (${ticket.riwayatList?.length || 0} LOG)`,
    14,
    currentY
  );

  const riwayatRows =
    ticket.riwayatList && ticket.riwayatList.length > 0
      ? ticket.riwayatList.map((r, i) => [
          i + 1,
          new Date(r.createdAt).toLocaleString('id-ID'),
          `${r.statusSebelumnya} -> ${r.statusBaru}`,
          `${r.diubahOlehNama} (${r.diubahOlehRole})`,
          r.catatan,
        ])
      : [['-', '-', 'Menunggu Verifikasi', 'Sistem Portal', 'Laporan terdaftar']];

  autoTable(doc, {
    startY: currentY + 3,
    head: [['No', 'Waktu Perubahan', 'Transisi Status', 'Petugas / Pelapor', 'Catatan Penanganan']],
    body: riwayatRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255] }, // Emerald-600
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Bagian V: Diskusi & Tanggapan Resmi (Jika ada)
  if (ticket.tanggapanList && ticket.tanggapanList.length > 0) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(
      `V. ARSIP KOMUNIKASI & TANGGAPAN RESMI (${ticket.tanggapanList.length} PESAN)`,
      14,
      currentY
    );

    autoTable(doc, {
      startY: currentY + 3,
      head: [['No', 'Tanggal', 'Pengirim & Peran', 'Isi Tanggapan / Instruksi', 'Tindak Lanjut']],
      body: ticket.tanggapanList.map((t, idx) => [
        idx + 1,
        new Date(t.createdAt).toLocaleString('id-ID'),
        `${t.namaPengirim} (${t.peranPengirim})`,
        t.isiTanggapan,
        t.tindakLanjut || '-',
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  } else {
    currentY += 4;
  }

  // Blok Pengesahan / Tanda Tangan Arsip Digital
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 25;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY, pageWidth - 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Dokumen Arsip Digital ini dicetak otomatis dari Portal Pengaduan Sertifikasi Guru Belum Valid pada ${new Date().toLocaleString('id-ID')}.`,
    14,
    currentY + 6
  );
  doc.text(
    `Kode Verifikasi Arsip: ARCHIVE-${ticket.nomorTiket}-${ticket.id}   |   Dokumen sah sebagai bukti pelaporan dan verifikasi elektronik.`,
    14,
    currentY + 11
  );

  const safeName = ticket.namaLengkap.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Arsip_Pengaduan_${ticket.nomorTiket}_${safeName}.pdf`);
}


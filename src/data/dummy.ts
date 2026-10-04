/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Project, Task, Comment, ActivityLog, Notification, NotificationSettings, TaskReminderRule } from '../types';
import { formatDate } from '../utils/dateFormat';

import avatarHafidz from '../assets/avatar-hafidz.png';
import avatarAditya from '../assets/avatar-aditya.png';
import avatarAmir from '../assets/avatar-amir.png';
import avatarHamzah from '../assets/avatar-hamzah.png';

export const DUMMY_USERS: User[] = [
  {
    id: 'USR01',
    name: 'Hafidz Ardis S.',
    username: 'hafidzardis',
    email: 'hafidz.ardis@morkhestudio.com',
    avatar: avatarHafidz,
    role: 'PM',
    position: 'Founder & CEO',
    overloadLimit: 2
  },
  {
    id: 'USR02',
    name: 'Aditya Nur Wahyana',
    username: 'aditya.nur.wahyana',
    email: 'aditya.creative@morkhestudio.com',
    avatar: avatarAditya,
    role: 'Staff',
    position: 'Graphic Designer',
    overloadLimit: 4
  },
  {
    id: 'USR03',
    name: 'Amir Salim',
    username: 'amir.salim',
    email: 'amir.media@morkhestudio.com',
    avatar: avatarAmir,
    role: 'Staff',
    position: 'Videographer',
    overloadLimit: 2
  },
  {
    id: 'USR04',
    name: 'Hamzah Ali Umar',
    username: 'hamzah.ali.umar',
    email: 'hamzah.ux@morkhestudio.com',
    avatar: avatarHamzah,
    role: 'Staff',
    position: 'Photographer',
    overloadLimit: 3
  }
];

export interface UserCredential {
  userId: string;
  email: string;
  password: string;
}

export const DUMMY_CREDENTIALS: UserCredential[] = [
  {
    userId: 'USR01',
    email: 'hafidz.ardis@morkhestudio.com',
    password: 'hafidz123'
  },
  {
    userId: 'USR02',
    email: 'aditya.creative@morkhestudio.com',
    password: 'aditya123'
  },
  {
    userId: 'USR03',
    email: 'amir.media@morkhestudio.com',
    password: 'amir123'
  },
  {
    userId: 'USR04',
    email: 'hamzah.ux@morkhestudio.com',
    password: 'hamzah123'
  }
];

export const DUMMY_PROJECTS: Project[] = [
  {
    id: 'PRJ01',
    code: 'PRJ-1',
    name: 'Brand Identity Kopi Selasar',
    description: 'Mengembangkan panduan identitas brand lengkap, aset logo, desain kemasan, dan panduan brand media sosial untuk kedai kopi Kopi Selasar Bandung.',
    status: 'Ongoing',
    client: 'Kopi Selasar Indonesia',
    managerId: 'USR01',
    startDate: '2026-06-15',
    endDate: '2026-07-20',
    progress: 65,
    memberIds: ['USR02'],
    attachments: [
      {
        id: 'patt-1',
        type: 'file',
        name: 'Brief_Awal_Klien_Kopi_Selasar.pdf',
        size: '3.4 MB',
        addedBy: 'USR01',
        addedByName: 'Hafidz Ardis S.',
        addedByRole: 'PM',
        createdAt: '2026-06-15T09:00:00Z'
      },
      {
        id: 'patt-2',
        type: 'file',
        name: 'Kontrak_Kerja_Sama_Morkhe_Selasar.pdf',
        size: '1.8 MB',
        addedBy: 'USR01',
        addedByName: 'Hafidz Ardis S.',
        addedByRole: 'PM',
        createdAt: '2026-06-15T09:30:00Z'
      },
      {
        id: 'patt-3',
        type: 'link',
        name: 'Moodboard Referensi Umum & Konsep Visual',
        url: 'https://pinterest.com/morkhestudio/kopi-selasar-moodboard',
        addedBy: 'USR01',
        addedByName: 'Hafidz Ardis S.',
        addedByRole: 'PM',
        createdAt: '2026-06-16T10:00:00Z'
      }
    ]
  },
  {
    id: 'PRJ02',
    code: 'PRJ-2',
    name: 'Kampanye Promosi FIKOM Unpad',
    description: 'Membuat iklan video berkualitas produksi tinggi, pamflet media sosial, dan desain landing page digital untuk mempromosikan Fakultas Ilmu Komunikasi Universitas Padjadjaran.',
    status: 'Ongoing',
    client: 'Universitas Padjadjaran',
    managerId: 'USR01',
    startDate: '2026-07-01',
    endDate: '2026-08-01',
    progress: 30,
    memberIds: ['USR03', 'USR04'],
    attachments: []
  },
  {
    id: 'PRJ03',
    code: 'PRJ-3',
    name: 'Redesain Website Internal Morkhē Studio',
    description: 'Proyek internal untuk merombak situs web portofolio agensi Morkhē Studio guna menarik klien desain internasional, menonjolkan tata letak bento grid dan animasi kaya.',
    status: 'Planning',
    client: 'Internal Morkhē Studio',
    managerId: 'USR01',
    startDate: '2026-07-10',
    endDate: '2026-08-30',
    progress: 10,
    memberIds: ['USR01', 'USR04'],
    attachments: [
      {
        id: 'patt-6',
        type: 'file',
        name: 'Dokumen_Scope_Website_Internal.docx',
        size: '1.1 MB',
        addedBy: 'USR01',
        addedByName: 'Hafidz Ardis S.',
        addedByRole: 'PM',
        createdAt: '2026-07-10T10:00:00Z'
      }
    ]
  },
  {
    id: 'PRJ04',
    code: 'PRJ-4',
    name: 'Media Pack Bandung Art Festival',
    description: 'Mendesain grafis lingkungan, spanduk jalanan, tiket, buklet, dan promosi digital dinamis untuk festival tahunan Bandung Art Festival.',
    status: 'Review',
    client: 'Dinas Kebudayaan Bandung',
    managerId: 'USR01',
    startDate: '2026-06-01',
    endDate: '2026-07-12',
    progress: 90,
    memberIds: ['USR02', 'USR04'],
    attachments: [
      {
        id: 'patt-7',
        type: 'file',
        name: 'Surat_Tugas_Dinas_Kebudayaan.pdf',
        size: '2.8 MB',
        addedBy: 'USR01',
        addedByName: 'Hafidz Ardis S.',
        addedByRole: 'PM',
        createdAt: '2026-06-01T09:00:00Z'
      }
    ]
  }
];

export const DUMMY_TASKS: Task[] = [
  // --- Aditya's Tasks (PRJ01 and PRJ04 only): 4 Active, 1 Done ---
  {
    id: 'TSK01',
    code: 'TGS-1',
    projectId: 'PRJ01',
    title: 'Finalisasi Logo Mockup & Panduan Kemasan',
    description: 'Menyelesaikan mockup kantong kertas biji kopi, sleeve cangkir, dan presentasi skema warna keseluruhan untuk persetujuan klien.',
    status: 'review',
    priority: 'High',
    assigneeId: 'USR02', // Aditya (Active 1/4)
    assigneeIds: ['USR02'],
    assignedBy: 'USR01',
    startDate: '2026-06-25',
    deadline: '2026-07-07',
    subtasks: [
      { id: 'sub-1', title: 'Siapkan file mockup resolusi tinggi', isCompleted: true },
      { id: 'sub-2', title: 'Susun pola dimensi kantong kopi', isCompleted: true },
      { id: 'sub-3', title: 'Buat draf panduan kemasan PDF', isCompleted: false }
    ],
    attachments: [
      {
        id: 'att-1',
        type: 'file',
        name: 'Brief_Awal_Kopi_Selasar.pdf',
        size: '2.4 MB',
        addedBy: 'USR01',
        addedByName: 'Hafidz Ardis S.',
        addedByRole: 'PM',
        createdAt: '2026-07-02T10:00:00Z'
      },
      {
        id: 'att-2',
        type: 'link',
        name: 'Referensi Figma Brand Kit',
        url: 'https://figma.com/@morkhe/brand-kit',
        addedBy: 'USR02',
        addedByName: 'Aditya Nur Wahyana',
        addedByRole: 'Staff',
        createdAt: '2026-07-03T11:15:00Z'
      }
    ]
  },
  {
    id: 'TSK02',
    code: 'TGS-2',
    projectId: 'PRJ01',
    title: 'Audit Branding Kompetitor & Moodboard',
    description: 'Memeriksa arah desain jaringan kedai kopi hipster lokal dan nasional utama di Bandung (Selasar, Djurnal, Sejiwa).',
    status: 'in_progress',
    priority: 'Low',
    assigneeId: 'USR02', // Aditya (Active 2/4)
    assigneeIds: ['USR02'],
    assignedBy: 'USR02',
    startDate: '2026-06-18',
    deadline: '2026-07-15',
    subtasks: [
      { id: 'sub-13', title: 'Kunjungi gerai Kopi Selasar untuk merasakan desain tata ruang', isCompleted: true },
      { id: 'sub-14', title: 'Susun papan moodboard di Pinterest/Dribbble', isCompleted: true }
    ]
  },
  {
    id: 'TSK03',
    code: 'TGS-3',
    projectId: 'PRJ04',
    title: 'Validasi File Produksi Cetak',
    description: 'Melakukan pemeriksaan pre-flight pada file, mengubah teks menjadi outline, memeriksa ulang konversi CMYK dan bleed untuk poster jalanan Bandung Art Festival.',
    status: 'review',
    priority: 'Medium',
    assigneeId: 'USR02', // Aditya (Active 3/4)
    assigneeIds: ['USR02'],
    assignedBy: 'USR01',
    startDate: '2026-07-04',
    deadline: '2026-07-10',
    subtasks: [
      { id: 'sub-11', title: 'Periksa semua gambar raster tertaut beresolusi 300dpi', isCompleted: true },
      { id: 'sub-12', title: 'Sematkan tanda air Logo Kebudayaan Bandung', isCompleted: true }
    ]
  },
  {
    id: 'TSK05',
    code: 'TGS-5',
    projectId: 'PRJ01',
    title: 'Pemilihan Palet Warna & Tipografi',
    description: 'Menentukan hierarki tipografi (serif vs sans-serif) dan palet warna earth-tone hangat yang mewakili kopi warisan lokal Indonesia.',
    status: 'done',
    priority: 'Medium',
    assigneeId: 'USR02', // Aditya (Completed)
    assigneeIds: ['USR02'],
    assignedBy: 'USR01',
    startDate: '2026-06-15',
    deadline: '2026-06-28',
    subtasks: [
      { id: 'sub-4', title: 'Riset inspirasi tipografi', isCompleted: true },
      { id: 'sub-5', title: 'Buat 3 konfigurasi kontras warna', isCompleted: true }
    ]
  },

  // --- Hafidz PM's Tasks (PRJ03): 1 Active, 1 Done ---
  {
    id: 'TSK06',
    code: 'TGS-6',
    projectId: 'PRJ03',
    title: 'Review Arsitektur Informasi & Wireframe Web Studio',
    description: 'Meninjau struktur halaman portofolio bento grid agensi dan alur konversi calon klien internasional.',
    status: 'in_progress',
    priority: 'High',
    assigneeId: 'USR01', // Hafidz (Active 1/1)
    assigneeIds: ['USR01'],
    assignedBy: 'USR01',
    startDate: '2026-07-01',
    deadline: '2026-07-25',
    subtasks: [
      { id: 'sub-61', title: 'Review sitemap dan alur halaman utama', isCompleted: true },
      { id: 'sub-62', title: 'Validasi form inquiry klien internasional', isCompleted: false }
    ]
  },
  {
    id: 'TSK07',
    code: 'TGS-7',
    projectId: 'PRJ03',
    title: 'Penyusunan Kontrak Kerja Sama & Scope Web',
    description: 'Menyusun ruang lingkup pengerjaan internal dan alokasi sumber daya teknis perombakan situs studio.',
    status: 'done',
    priority: 'Low',
    assigneeId: 'USR01', // Hafidz (Completed)
    assigneeIds: ['USR01'],
    assignedBy: 'USR01',
    startDate: '2026-06-20',
    deadline: '2026-07-02',
    subtasks: [
      { id: 'sub-71', title: 'Finalisasi timeline dan milestone proyek', isCompleted: true }
    ]
  },

  // --- Hamzah's Tasks (PRJ02, PRJ03, PRJ04): 5 Active, 1 Canceled ---
  {
    id: 'TSK08',
    code: 'TGS-8',
    projectId: 'PRJ02',
    title: 'Desain UI untuk Landing Page Promosi',
    description: 'Mendesain wireframe interaktif high-fidelity dan struktur bento di Figma untuk portal promosi FIKOM Unpad.',
    status: 'todo',
    priority: 'High',
    assigneeId: 'USR04', // Hamzah (Active 1/5)
    assigneeIds: ['USR04'],
    assignedBy: 'USR01',
    startDate: '2026-07-01',
    deadline: '2026-07-09',
    subtasks: [
      { id: 'sub-9', title: 'Desain wireframe bagian hero', isCompleted: false },
      { id: 'sub-10', title: 'Desain formulir pendaftaran mahasiswa baru', isCompleted: false }
    ]
  },
  {
    id: 'TSK09',
    code: 'TGS-9',
    projectId: 'PRJ02',
    title: 'Fotografi Fasilitas & Kampus Jatinangor',
    description: 'Sesi pemotretan langsung fasilitas laboratorium multimedia, perpustakaan, dan area terbuka hijau kampus FIKOM Unpad.',
    status: 'in_progress',
    priority: 'Critical',
    assigneeId: 'USR04', // Hamzah (Active 2/5)
    assigneeIds: ['USR04'],
    assignedBy: 'USR01',
    startDate: '2026-07-02',
    deadline: '2026-07-08',
    subtasks: [
      { id: 'sub-91', title: 'Briefing lokasi dengan humas kampus', isCompleted: true },
      { id: 'sub-92', title: 'Pengambilan foto studio radio & TV', isCompleted: false }
    ]
  },
  {
    id: 'TSK10',
    code: 'TGS-10',
    projectId: 'PRJ02',
    title: 'Editing & Color Grading Foto Promosi',
    description: 'Kurasi 50 foto terbaik dan penyesuaian mood warna sesuai palet brand visual FIKOM Unpad.',
    status: 'todo',
    priority: 'Medium',
    assigneeId: 'USR04', // Hamzah (Active 3/5)
    assigneeIds: ['USR04'],
    assignedBy: 'USR01',
    startDate: '2026-07-05',
    deadline: '2026-07-16',
    subtasks: [
      { id: 'sub-101', title: 'Sortir foto RAW hasil sesi fotografi', isCompleted: false },
      { id: 'sub-102', title: 'Export JPG resolusi web & cetak', isCompleted: false }
    ]
  },
  {
    id: 'TSK11',
    code: 'TGS-11',
    projectId: 'PRJ03',
    title: 'Pengembangan Desain Bento Grid Web Agensi',
    description: 'Merancang modul kartu interaktif bento grid showcase proyek pilihan untuk portofolio Morkhē Studio.',
    status: 'in_progress',
    priority: 'High',
    assigneeId: 'USR04', // Hamzah (Active 4/5)
    assigneeIds: ['USR04'],
    assignedBy: 'USR01',
    startDate: '2026-07-03',
    deadline: '2026-07-22',
    subtasks: [
      { id: 'sub-111', title: 'Eksplorasi layout kartu interaktif', isCompleted: true },
      { id: 'sub-112', title: 'Prototipe mikro-interaksi hover di Figma', isCompleted: false }
    ]
  },
  {
    id: 'TSK12',
    code: 'TGS-12',
    projectId: 'PRJ04',
    title: 'Dokumentasi Foto Aset Media Pack Festival',
    description: 'Menyiapkan bank foto beresolusi tinggi karya seniman dan panggung festival untuk kebutuhan siaran pers media.',
    status: 'in_progress',
    priority: 'Medium',
    assigneeId: 'USR04', // Hamzah & Aditya (Active)
    assigneeIds: ['USR04', 'USR02'],
    assignedBy: 'USR01',
    startDate: '2026-07-01',
    deadline: '2026-07-11',
    subtasks: [
      { id: 'sub-121', title: 'Katalogisasi foto galeri seni', isCompleted: true },
      { id: 'sub-122', title: 'Pemberian metadata dan caption rilis pers', isCompleted: true }
    ]
  },
  {
    id: 'TSK15',
    code: 'TGS-15',
    projectId: 'PRJ03',
    title: 'Eksperimen Animasi 3D WebGL Web Studio',
    description: 'Pengembangan dihentikan sementara oleh PM karena optimasi kinerja perangkat seluler belum optimal dan prioritas dialihkan ke peluncuran proyek klien.',
    status: 'canceled_on_hold',
    priority: 'Low',
    assigneeId: 'USR04', // Hamzah (Canceled)
    assigneeIds: ['USR04'],
    assignedBy: 'USR01',
    startDate: '2026-07-02',
    deadline: '2026-07-20',
    subtasks: [
      { id: 'sub-15', title: 'Riset pustaka Three.js vs React Three Fiber', isCompleted: true },
      { id: 'sub-16', title: 'Uji performa FPS pada ponsel spesifikasi menengah', isCompleted: false }
    ]
  },

  // --- Amir's Tasks (PRJ02): 0 Active, 1 Done, 1 Canceled ---
  {
    id: 'TSK13',
    code: 'TGS-13',
    projectId: 'PRJ02',
    title: 'Penulisan Naskah & Storyboard Video Iklan',
    description: 'Membuat draf skenario video iklan yang menyoroti gaya hidup mahasiswa Unpad Jatinangor dan lingkungan akademis.',
    status: 'done',
    priority: 'Critical',
    assigneeId: 'USR03', // Amir (Completed)
    assigneeIds: ['USR03'],
    assignedBy: 'USR01',
    startDate: '2026-06-22',
    deadline: '2026-07-04',
    subtasks: [
      { id: 'sub-6', title: 'Lakukan wawancara dengan alumni Unpad', isCompleted: true },
      { id: 'sub-7', title: 'Buat draf sketsa storyboard visual', isCompleted: true },
      { id: 'sub-8', title: 'Tulis narasi dan pengisi suara latar', isCompleted: true }
    ]
  },
  {
    id: 'TSK14',
    code: 'TGS-14',
    projectId: 'PRJ02',
    title: 'Produksi Merchandise Cetak Kaos & Topi',
    description: 'Dibatalkan oleh pihak klien FIKOM Unpad setelah penyesuaian anggaran dan perubahan fokus strategi ke media promosi digital sepenuhnya.',
    status: 'canceled_on_hold',
    priority: 'Medium',
    assigneeId: 'USR03', // Amir (Canceled)
    assigneeIds: ['USR03'],
    assignedBy: 'USR01',
    startDate: '2026-06-29',
    deadline: '2026-07-18',
    subtasks: [
      { id: 'sub-17', title: 'Minta penawaran harga vendor konveksi lokal', isCompleted: true }
    ]
  }
];

export const DUMMY_COMMENTS: Comment[] = [
  {
    id: 'PCOM01',
    projectId: 'PRJ01',
    authorId: 'USR01',
    authorName: 'Hafidz Ardis S.',
    authorAvatar: avatarHafidz,
    authorRole: 'PM',
    content: 'Pihak manajemen Kopi Selasar telah menyetujui ringkasan brief dan moodboard awal. Mohon tim fokus pada penyelesaian aset brand identity sesuai jadwal.',
    createdAt: '2026-06-16T10:30:00Z'
  },
  {
    id: 'PCOM02',
    projectId: 'PRJ01',
    authorId: 'USR02',
    authorName: 'Aditya Nur Wahyana',
    authorAvatar: avatarAditya,
    authorRole: 'Staff',
    content: 'Siap mas @hafidzardis, dokumen kontrak dan moodboard sudah kami pelajari. Draft konsep kemasan akan kami update di Kanban secara berkala.',
    createdAt: '2026-06-16T14:15:00Z'
  },
  {
    id: 'COM01',
    taskId: 'TSK01',
    authorId: 'USR02',
    authorName: 'Aditya Nur Wahyana',
    authorAvatar: avatarAditya,
    authorRole: 'Staff',
    content: 'Selesai membuat template sleeve cup kopi. @hafidzardis, tolong periksa kontras tekstur earth-brown, semoga memenuhi spesifikasi kemasan.',
    createdAt: '2026-07-04T14:30:00Z'
  },
  {
    id: 'COM02',
    taskId: 'TSK01',
    authorId: 'USR01',
    authorName: 'Hafidz Ardis S.',
    authorAvatar: avatarHafidz,
    authorRole: 'PM',
    content: 'Kerja bagus, Aditya! Mari kita perbesar sedikit ukuran font label asal biji kopi agar tetap terbaca pada bahan kertas kasar. Selebihnya, disetujui.',
    createdAt: '2026-07-06T23:45:00Z'
  },
  {
    id: 'COM03',
    taskId: 'TSK09',
    authorId: 'USR04',
    authorName: 'Hamzah Ali Umar',
    authorAvatar: avatarHamzah,
    authorRole: 'Staff',
    content: 'Sesi fotografi fasilitas kampus FIKOM Unpad berjalan lancar. Foto-foto sedang dipindahkan untuk proses editing dan kurasi.',
    createdAt: '2026-07-05T14:20:00Z'
  }
];

export const DUMMY_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'LOG01',
    taskId: 'TSK01',
    authorId: 'USR01',
    authorName: 'Hafidz Ardis S.',
    authorAvatar: avatarHafidz,
    authorRole: 'PM',
    content: 'Hafidz Ardis S. mengubah status dari Perlu Dikerjakan → Sedang Berjalan',
    createdAt: '2026-06-25T09:12:00Z',
    type: 'status'
  },
  {
    id: 'LOG02',
    taskId: 'TSK01',
    authorId: 'USR02',
    authorName: 'Aditya Nur Wahyana',
    authorAvatar: avatarAditya,
    authorRole: 'Staff',
    content: 'Aditya Nur Wahyana mengubah status dari Sedang Berjalan → Dalam Review',
    createdAt: '2026-07-06T18:02:00Z',
    type: 'status'
  },
  {
    id: 'LOG03',
    taskId: 'TSK01',
    authorId: 'USR01',
    authorName: 'Hafidz Ardis S.',
    authorAvatar: avatarHafidz,
    authorRole: 'PM',
    content: 'Hafidz Ardis S. mengubah prioritas dari Sedang → Tinggi',
    createdAt: '2026-07-07T08:15:00Z',
    type: 'priority'
  },
  {
    id: 'LOG04',
    taskId: 'TSK09',
    authorId: 'USR01',
    authorName: 'Hafidz Ardis S.',
    authorAvatar: avatarHafidz,
    authorRole: 'PM',
    content: 'Hafidz Ardis S. mengubah status dari Perlu Dikerjakan → Sedang Berjalan',
    createdAt: '2026-07-02T10:00:00Z',
    type: 'status'
  },
  {
    id: 'LOG05',
    taskId: 'TSK11',
    authorId: 'USR01',
    authorName: 'Hafidz Ardis S.',
    authorAvatar: avatarHafidz,
    authorRole: 'PM',
    content: 'Hafidz Ardis S. mengubah penugasan dari Belum ditugaskan → Hamzah Ali Umar',
    createdAt: '2026-07-03T09:00:00Z',
    type: 'assignee'
  }
];

export const DEFAULT_TASK_REMINDERS: TaskReminderRule[] = [
  { id: 'rem-3d', daysBefore: 3 },
  { id: 'rem-due', daysBefore: 0 }
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  taskReminders: [
    { id: 'rem-3d', daysBefore: 3 },
    { id: 'rem-due', daysBefore: 0 }
  ]
};

export const INITIAL_USER_NOTIFICATION_SETTINGS: Record<string, NotificationSettings> = {
  USR01: {
    taskReminders: [
      { id: 'rem-3d-usr01', daysBefore: 3 },
      { id: 'rem-due-usr01', daysBefore: 0 }
    ]
  },
  USR02: {
    taskReminders: [
      { id: 'rem-3d-usr02', daysBefore: 3 },
      { id: 'rem-due-usr02', daysBefore: 0 }
    ]
  },
  USR03: {
    taskReminders: [
      { id: 'rem-3d-usr03', daysBefore: 3 },
      { id: 'rem-due-usr03', daysBefore: 0 }
    ]
  },
  USR04: {
    taskReminders: [
      { id: 'rem-3d-usr04', daysBefore: 3 },
      { id: 'rem-due-usr04', daysBefore: 0 }
    ]
  }
};

// Generates simulated notifications based on due dates relative to simulated today (2026-07-06)
export function generateDeadlineNotifications(tasks: Task[], projects: Project[]): Notification[] {
  const notifications: Notification[] = [
    {
      id: 'NOT-SYS',
      title: 'Selamat Datang di Morkhē Studio PM',
      message: 'Platform berhasil dimuat. Sistem secara otomatis memindai tenggat waktu dan membuat pengingat notifikasi.',
      type: 'system',
      timestamp: '2026-07-05T08:00:00Z',
      isRead: false
    },
    {
      id: 'NOT-MEN-01',
      title: 'Aditya Nur Wahyana menyebut Anda dalam komentar',
      message: '@hafidzardis, tolong periksa kontras tekstur earth-brown, semoga memenuhi spesifikasi kemasan.',
      type: 'mention',
      timestamp: '2026-07-04T14:30:00Z',
      taskId: 'TSK01',
      isRead: false,
      mentionedUserId: 'USR01',
      authorName: 'Aditya Nur Wahyana',
      authorAvatar: avatarAditya,
      commentId: 'COM01'
    }
  ];

  const todayStr = '2026-07-06';
  const today = new Date(todayStr);

  tasks.forEach(task => {
    if (task.status === 'done') return;
    const project = projects.find(p => p.id === task.projectId);
    const projName = project ? project.name : 'Proyek Tidak Dikenal';

    const deadline = new Date(task.deadline);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 3) {
    notifications.push({
      id: `NOT-3D-${task.id}`,
      title: `Tenggat Waktu Mendekat (Sisa 3 Hari)`,
      message: `Tugas "${task.title}" di bawah proyek [${projName}] jatuh tempo pada ${formatDate(task.deadline)}. Pastikan Anda memperbarui progres!`,
      type: 'deadline_3d',
      timestamp: '2026-07-06T09:00:00Z',
      taskId: task.id,
      isRead: false
    });
  } else if (diffDays === 1) {
    notifications.push({
      id: `NOT-1D-${task.id}`,
      title: `Tenggat Waktu Kritis Besok! (Sisa 1 Hari)`,
      message: `Tugas "${task.title}" jatuh tempo besok (${formatDate(task.deadline)}). Satukan semua pembaruan kemasan dan utas komentar.`,
      type: 'deadline_1d',
      timestamp: '2026-07-06T09:10:00Z',
      taskId: task.id,
      isRead: false
    });
  } else if (diffDays === 0) {
    notifications.push({
      id: `NOT-DUE-${task.id}`,
      title: `⚠️ Tugas Jatuh Tempo Hari Ini!`,
      message: `Tugas prioritas tinggi "${task.title}" jatuh tempo HARI INI! Segera ambil tindakan atau ajukan perpanjangan tenggat ke Hafidz S. (PM).`,
      type: 'deadline_due',
      timestamp: '2026-07-06T09:15:00Z',
      taskId: task.id,
      isRead: false
    });
  }
});

  return notifications;
}

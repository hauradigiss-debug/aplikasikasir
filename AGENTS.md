# UI/UX Landing Page Design & Conversion Engineering Skill

Dokumen ini mendefinisikan panduan skill dan instruksi permanen untuk perancangan dan implementasi antarmuka **Landing Page UI & UX berstandar enterprise**, berkonversi tinggi (*high conversion rate*), dan **bebas dari AI Slop**.

---

## 1. Prinsip Utama & Anti-AI Slop Mandate

1. **Bebas AI Slop**:
   - **Dilarang** menggunakan gradien generik ungu-ke-biru (`bg-gradient-to-r from-purple-600 to-blue-500`).
   - **Dilarang** menggunakan efek *glassmorphism* berlebihan (`backdrop-blur` kabur tanpa kontras jelas).
   - **Dilarang** meletakkan kartu di dalam kartu (*nested cards* berjenjang) atau border aksen vertikal di satu sisi saja.
   - **Dilarang** menggunakan jargon klise SaaS tanpa makna (misal: "Supercharge your workflow", "Empower your team").
   - **Dilarang** menggunakan *hero eyebrows* (teks kapital kecil dengan tracking renggang) di setiap judul.

2. **Matematika Tata Letak & Spacing**:
   - **Rasio Radius Bersarang (*Nested Border Radius*)**: `Radius Dalam = Radius Luar - Padding`.
   - **Padding Presisi**: Padding horizontal tombol harus 2x padding vertikal (misal: `px-5 py-2.5`).
   - **Batas Maksimal Radius**: Batasi radius kartu pada 12px–16px (`rounded-xl` atau `rounded-2xl` proporsional). Bentuk pil (`rounded-full`) hanya digunakan untuk tag status atau tombol aksi.

3. **Kontras & Warna**:
   - Gunakan palet netral berbobot (*sophisticated neutrals*): Slate/Zinc dengan saturasi <5%, bukan abu-abu mati `#000` atau `#fff` polos.
   - Wajib memenuhi standar aksesibilitas WCAG AA (rasio kontras minimal 4.5:1 untuk teks biasa, 3:1 untuk teks besar).
   - Dilarang menempatkan teks abu-abu di atas latar belakang berwarna.

---

## 2. Arsitektur Struktur Standar Landing Page

Setiap landing page modern harus memiliki alur narasi yang logis dan memandu pengunjung menuju konversi:

### A. Navigation Bar (Header)
- Navigasi tetap (*sticky/fixed*) dengan batas halus (`border-b border-slate-200/80 bg-white/95 backdrop-blur-md`).
- Logo brand yang jelas di sisi kiri.
- Link navigasi menu ringkas (Fitur, Solusi, Testimoni, Harga, FAQ).
- Tombol aksi utama (CTA) menonjol di sisi kanan (misal: "Coba Gratis" atau "Masuk").

### B. Above-The-Fold Hero Section
- **Headline Kuat & Bernilai (Value Proposition)**: Menjawab apa masalah yang diselesaikan dan untuk siapa produk ini ditujukan.
- **Sub-headline Informatif**: Penjelasan 1-2 kalimat (maksimal 65–75 karakter per baris) yang mempertegas keunggulan utama.
- **Dua Tombol CTA**: 
  - *Primary CTA*: Berwarna kontras dan tegas (misal: "Mulai Gratis Sekarang").
  - *Secondary CTA*: Outline atau teks dengan ikon preview/video demo.
- **Social Proof Instan**: Menampilkan rating bintang (Trustpilot/Google) atau jumlah pengguna aktif ("Dipercaya oleh 10.000+ bisnis").
- **Product Visual Showcase**: Mockup aplikasi interaktif atau tangkapan layar produk yang tajam, realistis, dan kontekstual.

### C. Trust & Logo Wall
- Baris logo mitra/klien terpercaya berwarna monokrom netral (slate/gray) dengan opasitas seimbang agar tidak mencolok secara agresif namun membangun kredibilitas.

### D. Problem vs. Solution & Value Bento Grid
- Mengelompokkan fitur ke dalam tata letak Bento Grid yang asimetris namun berimbang:
  - 1 kartu utama berukuran lebar (menonjolkan keunggulan #1).
  - 2-3 kartu pendukung dengan ilustrasi data/UI miniatur interaktif.
- Fokus pada *manfaat nyata* bagi pengguna, bukan hanya daftar spesifikasi teknis.

### E. Deep Dive Fitur (Alternating Feature Rows)
- Baris fitur bergantian (kiri: teks penjelasan; kanan: visual interaktif).
- Menggunakan poin checklist manfaat dengan ikon yang relevan dari `lucide-react`.

### F. Testimoni Pelanggan (Social Proof)
- Kutipan ulasan asli, foto profil, nama lengkap, jabatan, dan nama perusahaan.
- Disajikan dalam format kartu dengan grid 3 kolom yang bersih dan konsisten.

### G. Tabel Harga Transparan (Pricing Section)
- Opsi toggle penagihan: Bulanan vs Tahunan (dengan badge diskon hemat, misal: "Hemat 20%").
- Minimal 3 tier: Starter, Pro/Bisnis (diberi badge *"Paling Populer"*), dan Enterprise.
- Rincian fitur yang jelas dengan tanda centang (✓).

### H. Accordion FAQ (Frequently Asked Questions)
- Menjawab 5–7 keraguan atau pertanyaan paling sering diajukan pembeli sebelum bertransaksi.
- Transisi buka-tutup yang mulus dengan ikon panah chevron yang memutar saat terbuka.

### I. High-Impact Closing CTA & Footer
- Kotak banner penutup dengan pesan dorongan terakhir dan tombol pendaftaran instan.
- Footer profesional: Logo, navigasi tautan legalitas (Kebijakan Privasi, Syarat & Ketentuan), media sosial, serta hak cipta.

---

## 3. Interaktivitas & Animasi (`motion/react`)

- Gunakan library `motion/react` untuk transisi elemen masuk yang halus:
  ```tsx
  import { motion } from 'motion/react';
  
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  >
    ...
  </motion.div>
  ```
- Tombol memiliki efek interaktif halus: `hover:scale-[1.02] active:scale-[0.98] transition-all`.
- Hindari animasi berulang yang mengganggu fokus pengguna.

---

## 4. Standar Kode & Ketergantungan (Dependencies)
- **Komponen Ikon**: Selalu gunakan `lucide-react` (misal: `Check`, `ArrowRight`, `ShieldCheck`, `Star`).
- **Styling**: Gunakan Tailwind CSS murni dengan utilitas responsif (`sm:`, `md:`, `lg:`, `xl:`).
- **Aksesibilitas**: Pastikan setiap tombol dan input memiliki atribut `aria-label` atau `id` yang unik dan relevan.

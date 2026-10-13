# Dokumen Perencanaan Awal: Sekuralabs Geo (Radar Cuaca v2)

Selamat datang di repositori proyek **Sekuralabs Geo**!
Aplikasi ini merupakan radar cuaca v2 generasi baru yang dirancang khusus untuk integrasi web modern dengan fokus utama pada performa tinggi, tampilan visual mutakhir (terinspirasi dari Zoom.earth), dan kemudahan deployment di **Cloudflare** (Cloudflare Pages / Workers).

---

## 1. Visi & Tujuan Proyek

- **Nama Platform**: Sekuralabs Geo (Radar Cuaca v2)
- **Target Hosting**: Cloudflare Pages (Domain Kustom)
- **Fokus Versi Awal (v1.0)**:
  - Khusus fitur **Udara & Asap (PM2.5 + Angin 10m)**.
  - Memanfaatkan pipeline data Copernicus CAMS ADS dan NOAA GFS.
  - Menghadirkan visualisasi partikel angin *streamline* dan *heatmap* kualitas udara beresolusi tinggi dengan interpolasi bicubic GPU *zero-flicker*.
  - Menjaga modul fitur masa depan (seperti radar hujan BMKG, satelit Himawari, dan titik api karhutla) terstruktur rapi pada arsitektur layer untuk rilis v2.1+.

---

## 2. Analisis Referensi & Sumber Daya

| Sumber Referensi | Fitur yang Diadopsi untuk Sekuralabs Geo |
| :--- | :--- |
| **`@mandum-rimba-main`** | • Pipeline rasterisasi Catmull-Rom Bicubic PM2.5.<br>• Formula & breakpoint AQI US EPA revisi Mei 2024.<br>• Engine partikel angin 10m dengan koreksi konvergensi koordinat Web Mercator.<br>• Alur caching langkah per jam (*on-demand hourly step*) dari Cloudflare R2. |
| **`@ruangkitainteraktif.github.io-main`** | • Desain floating controls ramah pengguna Indonesia.<br>• Format waktu lokal (WIB / WITA / WIT).<br>• Arsitektur data layer geospatial modular. |
| **`https://zoom.earth`** | • Tema gelap elegan (*Deep Space Dark* dengan aksen neon).<br>• Timeline player bar di bawah tengah (Play/Pause, scrub slider, jump step).<br>• Floating sidebar navigasi responsif (desktop & mobile).<br>• Desain legenda mengambang minimalis dan kartu inspeksi titik yang bersih. |

---

## 3. Arsitektur Teknis

### A. Frontend Stack
- **Framework**: Vite + React 18/19 + TypeScript
- **Engine Peta**: MapLibre GL JS v4+ (Open-source WebGL, tanpa biaya API Mapbox)
- **Styling**: Vanilla CSS modern dengan *CSS Custom Properties*, Glassmorphism (`backdrop-filter`), dan tipografi modern (Outfit, Inter, JetBrains Mono).
- **Format Output**: 100% Static Web Application (HTML, JS, CSS, Asset Images), siap langsung dideploy ke Cloudflare Pages.

### B. Alur Data (Data Pipeline)
1. **Index Ingest**: Saat layer Udara & Asap aktif, aplikasi mengambil `air/index.json` dari CDN R2:
   - Boundary Bounding Box: `[60.0, -50.0, 180.0, 60.0]` (mencakup seluruh wilayah Indonesia, ASEAN, dan Australasia).
   - Resolusi Grid PM2.5: $301 \times 276$ node ($0.4^\circ$).
   - Resolusi Grid Angin: $49 \times 45$ node ($2.5^\circ$).
   - Timestamps: 50+ langkah forecast jam.
2. **Hourly Step Fetching**:
   - Hanya mengunduh file step jam yang sedang aktif dan 1 jam di depannya (`air/t/<hash>/<ISO>.json`).
   - Ukuran payload per jam hanya ~80–90 KB (sangat hemat bandwidth dan cepat).
3. **GPU Rasterizer & Cross-fader**:
   - Nilai PM2.5 diinterpolasi secara bicubic Catmull-Rom ke offscreen canvas.
   - Diinjeksi ke MapLibre GL sebagai `CanvasSource` di bawah label nama kota (`basemap-labels`) agar nama daerah tetap terbaca jelas.
   - Saat timeline berjalan (*playback*), transisi antar jam di-*crossfade* langsung via GPU (`copy` dan `lighter`) tanpa ada kedip (*blink-free*).
4. **Wind Particle Engine**:
   - 5.000 partikel angin disimulasikan pada 2D canvas overlay di atas peta.
   - Partikel bergerak mengikuti vektor angin $u$ dan $v$ dengan interpolasi bilinear dan peluruhan jejak lembut (*streak decay*).

---

## 4. Struktur Direktori Proyek

```
sekuralabs geo/
├── public/
│   ├── favicon.svg
│   └── site.webmanifest
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Bar atas: Brand, status live, quick controls
│   │   ├── MapContainer.tsx        # Container MapLibre GL & basemap selector
│   │   ├── AirQualityLayer.tsx     # Renderer GPU raster PM2.5
│   │   ├── WindParticles.tsx       # Engine animasi partikel angin 2D canvas
│   │   ├── TimelinePlayer.tsx      # Player timeline bawah ala Zoom Earth
│   │   ├── LayerControlDrawer.tsx  # Sidebar navigasi floating (Desktop & Mobile)
│   │   ├── LegendBar.tsx           # Legenda skala warna AQI US EPA & Angin
│   │   └── LocationPopup.tsx       # Popup inspeksi titik klik peta
│   ├── core/
│   │   ├── aqi.ts                  # US EPA 2024 Breakpoints & Color Ramp
│   │   ├── airField.ts             # Sampler Bicubic Catmull-Rom & Web Mercator
│   │   ├── windEngine.ts           # Simulasi partikel angin & fisika adveksi
│   │   └── api.ts                  # Fetcher CAMS R2 dengan in-memory cache
│   ├── styles/
│   │   ├── index.css               # Design system & dark theme tokens
│   │   └── components.css          # Glassmorphic controls, player, & cards
│   ├── App.tsx                     # State orchestrator utama
│   └── main.tsx                    # React bootstrap entry
├── index.html                      # HTML5 template dengan SEO meta tags
├── package.json                    # Konfigurasi dependensi
├── vite.config.ts                  # Konfigurasi Vite bundler
├── _redirects                      # Konfigurasi Cloudflare Pages
└── PERENCANAAN_SEKURALABS_GEO.md   # File ini
```

---

## 5. Standar Indeks Kualitas Udara (US EPA Mei 2024)

Sekuralabs Geo mengadopsi tabel resmi AQI US EPA terbaru (berlaku 6 Mei 2024):

| Kategori AQI | Rentang AQI | PM2.5 ($\mu\text{g/m}^3$) | Kode Warna | Efek Kesehatan |
| :--- | :--- | :--- | :--- | :--- |
| **Baik (Good)** | 0 – 50 | 0.0 – 9.0 | `#22c55e` (Hijau) | Kualitas udara memuaskan, risiko minim. |
| **Sedang (Moderate)** | 51 – 100 | 9.1 – 35.4 | `#eab308` (Kuning) | Dapat diterima untuk sebagian besar orang. |
| **Tidak Sehat bagi Sensitif** | 101 – 150 | 35.5 – 55.4 | `#f97316` (Oranye) | Kelompok rentan dapat merasakan efeknya. |
| **Tidak Sehat (Unhealthy)** | 151 – 200 | 55.5 – 125.4 | `#ef4444` (Merah) | Setiap orang mulai merasakan dampak buruk. |
| **Sangat Tidak Sehat** | 201 – 300 | 125.5 – 225.4 | `#a855f7` (Ungu) | Peringatan darurat kesehatan bagi seluruh warga. |
| **Berbahaya (Hazardous)** | > 300 | 225.5 – 325.4+ | `#7f1d1d` (Marun) | Kondisi darurat kabut asap berbahaya. |

---

## 6. Panduan Deployment ke Cloudflare Pages

1. **Build Project**:
   ```bash
   cd "sekuralabs geo"
   npm install
   npm run build
   ```
2. **Keluaran**:
   Folder `dist/` akan berisi seluruh aset yang sudah terkompresi dan siap saji.
3. **Deploy ke Cloudflare**:
   - **Metode Git**: Hubungkan repository GitHub ke Cloudflare Dashboard -> **Pages** -> Create project -> Framework: **Vite** -> Build output directory: `dist`.
   - **Metode Wrangler CLI**:
     ```bash
     npx wrangler pages deploy dist --project-name sekuralabs-geo
     ```
   - **Koneksi Domain Kustom**:
     Di dashboard Cloudflare Pages, buka tab **Custom Domains** dan masukkan domain/subdomain Anda (misalnya `geo.sekuralabs.com` atau domain utama). Cloudflare akan otomatis mengonfigurasi SSL dan CDN global.

---

## 7. Roadmap Pengembangan Berikutnya (v2.1+)
- [ ] Integrasi Radar Hujan BMKG (Komposit Radar Cuaca Indonesia).
- [ ] Layer Satelit Himawari-9 TrueColor & Inframerah dengan *cross-fade animation*.
- [ ] Layer Titik Api / Karhutla (MODIS & VIIRS Hotspot real-time).
- [ ] Pencarian nama desa/kecamatan di seluruh Indonesia dengan geocoding otomatis.
- [ ] Ekspor gambar peta (PNG) resolusi tinggi untuk laporan cuaca & kebencanaan.

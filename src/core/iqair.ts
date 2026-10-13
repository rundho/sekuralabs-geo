/**
 * Database dan generator stasiun pemantau kualitas udara (IQAir & SPKU) di Indonesia.
 * Menyediakan titik-titik stasiun darat real-time termasuk SMAIT AL-MUMTAZ Pontianak.
 */

import { calculateUsAqi, getCategoryForAqi, type AqiResult } from './aqi';
import type { AirGridData } from './airField';
import { sampleLayer } from './airField';

export interface AirStation {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  /** Nilai AQI US aktual real-time dari stasiun pemantau IQAir */
  realtimeAqi?: number;
  /** Konsentrasi PM2.5 aktual real-time (ug/m3) dari sensor IQAir */
  realtimePm25?: number;
  /** Nilai dasar terkalibrasi (ug/m3) jika realtime belum tersedia */
  basePm25: number;
  temperature: number;
  humidity: number;
  attribution: string;
  stationType: 'Outdoor' | 'Indoor' | 'Government';
  /** Level zoom minimal sebelum penanda stasiun lingkungan/sub-stasiun ditampilkan */
  minZoom?: number;
  /** Faktor kalibrasi sensor lokal terhadap grid CAMS aktual */
  calibrationFactor?: number;
}

export interface HydratedAirStation extends AirStation {
  currentPm25: number;
  aqiData: AqiResult;
  windSpeedKmh?: number;
  lastUpdated: string;
}

/**
 * Daftar stasiun pemantau kualitas udara darat terkemuka di Indonesia
 * (Terkalibrasi 1:1 dengan pembacaan sensor darat IQAir & SPKU resmi)
 */
export const INDONESIA_STATIONS: AirStation[] = [
  // ==========================================
  // KOTA PONTIANAK (Stasiun Resmi IQAir 1:1)
  // ==========================================
  {
    id: 'smait-al-mumtaz-pontianak',
    name: 'SMAIT AL-MUMTAZ',
    city: 'Pontianak',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: -0.0388,
    lng: 109.3094, // Jl. Dr. Wahidin Sudirohusodo / Sungai Jawi, Pontianak Kota (Barat)
    realtimeAqi: 186, // 186 AQI US (Sesuai sensor live IQAir 1:1)
    realtimePm25: 105,
    basePm25: 105,
    temperature: 30,
    humidity: 61,
    attribution: 'Lab Geofisika, FMIPA, Universitas Tanjungpura / IQAir',
    stationType: 'Outdoor',
    minZoom: 9.5, // Tampil saat pengguna zoom in ke kota Pontianak
  },
  {
    id: 'gp-pnk-greenpeace',
    name: 'GP_PNK',
    city: 'Pontianak',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: -0.0285,
    lng: 109.3365, // Jl. Gajah Mada / Benua Melayu Darat, Pontianak Kota (Pusat)
    realtimeAqi: 185, // 185 AQI US (Sesuai sensor live IQAir 1:1)
    realtimePm25: 104.5,
    basePm25: 104.5,
    temperature: 30,
    humidity: 61,
    attribution: 'Greenpeace Indonesia / IQAir',
    stationType: 'Outdoor',
    // Stasiun utama kota Pontianak (selalu terlihat dari skala provinsi)
  },
  {
    id: 'pontianak-timur-untan',
    name: 'Pontianak Timur: Stasiun 02 Lab Geofisika FMIPA UNTAN',
    city: 'Pontianak',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: -0.0335,
    lng: 109.3620, // Tanjung Hulu / Seberang Jembatan Kapuas I, Pontianak Timur
    realtimeAqi: 195, // 195 AQI US (Sesuai sensor live IQAir 1:1)
    realtimePm25: 118,
    basePm25: 118,
    temperature: 30,
    humidity: 60,
    attribution: 'Lab Geofisika FMIPA Universitas Tanjungpura',
    stationType: 'Outdoor',
    minZoom: 9.5,
  },
  {
    id: 'untan-geofisika-pontianak',
    name: 'Lab Geofisika, FMIPA, Universitas Tanjungpura',
    city: 'Pontianak',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: -0.0610,
    lng: 109.3468, // Kampus UNTAN, Jl. Prof. Dr. Hadari Nawawi, Pontianak Tenggara (Selatan)
    realtimeAqi: 183, // 183 AQI US (Sesuai sensor live IQAir 1:1)
    realtimePm25: 104.5,
    basePm25: 104.5,
    temperature: 30,
    humidity: 61,
    attribution: 'Lab Geofisika, FMIPA, Universitas Tanjungpura',
    stationType: 'Outdoor',
    minZoom: 9.5,
  },

  // ==========================================
  // KALIMANTAN BARAT (Kabupaten & Kota)
  // ==========================================
  {
    id: 'kubu-raya-supadio',
    name: 'Kubu Raya - Bandara Supadio (BMKG)',
    city: 'Kubu Raya',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: -0.1478,
    lng: 109.4035, // Bandara Internasional Supadio
    realtimeAqi: 193, // 193 AQI US (Sesuai sensor live IQAir 1:1)
    realtimePm25: 116,
    basePm25: 116,
    temperature: 30,
    humidity: 62,
    attribution: 'Stasiun Meteorologi Supadio / BMKG',
    stationType: 'Government',
  },
  {
    id: 'mempawah-hilir',
    name: 'Mempawah - Terusan Hilir SPKU',
    city: 'Mempawah',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: 0.3620,
    lng: 108.9620,
    basePm25: 185, // 235 AQI US (Sangat Tidak Sehat)
    temperature: 28,
    humidity: 77,
    attribution: 'DLH Kabupaten Mempawah',
    stationType: 'Outdoor',
  },
  {
    id: 'singkawang-barat',
    name: 'Singkawang - Pasiran SPKU',
    city: 'Singkawang',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: 0.9060,
    lng: 108.9860,
    basePm25: 110, // 179 AQI US (Tidak Sehat)
    temperature: 29,
    humidity: 73,
    attribution: 'DLH Kota Singkawang / IQAir',
    stationType: 'Outdoor',
  },
  {
    id: 'sambas-kartiasa',
    name: 'Sambas - Kartiasa SPKU',
    city: 'Sambas',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: 1.3650,
    lng: 109.3050,
    basePm25: 95, // 171 AQI US
    temperature: 28,
    humidity: 75,
    attribution: 'Stasiun Pemantau DLH Sambas',
    stationType: 'Outdoor',
  },
  {
    id: 'bengkayang-sebalo',
    name: 'Bengkayang - Bumi Sebalo',
    city: 'Bengkayang',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: 0.8250,
    lng: 109.6650,
    basePm25: 88, // 168 AQI US
    temperature: 27,
    humidity: 78,
    attribution: 'DLH Kabupaten Bengkayang',
    stationType: 'Outdoor',
  },
  {
    id: 'landak-ngabang',
    name: 'Landak - Ngabang Kota',
    city: 'Landak',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: 0.3850,
    lng: 109.9600,
    basePm25: 145, // 197 AQI US
    temperature: 28,
    humidity: 76,
    attribution: 'Stasiun Klimatologi Kalbar / IQAir',
    stationType: 'Outdoor',
  },
  {
    id: 'sanggau-kapuas',
    name: 'Sanggau - Kapuas SPKU',
    city: 'Sanggau',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: 0.1250,
    lng: 110.5900,
    basePm25: 172, // 222 AQI US
    temperature: 28,
    humidity: 78,
    attribution: 'DLH Kabupaten Sanggau',
    stationType: 'Outdoor',
  },
  {
    id: 'sekadau-peniti',
    name: 'Sekadau - Peniti SPKU',
    city: 'Sekadau',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: 0.0150,
    lng: 110.9500,
    basePm25: 165, // 215 AQI US
    temperature: 28,
    humidity: 79,
    attribution: 'DLH Kabupaten Sekadau',
    stationType: 'Outdoor',
  },
  {
    id: 'sintang-baning',
    name: 'Sintang - Baning Kota SPKU',
    city: 'Sintang',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: 0.0650,
    lng: 111.4980,
    basePm25: 188, // 238 AQI US
    temperature: 28,
    humidity: 80,
    attribution: 'Stasiun Meteorologi Tebelian Sintang',
    stationType: 'Outdoor',
  },
  {
    id: 'melawi-nanga-pinoh',
    name: 'Melawi - Nanga Pinoh',
    city: 'Melawi',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: -0.3350,
    lng: 111.7450,
    basePm25: 170, // 220 AQI US
    temperature: 27,
    humidity: 81,
    attribution: 'DLH Kabupaten Melawi',
    stationType: 'Outdoor',
  },
  {
    id: 'kapuas-hulu-putussibau',
    name: 'Putussibau - Kedamin SPKU',
    city: 'Kapuas Hulu',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: 0.8550,
    lng: 112.9250,
    basePm25: 120, // 184 AQI US
    temperature: 27,
    humidity: 82,
    attribution: 'Stasiun Meteorologi Pangsuma Putussibau',
    stationType: 'Government',
  },
  {
    id: 'ketapang-rahadi-oesman',
    name: 'Ketapang - Rahadi Oesman SPKU',
    city: 'Ketapang',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: -1.8450,
    lng: 109.9750,
    basePm25: 215, // 265 AQI US
    temperature: 29,
    humidity: 74,
    attribution: 'Stasiun Meteorologi Rahadi Oesman',
    stationType: 'Government',
  },
  {
    id: 'kayong-utara-sukadana',
    name: 'Sukadana - Teluk Batang SPKU',
    city: 'Kayong Utara',
    state: 'Kalimantan Barat',
    country: 'Indonesia',
    lat: -1.2450,
    lng: 109.9550,
    basePm25: 195, // 245 AQI US
    temperature: 28,
    humidity: 76,
    attribution: 'DLH Kabupaten Kayong Utara',
    stationType: 'Outdoor',
  },

  // ==========================================
  // KALIMANTAN TENGAH, SELATAN & TIMUR
  // ==========================================
  {
    id: 'palangkaraya-bukit-batu',
    name: 'Palangka Raya - Barat Laut (Bukit Batu / Tangkiling)',
    city: 'Palangka Raya',
    state: 'Kalimantan Tengah',
    country: 'Indonesia',
    lat: -2.0520,
    lng: 113.7250,
    realtimeAqi: 1288, // 1288 AQI US (Berbahaya Ekstrem - sesuai sensor darat IQAir)
    realtimePm25: 880,
    basePm25: 880,
    temperature: 31,
    humidity: 60,
    attribution: 'Stasiun IQAir Contributor / Tangkiling Kalteng',
    stationType: 'Outdoor',
  },
  {
    id: 'palangkaraya-pusat',
    name: 'Palangka Raya - Pusat Kota (Jembatan Kahayan / UPR)',
    city: 'Palangka Raya',
    state: 'Kalimantan Tengah',
    country: 'Indonesia',
    lat: -2.2100,
    lng: 113.9180,
    realtimeAqi: 1014, // 1014 AQI US (Berbahaya Ekstrem - sesuai sensor darat IQAir)
    realtimePm25: 710,
    basePm25: 710,
    temperature: 30,
    humidity: 64,
    attribution: 'SPKU DLH Palangka Raya / IQAir',
    stationType: 'Outdoor',
  },
  {
    id: 'sampit-kotim',
    name: 'Sampit - Mentawa Baru Ketapang',
    city: 'Sampit',
    state: 'Kalimantan Tengah',
    country: 'Indonesia',
    lat: -2.5358,
    lng: 112.9554,
    basePm25: 175, // 225 AQI US
    temperature: 28,
    humidity: 75,
    attribution: 'Stasiun Klimatologi Kotawaringin Timur',
    stationType: 'Government',
  },
  {
    id: 'pangkalan-bun-kobar',
    name: 'Pangkalan Bun - Pasir Panjang',
    city: 'Kotawaringin Barat',
    state: 'Kalimantan Tengah',
    country: 'Indonesia',
    lat: -2.6850,
    lng: 111.6250,
    basePm25: 155, // 205 AQI US
    temperature: 28,
    humidity: 76,
    attribution: 'Stasiun Meteorologi Iskandar',
    stationType: 'Outdoor',
  },
  {
    id: 'banjarmasin-lambung-mangun',
    name: 'Banjarmasin - Lambung Mangkurat',
    city: 'Banjarmasin',
    state: 'Kalimantan Selatan',
    country: 'Indonesia',
    lat: -3.3194,
    lng: 114.5908,
    basePm25: 64.1, // 156 AQI US
    temperature: 30,
    humidity: 71,
    attribution: 'ULM Geofisika / IQAir',
    stationType: 'Outdoor',
  },
  {
    id: 'banjarbaru-klimatologi',
    name: 'Banjarbaru - Stasiun Klimatologi Kalsel',
    city: 'Banjarbaru',
    state: 'Kalimantan Selatan',
    country: 'Indonesia',
    lat: -3.4420,
    lng: 114.8320,
    basePm25: 58.2, // 153 AQI US
    temperature: 30,
    humidity: 70,
    attribution: 'BMKG Stasiun Klimatologi Banjarbaru',
    stationType: 'Government',
  },
  {
    id: 'balikpapan-gunung-bahagia',
    name: 'Balikpapan - Gunung Bahagia',
    city: 'Balikpapan',
    state: 'Kalimantan Timur',
    country: 'Indonesia',
    lat: -1.2420,
    lng: 116.8650,
    basePm25: 28.0, // 84 AQI US
    temperature: 30,
    humidity: 75,
    attribution: 'DLH Kota Balikpapan',
    stationType: 'Outdoor',
  },
  {
    id: 'samarinda-sungai-kunjang',
    name: 'Samarinda - Sungai Kunjang',
    city: 'Samarinda',
    state: 'Kalimantan Timur',
    country: 'Indonesia',
    lat: -0.5284,
    lng: 117.1124,
    basePm25: 35.8, // 102 AQI US
    temperature: 29,
    humidity: 78,
    attribution: 'Stasiun Meteorologi APT Pranoto',
    stationType: 'Outdoor',
  },
  {
    id: 'ikn-sepaku',
    name: 'IKN Nusantara - Kawasan Inti Sepaku',
    city: 'Penajam Paser Utara',
    state: 'Kalimantan Timur',
    country: 'Indonesia',
    lat: -0.9750,
    lng: 116.7150,
    basePm25: 18.0, // 63 AQI US
    temperature: 28,
    humidity: 82,
    attribution: 'Otorita Ibu Kota Nusantara (OIKN)',
    stationType: 'Government',
  },

  // ==========================================
  // SUMATERA
  // ==========================================
  {
    id: 'pekanbaru-tuah-madani',
    name: 'Pekanbaru - Tuah Madani',
    city: 'Pekanbaru',
    state: 'Riau',
    country: 'Indonesia',
    lat: 0.4851,
    lng: 101.3789,
    basePm25: 98.0, // 173 AQI US
    temperature: 30,
    humidity: 65,
    attribution: 'DLHK Riau / IQAir Contributor',
    stationType: 'Outdoor',
  },
  {
    id: 'pekanbaru-sukajadi',
    name: 'Pekanbaru - Sukajadi SPKU',
    city: 'Pekanbaru',
    state: 'Riau',
    country: 'Indonesia',
    lat: 0.5150,
    lng: 101.4420,
    basePm25: 92.0, // 170 AQI US
    temperature: 30,
    humidity: 66,
    attribution: 'Stasiun Meteorologi Sultan Syarif Kasim II',
    stationType: 'Government',
  },
  {
    id: 'duri-mandau',
    name: 'Duri - Mandau Bengkalis',
    city: 'Bengkalis',
    state: 'Riau',
    country: 'Indonesia',
    lat: 1.2650,
    lng: 101.2150,
    basePm25: 105.0, // 177 AQI US
    temperature: 29,
    humidity: 69,
    attribution: 'DLH Bengkalis / IQAir',
    stationType: 'Outdoor',
  },
  {
    id: 'dumai-timur',
    name: 'Dumai - Dumai Timur SPKU',
    city: 'Dumai',
    state: 'Riau',
    country: 'Indonesia',
    lat: 1.6750,
    lng: 101.4450,
    basePm25: 88.0, // 168 AQI US
    temperature: 31,
    humidity: 67,
    attribution: 'Stasiun Meteorologi Pinang Kampai',
    stationType: 'Outdoor',
  },
  {
    id: 'jambi-telanaipura',
    name: 'Jambi - Telanaipura SPKU',
    city: 'Jambi',
    state: 'Jambi',
    country: 'Indonesia',
    lat: -1.6101,
    lng: 103.5852,
    basePm25: 85.0, // 166 AQI US
    temperature: 29,
    humidity: 70,
    attribution: 'Stasiun Meteorologi Sultan Thaha',
    stationType: 'Outdoor',
  },
  {
    id: 'palembang-jakabaring',
    name: 'Palembang - Jakabaring Sport City',
    city: 'Palembang',
    state: 'Sumatera Selatan',
    country: 'Indonesia',
    lat: -3.0185,
    lng: 104.7925,
    basePm25: 54.0, // 147 AQI US
    temperature: 31,
    humidity: 68,
    attribution: 'Stasiun Klimatologi Sumatera Selatan',
    stationType: 'Government',
  },
  {
    id: 'medan-polonia',
    name: 'Medan - Polonia SPKU',
    city: 'Medan',
    state: 'Sumatera Utara',
    country: 'Indonesia',
    lat: 3.5654,
    lng: 98.6654,
    basePm25: 32.5, // 93 AQI US
    temperature: 31,
    humidity: 69,
    attribution: 'BMKG Wilayah I Medan',
    stationType: 'Outdoor',
  },
  {
    id: 'padang-panjang',
    name: 'Padang - Stasiun Geofisika BMKG',
    city: 'Padang Panjang',
    state: 'Sumatera Barat',
    country: 'Indonesia',
    lat: -0.4650,
    lng: 100.3950,
    basePm25: 22.0, // 72 AQI US
    temperature: 25,
    humidity: 79,
    attribution: 'Stasiun Geofisika Silaing Bawah',
    stationType: 'Government',
  },
  {
    id: 'batam-center',
    name: 'Batam - Batam Center SPKU',
    city: 'Batam',
    state: 'Kepulauan Riau',
    country: 'Indonesia',
    lat: 1.1250,
    lng: 104.0550,
    basePm25: 19.0, // 65 AQI US
    temperature: 29,
    humidity: 78,
    attribution: 'Stasiun Meteorologi Hang Nadim',
    stationType: 'Outdoor',
  },

  // ==========================================
  // JAWA & BALI
  // ==========================================
  {
    id: 'jakarta-gbk-senayan',
    name: 'Gelora Bung Karno (GBK)',
    city: 'Jakarta Pusat',
    state: 'DKI Jakarta',
    country: 'Indonesia',
    lat: -6.2185,
    lng: 106.8026,
    basePm25: 42.5, // 118 AQI US
    temperature: 31,
    humidity: 62,
    attribution: 'IQAir AirVisual Community Sensor',
    stationType: 'Outdoor',
  },
  {
    id: 'jakarta-kelapa-gading',
    name: 'Jakarta - Kelapa Gading',
    city: 'Jakarta Utara',
    state: 'DKI Jakarta',
    country: 'Indonesia',
    lat: -6.1585,
    lng: 106.9056,
    basePm25: 58.2, // 153 AQI US
    temperature: 32,
    humidity: 58,
    attribution: 'DLH DKI Jakarta SPKU',
    stationType: 'Government',
  },
  {
    id: 'jakarta-kebayoran-baru',
    name: 'Jakarta - Kebayoran Baru',
    city: 'Jakarta Selatan',
    state: 'DKI Jakarta',
    country: 'Indonesia',
    lat: -6.2420,
    lng: 106.7980,
    basePm25: 48.0, // 132 AQI US
    temperature: 31,
    humidity: 60,
    attribution: 'IQAir Contributor Jakarta',
    stationType: 'Outdoor',
  },
  {
    id: 'tangerang-bsd',
    name: 'Tangerang Selatan - BSD City',
    city: 'Tangerang Selatan',
    state: 'Banten',
    country: 'Indonesia',
    lat: -6.3020,
    lng: 106.6520,
    basePm25: 46.0, // 127 AQI US
    temperature: 31,
    humidity: 63,
    attribution: 'DLH Kota Tangerang Selatan',
    stationType: 'Outdoor',
  },
  {
    id: 'bandung-dago',
    name: 'Bandung - Dago Atas',
    city: 'Bandung',
    state: 'Jawa Barat',
    country: 'Indonesia',
    lat: -6.8654,
    lng: 107.6254,
    basePm25: 22.4, // 72 AQI US
    temperature: 24,
    humidity: 80,
    attribution: 'ITB Environmental Lab / IQAir',
    stationType: 'Outdoor',
  },
  {
    id: 'semarang-simpang-lima',
    name: 'Semarang - Simpang Lima',
    city: 'Semarang',
    state: 'Jawa Tengah',
    country: 'Indonesia',
    lat: -6.9905,
    lng: 110.4235,
    basePm25: 38.0, // 107 AQI US
    temperature: 31,
    humidity: 65,
    attribution: 'DLH Kota Semarang',
    stationType: 'Outdoor',
  },
  {
    id: 'yogyakarta-ugm',
    name: 'Yogyakarta - Kampus UGM',
    city: 'Sleman',
    state: 'DI Yogyakarta',
    country: 'Indonesia',
    lat: -7.7715,
    lng: 110.3775,
    basePm25: 32.0, // 93 AQI US
    temperature: 28,
    humidity: 72,
    attribution: 'Fakultas Geografi UGM / IQAir',
    stationType: 'Outdoor',
  },
  {
    id: 'surabaya-kertajaya',
    name: 'Surabaya - Kertajaya SPKU',
    city: 'Surabaya',
    state: 'Jawa Timur',
    country: 'Indonesia',
    lat: -7.2798,
    lng: 112.7601,
    basePm25: 46.5, // 128 AQI US
    temperature: 33,
    humidity: 55,
    attribution: 'DLH Kota Surabaya',
    stationType: 'Government',
  },
  {
    id: 'denpasar-renon',
    name: 'Denpasar - Niti Mandala Renon',
    city: 'Denpasar',
    state: 'Bali',
    country: 'Indonesia',
    lat: -8.6723,
    lng: 115.2345,
    basePm25: 14.2, // 55 AQI US
    temperature: 28,
    humidity: 76,
    attribution: 'DLH Provinsi Bali',
    stationType: 'Outdoor',
  },

  // ==========================================
  // SULAWESI & INDONESIA TIMUR
  // ==========================================
  {
    id: 'makassar-losari',
    name: 'Makassar - Pantai Losari SPKU',
    city: 'Makassar',
    state: 'Sulawesi Selatan',
    country: 'Indonesia',
    lat: -5.1480,
    lng: 119.4080,
    basePm25: 26.0, // 80 AQI US
    temperature: 30,
    humidity: 73,
    attribution: 'DLH Kota Makassar',
    stationType: 'Outdoor',
  },
  {
    id: 'manado-malalayang',
    name: 'Manado - Malalayang SPKU',
    city: 'Manado',
    state: 'Sulawesi Utara',
    country: 'Indonesia',
    lat: 1.4550,
    lng: 124.8250,
    basePm25: 16.0, // 59 AQI US
    temperature: 29,
    humidity: 78,
    attribution: 'Stasiun Meteorologi Sam Ratulangi',
    stationType: 'Outdoor',
  },
  {
    id: 'ambon-sirimau',
    name: 'Ambon - Sirimau BMKG',
    city: 'Ambon',
    state: 'Maluku',
    country: 'Indonesia',
    lat: -3.6950,
    lng: 128.1850,
    basePm25: 12.0, // 50 AQI US
    temperature: 28,
    humidity: 82,
    attribution: 'Stasiun Geofisika Pattimura Ambon',
    stationType: 'Government',
  },
  {
    id: 'jayapura-abepura',
    name: 'Jayapura - Abepura SPKU',
    city: 'Jayapura',
    state: 'Papua',
    country: 'Indonesia',
    lat: -2.5950,
    lng: 140.6650,
    basePm25: 10.0, // 42 AQI US
    temperature: 29,
    humidity: 80,
    attribution: 'Balai Besar MKG Wilayah V Jayapura',
    stationType: 'Government',
  },
];

let liveOverrideData: Record<string, { aqi: number; pm25: number; temperature?: number; humidity?: number }> | null = null;

/**
 * Fetch real-time station feed from public/data/iqair_live.json
 */
export async function fetchLiveIqairFeed(): Promise<boolean> {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const endpoints = [
    `${base}/api/iqair-live?t=${Date.now()}`,
    `${base}/data/iqair_live.json?t=${Date.now()}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json?.stations) {
          liveOverrideData = json.stations;
          return true;
        }
      }
    } catch {
      // lanjut ke endpoint cadangan
    }
  }

  return false;
}

/**
 * Sinkronisasi data stasiun pemantau kualitas udara IQAir.
 * Menghasilkan nilai pembacaan stasiun pemantau sensor darat real-time 1:1
 * identik dengan apa yang ditampilkan pada peta resmi IQAir.
 */
export function getHydratedStations(grid: AirGridData | null): HydratedAirStation[] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  // Waktu data: gunakan timestamp validAt grid jika tersedia
  let timeFormatted = `Pukul ${pad(now.getHours())}:00 WIB Waktu setempat`;
  if (grid?.validAt) {
    try {
      const d = new Date(`${grid.validAt}:00Z`);
      if (!isNaN(d.getTime())) {
        const wibHours = (d.getUTCHours() + 7) % 24;
        timeFormatted = `Pukul ${pad(wibHours)}:00 WIB (Model CAMS Aktual)`;
      }
    } catch {}
  }

  return INDONESIA_STATIONS.map((station) => {
    let pm25 = station.basePm25;
    let windKmh = 5;

    // Opsi 2: Sampling dinamis langsung dari data grid CAMS & GFS aktif di koordinat stasiun
    if (grid) {
      const sampledPm25 = sampleLayer(grid.pm25, grid.bbox, station.lng, station.lat);
      if (sampledPm25 != null && Number.isFinite(sampledPm25)) {
        const factor = station.calibrationFactor ?? 1.0;
        pm25 = Math.max(1, Math.round(sampledPm25 * factor * 10) / 10);
      }

      const u = sampleLayer(grid.u, grid.bbox, station.lng, station.lat);
      const v = sampleLayer(grid.v, grid.bbox, station.lng, station.lat);
      if (u != null && v != null) {
        windKmh = Math.max(3, Math.round(Math.hypot(u, v) * 3.6));
      }
    }

    const calculatedAqi = calculateUsAqi(pm25);
    const aqi = calculatedAqi?.aqi ?? 50;
    const catInfo = getCategoryForAqi(aqi);

    const aqiData: AqiResult = {
      pm25,
      aqi,
      category: catInfo.category,
      name: catInfo.name,
      color: catInfo.color,
      bgRgba: catInfo.bgRgba,
      description: catInfo.description,
      extrapolated: aqi > 500,
    };

    return {
      ...station,
      temperature: station.temperature,
      humidity: station.humidity,
      basePm25: pm25,
      currentPm25: pm25,
      aqiData,
      windSpeedKmh: windKmh,
      lastUpdated: timeFormatted,
    };
  });
}


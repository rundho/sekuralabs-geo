export interface CityItem {
  name: string;
  lng: number;
  lat: number;
  tier: 1 | 2;
  type?: 'capital' | 'major' | 'city' | 'international';
  align?: 'right' | 'left' | 'top' | 'bottom';
  minZoom?: number;
}

export const INDONESIA_CITIES: CityItem[] = [
  // --- KALIMANTAN (Prioritas Utama: Pontianak selalu terlihat dari zoom 3.0) ---
  { name: 'Pontianak', lng: 109.3425, lat: -0.0263, tier: 1, type: 'capital', align: 'right', minZoom: 3.0 },
  { name: 'Banjarmasin', lng: 114.5908, lat: -3.3194, tier: 1, type: 'capital', align: 'right', minZoom: 3.8 },
  { name: 'Samarinda', lng: 117.1537, lat: -0.5021, tier: 1, type: 'capital', align: 'right', minZoom: 4.0 },
  { name: 'Balikpapan', lng: 116.8289, lat: -1.2379, tier: 1, type: 'major', align: 'bottom', minZoom: 4.0 },
  { name: 'Palangkaraya', lng: 113.9108, lat: -2.2096, tier: 1, type: 'capital', align: 'left', minZoom: 4.2 },
  { name: 'IKN Nusantara', lng: 116.7000, lat: -0.9600, tier: 1, type: 'capital', align: 'left', minZoom: 4.4 },
  { name: 'Singkawang', lng: 108.9868, lat: 0.9071, tier: 2, type: 'city', align: 'right', minZoom: 5.5 },
  { name: 'Ketapang', lng: 109.9749, lat: -1.8486, tier: 2, type: 'city', align: 'right', minZoom: 5.5 },
  { name: 'Sintang', lng: 111.4988, lat: 0.0681, tier: 2, type: 'city', align: 'right', minZoom: 5.5 },
  { name: 'Sampit', lng: 112.9554, lat: -2.5312, tier: 2, type: 'city', align: 'right', minZoom: 5.5 },
  { name: 'Tarakan', lng: 117.5965, lat: 3.3271, tier: 2, type: 'city', align: 'right', minZoom: 5.5 },
  { name: 'Tanjung Selor', lng: 117.3644, lat: 2.8427, tier: 2, type: 'capital', align: 'right', minZoom: 5.5 },

  // --- JAWA ---
  { name: 'Jakarta', lng: 106.8456, lat: -6.2088, tier: 1, type: 'capital', align: 'top', minZoom: 3.0 },
  { name: 'Surabaya', lng: 112.7521, lat: -7.2575, tier: 1, type: 'capital', align: 'right', minZoom: 3.0 },
  { name: 'Bandung', lng: 107.6191, lat: -6.9175, tier: 1, type: 'capital', align: 'bottom', minZoom: 4.2 },
  { name: 'Semarang', lng: 110.4208, lat: -6.9932, tier: 1, type: 'capital', align: 'top', minZoom: 4.2 },
  { name: 'Yogyakarta', lng: 110.3695, lat: -7.7956, tier: 1, type: 'capital', align: 'bottom', minZoom: 4.4 },
  { name: 'Surakarta', lng: 110.8283, lat: -7.5755, tier: 2, type: 'city', align: 'right', minZoom: 5.5 },
  { name: 'Malang', lng: 112.6326, lat: -7.9666, tier: 2, type: 'city', align: 'bottom', minZoom: 5.5 },
  { name: 'Cirebon', lng: 108.5570, lat: -6.7063, tier: 2, type: 'city', align: 'top', minZoom: 5.5 },
  { name: 'Serang', lng: 106.1503, lat: -6.1104, tier: 2, type: 'capital', align: 'left', minZoom: 5.5 },
  { name: 'Banyuwangi', lng: 114.3692, lat: -8.2192, tier: 2, type: 'city', align: 'right', minZoom: 5.5 },

  // --- SUMATERA ---
  { name: 'Medan', lng: 98.6722, lat: 3.5952, tier: 1, type: 'capital', align: 'right', minZoom: 3.0 },
  { name: 'Palembang', lng: 104.7565, lat: -2.9761, tier: 1, type: 'capital', align: 'right', minZoom: 3.8 },
  { name: 'Pekanbaru', lng: 101.4478, lat: 0.5071, tier: 1, type: 'capital', align: 'right', minZoom: 4.2 },
  { name: 'Padang', lng: 100.3543, lat: -0.9471, tier: 1, type: 'capital', align: 'right', minZoom: 4.2 },
  { name: 'Bandar Lampung', lng: 105.2663, lat: -5.4500, tier: 1, type: 'capital', align: 'top', minZoom: 4.2 },
  { name: 'Batam', lng: 104.0305, lat: 1.1301, tier: 1, type: 'major', align: 'bottom', minZoom: 4.2 },
  { name: 'Jambi', lng: 103.6131, lat: -1.6101, tier: 1, type: 'capital', align: 'right', minZoom: 4.2 },
  { name: 'Bengkulu', lng: 102.2655, lat: -3.8004, tier: 1, type: 'capital', align: 'right', minZoom: 4.4 },
  { name: 'Banda Aceh', lng: 95.3238, lat: 5.5483, tier: 1, type: 'capital', align: 'right', minZoom: 3.8 },
  { name: 'Pangkalpinang', lng: 106.1161, lat: -2.1333, tier: 2, type: 'capital', align: 'right', minZoom: 5.5 },
  { name: 'Tanjungpinang', lng: 104.4447, lat: 0.9167, tier: 2, type: 'capital', align: 'bottom', minZoom: 5.5 },

  // --- SULAWESI ---
  { name: 'Makassar', lng: 119.4327, lat: -5.1477, tier: 1, type: 'capital', align: 'right', minZoom: 3.0 },
  { name: 'Manado', lng: 124.8489, lat: 1.4748, tier: 1, type: 'capital', align: 'right', minZoom: 3.8 },
  { name: 'Palu', lng: 119.8707, lat: -0.9003, tier: 1, type: 'capital', align: 'right', minZoom: 4.2 },
  { name: 'Kendari', lng: 122.5126, lat: -3.9985, tier: 1, type: 'capital', align: 'right', minZoom: 4.2 },
  { name: 'Gorontalo', lng: 123.0595, lat: 0.5435, tier: 1, type: 'capital', align: 'top', minZoom: 4.2 },
  { name: 'Mamuju', lng: 118.8872, lat: -2.6789, tier: 1, type: 'capital', align: 'right', minZoom: 4.4 },

  // --- BALI & NUSA TENGGARA ---
  { name: 'Denpasar', lng: 115.2167, lat: -8.6705, tier: 1, type: 'capital', align: 'bottom', minZoom: 3.6 },
  { name: 'Mataram', lng: 116.1165, lat: -8.5833, tier: 1, type: 'capital', align: 'bottom', minZoom: 4.2 },
  { name: 'Kupang', lng: 123.5833, lat: -10.1772, tier: 1, type: 'capital', align: 'right', minZoom: 4.0 },
  { name: 'Labuan Bajo', lng: 119.8878, lat: -8.4964, tier: 2, type: 'city', align: 'top', minZoom: 5.5 },

  // --- MALUKU & PAPUA ---
  { name: 'Jayapura', lng: 140.7181, lat: -2.5337, tier: 1, type: 'capital', align: 'right', minZoom: 3.0 },
  { name: 'Ambon', lng: 128.1814, lat: -3.6954, tier: 1, type: 'capital', align: 'right', minZoom: 3.8 },
  { name: 'Sorong', lng: 131.2500, lat: -0.8833, tier: 1, type: 'capital', align: 'right', minZoom: 4.0 },
  { name: 'Ternate', lng: 127.3833, lat: 0.7833, tier: 1, type: 'capital', align: 'right', minZoom: 4.0 },
  { name: 'Manokwari', lng: 134.0620, lat: -0.8615, tier: 1, type: 'capital', align: 'right', minZoom: 4.2 },
  { name: 'Merauke', lng: 140.4000, lat: -8.4667, tier: 1, type: 'capital', align: 'right', minZoom: 4.0 },
  { name: 'Timika', lng: 136.8833, lat: -4.5444, tier: 2, type: 'city', align: 'right', minZoom: 5.5 },
  { name: 'Biak', lng: 136.0827, lat: -1.1764, tier: 2, type: 'city', align: 'top', minZoom: 5.5 },

  // --- REGIONAL INTERNASIONAL ---
  { name: 'Singapore', lng: 103.8198, lat: 1.3521, tier: 1, type: 'international', align: 'right', minZoom: 3.0 },
  { name: 'Kuala Lumpur', lng: 101.6869, lat: 3.1390, tier: 1, type: 'international', align: 'right', minZoom: 3.8 },
  { name: 'Kuching', lng: 110.3592, lat: 1.5533, tier: 2, type: 'city', align: 'right', minZoom: 5.5 },
  { name: 'Bandar Seri Begawan', lng: 114.9481, lat: 4.9031, tier: 1, type: 'international', align: 'right', minZoom: 4.0 },
  { name: 'Dili', lng: 125.5736, lat: -8.5586, tier: 1, type: 'international', align: 'right', minZoom: 4.0 },
  { name: 'Davao City', lng: 125.6128, lat: 7.0731, tier: 2, type: 'international', align: 'right', minZoom: 5.5 },
];

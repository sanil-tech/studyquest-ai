// Daerah (districts) for each Malaysian state/territory
// Used for profile pre-fill to ensure consistent district names for leaderboard filtering.

export const MALAYSIA_DISTRICTS = {
  "Johor": ["Batu Pahat", "Johor Bahru", "Kluang", "Kota Tinggi", "Kulai", "Mersing", "Muar", "Pontian", "Segamat", "Tangkak"],
  "Kedah": ["Baling", "Bandar Baharu", "Kota Setar", "Kubang Pasu", "Kuala Muda", "Kulim", "Langkawi", "Padang Terap", "Pendang", "Pokok Sena", "Sik", "Yan"],
  "Kelantan": ["Bachok", "Gua Musang", "Jeli", "Kota Bharu", "Kuala Krai", "Machang", "Pasir Mas", "Pasir Puteh", "Tanah Merah", "Tumpat"],
  "Melaka": ["Alor Gajah", "Jasin", "Melaka Tengah"],
  "Negeri Sembilan": ["Jempol", "Jelebu", "Kuala Pilah", "Port Dickson", "Rembau", "Seremban", "Tampin"],
  "Pahang": ["Bera", "Cameron Highlands", "Jerantut", "Kuantan", "Lipis", "Maran", "Pekan", "Raub", "Rompin", "Temerloh"],
  "Pulau Pinang": ["Barat Daya", "Seberang Perai Tengah", "Seberang Perai Utara", "Seberang Perai Selatan", "Timur Laut"],
  "Perak": ["Bagan Datuk", "Batang Padang", "Hilir Perak", "Hulu Perak", "Kampar", "Kerian", "Kinta", "Kuala Kangsar", "Larut, Matang & Selama", "Manjung", "Muallim", "Perak Tengah", "Tapah", "Teluk Intan"],
  "Perlis": ["Padang Besar", "Arau", "Kangar"],
  "Sabah": ["Beaufort", "Beluran", "Keningau", "Kinabatangan", "Kota Belud", "Kota Kinabalu", "Kuala Penyu", "Kudat", "Lahad Datu", "Nabawan", "Penampang", "Papar", "Putatan", "Ranau", "Sandakan", "Semporna", "Sipitang", "Tambunan", "Tawau", "Tongod"],
  "Sarawak": ["Asajaya", "Bau", "Belaga", "Bintulu", "Dalat", "Daro", "Julau", "Kabong", "Kanowit", "Kapit", "Kuching", "Lawas", "Limbang", "Lubok Antu", "Lundu", "Maradong", "Marudi", "Matu", "Miri", "Mukah", "Pakan", "Sadong", "Samarahan", "Sarikei", "Sebauh", "Selangau", "Serian", "Simunjan", "Song", "Sri Aman", "Subis", "Tatau", "Tanjung Manis"],
  "Selangor": ["Gombak", "Hulu Langat", "Hulu Selangor", "Klang", "Kuala Langat", "Kuala Selangor", "Petaling", "Sabak Bernam", "Sepang"],
  "Terengganu": ["Besut", "Dungun", "Hulu Terengganu", "Kemaman", "Kuala Nerus", "Kuala Terengganu", "Marang", "Setiu"],
  "W.P. Kuala Lumpur": ["Wilayah Persekutuan Kuala Lumpur"],
  "W.P. Putrajaya": ["Wilayah Persekutuan Putrajaya"],
  "W.P. Labuan": ["Wilayah Persekutuan Labuan"],
};

export const MALAYSIA_STATES = Object.keys(MALAYSIA_DISTRICTS);

export function getDistrictsForState(state) {
  return MALAYSIA_DISTRICTS[state] || [];
}
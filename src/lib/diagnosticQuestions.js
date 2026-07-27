// src/lib/diagnosticQuestions.js
// Static question bank for the 3M Learning Readiness Diagnostic.
// Pre-defined questions — NO AI generation needed per assessment.
// AI is only used ONCE at the end to analyse results.

export const DIAGNOSTIC_MODULES = [
  // ================================================================
  // MODULE 1: MEMBACA (READING)
  // ================================================================
  {
    id: "membaca",
    title: "Membaca",
    subtitle: "Kemahiran Membaca",
    icon: "📖",
    color: "emerald",
    maxResultLevel: 4,
    levels: [
      {
        level: 1,
        title: "Kenal Huruf",
        description: "Mengenal huruf besar dan kecil",
        skill: "letter_recognition",
        skillDisplayName: "Pengenalan Huruf",
        questions: [
          { id: "mb1q1", question: "Apakah huruf ini?", display: "A", options: ["A", "B", "C", "D"], correct: "A" },
          { id: "mb1q2", question: "Apakah huruf ini?", display: "b", options: ["a", "b", "c", "d"], correct: "b" },
          { id: "mb1q3", question: "Apakah huruf ini?", display: "S", options: ["S", "Z", "X", "C"], correct: "S" },
          { id: "mb1q4", question: "Apakah huruf ini?", display: "m", options: ["n", "m", "w", "v"], correct: "m" },
        ],
      },
      {
        level: 2,
        title: "Gabung Bunyi",
        description: "Suku kata dan gabungan bunyi",
        skill: "syllable_blending",
        skillDisplayName: "Gabungan Suku Kata",
        questions: [
          { id: "mb2q1", question: "Gabungkan suku kata ini:", display: "ba + ju", options: ["baju", "bajau", "bahu", "buju"], correct: "baju" },
          { id: "mb2q2", question: "Gabungkan suku kata ini:", display: "ma + ta", options: ["mata", "mita", "maza", "matu"], correct: "mata" },
          { id: "mb2q3", question: "Gabungkan suku kata ini:", display: "sa + pu", options: ["sapu", "sipo", "supa", "sapo"], correct: "sapu" },
          { id: "mb2q4", question: "Gabungkan suku kata ini:", display: "ta + hu", options: ["tahu", "tohu", "tuha", "tahi"], correct: "tahu" },
        ],
      },
      {
        level: 3,
        title: "Baca Perkataan",
        description: "Membaca perkataan mudah",
        skill: "word_reading",
        skillDisplayName: "Membaca Perkataan",
        questions: [
          { id: "mb3q1", question: "Perkataan manakah bermaksud bola?", display: "⚽", options: ["bola", "buku", "rumah", "mata"], correct: "bola" },
          { id: "mb3q2", question: "Perkataan manakah bermaksud buku?", display: "📚", options: ["bola", "buku", "rumah", "mata"], correct: "buku" },
          { id: "mb3q3", question: "Perkataan manakah bermaksud rumah?", display: "🏠", options: ["bola", "buku", "rumah", "mata"], correct: "rumah" },
          { id: "mb3q4", question: "Perkataan manakah bermaksud mata?", display: "👁️", options: ["bola", "buku", "rumah", "mata"], correct: "mata" },
        ],
      },
      {
        level: 4,
        title: "Baca Ayat Mudah",
        description: "Memahami ayat mudah",
        skill: "sentence_reading",
        skillDisplayName: "Pemahaman Ayat",
        questions: [
          { id: "mb4q1", question: "Ali makan nasi. Apa Ali buat?", display: "Ali makan nasi.", options: ["Makan", "Tidur", "Main", "Baca"], correct: "Makan" },
          { id: "mb4q2", question: "Ibu masak kuih. Apa Ibu buat?", display: "Ibu masak kuih.", options: ["Masak", "Makan", "Jual", "Beli"], correct: "Masak" },
          { id: "mb4q3", question: "Kucing minum susu. Apa kucing buat?", display: "Kucing minum susu.", options: ["Makan", "Minum", "Tidur", "Lari"], correct: "Minum" },
          { id: "mb4q4", question: "Adik main bola. Apa adik buat?", display: "Adik main bola.", options: ["Makan", "Minum", "Main", "Tidur"], correct: "Main" },
        ],
      },
    ],
    levelDescriptions: {
      1: "Belum mengenal huruf",
      2: "Mengenal huruf tetapi belum membaca",
      3: "Boleh membaca perkataan mudah",
      4: "Boleh membaca ayat mudah",
    },
    levelRecommendations: {
      1: "Mulakan dengan aktiviti pengenalan huruf dan suara huruf.",
      2: "Latih gabungan suku kata (ba, ma, sa, ta) sebelum membaca perkataan.",
      3: "Latih membaca perkataan mudah dan ayat pendek setiap hari.",
      4: "Pelajar sedia untuk pelajaran membaca tahap pendidikan formal.",
    },
  },

  // ================================================================
  // MODULE 2: MENULIS (WRITING)
  // ================================================================
  {
    id: "menulis",
    title: "Menulis",
    subtitle: "Kemahiran Menulis",
    icon: "✏️",
    color: "blue",
    maxResultLevel: 4,
    levels: [
      {
        level: 1,
        title: "Motor Menulis",
        description: "Koordinasi motor dan bentuk asas",
        skill: "motor_writing",
        skillDisplayName: "Koordinasi Motor",
        questions: [
          { id: "mn1q1", question: "Bentuk manakah bulatan?", display: "Pilih bulatan", options: ["⬛", "⬤", "🔺", "⭐"], correct: "⬤" },
          { id: "mn1q2", question: "Bentuk manakah segitiga?", display: "Pilih segitiga", options: ["⬛", "⬤", "🔺", "⭐"], correct: "🔺" },
          { id: "mn1q3", question: "Bentuk manakah petak?", display: "Pilih petak", options: ["⬛", "⬤", "🔺", "⭐"], correct: "⬛" },
          { id: "mn1q4", question: "Bentuk manakah bintang?", display: "Pilih bintang", options: ["⬛", "⬤", "🔺", "⭐"], correct: "⭐" },
        ],
      },
      {
        level: 2,
        title: "Menulis Huruf",
        description: "Mengenal dan menulis huruf",
        skill: "letter_writing",
        skillDisplayName: "Penulisan Huruf",
        questions: [
          { id: "mn2q1", question: "Huruf 'B' yang manakah betul?", display: "Pilih huruf B", options: ["B", "D", "P", "R"], correct: "B" },
          { id: "mn2q2", question: "Huruf 'd' yang manakah betul?", display: "Pilih huruf d", options: ["b", "d", "p", "q"], correct: "d" },
          { id: "mn2q3", question: "Huruf 'A' yang manakah betul?", display: "Pilih huruf A", options: ["A", "H", "R", "V"], correct: "A" },
          { id: "mn2q4", question: "Huruf 'p' yang manakah betul?", display: "Pilih huruf p", options: ["b", "d", "p", "q"], correct: "p" },
        ],
      },
      {
        level: 3,
        title: "Menulis Perkataan",
        description: "Menulis perkataan mudah",
        skill: "word_writing",
        skillDisplayName: "Penulisan Perkataan",
        questions: [
          { id: "mn3q1", question: "Perkataan 'buku' yang manakah betul?", display: "buku", options: ["buku", "buko", "buha", "uku"], correct: "buku" },
          { id: "mn3q2", question: "Perkataan 'bola' yang manakah betul?", display: "bola", options: ["bola", "bala", "bola", "dola"], correct: "bola" },
          { id: "mn3q3", question: "Perkataan 'susu' yang manakah betul?", display: "susu", options: ["susu", "susa", "sasi", "susu"], correct: "susu" },
          { id: "mn3q4", question: "Perkataan 'mata' yang manakah betul?", display: "mata", options: ["mata", "mota", "maza", "mata"], correct: "mata" },
        ],
      },
      {
        level: 4,
        title: "Menulis Ayat Mudah",
        description: "Menulis ayat dengan ejaan dan tanda baca",
        skill: "sentence_writing",
        skillDisplayName: "Penulisan Ayat",
        questions: [
          { id: "mn4q1", question: "Ayat yang manakah betul?", display: "Pilih ayat betul", options: ["Saya suka buku.", "Saya suka buku", "saya suka buku.", "saya suka buku"], correct: "Saya suka buku." },
          { id: "mn4q2", question: "Ayat yang manakah betul?", display: "Pilih ayat betul", options: ["Ali makan nasi.", "ali makan nasi", "Ali makan nasi", "ali makan nasi."], correct: "Ali makan nasi." },
          { id: "mn4q3", question: "Ejaan 'rumah' yang manakah betul?", display: "rumah", options: ["rumah", "rumha", "rumag", "rumoh"], correct: "rumah" },
          { id: "mn4q4", question: "Ayat yang manakah betul?", display: "Pilih ayat betul", options: ["Ibu masak kuih.", "ibu masak kuih", "Ibu masak kuih", "ibu masak kuih."], correct: "Ibu masak kuih." },
        ],
      },
    ],
    levelDescriptions: {
      1: "Memerlukan asas penulisan",
      2: "Boleh menulis huruf",
      3: "Boleh menulis perkataan",
      4: "Boleh menulis ayat mudah",
    },
    levelRecommendations: {
      1: "Latih aktiviti motor halus: mewarna, mengesan garisan dan bentuk.",
      2: "Latih menulis huruf besar dan kecil dengan panduan garisan.",
      3: "Latih menulis perkataan mudah dengan ejaan yang betul.",
      4: "Pelajar sedia untuk latihan penulisan ayat dan karangan pendek.",
    },
  },

  // ================================================================
  // MODULE 3: MENGIRA (NUMERACY)
  // ================================================================
  {
    id: "mengira",
    title: "Mengira",
    subtitle: "Kemahiran Mengira",
    icon: "🔢",
    color: "amber",
    maxResultLevel: 4,
    levels: [
      {
        level: 1,
        title: "Kenali Nombor",
        description: "Mengenal nombor 0-10",
        skill: "number_recognition",
        skillDisplayName: "Pengenalan Nombor",
        questions: [
          { id: "mg1q1", question: "Apakah nombor ini?", display: "5", options: ["3", "5", "7", "9"], correct: "5" },
          { id: "mg1q2", question: "Apakah nombor ini?", display: "8", options: ["6", "8", "0", "9"], correct: "8" },
          { id: "mg1q3", question: "Apakah nombor ini?", display: "0", options: ["1", "0", "10", "6"], correct: "0" },
          { id: "mg1q4", question: "Apakah nombor ini?", display: "3", options: ["2", "3", "5", "8"], correct: "3" },
        ],
      },
      {
        level: 2,
        title: "Kira",
        description: "Mengira objek",
        skill: "counting",
        skillDisplayName: "Mengira Objek",
        questions: [
          { id: "mg2q1", question: "Berapa epal ada?", display: "🍎🍎🍎", options: ["2", "3", "4", "5"], correct: "3" },
          { id: "mg2q2", question: "Berapa bintang ada?", display: "⭐⭐⭐⭐⭐", options: ["4", "5", "6", "7"], correct: "5" },
          { id: "mg2q3", question: "Berapa kucing ada?", display: "🐱🐱", options: ["1", "2", "3", "4"], correct: "2" },
          { id: "mg2q4", question: "Berapa bunga ada?", display: "🌸🌸🌸🌸", options: ["3", "4", "5", "6"], correct: "4" },
        ],
      },
      {
        level: 3,
        title: "Banding Nombor",
        description: "Membandingkan nombor",
        skill: "number_comparison",
        skillDisplayName: "Perbandingan Nombor",
        questions: [
          { id: "mg3q1", question: "Yang mana lebih besar?", display: "5 atau 8", options: ["5", "8", "Sama", "Tak tahu"], correct: "8" },
          { id: "mg3q2", question: "Yang mana lebih kecil?", display: "3 atau 7", options: ["3", "7", "Sama", "Tak tahu"], correct: "3" },
          { id: "mg3q3", question: "Yang mana lebih besar?", display: "12 atau 9", options: ["12", "9", "Sama", "Tak tahu"], correct: "12" },
          { id: "mg3q4", question: "Yang mana lebih kecil?", display: "15 atau 8", options: ["15", "8", "Sama", "Tak tahu"], correct: "8" },
        ],
      },
      {
        level: 4,
        title: "Kira Asas",
        description: "Operasi tambah dan tolak",
        skill: "basic_operations",
        skillDisplayName: "Operasi Asas",
        questions: [
          { id: "mg4q1", question: "Berapa jawapannya?", display: "3 + 2 = ?", options: ["4", "5", "6", "7"], correct: "5" },
          { id: "mg4q2", question: "Berapa jawapannya?", display: "5 - 2 = ?", options: ["2", "3", "4", "7"], correct: "3" },
          { id: "mg4q3", question: "Berapa jawapannya?", display: "4 + 3 = ?", options: ["6", "7", "8", "9"], correct: "7" },
          { id: "mg4q4", question: "Berapa jawapannya?", display: "6 - 3 = ?", options: ["2", "3", "4", "9"], correct: "3" },
        ],
      },
      {
        level: 5,
        title: "Penyelesaian Masalah",
        description: "Masalah mudah dalam kehidupan",
        skill: "problem_solving",
        skillDisplayName: "Penyelesaian Masalah",
        questions: [
          { id: "mg5q1", question: "Ali ada 3 epal. Ibu beri 2 lagi. Berapa jumlah?", display: "🍎🍎🍎 + 🍎🍎", options: ["4", "5", "6", "7"], correct: "5" },
          { id: "mg5q2", question: "Siti ada 5 gula-gula. Dia makan 2. Berapa lagi?", display: "🍬🍬🍬🍬🍬 → makan 2", options: ["2", "3", "4", "7"], correct: "3" },
          { id: "mg5q3", question: "Ada 4 burung di pokok. 1 terbang pergi. Berapa lagi?", display: "🐦🐦🐦🐦 → 1 terbang", options: ["2", "3", "4", "5"], correct: "3" },
          { id: "mg5q4", question: "Kakak ada 2 pensel. Abang beri 3 lagi. Berapa jumlah?", display: "✏️✏️ + ✏️✏️✏️", options: ["4", "5", "6", "7"], correct: "5" },
        ],
      },
    ],
    levelDescriptions: {
      1: "Memerlukan asas nombor",
      2: "Boleh mengenal nombor",
      3: "Boleh melakukan kiraan asas",
      4: "Boleh menyelesaikan masalah mudah",
    },
    levelRecommendations: {
      1: "Mulakan dengan aktiviti mengenali nombor 0-10 menggunakan objek konkrit.",
      2: "Latih mengira objek sehingga 10, kemudian sehingga 20.",
      3: "Latih operasi tambah dan tolak dengan objek dan gambar.",
      4: "Pelajar sedia untuk masalah matematik yang lebih kompleks.",
    },
  },
];

// Pass threshold: student must get ≥75% correct to proceed to next level
export const PASS_THRESHOLD = 0.75;

// Calculate mastery level from score percentage
export function getMasteryLevel(scorePercent) {
  if (scorePercent >= 75) return "strong";
  if (scorePercent >= 50) return "good";
  return "developing";
}

// Calculate result level from levels passed
export function getResultLevel(levelsPassed, maxResultLevel) {
  return Math.min(levelsPassed + 1, maxResultLevel);
}

// Get mastery emoji
export function getMasteryEmoji(mastery) {
  switch (mastery) {
    case "strong": return "🟢";
    case "good": return "🟡";
    case "developing": return "🔴";
    default: return "⚪";
  }
}

// Get mastery label in Malay
export function getMasteryLabel(mastery) {
  switch (mastery) {
    case "strong": return "Cemerlang";
    case "good": return "Berkembang";
    case "developing": return "Perlu Latihan";
    default: return "Belum Dinilai";
  }
}
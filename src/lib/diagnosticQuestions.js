// src/lib/diagnosticQuestions.js
// Comprehensive KPM-aligned question bank for the 3M Learning Readiness Diagnostic.
// Based on Ujian Diagnostik Pemulihan Khas KPM (UD Lisan & UD Menulis).
// Question types: "mcq" (multiple choice), "voice" (read aloud), "image_upload" (handwriting photo).
// AI is only used ONCE at the end to analyse results + review uploaded handwriting images.

export const DIAGNOSTIC_MODULES = [
  // ================================================================
  // MODULE 1: MEMBACA (READING) — 6 Levels, KPM Skills 1-32
  // ================================================================
  {
    id: "membaca",
    title: "Membaca",
    subtitle: "Kemahiran Membaca (UD Lisan KPM)",
    icon: "📖",
    color: "emerald",
    maxResultLevel: 6,
    levels: [
      {
        level: 1,
        title: "Pengenalan Huruf",
        description: "Mengenal abjad kecil, besar & vokal (Kemahiran 1-3)",
        skill: "letter_recognition",
        skillDisplayName: "Pengenalan Huruf",
        questions: [
          { id: "mb1q1", type: "mcq", question: "Huruf kecil manakah ini?", display: "b", options: ["a", "b", "d", "p"], correct: "b" },
          { id: "mb1q2", type: "mcq", question: "Huruf besar manakah ini?", display: "G", options: ["C", "G", "O", "Q"], correct: "G" },
          { id: "mb1q3", type: "mcq", question: "Huruf vokal yang mana?", display: "🍎", options: ["a", "b", "k", "m"], correct: "a" },
          { id: "mb1q4", type: "mcq", question: "Huruf vokal yang mana?", display: "🐘", options: ["g", "e", "k", "l"], correct: "e" },
        ],
      },
      {
        level: 2,
        title: "Suku Kata & Perkataan KV",
        description: "Suku kata KV, KV+KV, V+KV (Kemahiran 4-6)",
        skill: "syllable_blending",
        skillDisplayName: "Suku Kata & Perkataan KV",
        questions: [
          { id: "mb2q1", type: "mcq", question: "Gabung suku kata:", display: "bu + ku", options: ["buku", "buko", "buka", "buki"], correct: "buku" },
          { id: "mb2q2", type: "mcq", question: "Gabung suku kata:", display: "i + si", options: ["isi", "asu", "itu", "ibi"], correct: "isi" },
          { id: "mb2q3", type: "mcq", question: "Perkataan untuk gambar ini?", display: "🐎", options: ["kuda", "kuca", "kuda", "kuta"], correct: "kuda" },
          { id: "mb2q4", type: "voice", question: "Baca perkataan ini dengan kuat:", display: "meja", correct: "meja" },
        ],
      },
      {
        level: 3,
        title: "Perkataan KVK & Gabungan",
        description: "KV+KV+KV, KVK, suku KVK, V+KVK (Kemahiran 7-10)",
        skill: "kvk_reading",
        skillDisplayName: "Perkataan KVK",
        questions: [
          { id: "mb3q1", type: "mcq", question: "Baca perkataan:", display: "kerusi", options: ["kerusi", "keruti", "kerosi", "kerisi"], correct: "kerusi" },
          { id: "mb3q2", type: "mcq", question: "Perkataan KVK untuk gambar?", display: "🚌", options: ["bas", "bes", "bis", "bus"], correct: "bas" },
          { id: "mb3q3", type: "mcq", question: "Baca perkataan:", display: "biskut", options: ["biskut", "biskat", "beskot", "biskot"], correct: "biskut" },
          { id: "mb3q4", type: "voice", question: "Baca perkataan ini:", display: "ayam", correct: "ayam" },
        ],
      },
      {
        level: 4,
        title: "Rangkai Kata",
        description: "KV+KVK, KVK+KV, KVK+KVK, KV+KV+KVK (Kemahiran 11-16)",
        skill: "phrase_reading",
        skillDisplayName: "Rangkai Kata",
        questions: [
          { id: "mb4q1", type: "mcq", question: "Rangkai kata yang betul?", display: "tujuh kotak", options: ["tujuh kotak", "tujuh ketak", "tujih kotak", "tujuh kutak"], correct: "tujuh kotak" },
          { id: "mb4q2", type: "mcq", question: "Perkataan untuk gambar?", display: "🐄", options: ["lembu", "lembi", "lemba", "lambu"], correct: "lembu" },
          { id: "mb4q3", type: "mcq", question: "Baca perkataan:", display: "bantal", options: ["bantal", "bantel", "bontal", "bantol"], correct: "bantal" },
          { id: "mb4q4", type: "voice", question: "Baca rangkai kata ini:", display: "cawan putih", correct: "cawan putih" },
        ],
      },
      {
        level: 5,
        title: "Ayat",
        description: "Ayat mudah & ayat majmuk (Kemahiran 17-24)",
        skill: "sentence_reading",
        skillDisplayName: "Bacaan Ayat",
        questions: [
          { id: "mb5q1", type: "mcq", question: "Ali makan nasi. Apa Ali buat?", display: "Ali makan nasi.", options: ["Makan", "Tidur", "Main", "Baca"], correct: "Makan" },
          { id: "mb5q2", type: "mcq", question: "Ayat yang betul?", display: "Pilih ayat betul", options: ["Ibu masak kuih.", "ibu masak kuih", "Ibu masak kuih", "ibu masak kuih."], correct: "Ibu masak kuih." },
          { id: "mb5q3", type: "mcq", question: "Siti buat apa?", display: "Siti baca buku di rumah.", options: ["Baca buku", "Main bola", "Tidur", "Makan"], correct: "Baca buku" },
          { id: "mb5q4", type: "voice", question: "Baca ayat ini:", display: "Adik main bola di padang.", correct: "adik main bola di padang" },
        ],
      },
      {
        level: 6,
        title: "Pemahaman & Perenggan",
        description: "Baca perenggan & jawab soalan (Kemahiran 25-32)",
        skill: "comprehension",
        skillDisplayName: "Pemahaman",
        questions: [
          { id: "mb6q1", type: "mcq", question: "Siapa pergi ke kedai?", display: "Ibu pergi ke kedai membeli sayur.", options: ["Ibu", "Ayah", "Adik", "Kakak"], correct: "Ibu" },
          { id: "mb6q2", type: "mcq", question: "Apa Ibu beli?", display: "Ibu pergi ke kedai membeli sayur.", options: ["Sayur", "Buku", "Bola", "Kuih"], correct: "Sayur" },
          { id: "mb6q3", type: "mcq", question: "Di mana Ibu pergi?", display: "Ibu pergi ke kedai membeli sayur.", options: ["Kedai", "Sekolah", "Padang", "Rumah"], correct: "Kedai" },
          { id: "mb6q4", type: "voice", question: "Baca perenggan ini:", display: "Pagi ini, Ahmad pergi ke sekolah. Dia berjalan bersama rakannya. Mereka gembira.", correct: "pagi ini ahmad pergi ke sekolah dia berjalan bersama rakanya mereka gembira" },
        ],
      },
    ],
    levelDescriptions: {
      1: "Belum mengenal huruf",
      2: "Mengenal huruf, belum membaca suku kata",
      3: "Boleh membaca perkataan KVK",
      4: "Boleh membaca rangkai kata",
      5: "Boleh membaca ayat mudah",
      6: "Boleh membaca perenggan & memahami",
    },
    levelRecommendations: {
      1: "Mulakan dengan aktiviti pengenalan huruf dan sebutan bunyi huruf setiap hari.",
      2: "Latih gabungan suku kata KV (ba, ma, sa, ta) sebelum membaca perkataan penuh.",
      3: "Latih perkataan KVK (bas, beg, pen) dan suku kata KVK dalam perkataan.",
      4: "Latih membaca rangkai kata dan frasa pendek dengan lancer.",
      5: "Latih membaca ayat mudah dan ayat majmuk sehingga lancer.",
      6: "Pelajar sedia untuk pelajaran membaca tahap pendidikan formal penuh.",
    },
  },

  // ================================================================
  // MODULE 2: MENULIS (WRITING) — 6 Levels, KPM Skills 1-32
  // ================================================================
  {
    id: "menulis",
    title: "Menulis",
    subtitle: "Kemahiran Menulis (UD Menulis KPM)",
    icon: "✏️",
    color: "blue",
    maxResultLevel: 6,
    levels: [
      {
        level: 1,
        title: "Penulisan Huruf",
        description: "Tulis abjad kecil, besar & vokal (Kemahiran 1-3)",
        skill: "letter_writing",
        skillDisplayName: "Penulisan Huruf",
        questions: [
          { id: "mn1q1", type: "mcq", question: "Huruf kecil untuk 'A' ialah?", display: "A → ?", options: ["a", "e", "o", "u"], correct: "a" },
          { id: "mn1q2", type: "mcq", question: "Huruf besar untuk 'b' ialah?", display: "b → ?", options: ["B", "D", "P", "R"], correct: "B" },
          { id: "mn1q3", type: "mcq", question: "Vokal yang lengkapkan perkataan?", display: "🍎 → a_l", options: ["p", "e", "m", "k"], correct: "p" },
          { id: "mn1q4", type: "image_upload", question: "Tulis huruf 'A' dan 'a' di atas kertas, kemudian muat naik gambar.", display: "A a", correct: "A a" },
        ],
      },
      {
        level: 2,
        title: "Suku Kata & Perkataan KV",
        description: "Tulis suku kata KV & padankan perkataan (Kemahiran 4-6)",
        skill: "syllable_writing",
        skillDisplayName: "Penulisan Suku Kata",
        questions: [
          { id: "mn2q1", type: "mcq", question: "Suku kata untuk gambar ini?", display: "👀 → ma__", options: ["ta", "ba", "ka", "na"], correct: "ta" },
          { id: "mn2q2", type: "mcq", question: "Padankan: gambar buku?", display: "📚", options: ["buku", "meja", "labu", "bola"], correct: "buku" },
          { id: "mn2q3", type: "mcq", question: "Lengkapkan: 🥜 → __si", display: "🥜 → __si", options: ["ka", "ba", "bi", "ku"], correct: "ka" },
          { id: "mn2q4", type: "image_upload", question: "Tulis perkataan 'buku' di atas kertas, kemudian muat naik gambar.", display: "buku", correct: "buku" },
        ],
      },
      {
        level: 3,
        title: "Perkataan KVK & Padanan",
        description: "Lengkapkan & pilih perkataan KVK (Kemahiran 7-10)",
        skill: "kvk_writing",
        skillDisplayName: "Penulisan KVK",
        questions: [
          { id: "mn3q1", type: "mcq", question: "Lengkapkan: 🪑 → ker__si", display: "🪑 → ker__si", options: ["u", "a", "i", "o"], correct: "u" },
          { id: "mn3q2", type: "mcq", question: "Pilih perkataan KVK betul:", display: "🚌", options: ["bas", "bes", "bis", "bos"], correct: "bas" },
          { id: "mn3q3", type: "mcq", question: "Lengkapkan: 🧺 → __am__ah", display: "🧺 → __am__ah", options: ["s, p", "b, t", "k, p", "l, k"], correct: "s, p" },
          { id: "mn3q4", type: "image_upload", question: "Tulis perkataan 'bantal' di atas kertas, kemudian muat naik gambar.", display: "bantal", correct: "bantal" },
        ],
      },
      {
        level: 4,
        title: "Rangkai Kata",
        description: "Tulis & lengkapkan rangkai kata (Kemahiran 11-16)",
        skill: "phrase_writing",
        skillDisplayName: "Penulisan Rangkai Kata",
        questions: [
          { id: "mn4q1", type: "mcq", question: "Lengkapkan perkataan:", display: "bas__kal", options: ["i", "a", "u", "e"], correct: "i" },
          { id: "mn4q2", type: "mcq", question: "Pilih perkataan betul untuk 🐄:", display: "🐄", options: ["lembu", "lembi", "lambu", "lemba"], correct: "lembu" },
          { id: "mn4q3", type: "image_upload", question: "Tulis rangkai kata 'tujuh kotak' di atas kertas, kemudian muat naik gambar.", display: "tujuh kotak", correct: "tujuh kotak" },
          { id: "mn4q4", type: "image_upload", question: "Tulis perkataan 'selamat' di atas kertas, kemudian muat naik gambar.", display: "selamat", correct: "selamat" },
        ],
      },
      {
        level: 5,
        title: "Penulisan Ayat",
        description: "Tulis & lengkapkan ayat (Kemahiran 17-24)",
        skill: "sentence_writing",
        skillDisplayName: "Penulisan Ayat",
        questions: [
          { id: "mn5q1", type: "mcq", question: "Ayat yang betul?", display: "Pilih ayat betul", options: ["Saya suka buku.", "saya suka buku", "Saya suka buku", "saya suka buku."], correct: "Saya suka buku." },
          { id: "mn5q2", type: "mcq", question: "Ejaan 'rumah' yang betul?", display: "rumah", options: ["rumah", "rumha", "rumag", "rumoh"], correct: "rumah" },
          { id: "mn5q3", type: "image_upload", question: "Tulis ayat 'Ibu masak kuih.' di atas kertas, kemudian muat naik gambar.", display: "Ibu masak kuih.", correct: "Ibu masak kuih" },
          { id: "mn5q4", type: "image_upload", question: "Tulis ayat 'Adik main bola.' di atas kertas, kemudian muat naik gambar.", display: "Adik main bola.", correct: "Adik main bola" },
        ],
      },
      {
        level: 6,
        title: "Penulisan Perenggan",
        description: "Susun ayat & tulis perenggan (Kemahiran 25-32)",
        skill: "paragraph_writing",
        skillDisplayName: "Penulisan Perenggan",
        questions: [
          { id: "mn6q1", type: "mcq", question: "Susunan ayat yang betul?", display: "(1) pergi (2) sekolah (3) Ahmad (4) ke", options: ["3,1,4,2", "1,2,3,4", "3,4,2,1", "4,3,2,1"], correct: "3,1,4,2" },
          { id: "mn6q2", type: "mcq", question: "Tanda baca yang betul di hujung ayat?", display: "Ibu masak kuih_", options: [".", ",", "?", "!"], correct: "." },
          { id: "mn6q3", type: "image_upload", question: "Tulis ayat ini di atas kertas: 'Pagi ini saya pergi ke sekolah.' Kemudian muat naik gambar.", display: "Pagi ini saya pergi ke sekolah.", correct: "Pagi ini saya pergi ke sekolah" },
          { id: "mn6q4", type: "image_upload", question: "Tulis 2 ayat tentang gambar ini, kemudian muat naik gambar tulisan kamu.", display: "🌳🐦🌻", correct: "ayat tentang gambar" },
        ],
      },
    ],
    levelDescriptions: {
      1: "Memerlukan asas penulisan huruf",
      2: "Boleh menulis suku kata KV",
      3: "Boleh menulis perkataan KVK",
      4: "Boleh menulis rangkai kata",
      5: "Boleh menulis ayat mudah",
      6: "Boleh menulis perenggan pendek",
    },
    levelRecommendations: {
      1: "Latih aktiviti motor halus: mewarna, mengesan garisan, dan menulis huruf dengan panduan.",
      2: "Latih menulis suku kata KV (ba, ca, da, la) dengan ejaan yang betul.",
      3: "Latih menulis perkataan KVK (bas, beg, pen, dam) dengan panduan garisan.",
      4: "Latih menulis rangkai kata dan frasa pendek dengan ejaan yang betul.",
      5: "Latih menulis ayat mudah dengan huruf besar dan tanda baca yang betul.",
      6: "Pelajar sedia untuk latihan penulisan perenggan dan karangan pendek.",
    },
  },

  // ================================================================
  // MODULE 3: MENGIRA (NUMERACY) — 5 Levels
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
          { id: "mg1q1", type: "mcq", question: "Apakah nombor ini?", display: "5", options: ["3", "5", "7", "9"], correct: "5" },
          { id: "mg1q2", type: "mcq", question: "Apakah nombor ini?", display: "8", options: ["6", "8", "0", "9"], correct: "8" },
          { id: "mg1q3", type: "mcq", question: "Apakah nombor ini?", display: "0", options: ["1", "0", "10", "6"], correct: "0" },
          { id: "mg1q4", type: "mcq", question: "Apakah nombor ini?", display: "3", options: ["2", "3", "5", "8"], correct: "3" },
        ],
      },
      {
        level: 2,
        title: "Kira",
        description: "Mengira objek",
        skill: "counting",
        skillDisplayName: "Mengira Objek",
        questions: [
          { id: "mg2q1", type: "mcq", question: "Berapa epal ada?", display: "🍎🍎🍎", options: ["2", "3", "4", "5"], correct: "3" },
          { id: "mg2q2", type: "mcq", question: "Berapa bintang ada?", display: "⭐⭐⭐⭐⭐", options: ["4", "5", "6", "7"], correct: "5" },
          { id: "mg2q3", type: "mcq", question: "Berapa kucing ada?", display: "🐱🐱", options: ["1", "2", "3", "4"], correct: "2" },
          { id: "mg2q4", type: "mcq", question: "Berapa bunga ada?", display: "🌸🌸🌸🌸", options: ["3", "4", "5", "6"], correct: "4" },
        ],
      },
      {
        level: 3,
        title: "Banding Nombor",
        description: "Membandingkan nombor",
        skill: "number_comparison",
        skillDisplayName: "Perbandingan Nombor",
        questions: [
          { id: "mg3q1", type: "mcq", question: "Yang mana lebih besar?", display: "5 atau 8", options: ["5", "8", "Sama", "Tak tahu"], correct: "8" },
          { id: "mg3q2", type: "mcq", question: "Yang mana lebih kecil?", display: "3 atau 7", options: ["3", "7", "Sama", "Tak tahu"], correct: "3" },
          { id: "mg3q3", type: "mcq", question: "Yang mana lebih besar?", display: "12 atau 9", options: ["12", "9", "Sama", "Tak tahu"], correct: "12" },
          { id: "mg3q4", type: "mcq", question: "Yang mana lebih kecil?", display: "15 atau 8", options: ["15", "8", "Sama", "Tak tahu"], correct: "8" },
        ],
      },
      {
        level: 4,
        title: "Kira Asas",
        description: "Operasi tambah dan tolak",
        skill: "basic_operations",
        skillDisplayName: "Operasi Asas",
        questions: [
          { id: "mg4q1", type: "mcq", question: "Berapa jawapannya?", display: "3 + 2 = ?", options: ["4", "5", "6", "7"], correct: "5" },
          { id: "mg4q2", type: "mcq", question: "Berapa jawapannya?", display: "5 - 2 = ?", options: ["2", "3", "4", "7"], correct: "3" },
          { id: "mg4q3", type: "mcq", question: "Berapa jawapannya?", display: "4 + 3 = ?", options: ["6", "7", "8", "9"], correct: "7" },
          { id: "mg4q4", type: "mcq", question: "Berapa jawapannya?", display: "6 - 3 = ?", options: ["2", "3", "4", "9"], correct: "3" },
        ],
      },
      {
        level: 5,
        title: "Penyelesaian Masalah",
        description: "Masalah mudah dalam kehidupan",
        skill: "problem_solving",
        skillDisplayName: "Penyelesaian Masalah",
        questions: [
          { id: "mg5q1", type: "mcq", question: "Ali ada 3 epal. Ibu beri 2 lagi. Berapa jumlah?", display: "🍎🍎🍎 + 🍎🍎", options: ["4", "5", "6", "7"], correct: "5" },
          { id: "mg5q2", type: "mcq", question: "Siti ada 5 gula-gula. Dia makan 2. Berapa lagi?", display: "🍬🍬🍬🍬🍬 → makan 2", options: ["2", "3", "4", "7"], correct: "3" },
          { id: "mg5q3", type: "mcq", question: "Ada 4 burung di pokok. 1 terbang pergi. Berapa lagi?", display: "🐦🐦🐦🐦 → 1 terbang", options: ["2", "3", "4", "5"], correct: "3" },
          { id: "mg5q4", type: "mcq", question: "Kakak ada 2 pensel. Abang beri 3 lagi. Berapa jumlah?", display: "✏️✏️ + ✏️✏️✏️", options: ["4", "5", "6", "7"], correct: "5" },
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
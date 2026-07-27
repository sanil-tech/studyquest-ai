/**
 * Bank Soalan Diagnostik — MENGIRA (Matematik)
 * Berdasarkan: Program Pemulihan Khas — Ujian Diagnostik Matematik
 * Kemahiran 1–18 (Pra-Nombor hingga Penyelesaian Masalah)
 */

export const MENGIRA_QUESTIONS = [
  // ── KEMAHIRAN 1: PRA-NOMBOR (Warna, Saiz, Bentuk) ──────
  {
    id: "M-PRE-01", subject: "mengira", skill: "pre_number", sub_skill: "colours", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Apakah warna langit pada siang hari?", display: "Pilih warna langit:", options: ["Biru", "Merah", "Hitam", "Hijau"], correct: "Biru" }),
    answer: "Biru", explanation: "Langit siang berwarna biru.", layer: "screening",
  },
  {
    id: "M-PRE-02", subject: "mengira", skill: "pre_number", sub_skill: "colours", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Daun pokok berwarna apa?", display: "Pilih warna daun:", options: ["Hijau", "Merah", "Kuning", "Biru"], correct: "Hijau" }),
    answer: "Hijau", explanation: "Daun pokok berwarna hijau.", layer: "screening",
  },
  {
    id: "M-PRE-03", subject: "mengira", skill: "pre_number", sub_skill: "sizes", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Mana satu lebih BESAR?", display: "🐘 Gajah   atau   🐭 Tikus", options: ["Gajah", "Tikus", "Sama besar"], correct: "Gajah" }),
    answer: "Gajah", explanation: "Gajah lebih besar daripada tikus.", layer: "screening",
  },
  {
    id: "M-PRE-04", subject: "mengira", skill: "pre_number", sub_skill: "sizes", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Mana satu lebih KECIL?", display: "🌳 Pokok   atau   🌱 Benih", options: ["Benih", "Pokok", "Sama kecil"], correct: "Benih" }),
    answer: "Benih", explanation: "Benih lebih kecil daripada pokok.", layer: "screening",
  },
  {
    id: "M-PRE-05", subject: "mengira", skill: "pre_number", sub_skill: "shapes", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Apakah bentuk roda basikal?", display: "Pilih bentuk roda:", options: ["Bulat", "Segi empat", "Segi tiga", "Bintang"], correct: "Bulat" }),
    answer: "Bulat", explanation: "Roda berbentuk bulat (circle).", layer: "screening",
  },

  // ── KEMAHIRAN 2: KONSEP NOMBOR ───────────────────────────
  {
    id: "M-NUM-01", subject: "mengira", skill: "number_concept", sub_skill: "large_small", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Kumpulan mana yang LEBIH BANYAK?", display: "Kumpulan A: 🍎🍎🍎🍎🍎  |  Kumpulan B: 🍎🍎🍎", options: ["Kumpulan A (5 buah)", "Kumpulan B (3 buah)", "Sama banyak"], correct: "Kumpulan A (5 buah)" }),
    answer: "Kumpulan A (5 buah)", explanation: "Kumpulan A ada 5, Kumpulan B ada 3. Kumpulan A lebih banyak.", layer: "screening",
  },
  {
    id: "M-NUM-02", subject: "mengira", skill: "number_concept", sub_skill: "large_small", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Kumpulan mana yang LEBIH SEDIKIT?", display: "Kumpulan A: ⭐⭐  |  Kumpulan B: ⭐⭐⭐⭐⭐⭐", options: ["Kumpulan A (2 bintang)", "Kumpulan B (6 bintang)", "Sama banyak"], correct: "Kumpulan A (2 bintang)" }),
    answer: "Kumpulan A (2 bintang)", explanation: "Kumpulan A ada 2, lebih sedikit dari B yang ada 6.", layer: "screening",
  },
  {
    id: "M-NUM-03", subject: "mengira", skill: "number_concept", sub_skill: "equal", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Adakah kedua-dua kumpulan SAMA BANYAK?", display: "Kumpulan A: 🌸🌸🌸🌸  |  Kumpulan B: 🌺🌺🌺🌺", options: ["Ya, sama banyak (4 = 4)", "Tidak, berlainan"], correct: "Ya, sama banyak (4 = 4)" }),
    answer: "Ya, sama banyak (4 = 4)", explanation: "Kedua-dua kumpulan ada 4. Sama banyak.", layer: "screening",
  },

  // ── KEMAHIRAN 3: MENGENAL NOMBOR 1–10 ───────────────────
  {
    id: "M-N10-01", subject: "mengira", skill: "number_1_10", sub_skill: "match_figure", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Berapa banyak bintang ini? ⭐⭐⭐", display: "Kira: ⭐⭐⭐", options: ["1", "2", "3", "4"], correct: "3" }),
    answer: "3", explanation: "Terdapat 3 bintang.", layer: "screening",
  },
  {
    id: "M-N10-02", subject: "mengira", skill: "number_1_10", sub_skill: "match_figure", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Berapa banyak epal? 🍎🍎🍎🍎🍎🍎🍎", display: "Kira: 🍎🍎🍎🍎🍎🍎🍎", options: ["5", "6", "7", "8"], correct: "7" }),
    answer: "7", explanation: "Terdapat 7 epal.", layer: "screening",
  },
  {
    id: "M-N10-03", subject: "mengira", skill: "number_1_10", sub_skill: "value_6_10", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Nombor manakah lebih besar?", display: "8   atau   6", options: ["8", "6", "Sama"], correct: "8" }),
    answer: "8", explanation: "8 lebih besar daripada 6.", layer: "screening",
  },
  {
    id: "M-N10-04", subject: "mengira", skill: "number_sequence", sub_skill: "ascending", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Nombor yang hilang: 1, 2, __, 4, 5", display: "1, 2, ___, 4, 5", options: ["3", "6", "0", "7"], correct: "3" }),
    answer: "3", explanation: "Turutan menaik: 1, 2, 3, 4, 5.", layer: "screening",
  },
  {
    id: "M-N10-05", subject: "mengira", skill: "number_sequence", sub_skill: "descending", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Nombor yang hilang: 9, 8, __, 6, 5", display: "9, 8, ___, 6, 5", options: ["7", "4", "10", "6"], correct: "7" }),
    answer: "7", explanation: "Turutan menurun: 9, 8, 7, 6, 5.", layer: "screening",
  },
  {
    id: "M-N10-06", subject: "mengira", skill: "number_sequence", sub_skill: "before_after", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Nombor sebelum 6 ialah?", display: "___ , 6", options: ["5", "7", "4", "8"], correct: "5" }),
    answer: "5", explanation: "Nombor sebelum 6 ialah 5.", layer: "screening",
  },
  {
    id: "M-N10-07", subject: "mengira", skill: "number_sequence", sub_skill: "between", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Nombor di antara 3 dan 5?", display: "3, ___, 5", options: ["4", "2", "6", "1"], correct: "4" }),
    answer: "4", explanation: "Nombor di antara 3 dan 5 ialah 4.", layer: "screening",
  },

  // ── KEMAHIRAN 4: TAMBAH ≤10 ──────────────────────────────
  {
    id: "M-ADD10-01", subject: "mengira", skill: "addition_10", sub_skill: "combination", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "🍎🍎 + 🍎🍎🍎 = ?", display: "2 + 3 = ___", options: ["4", "5", "6", "3"], correct: "5" }),
    answer: "5", explanation: "2 + 3 = 5.", layer: "screening",
  },
  {
    id: "M-ADD10-02", subject: "mengira", skill: "addition_10", sub_skill: "horizontal", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "4 + 3 = ?", display: "4 + 3 = ___", options: ["6", "7", "8", "5"], correct: "7" }),
    answer: "7", explanation: "4 + 3 = 7.", layer: "screening",
  },
  {
    id: "M-ADD10-03", subject: "mengira", skill: "addition_10", sub_skill: "horizontal", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "1 + 8 = ?", display: "1 + 8 = ___", options: ["7", "8", "9", "10"], correct: "9" }),
    answer: "9", explanation: "1 + 8 = 9.", layer: "screening",
  },
  {
    id: "M-ADD10-04", subject: "mengira", skill: "addition_10", sub_skill: "vertical", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "6 + 3 = ? (bentuk lazim)", display: "  6\n+ 3\n——", options: ["8", "9", "7", "10"], correct: "9" }),
    answer: "9", explanation: "6 + 3 = 9.", layer: "screening",
  },
  {
    id: "M-ADD10-05", subject: "mengira", skill: "addition_10", sub_skill: "vertical", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "5 + 4 = ? (bentuk lazim)", display: "  5\n+ 4\n——", options: ["8", "10", "9", "7"], correct: "9" }),
    answer: "9", explanation: "5 + 4 = 9.", layer: "screening",
  },

  // ── KEMAHIRAN 5: TOLAK ≤10 ───────────────────────────────
  {
    id: "M-SUB10-01", subject: "mengira", skill: "subtraction_10", sub_skill: "separation", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Ada 9 bola. 3 diambil. Berapa tinggal?", display: "9 - 3 = ___", options: ["5", "6", "7", "4"], correct: "6" }),
    answer: "6", explanation: "9 - 3 = 6.", layer: "screening",
  },
  {
    id: "M-SUB10-02", subject: "mengira", skill: "subtraction_10", sub_skill: "horizontal", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "7 - 3 = ?", display: "7 - 3 = ___", options: ["3", "4", "5", "6"], correct: "4" }),
    answer: "4", explanation: "7 - 3 = 4.", layer: "screening",
  },
  {
    id: "M-SUB10-03", subject: "mengira", skill: "subtraction_10", sub_skill: "horizontal", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "9 - 0 = ?", display: "9 - 0 = ___", options: ["0", "8", "9", "10"], correct: "9" }),
    answer: "9", explanation: "9 - 0 = 9. Tolak sifar tidak mengubah nilai.", layer: "screening",
  },
  {
    id: "M-SUB10-04", subject: "mengira", skill: "subtraction_10", sub_skill: "vertical", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "8 - 5 = ? (bentuk lazim)", display: "  8\n- 5\n——", options: ["2", "3", "4", "5"], correct: "3" }),
    answer: "3", explanation: "8 - 5 = 3.", layer: "screening",
  },
  {
    id: "M-SUB10-05", subject: "mengira", skill: "subtraction_10", sub_skill: "vertical", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "9 - 3 = ? (bentuk lazim)", display: "  9\n- 3\n——", options: ["5", "6", "7", "4"], correct: "6" }),
    answer: "6", explanation: "9 - 3 = 6.", layer: "screening",
  },

  // ── KEMAHIRAN 6: NOMBOR 11–20 ────────────────────────────
  {
    id: "M-N20-01", subject: "mengira", skill: "number_11_20", sub_skill: "count_write", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Berapa banyak bintang? ⭐×13", display: "Kira: ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐", options: ["11", "12", "13", "14"], correct: "13" }),
    answer: "13", explanation: "Terdapat 13 bintang.", layer: "screening",
  },
  {
    id: "M-N20-02", subject: "mengira", skill: "number_11_20", sub_skill: "ascending", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Turutan menaik: 18, 12, 15, 17", display: "Susun dari kecil ke besar:", options: ["12, 15, 17, 18", "18, 17, 15, 12", "15, 12, 18, 17"], correct: "12, 15, 17, 18" }),
    answer: "12, 15, 17, 18", explanation: "Turutan menaik: 12, 15, 17, 18.", layer: "screening",
  },
  {
    id: "M-N20-03", subject: "mengira", skill: "number_11_20", sub_skill: "descending", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Turutan menurun: 20, 17, 14, 11", display: "Susun dari besar ke kecil:", options: ["20, 17, 14, 11", "11, 14, 17, 20", "20, 14, 17, 11"], correct: "20, 17, 14, 11" }),
    answer: "20, 17, 14, 11", explanation: "Turutan menurun: 20, 17, 14, 11.", layer: "screening",
  },

  // ── KEMAHIRAN 7 & 8: TAMBAH/TOLAK ≤18 ──────────────────
  {
    id: "M-ADD18-01", subject: "mengira", skill: "addition_18", sub_skill: "horizontal", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "5 + 7 = ?", display: "5 + 7 = ___", options: ["10", "11", "12", "13"], correct: "12" }),
    answer: "12", explanation: "5 + 7 = 12.", layer: "screening",
  },
  {
    id: "M-ADD18-02", subject: "mengira", skill: "addition_18", sub_skill: "horizontal", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "9 + 5 = ?", display: "9 + 5 = ___", options: ["13", "14", "15", "12"], correct: "14" }),
    answer: "14", explanation: "9 + 5 = 14.", layer: "screening",
  },
  {
    id: "M-ADD18-03", subject: "mengira", skill: "addition_18", sub_skill: "vertical", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "8 + 3 = ? (bentuk lazim)", display: "  8\n+ 3\n——", options: ["10", "11", "12", "13"], correct: "11" }),
    answer: "11", explanation: "8 + 3 = 11.", layer: "screening",
  },
  {
    id: "M-SUB18-01", subject: "mengira", skill: "subtraction_18", sub_skill: "horizontal", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "16 - 8 = ?", display: "16 - 8 = ___", options: ["6", "7", "8", "9"], correct: "8" }),
    answer: "8", explanation: "16 - 8 = 8.", layer: "screening",
  },
  {
    id: "M-SUB18-02", subject: "mengira", skill: "subtraction_18", sub_skill: "horizontal", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "13 - 4 = ?", display: "13 - 4 = ___", options: ["7", "8", "9", "10"], correct: "9" }),
    answer: "9", explanation: "13 - 4 = 9.", layer: "screening",
  },
  {
    id: "M-SUB18-03", subject: "mengira", skill: "subtraction_18", sub_skill: "vertical", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "12 - 7 = ? (bentuk lazim)", display: " 12\n-  7\n——", options: ["4", "5", "6", "7"], correct: "5" }),
    answer: "5", explanation: "12 - 7 = 5.", layer: "screening",
  },

  // ── KEMAHIRAN 9: NOMBOR HINGGA 50 ───────────────────────
  {
    id: "M-N50-01", subject: "mengira", skill: "number_50", sub_skill: "place_value", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "34 = ___ puluh ___ sa", display: "34 = ___", options: ["3 puluh 4 sa", "4 puluh 3 sa", "3 puluh 3 sa"], correct: "3 puluh 4 sa" }),
    answer: "3 puluh 4 sa", explanation: "34 = 3 puluh + 4 sa.", layer: "investigation",
  },
  {
    id: "M-N50-02", subject: "mengira", skill: "number_50", sub_skill: "ascending_descending", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Nombor yang hilang: 46, ___, 48, 49, 50", display: "46, ___, 48, 49, 50", options: ["44", "45", "47", "43"], correct: "47" }),
    answer: "47", explanation: "Turutan menaik: 46, 47, 48, 49, 50.", layer: "investigation",
  },
  {
    id: "M-N50-03", subject: "mengira", skill: "number_50", sub_skill: "words", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "29 dalam perkataan ialah?", display: "29 = ___", options: ["dua puluh sembilan", "tiga puluh sembilan", "dua belas", "sembilan belas"], correct: "dua puluh sembilan" }),
    answer: "dua puluh sembilan", explanation: "29 = dua puluh sembilan.", layer: "investigation",
  },

  // ── KEMAHIRAN 10: SIFAR ──────────────────────────────────
  {
    id: "M-ZERO-01", subject: "mengira", skill: "zero_concept", sub_skill: "recognition", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Tiada sebiji epal = berapa?", display: "Tiada epal = ___", options: ["0", "1", "10", "100"], correct: "0" }),
    answer: "0", explanation: "Tiada (kosong) = sifar (0).", layer: "screening",
  },
  {
    id: "M-ZERO-02", subject: "mengira", skill: "zero_concept", sub_skill: "addition_subtraction", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "5 - 0 = ?", display: "5 - 0 = ___", options: ["0", "4", "5", "6"], correct: "5" }),
    answer: "5", explanation: "5 - 0 = 5. Tolak sifar tidak mengubah nilai.", layer: "screening",
  },
  {
    id: "M-ZERO-03", subject: "mengira", skill: "zero_concept", sub_skill: "addition_subtraction", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "0 + 6 = ?", display: "0 + 6 = ___", options: ["0", "5", "6", "7"], correct: "6" }),
    answer: "6", explanation: "0 + 6 = 6.", layer: "screening",
  },

  // ── KEMAHIRAN 11: TAMBAH ≤50 ────────────────────────────
  {
    id: "M-ADD50-01", subject: "mengira", skill: "addition_50", sub_skill: "one_digit_tens", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "6 + 30 = ?", display: "6 + 30 = ___", options: ["34", "35", "36", "37"], correct: "36" }),
    answer: "36", explanation: "6 + 30 = 36.", layer: "investigation",
  },
  {
    id: "M-ADD50-02", subject: "mengira", skill: "addition_50", sub_skill: "two_digit_one_digit", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "23 + 4 = ?", display: "23 + 4 = ___", options: ["25", "26", "27", "28"], correct: "27" }),
    answer: "27", explanation: "23 + 4 = 27.", layer: "investigation",
  },
  {
    id: "M-ADD50-03", subject: "mengira", skill: "addition_50", sub_skill: "two_digit_two_digit", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "24 + 25 = ?", display: "24 + 25 = ___", options: ["47", "48", "49", "50"], correct: "49" }),
    answer: "49", explanation: "24 + 25 = 49.", layer: "investigation",
  },
  {
    id: "M-ADD50-04", subject: "mengira", skill: "addition_50", sub_skill: "regrouping", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "23 + 9 = ?", display: "23 + 9 = ___", options: ["30", "31", "32", "33"], correct: "32" }),
    answer: "32", explanation: "23 + 9 = 32. (Mengumpul semula: 3+9=12)", layer: "investigation",
  },

  // ── KEMAHIRAN 12: TOLAK ≤50 ─────────────────────────────
  {
    id: "M-SUB50-01", subject: "mengira", skill: "subtraction_50", sub_skill: "two_minus_one", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "35 - 4 = ?", display: "35 - 4 = ___", options: ["30", "31", "32", "33"], correct: "31" }),
    answer: "31", explanation: "35 - 4 = 31.", layer: "investigation",
  },
  {
    id: "M-SUB50-02", subject: "mengira", skill: "subtraction_50", sub_skill: "two_minus_two", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "45 - 32 = ?", display: "45 - 32 = ___", options: ["11", "12", "13", "14"], correct: "13" }),
    answer: "13", explanation: "45 - 32 = 13.", layer: "investigation",
  },
  {
    id: "M-SUB50-03", subject: "mengira", skill: "subtraction_50", sub_skill: "regrouping", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "43 - 28 = ?", display: "43 - 28 = ___", options: ["13", "14", "15", "16"], correct: "15" }),
    answer: "15", explanation: "43 - 28 = 15. (Mengumpul semula)", layer: "investigation",
  },

  // ── KEMAHIRAN 13: NOMBOR ≤100 ────────────────────────────
  {
    id: "M-N100-01", subject: "mengira", skill: "number_100", sub_skill: "sequence", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Nombor yang hilang: 86, 87, 88, ___, 90", display: "86, 87, 88, ___, 90", options: ["88", "89", "91", "92"], correct: "89" }),
    answer: "89", explanation: "Turutan menaik: 86, 87, 88, 89, 90.", layer: "investigation",
  },
  {
    id: "M-N100-02", subject: "mengira", skill: "number_100", sub_skill: "descending_sequence", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Nombor yang hilang: 78, 77, ___, 75", display: "78, 77, ___, 75", options: ["73", "74", "76", "79"], correct: "76" }),
    answer: "76", explanation: "Turutan menurun: 78, 77, 76, 75.", layer: "investigation",
  },

  // ── KEMAHIRAN 14: DARAB (hingga 9×5) ────────────────────
  {
    id: "M-MULT-01", subject: "mengira", skill: "multiplication", sub_skill: "basic_facts", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "2 × 3 = ?", display: "2 × 3 = ___", options: ["4", "5", "6", "7"], correct: "6" }),
    answer: "6", explanation: "2 × 3 = 6.", layer: "investigation",
  },
  {
    id: "M-MULT-02", subject: "mengira", skill: "multiplication", sub_skill: "basic_facts", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "5 × 3 = ?", display: "5 × 3 = ___", options: ["10", "12", "15", "18"], correct: "15" }),
    answer: "15", explanation: "5 × 3 = 15.", layer: "investigation",
  },
  {
    id: "M-MULT-03", subject: "mengira", skill: "multiplication", sub_skill: "basic_facts", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "7 × 4 = ?", display: "7 × 4 = ___", options: ["24", "26", "28", "30"], correct: "28" }),
    answer: "28", explanation: "7 × 4 = 28.", layer: "investigation",
  },
  {
    id: "M-MULT-04", subject: "mengira", skill: "multiplication", sub_skill: "zero", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "4 × 0 = ?", display: "4 × 0 = ___", options: ["0", "4", "40", "1"], correct: "0" }),
    answer: "0", explanation: "Mana-mana nombor × 0 = 0.", layer: "investigation",
  },
  {
    id: "M-MULT-05", subject: "mengira", skill: "multiplication", sub_skill: "basic_facts", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "9 × 5 = ?", display: "9 × 5 = ___", options: ["40", "43", "45", "50"], correct: "45" }),
    answer: "45", explanation: "9 × 5 = 45.", layer: "investigation",
  },

  // ── KEMAHIRAN 15: BAHAGI (hingga 45÷5) ──────────────────
  {
    id: "M-DIV-01", subject: "mengira", skill: "division", sub_skill: "concept", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "12 ÷ 3 = ?", display: "12 ÷ 3 = ___", options: ["3", "4", "5", "6"], correct: "4" }),
    answer: "4", explanation: "12 ÷ 3 = 4.", layer: "investigation",
  },
  {
    id: "M-DIV-02", subject: "mengira", skill: "division", sub_skill: "basic_facts", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "8 ÷ 2 = ?", display: "8 ÷ 2 = ___", options: ["2", "3", "4", "5"], correct: "4" }),
    answer: "4", explanation: "8 ÷ 2 = 4.", layer: "investigation",
  },
  {
    id: "M-DIV-03", subject: "mengira", skill: "division", sub_skill: "basic_facts", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "45 ÷ 5 = ?", display: "45 ÷ 5 = ___", options: ["7", "8", "9", "10"], correct: "9" }),
    answer: "9", explanation: "45 ÷ 5 = 9.", layer: "investigation",
  },
  {
    id: "M-DIV-04", subject: "mengira", skill: "division", sub_skill: "basic_facts", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "25 ÷ 5 = ?", display: "25 ÷ 5 = ___", options: ["4", "5", "6", "7"], correct: "5" }),
    answer: "5", explanation: "25 ÷ 5 = 5.", layer: "investigation",
  },

  // ── KEMAHIRAN 16: MASA & WAKTU ───────────────────────────
  {
    id: "M-TIME-01", subject: "mengira", skill: "time", sub_skill: "read_clock", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Jarum minit → 12, Jarum jam → 3. Pukul berapa?", display: "🕒 Jarum minit pada 12, jarum jam pada 3", options: ["Pukul 3.00", "Pukul 12.00", "Pukul 3.30", "Pukul 12.30"], correct: "Pukul 3.00" }),
    answer: "Pukul 3.00", explanation: "Jarum minit pada 12 + jarum jam pada 3 = Pukul 3.00.", layer: "investigation",
  },
  {
    id: "M-TIME-02", subject: "mengira", skill: "time", sub_skill: "read_clock", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Jarum minit → 12, Jarum jam → 6. Pukul berapa?", display: "🕕 Jarum minit pada 12, jarum jam pada 6", options: ["Pukul 6.00", "Pukul 12.00", "Pukul 6.30", "Pukul 3.00"], correct: "Pukul 6.00" }),
    answer: "Pukul 6.00", explanation: "Jarum minit pada 12 + jarum jam pada 6 = Pukul 6.00.", layer: "investigation",
  },

  // ── KEMAHIRAN 17: WANG ───────────────────────────────────
  {
    id: "M-MON-01", subject: "mengira", skill: "money", sub_skill: "coins", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "20 sen + 10 sen + 5 sen = ?", display: "20 sen + 10 sen + 5 sen = ___", options: ["30 sen", "35 sen", "25 sen", "40 sen"], correct: "35 sen" }),
    answer: "35 sen", explanation: "20 + 10 + 5 = 35 sen.", layer: "investigation",
  },
  {
    id: "M-MON-02", subject: "mengira", skill: "money", sub_skill: "notes", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "RM5 + RM1 + RM1 + RM1 = ?", display: "RM5 + RM3 = ___", options: ["RM7", "RM8", "RM9", "RM6"], correct: "RM8" }),
    answer: "RM8", explanation: "RM5 + RM3 = RM8.", layer: "investigation",
  },

  // ── KEMAHIRAN 18: PENYELESAIAN MASALAH ──────────────────
  {
    id: "M-PS-01", subject: "mengira", skill: "problem_solving", sub_skill: "addition_word", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Pak Mat ada 3 anak ayam. Beli 5 lagi. Berapa jumlah?", display: "3 + 5 = ___?", options: ["7", "8", "9", "6"], correct: "8" }),
    answer: "8", explanation: "3 + 5 = 8 ekor anak ayam.", layer: "investigation",
  },
  {
    id: "M-PS-02", subject: "mengira", skill: "problem_solving", sub_skill: "subtraction_word", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Khairi ada 8 guli. Beri 1 kepada abang. Berapa baki?", display: "8 - 1 = ___?", options: ["6", "7", "8", "9"], correct: "7" }),
    answer: "7", explanation: "8 - 1 = 7 biji guli.", layer: "investigation",
  },
  {
    id: "M-PS-03", subject: "mengira", skill: "problem_solving", sub_skill: "subtraction_word", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Ada 6 kek. Rosmah ambil 2. Berapa tinggal?", display: "6 - 2 = ___?", options: ["3", "4", "5", "6"], correct: "4" }),
    answer: "4", explanation: "6 - 2 = 4 biji kek.", layer: "investigation",
  },
  {
    id: "M-PS-04", subject: "mengira", skill: "problem_solving", sub_skill: "addition_word", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Manis ada 7 buku. Manis ada 2 buku. Berapa jumlah buku mereka?", display: "7 + 2 = ___?", options: ["8", "9", "10", "7"], correct: "9" }),
    answer: "9", explanation: "7 + 2 = 9 buku.", layer: "investigation",
  },
];
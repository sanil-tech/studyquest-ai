// src/lib/diagnosticQuestionBank.js
// Comprehensive KPM-aligned adaptive question bank for the 3M Diagnostic.
// Organized by: subject → skill → sub_skill → difficulty
// Each question supports adaptive Layer 1 (Screening) and Layer 2 (Investigation).
// AI is NEVER used to generate these questions — they are reusable and stored.

// ================================================================
// QUESTION BANK
// ================================================================
export const QUESTION_BANK = [
  // ============================================================
  // MEMBACA (READING) — Skill A: Letter Recognition
  // ============================================================
  // Vowels — Screening
  { question_id: "mb_lr_v_01", subject: "membaca", skill: "letter_recognition", sub_skill: "vowels", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "🍎", options: ["a", "b", "k", "m"], correct: "a" },
    answer: "a", explanation: "Huruf vokal ialah a, e, i, o, u." },
  { question_id: "mb_lr_v_02", subject: "membaca", skill: "letter_recognition", sub_skill: "vowels", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "🐘", options: ["g", "e", "k", "l"], correct: "e" },
    answer: "e", explanation: "Huruf 'e' ialah huruf vokal." },
  { question_id: "mb_lr_v_03", subject: "membaca", skill: "letter_recognition", sub_skill: "vowels", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "🐠", options: ["i", "k", "m", "r"], correct: "i" },
    answer: "i", explanation: "Huruf 'i' ialah huruf vokal." },
  { question_id: "mb_lr_v_04", subject: "membaca", skill: "letter_recognition", sub_skill: "vowels", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "🐙", options: ["o", "c", "t", "p"], correct: "o" },
    answer: "o", explanation: "Huruf 'o' ialah huruf vokal." },
  { question_id: "mb_lr_v_05", subject: "membaca", skill: "letter_recognition", sub_skill: "vowels", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "☂️", options: ["u", "b", "d", "s"], correct: "u" },
    answer: "u", explanation: "Huruf 'u' ialah huruf vokal." },
  // Consonants — Screening
  { question_id: "mb_lr_c_01", subject: "membaca", skill: "letter_recognition", sub_skill: "consonants", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "b", options: ["b", "d", "p", "q"], correct: "b" },
    answer: "b", explanation: "Ini ialah huruf 'b'." },
  { question_id: "mb_lr_c_02", subject: "membaca", skill: "letter_recognition", sub_skill: "consonants", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "m", options: ["n", "m", "w", "h"], correct: "m" },
    answer: "m", explanation: "Ini ialah huruf 'm'." },
  { question_id: "mb_lr_c_03", subject: "membaca", skill: "letter_recognition", sub_skill: "consonants", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "s", options: ["s", "z", "c", "e"], correct: "s" },
    answer: "s", explanation: "Ini ialah huruf 's'." },
  { question_id: "mb_lr_c_04", subject: "membaca", skill: "letter_recognition", sub_skill: "consonants", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "T", options: ["F", "T", "I", "L"], correct: "T" },
    answer: "T", explanation: "Ini ialah huruf besar 'T'." },
  { question_id: "mb_lr_c_05", subject: "membaca", skill: "letter_recognition", sub_skill: "consonants", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "K", options: ["X", "K", "Y", "V"], correct: "K" },
    answer: "K", explanation: "Ini ialah huruf besar 'K'." },
  // Confusion b/d, p/q — Screening
  { question_id: "mb_lr_x_01", subject: "membaca", skill: "letter_recognition", sub_skill: "confusion", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "d", options: ["b", "d", "p", "q"], correct: "d" },
    answer: "d", explanation: "Huruf 'd' membulat di sebelah kanan." },
  { question_id: "mb_lr_x_02", subject: "membaca", skill: "letter_recognition", sub_skill: "confusion", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "b", options: ["b", "d", "p", "q"], correct: "b" },
    answer: "b", explanation: "Huruf 'b' membulat di sebelah kiri." },
  { question_id: "mb_lr_x_03", subject: "membaca", skill: "letter_recognition", sub_skill: "confusion", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf ni apa?", display: "q", options: ["b", "d", "p", "q"], correct: "q" },
    answer: "q", explanation: "Huruf 'q' membulat di sebelah kiri, ekor ke kanan." },
  // Sound recognition — Investigation
  { question_id: "mb_lr_s_01", subject: "membaca", skill: "letter_recognition", sub_skill: "sounds", difficulty: 2, question_type: "mcq", layer: "investigation",
    question_content: { question: "Huruf mana yang berbunyi 'mmm'?", display: "🐄", options: ["m", "n", "b", "l"], correct: "m" },
    answer: "m", explanation: "Huruf 'm' berbunyi 'mmm'." },
  { question_id: "mb_lr_s_02", subject: "membaca", skill: "letter_recognition", sub_skill: "sounds", difficulty: 2, question_type: "mcq", layer: "investigation",
    question_content: { question: "Huruf mana yang berbunyi 'sss'?", display: "🐍", options: ["s", "z", "c", "x"], correct: "s" },
    answer: "s", explanation: "Huruf 's' berbunyi 'sss'." },
  { question_id: "mb_lr_s_03", subject: "membaca", skill: "letter_recognition", sub_skill: "sounds", difficulty: 2, question_type: "mcq", layer: "investigation",
    question_content: { question: "Huruf mana yang berbunyi 'ttt'?", display: "⏰", options: ["t", "d", "l", "r"], correct: "t" },
    answer: "t", explanation: "Huruf 't' berbunyi 'ttt'." },
  { question_id: "mb_lr_s_04", subject: "membaca", skill: "letter_recognition", sub_skill: "sounds", difficulty: 2, question_type: "mcq", layer: "investigation",
    question_content: { question: "Huruf mana yang berbunyi 'kkk'?", display: "🔑", options: ["k", "g", "c", "q"], correct: "k" },
    answer: "k", explanation: "Huruf 'k' berbunyi 'kkk'." },
  { question_id: "mb_lr_s_05", subject: "membaca", skill: "letter_recognition", sub_skill: "sounds", difficulty: 3, question_type: "voice", layer: "investigation",
    question_content: { question: "Sebut huruf ni kuat-kuat:", display: "r", correct: "r" },
    answer: "r", explanation: "Bunyi huruf 'r' adalah 'rrr'." },
  { question_id: "mb_lr_s_06", subject: "membaca", skill: "letter_recognition", sub_skill: "sounds", difficulty: 3, question_type: "voice", layer: "investigation",
    question_content: { question: "Sebut huruf ni kuat-kuat:", display: "l", correct: "l" },
    answer: "l", explanation: "Bunyi huruf 'l' adalah 'lll'." },
  { question_id: "mb_lr_s_07", subject: "membaca", skill: "letter_recognition", sub_skill: "sounds", difficulty: 3, question_type: "voice", layer: "investigation",
    question_content: { question: "Sebut huruf ni kuat-kuat:", display: "n", correct: "n" },
    answer: "n", explanation: "Bunyi huruf 'n' adalah 'nnn'." },
  { question_id: "mb_lr_s_08", subject: "membaca", skill: "letter_recognition", sub_skill: "sounds", difficulty: 3, question_type: "voice", layer: "investigation",
    question_content: { question: "Sebut huruf ni kuat-kuat:", display: "g", correct: "g" },
    answer: "g", explanation: "Bunyi huruf 'g' adalah 'ggg'." },

  // ============================================================
  // MEMBACA — Skill B: Syllable Blending
  // ============================================================
  // KV — Screening
  { question_id: "mb_sb_kv_01", subject: "membaca", skill: "syllable_blending", sub_skill: "KV", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Cuba baca ni. Apa perkataannya?", display: "ba + tu", options: ["batu", "bato", "bata", "bati"], correct: "batu" },
    answer: "batu", explanation: "ba + tu = batu." },
  { question_id: "mb_sb_kv_02", subject: "membaca", skill: "syllable_blending", sub_skill: "KV", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Cuba baca ni. Apa perkataannya?", display: "ma + ta", options: ["mata", "mota", "mato", "mati"], correct: "mata" },
    answer: "mata", explanation: "ma + ta = mata." },
  { question_id: "mb_sb_kv_03", subject: "membaca", skill: "syllable_blending", sub_skill: "KV", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Cuba baca ni. Apa perkataannya?", display: "sa + ya", options: ["saya", "sayo", "sasya", "saka"], correct: "saya" },
    answer: "saya", explanation: "sa + ya = saya." },
  // KV+KV — Screening
  { question_id: "mb_sb_kvkv_01", subject: "membaca", skill: "syllable_blending", sub_skill: "KV+KV", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Gambar ni apa?", display: "🐎", options: ["kuda", "kuca", "kuta", "kuka"], correct: "kuda" },
    answer: "kuda", explanation: "ku + da = kuda." },
  { question_id: "mb_sb_kvkv_02", subject: "membaca", skill: "syllable_blending", sub_skill: "KV+KV", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Gambar ni apa?", display: "📚", options: ["buku", "buko", "baka", "buki"], correct: "buku" },
    answer: "buku", explanation: "bu + ku = buku." },
  { question_id: "mb_sb_kvkv_03", subject: "membaca", skill: "syllable_blending", sub_skill: "KV+KV", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Gambar ni apa?", display: "⚽", options: ["bola", "balo", "bora", "boka"], correct: "bola" },
    answer: "bola", explanation: "bo + la = bola." },
  // KV+KV+KV — Investigation
  { question_id: "mb_sb_kv3_01", subject: "membaca", skill: "syllable_blending", sub_skill: "KV+KV+KV", difficulty: 3, question_type: "mcq", layer: "investigation",
    question_content: { question: "Cuba baca ni. Apa perkataannya?", display: "ke + la + pa", options: ["kelapa", "kalapa", "kelipa", "kalapa"], correct: "kelapa" },
    answer: "kelapa", explanation: "ke + la + pa = kelapa." },
  { question_id: "mb_sb_kv3_02", subject: "membaca", skill: "syllable_blending", sub_skill: "KV+KV+KV", difficulty: 3, question_type: "mcq", layer: "investigation",
    question_content: { question: "Cuba baca ni. Apa perkataannya?", display: "ke + re + ta", options: ["kereta", "kareta", "kereta", "kirita"], correct: "kereta" },
    answer: "kereta", explanation: "ke + re + ta = kereta." },
  { question_id: "mb_sb_kv3_03", subject: "membaca", skill: "syllable_blending", sub_skill: "KV+KV+KV", difficulty: 3, question_type: "mcq", layer: "investigation",
    question_content: { question: "Cuba baca ni. Apa perkataannya?", display: "se + la + mat", options: ["selamat", "salamat", "selemat", "silamat"], correct: "selamat" },
    answer: "selamat", explanation: "se + la + mat = selamat." },
  { question_id: "mb_sb_kv3_04", subject: "membaca", skill: "syllable_blending", sub_skill: "KV+KV+KV", difficulty: 3, question_type: "voice", layer: "investigation",
    question_content: { question: "Baca perkataan ni kuat-kuat:", display: "kelapa", correct: "kelapa" },
    answer: "kelapa", explanation: "Perkataan 'kelapa' mempunyai 3 suku kata." },
  { question_id: "mb_sb_v_01", subject: "membaca", skill: "syllable_blending", sub_skill: "KV", difficulty: 2, question_type: "voice", layer: "investigation",
    question_content: { question: "Baca perkataan ni:", display: "meja", correct: "meja" },
    answer: "meja", explanation: "me + ja = meja." },
  { question_id: "mb_sb_v_02", subject: "membaca", skill: "syllable_blending", sub_skill: "KV+KV", difficulty: 2, question_type: "voice", layer: "investigation",
    question_content: { question: "Baca perkataan ni:", display: "baju", correct: "baju" },
    answer: "baju", explanation: "ba + ju = baju." },

  // ============================================================
  // MEMBACA — Skill C: Word Reading
  // ============================================================
  { question_id: "mb_wr_01", subject: "membaca", skill: "word_reading", sub_skill: "daily_words", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Gambar ni apa?", display: "👩", options: ["ibu", "ayah", "kakak", "adik"], correct: "ibu" },
    answer: "ibu", explanation: "Gambar ini ialah 'ibu'." },
  { question_id: "mb_wr_02", subject: "membaca", skill: "word_reading", sub_skill: "daily_words", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Gambar ni apa?", display: "👨", options: ["ayah", "ibu", "abang", "bapa"], correct: "ayah" },
    answer: "ayah", explanation: "Gambar ini ialah 'ayah'." },
  { question_id: "mb_wr_03", subject: "membaca", skill: "word_reading", sub_skill: "daily_words", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Gambar ni apa?", display: "🏠", options: ["rumah", "rama", "rusa", "rumin"], correct: "rumah" },
    answer: "rumah", explanation: "Gambar ini ialah 'rumah'." },
  { question_id: "mb_wr_04", subject: "membaca", skill: "word_reading", sub_skill: "common_words", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Perkataan ni apa?", display: "suku", options: ["suku", "soko", "saka", "suki"], correct: "suku" },
    answer: "suku", explanation: "Perkataan 'suku'." },
  // Investigation
  { question_id: "mb_wr_05", subject: "membaca", skill: "word_reading", sub_skill: "daily_words", difficulty: 2, question_type: "voice", layer: "investigation",
    question_content: { question: "Baca perkataan ni kuat-kuat:", display: "bola", correct: "bola" },
    answer: "bola", explanation: "Perkataan 'bola'." },
  { question_id: "mb_wr_06", subject: "membaca", skill: "word_reading", sub_skill: "daily_words", difficulty: 2, question_type: "voice", layer: "investigation",
    question_content: { question: "Baca perkataan ni kuat-kuat:", display: "buku", correct: "buku" },
    answer: "buku", explanation: "Perkataan 'buku'." },
  { question_id: "mb_wr_07", subject: "membaca", skill: "word_reading", sub_skill: "common_words", difficulty: 3, question_type: "voice", layer: "investigation",
    question_content: { question: "Baca perkataan ni kuat-kuat:", display: "rumah", correct: "rumah" },
    answer: "rumah", explanation: "Perkataan 'rumah'." },

  // ============================================================
  // MEMBACA — Skill D: Sentence Reading
  // ============================================================
  { question_id: "mb_sr_01", subject: "membaca", skill: "sentence_reading", sub_skill: "simple_sentence", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Ali makan nasi. Apa Ali buat?", display: "Ali makan nasi.", options: ["Makan", "Tidur", "Main", "Baca"], correct: "Makan" },
    answer: "Makan", explanation: "Ali sedang makan nasi." },
  { question_id: "mb_sr_02", subject: "membaca", skill: "sentence_reading", sub_skill: "simple_sentence", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Siti buat apa?", display: "Siti baca buku di rumah.", options: ["Baca buku", "Main bola", "Tidur", "Makan"], correct: "Baca buku" },
    answer: "Baca buku", explanation: "Siti sedang membaca buku." },
  { question_id: "mb_sr_03", subject: "membaca", skill: "sentence_reading", sub_skill: "comprehension", difficulty: 3, question_type: "mcq", layer: "screening",
    question_content: { question: "Siapa pergi ke kedai?", display: "Ibu pergi ke kedai membeli sayur.", options: ["Ibu", "Ayah", "Adik", "Kakak"], correct: "Ibu" },
    answer: "Ibu", explanation: "Ibu yang pergi ke kedai." },
  // Investigation
  { question_id: "mb_sr_04", subject: "membaca", skill: "sentence_reading", sub_skill: "simple_sentence", difficulty: 3, question_type: "voice", layer: "investigation",
    question_content: { question: "Baca ayat ni kuat-kuat:", display: "Adik main bola di padang.", correct: "adik main bola di padang" },
    answer: "adik main bola di padang", explanation: "Ayat: Adik main bola di padang." },
  { question_id: "mb_sr_05", subject: "membaca", skill: "sentence_reading", sub_skill: "comprehension", difficulty: 3, question_type: "voice", layer: "investigation",
    question_content: { question: "Baca ayat ni kuat-kuat:", display: "Pagi ini, Ahmad pergi ke sekolah. Dia berjalan bersama rakannya. Mereka gembira.", correct: "pagi ini ahmad pergi ke sekolah" },
    answer: "pagi ini ahmad pergi ke sekolah", explanation: "Baca perenggan dengan lancer." },

  // ============================================================
  // MENULIS (WRITING)
  // ============================================================
  // Skill: Writing Readiness — Screening
  { question_id: "mn_wr_01", subject: "menulis", skill: "writing_readiness", sub_skill: "tracing", difficulty: 1, question_type: "image_upload", layer: "screening",
    question_content: { question: "Tulis huruf 'A' di kertas. Lepas tu, ambil gambar.", display: "A a", correct: "A a" },
    answer: "A a", explanation: "Latihan menulis huruf A." },
  { question_id: "mn_wr_02", subject: "menulis", skill: "writing_readiness", sub_skill: "shapes", difficulty: 1, question_type: "image_upload", layer: "screening",
    question_content: { question: "Tulis huruf 'B' di kertas. Lepas tu, ambil gambar.", display: "B b", correct: "B b" },
    answer: "B b", explanation: "Latihan menulis huruf B." },
  // Skill: Letter Writing — Screening
  { question_id: "mn_lw_01", subject: "menulis", skill: "letter_writing", sub_skill: "vowels", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf kecil untuk 'A' ialah?", display: "A → ?", options: ["a", "e", "o", "u"], correct: "a" },
    answer: "a", explanation: "Huruf kecil 'A' ialah 'a'." },
  { question_id: "mn_lw_02", subject: "menulis", skill: "letter_writing", sub_skill: "consonants", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Huruf besar untuk 'b' ialah?", display: "b → ?", options: ["B", "D", "P", "R"], correct: "B" },
    answer: "B", explanation: "Huruf besar 'b' ialah 'B'." },
  { question_id: "mn_lw_03", subject: "menulis", skill: "letter_writing", sub_skill: "own_name", difficulty: 2, question_type: "image_upload", layer: "screening",
    question_content: { question: "Tulis nama kamu di kertas. Lepas tu, ambil gambar.", display: "Nama Saya", correct: "nama pelajar" },
    answer: "nama pelajar", explanation: "Menulis nama sendiri." },
  // Investigation
  { question_id: "mn_lw_04", subject: "menulis", skill: "letter_writing", sub_skill: "vowels", difficulty: 2, question_type: "image_upload", layer: "investigation",
    question_content: { question: "Tulis huruf 'e' dan 'i' di kertas. Lepas tu, ambil gambar.", display: "e i", correct: "e i" },
    answer: "e i", explanation: "Latihan menulis huruf vokal." },
  { question_id: "mn_lw_05", subject: "menulis", skill: "letter_writing", sub_skill: "consonants", difficulty: 2, question_type: "image_upload", layer: "investigation",
    question_content: { question: "Tulis huruf 'm' dan 's' di kertas. Lepas tu, ambil gambar.", display: "m s", correct: "m s" },
    answer: "m s", explanation: "Latihan menulis huruf konsonan." },
  // Skill: Word Writing — Screening
  { question_id: "mn_ww_01", subject: "menulis", skill: "word_writing", sub_skill: "copy_words", difficulty: 2, question_type: "image_upload", layer: "screening",
    question_content: { question: "Tulis perkataan 'buku' di kertas. Lepas tu, ambil gambar.", display: "buku", correct: "buku" },
    answer: "buku", explanation: "Menulis perkataan 'buku'." },
  { question_id: "mn_ww_02", subject: "menulis", skill: "word_writing", sub_skill: "copy_words", difficulty: 2, question_type: "image_upload", layer: "screening",
    question_content: { question: "Tulis perkataan 'bola' di kertas. Lepas tu, ambil gambar.", display: "bola", correct: "bola" },
    answer: "bola", explanation: "Menulis perkataan 'bola'." },
  { question_id: "mn_ww_03", subject: "menulis", skill: "word_writing", sub_skill: "copy_words", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Ejaan yang betul ialah?", display: "🚗", options: ["kereta", "kreata", "kereta", "kereta"], correct: "kereta" },
    answer: "kereta", explanation: "Ejaan yang betul ialah 'kereta'." },
  // Investigation
  { question_id: "mn_ww_04", subject: "menulis", skill: "word_writing", sub_skill: "copy_words", difficulty: 2, question_type: "image_upload", layer: "investigation",
    question_content: { question: "Tulis perkataan 'saya' di kertas. Lepas tu, ambil gambar.", display: "saya", correct: "saya" },
    answer: "saya", explanation: "Menulis perkataan 'saya'." },
  { question_id: "mn_ww_05", subject: "menulis", skill: "word_writing", sub_skill: "copy_words", difficulty: 3, question_type: "image_upload", layer: "investigation",
    question_content: { question: "Tulis perkataan 'selamat' di kertas. Lepas tu, ambil gambar.", display: "selamat", correct: "selamat" },
    answer: "selamat", explanation: "Menulis perkataan 'selamat'." },
  // Skill: Sentence Writing — Screening
  { question_id: "mn_sw_01", subject: "menulis", skill: "sentence_writing", sub_skill: "spelling", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Ejaan 'rumah' yang betul?", display: "rumah", options: ["rumah", "rumha", "rumag", "rumoh"], correct: "rumah" },
    answer: "rumah", explanation: "Ejaan yang betul ialah 'rumah'." },
  { question_id: "mn_sw_02", subject: "menulis", skill: "sentence_writing", sub_skill: "capitals", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Ayat yang betul?", display: "Pilih ayat betul", options: ["Saya suka buku.", "saya suka buku", "Saya suka buku", "saya suka buku."], correct: "Saya suka buku." },
    answer: "Saya suka buku.", explanation: "Ayat bermula dengan huruf besar dan berakhir dengan tanda baca." },
  { question_id: "mn_sw_03", subject: "menulis", skill: "sentence_writing", sub_skill: "punctuation", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Tanda apa di hujung ayat ni?", display: "Ibu masak kuih_", options: [".", ",", "?", "!"], correct: "." },
    answer: ".", explanation: "Ayat penyata berakhir dengan tanda titik (.)." },
  // Investigation
  { question_id: "mn_sw_04", subject: "menulis", skill: "sentence_writing", sub_skill: "spelling", difficulty: 3, question_type: "image_upload", layer: "investigation",
    question_content: { question: "Tulis ayat 'Ibu masak kuih.' di kertas. Lepas tu, ambil gambar.", display: "Ibu masak kuih.", correct: "Ibu masak kuih" },
    answer: "Ibu masak kuih", explanation: "Menulis ayat dengan ejaan yang betul." },
  { question_id: "mn_sw_05", subject: "menulis", skill: "sentence_writing", sub_skill: "spacing", difficulty: 3, question_type: "image_upload", layer: "investigation",
    question_content: { question: "Tulis ayat 'Adik main bola.' di kertas. Lepas tu, ambil gambar.", display: "Adik main bola.", correct: "Adik main bola" },
    answer: "Adik main bola", explanation: "Menulis ayat dengan jarak perkataan yang betul." },

  // ============================================================
  // MENGIRA (NUMERACY)
  // ============================================================
  // Skill A: Number Recognition — Screening
  { question_id: "mg_nr_01", subject: "mengira", skill: "number_recognition", sub_skill: "0_to_9", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Nombor ni apa?", display: "5", options: ["3", "5", "7", "9"], correct: "5" },
    answer: "5", explanation: "Ini ialah nombor 5." },
  { question_id: "mg_nr_02", subject: "mengira", skill: "number_recognition", sub_skill: "0_to_9", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Nombor ni apa?", display: "8", options: ["6", "8", "0", "9"], correct: "8" },
    answer: "8", explanation: "Ini ialah nombor 8." },
  { question_id: "mg_nr_03", subject: "mengira", skill: "number_recognition", sub_skill: "0_to_9", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Nombor ni apa?", display: "0", options: ["1", "0", "10", "6"], correct: "0" },
    answer: "0", explanation: "Ini ialah nombor 0." },
  { question_id: "mg_nr_04", subject: "mengira", skill: "number_recognition", sub_skill: "0_to_9", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Nombor ni apa?", display: "3", options: ["2", "3", "5", "8"], correct: "3" },
    answer: "3", explanation: "Ini ialah nombor 3." },
  // Confusion 6/9, 12/21 — Screening
  { question_id: "mg_nr_05", subject: "mengira", skill: "number_recognition", sub_skill: "confusion", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Nombor ni apa?", display: "6", options: ["6", "9", "8", "0"], correct: "6" },
    answer: "6", explanation: "Ini ialah nombor 6 (bukan 9)." },
  { question_id: "mg_nr_06", subject: "mengira", skill: "number_recognition", sub_skill: "confusion", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Nombor ni apa?", display: "9", options: ["6", "9", "8", "4"], correct: "9" },
    answer: "9", explanation: "Ini ialah nombor 9 (bukan 6)." },
  { question_id: "mg_nr_07", subject: "mengira", skill: "number_recognition", sub_skill: "confusion", difficulty: 3, question_type: "mcq", layer: "screening",
    question_content: { question: "Nombor ni apa?", display: "12", options: ["12", "21", "2", "20"], correct: "12" },
    answer: "12", explanation: "Ini ialah nombor 12 (bukan 21)." },
  { question_id: "mg_nr_08", subject: "mengira", skill: "number_recognition", sub_skill: "confusion", difficulty: 3, question_type: "mcq", layer: "screening",
    question_content: { question: "Nombor ni apa?", display: "21", options: ["12", "21", "2", "1"], correct: "21" },
    answer: "21", explanation: "Ini ialah nombor 21 (bukan 12)." },
  // Investigation
  { question_id: "mg_nr_09", subject: "mengira", skill: "number_recognition", sub_skill: "10_to_100", difficulty: 2, question_type: "mcq", layer: "investigation",
    question_content: { question: "Nombor ni apa?", display: "15", options: ["15", "51", "5", "50"], correct: "15" },
    answer: "15", explanation: "Ini ialah nombor 15." },
  { question_id: "mg_nr_10", subject: "mengira", skill: "number_recognition", sub_skill: "10_to_100", difficulty: 3, question_type: "mcq", layer: "investigation",
    question_content: { question: "Nombor ni apa?", display: "50", options: ["15", "5", "50", "500"], correct: "50" },
    answer: "50", explanation: "Ini ialah nombor 50." },

  // Skill B: Counting — Screening
  { question_id: "mg_ct_01", subject: "mengira", skill: "counting", sub_skill: "count_objects", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Kira epal ni. Berapa?", display: "🍎🍎🍎", options: ["2", "3", "4", "5"], correct: "3" },
    answer: "3", explanation: "Ada 3 biji epal." },
  { question_id: "mg_ct_02", subject: "mengira", skill: "counting", sub_skill: "count_objects", difficulty: 1, question_type: "mcq", layer: "screening",
    question_content: { question: "Kira bintang ni. Berapa?", display: "⭐⭐⭐⭐⭐", options: ["4", "5", "6", "7"], correct: "5" },
    answer: "5", explanation: "Ada 5 biji bintang." },
  { question_id: "mg_ct_03", subject: "mengira", skill: "counting", sub_skill: "sequence", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Selepas 5, apa nombor?", display: "5 → ?", options: ["4", "6", "7", "10"], correct: "6" },
    answer: "6", explanation: "Selepas 5 ialah 6." },
  // Investigation
  { question_id: "mg_ct_04", subject: "mengira", skill: "counting", sub_skill: "missing_numbers", difficulty: 2, question_type: "mcq", layer: "investigation",
    question_content: { question: "Nombor yang hilang?", display: "3, _, 5", options: ["2", "4", "6", "7"], correct: "4" },
    answer: "4", explanation: "3, 4, 5 — nombor yang hilang ialah 4." },
  { question_id: "mg_ct_05", subject: "mengira", skill: "counting", sub_skill: "count_objects", difficulty: 2, question_type: "mcq", layer: "investigation",
    question_content: { question: "Kira kucing ni. Berapa?", display: "🐱🐱🐱🐱", options: ["3", "4", "5", "6"], correct: "4" },
    answer: "4", explanation: "Ada 4 ekor kucing." },
  { question_id: "mg_ct_06", subject: "mengira", skill: "counting", sub_skill: "sequence", difficulty: 3, question_type: "mcq", layer: "investigation",
    question_content: { question: "Nombor yang hilang?", display: "7, 8, _, 10", options: ["9", "6", "11", "8"], correct: "9" },
    answer: "9", explanation: "7, 8, 9, 10 — nombor yang hilang ialah 9." },

  // Skill C: Comparison — Screening
  { question_id: "mg_cp_01", subject: "mengira", skill: "comparison", sub_skill: "bigger_smaller", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Yang mana lebih besar?", display: "5 atau 8", options: ["5", "8", "Sama", "Tak tahu"], correct: "8" },
    answer: "8", explanation: "8 lebih besar daripada 5." },
  { question_id: "mg_cp_02", subject: "mengira", skill: "comparison", sub_skill: "more_less", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Yang mana lebih banyak?", display: "🍎🍎 atau 🍎🍎🍎🍎", options: ["🍎🍎", "🍎🍎🍎🍎", "Sama", "Tak tahu"], correct: "🍎🍎🍎🍎" },
    answer: "🍎🍎🍎🍎", explanation: "4 epal lebih banyak daripada 2 epal." },
  { question_id: "mg_cp_03", subject: "mengira", skill: "comparison", sub_skill: "before_after", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Sebelum 7, apa nombor?", display: "?, 7", options: ["6", "8", "5", "9"], correct: "6" },
    answer: "6", explanation: "Sebelum 7 ialah 6." },
  // Investigation
  { question_id: "mg_cp_04", subject: "mengira", skill: "comparison", sub_skill: "bigger_smaller", difficulty: 2, question_type: "mcq", layer: "investigation",
    question_content: { question: "Yang mana lebih kecil?", display: "3 atau 7", options: ["3", "7", "Sama", "Tak tahu"], correct: "3" },
    answer: "3", explanation: "3 lebih kecil daripada 7." },
  { question_id: "mg_cp_05", subject: "mengira", skill: "comparison", sub_skill: "bigger_smaller", difficulty: 3, question_type: "mcq", layer: "investigation",
    question_content: { question: "Yang mana lebih besar?", display: "12 atau 9", options: ["12", "9", "Sama", "Tak tahu"], correct: "12" },
    answer: "12", explanation: "12 lebih besar daripada 9." },
  { question_id: "mg_cp_06", subject: "mengira", skill: "comparison", sub_skill: "more_less", difficulty: 3, question_type: "mcq", layer: "investigation",
    question_content: { question: "Yang mana lebih sedikit?", display: "🌸🌸 atau 🌸🌸🌸🌸", options: ["🌸🌸", "🌸🌸🌸🌸", "Sama", "Tak tahu"], correct: "🌸🌸" },
    answer: "🌸🌸", explanation: "2 bunga lebih sedikit daripada 4 bunga." },

  // Skill D: Basic Operations — Screening
  { question_id: "mg_bo_01", subject: "mengira", skill: "basic_operations", sub_skill: "addition", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Berapa jawapan?", display: "3 + 2 = ?", options: ["4", "5", "6", "7"], correct: "5" },
    answer: "5", explanation: "3 + 2 = 5." },
  { question_id: "mg_bo_02", subject: "mengira", skill: "basic_operations", sub_skill: "subtraction", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Berapa jawapan?", display: "5 - 2 = ?", options: ["2", "3", "4", "7"], correct: "3" },
    answer: "3", explanation: "5 - 2 = 3." },
  { question_id: "mg_bo_03", subject: "mengira", skill: "basic_operations", sub_skill: "addition", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Berapa jawapan?", display: "4 + 3 = ?", options: ["6", "7", "8", "9"], correct: "7" },
    answer: "7", explanation: "4 + 3 = 7." },
  // Investigation
  { question_id: "mg_bo_04", subject: "mengira", skill: "basic_operations", sub_skill: "subtraction", difficulty: 2, question_type: "mcq", layer: "investigation",
    question_content: { question: "Berapa jawapan?", display: "6 - 3 = ?", options: ["2", "3", "4", "9"], correct: "3" },
    answer: "3", explanation: "6 - 3 = 3." },
  { question_id: "mg_bo_05", subject: "mengira", skill: "basic_operations", sub_skill: "addition", difficulty: 3, question_type: "mcq", layer: "investigation",
    question_content: { question: "Berapa jawapan?", display: "7 + 2 = ?", options: ["8", "9", "10", "14"], correct: "9" },
    answer: "9", explanation: "7 + 2 = 9." },
  { question_id: "mg_bo_06", subject: "mengira", skill: "basic_operations", sub_skill: "subtraction", difficulty: 3, question_type: "mcq", layer: "investigation",
    question_content: { question: "Berapa jawapan?", display: "10 - 4 = ?", options: ["5", "6", "7", "14"], correct: "6" },
    answer: "6", explanation: "10 - 4 = 6." },

  // Skill E: Problem Solving — Screening
  { question_id: "mg_ps_01", subject: "mengira", skill: "problem_solving", sub_skill: "addition_word", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Ali ada 3 epal. Ibu beri 2 lagi. Berapa jumlah?", display: "🍎🍎🍎 + 🍎🍎", options: ["4", "5", "6", "7"], correct: "5" },
    answer: "5", explanation: "3 + 2 = 5 epal." },
  { question_id: "mg_ps_02", subject: "mengira", skill: "problem_solving", sub_skill: "subtraction_word", difficulty: 2, question_type: "mcq", layer: "screening",
    question_content: { question: "Siti ada 5 gula-gula. Dia makan 2. Berapa lagi?", display: "🍬🍬🍬🍬🍬 → makan 2", options: ["2", "3", "4", "7"], correct: "3" },
    answer: "3", explanation: "5 - 2 = 3 gula-gula." },
  // Investigation
  { question_id: "mg_ps_03", subject: "mengira", skill: "problem_solving", sub_skill: "addition_word", difficulty: 3, question_type: "mcq", layer: "investigation",
    question_content: { question: "Kakak ada 2 pensel. Abang beri 3 lagi. Berapa jumlah?", display: "✏️✏️ + ✏️✏️✏️", options: ["4", "5", "6", "7"], correct: "5" },
    answer: "5", explanation: "2 + 3 = 5 pensel." },
  { question_id: "mg_ps_04", subject: "mengira", skill: "problem_solving", sub_skill: "subtraction_word", difficulty: 3, question_type: "mcq", layer: "investigation",
    question_content: { question: "Ada 4 burung di pokok. 1 terbang pergi. Berapa lagi?", display: "🐦🐦🐦🐦 → 1 terbang", options: ["2", "3", "4", "5"], correct: "3" },
    answer: "3", explanation: "4 - 1 = 3 burung." },
];

// ================================================================
// MODULE METADATA
// ================================================================
export const DIAGNOSTIC_MODULES_META = [
  {
    id: "membaca",
    title: "Membaca",
    subtitle: "Kemahiran Membaca",
    icon: "📖",
    color: "from-emerald-500 to-green-500",
    borderColor: "border-emerald-400/40",
    skills: ["letter_recognition", "syllable_blending", "word_reading", "sentence_reading"],
    skillDisplayNames: {
      letter_recognition: "Pengecaman Huruf",
      syllable_blending: "Suku Kata",
      word_reading: "Bacaan Perkataan",
      sentence_reading: "Bacaan Ayat",
    },
    levelMax: 6,
  },
  {
    id: "menulis",
    title: "Menulis",
    subtitle: "Kemahiran Menulis",
    icon: "✏️",
    color: "from-blue-500 to-indigo-500",
    borderColor: "border-blue-400/40",
    skills: ["writing_readiness", "letter_writing", "word_writing", "sentence_writing"],
    skillDisplayNames: {
      writing_readiness: "Kesiapan Menulis",
      letter_writing: "Penulisan Huruf",
      word_writing: "Penulisan Perkataan",
      sentence_writing: "Penulisan Ayat",
    },
    levelMax: 6,
  },
  {
    id: "mengira",
    title: "Mengira",
    subtitle: "Kemahiran Mengira",
    icon: "🔢",
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-400/40",
    skills: ["number_recognition", "counting", "comparison", "basic_operations", "problem_solving"],
    skillDisplayNames: {
      number_recognition: "Pengecaman Nombor",
      counting: "Mengira",
      comparison: "Perbandingan",
      basic_operations: "Operasi Asas",
      problem_solving: "Penyelesaian Masalah",
    },
    levelMax: 5,
  },
];

// ================================================================
// MASTERY THRESHOLDS
// ================================================================
export const MASTERY_THRESHOLDS = {
  MASTERED: 90,        // 90-100% → skip basic questions
  DEVELOPING: 60,      // 60-89%  → needs some investigation
  NEEDS_FOUNDATION: 0, // <60%    → needs deep investigation
};

// ================================================================
// HELPER: Get mastery level from score
// ================================================================
export function getMasteryLevel(score) {
  if (score >= MASTERY_THRESHOLDS.MASTERED) return "mastered";
  if (score >= MASTERY_THRESHOLDS.DEVELOPING) return "developing";
  return "needs_foundation";
}

export function getMasteryLabel(level) {
  switch (level) {
    case "mastered":
    case "strong": return "Cemerlang";
    case "developing":
    case "good": return "Berkembang";
    case "needs_foundation": return "Perlu Asas";
    default: return "Belum Dinilai";
  }
}

export function getMasteryEmoji(level) {
  switch (level) {
    case "mastered":
    case "strong": return "🟢";
    case "developing":
    case "good": return "🟡";
    case "needs_foundation": return "🔴";
    default: return "⚪";
  }
}

export function getMasteryColor(level) {
  switch (level) {
    case "mastered": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "developing": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "needs_foundation": return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    default: return "text-stone-400 bg-stone-500/10 border-stone-500/30";
  }
}
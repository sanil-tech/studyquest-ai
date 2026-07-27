/**
 * Bank Soalan Diagnostik — MEMBACA (Bahasa Melayu)
 * Berdasarkan: Ujian Diagnostik Pemulihan Khas 2
 * Kemahiran 1–32 (Huruf hingga Pemahaman)
 */

export const MEMBACA_QUESTIONS = [
  // ── KEMAHIRAN 1 & 2: HURUF KECIL & BESAR ────────────────
  {
    id: "B-LC-01", subject: "membaca", skill: "lowercase_letters", sub_skill: "recognition", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Huruf manakah ini? → 'b'", display: "Apakah nama huruf ini: b", options: ["b", "d", "p", "q"], correct: "b" }),
    answer: "b", explanation: "Huruf ini ialah 'b'.", layer: "screening",
  },
  {
    id: "B-LC-02", subject: "membaca", skill: "lowercase_letters", sub_skill: "sequence", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Huruf selepas 'm' ialah?", display: "... l, m, ___, o, p ...", options: ["k", "n", "o", "q"], correct: "n" }),
    answer: "n", explanation: "Susunan abjad: l, m, n, o, p.", layer: "screening",
  },
  {
    id: "B-LC-03", subject: "membaca", skill: "lowercase_letters", sub_skill: "reading", difficulty: 1,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Sebut huruf-huruf ini:", display: "a   b   c   d   e   f   g   h   i   j", prompt: "Sebut: a, b, c, d, e, f, g, h, i, j" }),
    answer: "a b c d e f g h i j", explanation: "Huruf kecil a hingga j.", layer: "screening",
  },
  {
    id: "B-UC-01", subject: "membaca", skill: "uppercase_letters", sub_skill: "recognition", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Huruf besar manakah ini? → 'A'", display: "Apakah nama huruf besar: A", options: ["A", "B", "D", "E"], correct: "A" }),
    answer: "A", explanation: "Huruf besar ini ialah 'A'.", layer: "screening",
  },
  {
    id: "B-UC-02", subject: "membaca", skill: "uppercase_letters", sub_skill: "reading", difficulty: 1,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Sebut huruf besar ini:", display: "A   B   C   D   E", prompt: "Sebut: A, B, C, D, E" }),
    answer: "A B C D E", explanation: "Lima huruf besar pertama.", layer: "screening",
  },

  // ── KEMAHIRAN 3: HURUF VOKAL ─────────────────────────────
  {
    id: "B-VOW-01", subject: "membaca", skill: "vowels", sub_skill: "sound", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "'ANGGUR' bermula dengan huruf vokal apa?", display: "🍇 _nggur — Huruf vokal pertama?", options: ["a", "e", "i", "o"], correct: "a" }),
    answer: "a", explanation: "Anggur bermula dengan 'a'. A-nggur.", layer: "screening",
  },
  {
    id: "B-VOW-02", subject: "membaca", skill: "vowels", sub_skill: "sound", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "'IBU' bermula dengan huruf vokal apa?", display: "👩 _bu — Huruf vokal pertama?", options: ["a", "e", "i", "o"], correct: "i" }),
    answer: "i", explanation: "Ibu bermula dengan 'i'. I-bu.", layer: "screening",
  },
  {
    id: "B-VOW-03", subject: "membaca", skill: "vowels", sub_skill: "sound", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "'ULAR' bermula dengan huruf vokal apa?", display: "🐍 _lar — Huruf vokal pertama?", options: ["a", "e", "o", "u"], correct: "u" }),
    answer: "u", explanation: "Ular bermula dengan 'u'. U-lar.", layer: "screening",
  },
  {
    id: "B-VOW-04", subject: "membaca", skill: "vowels", sub_skill: "identification", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Manakah antara berikut BUKAN huruf vokal?", display: "Pilih yang BUKAN vokal:", options: ["b", "a", "e", "i"], correct: "b" }),
    answer: "b", explanation: "Huruf vokal: a, e, i, o, u. 'b' adalah konsonan.", layer: "screening",
  },

  // ── KEMAHIRAN 4: SUKU KATA KV ────────────────────────────
  {
    id: "B-KV-01", subject: "membaca", skill: "syllable_kv", sub_skill: "reading", difficulty: 1,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Eja dan baca suku kata ini:", display: "ma — ta", prompt: "Eja: ma-ta. Baca: mata" }),
    answer: "mata", explanation: "ma + ta = mata.", layer: "screening",
  },
  {
    id: "B-KV-02", subject: "membaca", skill: "syllable_kv", sub_skill: "combine", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "'ku' + 'da' = ?", display: "ku + da = ___", options: ["kuda", "duka", "kuku", "dada"], correct: "kuda" }),
    answer: "kuda", explanation: "ku + da = kuda (horse).", layer: "screening",
  },
  {
    id: "B-KV-03", subject: "membaca", skill: "syllable_kv", sub_skill: "combine", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "'me' + 'ja' = ?", display: "me + ja = ___", options: ["jema", "meja", "jame", "maje"], correct: "meja" }),
    answer: "meja", explanation: "me + ja = meja (table).", layer: "screening",
  },

  // ── KEMAHIRAN 5: PERKATAAN KV+KV ────────────────────────
  {
    id: "B-KVKV-01", subject: "membaca", skill: "word_kv_kv", sub_skill: "reading", difficulty: 1,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan-perkataan ini:", display: "buku   kuku   meja   kaki   biru   suka", prompt: "Baca: buku, kuku, meja, kaki, biru, suka" }),
    answer: "buku kuku meja kaki biru suka", explanation: "Perkataan KV+KV.", layer: "screening",
  },
  {
    id: "B-KVKV-02", subject: "membaca", skill: "word_kv_kv", sub_skill: "meaning", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Apakah maksud 'buku'?", display: "buku = ___", options: ["Bahan bacaan berkulit keras", "Makanan", "Binatang", "Warna"], correct: "Bahan bacaan berkulit keras" }),
    answer: "Bahan bacaan berkulit keras", explanation: "Buku ialah bahan bacaan.", layer: "screening",
  },
  {
    id: "B-KVKV-03", subject: "membaca", skill: "word_kv_kv", sub_skill: "reading", difficulty: 1,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan ini:", display: "dahi   budi   lidi   kopi", prompt: "Baca: dahi, budi, lidi, kopi" }),
    answer: "dahi budi lidi kopi", explanation: "Lebih banyak perkataan KV+KV.", layer: "screening",
  },

  // ── KEMAHIRAN 6: PERKATAAN V+KV ─────────────────────────
  {
    id: "B-VKV-01", subject: "membaca", skill: "word_v_kv", sub_skill: "reading", difficulty: 1,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan-perkataan ini:", display: "ibu   ini   itu   aku   ada   ubi   abu", prompt: "Baca: ibu, ini, itu, aku, ada, ubi, abu" }),
    answer: "ibu ini itu aku ada ubi abu", explanation: "Perkataan bermula dengan vokal.", layer: "screening",
  },
  {
    id: "B-VKV-02", subject: "membaca", skill: "word_v_kv", sub_skill: "meaning", difficulty: 1,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Apakah maksud 'aku'?", display: "aku = ___", options: ["Saya/Diri sendiri", "Kamu", "Dia", "Mereka"], correct: "Saya/Diri sendiri" }),
    answer: "Saya/Diri sendiri", explanation: "Aku = saya, kata ganti nama diri pertama.", layer: "screening",
  },

  // ── KEMAHIRAN 7: KV+KV+KV ───────────────────────────────
  {
    id: "B-KVKVKV-01", subject: "membaca", skill: "word_kv_kv_kv", sub_skill: "reading", difficulty: 2,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan 3 suku kata:", display: "kerusi   kelapa   menara   kereta   pelita", prompt: "Baca: kerusi, kelapa, menara, kereta, pelita" }),
    answer: "kerusi kelapa menara kereta pelita", explanation: "Perkataan 3 suku kata KV+KV+KV.", layer: "screening",
  },
  {
    id: "B-KVKVKV-02", subject: "membaca", skill: "word_kv_kv_kv", sub_skill: "syllable_split", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Suku kata untuk 'kereta'?", display: "kereta = ___", options: ["ke-re-ta", "ker-eta", "ke-ret-a", "kere-ta"], correct: "ke-re-ta" }),
    answer: "ke-re-ta", explanation: "kereta = ke + re + ta (3 suku kata KV).", layer: "screening",
  },
  {
    id: "B-KVKVKV-03", subject: "membaca", skill: "word_kv_kv_kv", sub_skill: "reading", difficulty: 2,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan ini:", display: "keladi   menari   petola", prompt: "Baca: keladi, menari, petola" }),
    answer: "keladi menari petola", explanation: "Lebih perkataan KV+KV+KV.", layer: "screening",
  },

  // ── KEMAHIRAN 8 & 9: KVK ────────────────────────────────
  {
    id: "B-KVK-01", subject: "membaca", skill: "word_kvk", sub_skill: "reading", difficulty: 1,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan KVK ini:", display: "bas   beg   pen   bot   kek   dam   lap   cop", prompt: "Baca: bas, beg, pen, bot, kek, dam, lap, cop" }),
    answer: "bas beg pen bot kek dam lap cop", explanation: "Perkataan KVK satu suku kata.", layer: "screening",
  },
  {
    id: "B-SYLKVK-01", subject: "membaca", skill: "syllable_kvk", sub_skill: "reading", difficulty: 2,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan dengan suku kata KVK:", display: "biskut   sampah   lembut   cincin   rimba   lembu", prompt: "Baca: biskut, sampah, lembut, cincin, rimba, lembu" }),
    answer: "biskut sampah lembut cincin rimba lembu", explanation: "Perkataan dengan suku kata KVK.", layer: "investigation",
  },

  // ── KEMAHIRAN 10: V+KVK ─────────────────────────────────
  {
    id: "B-VKVK-01", subject: "membaca", skill: "word_v_kvk", sub_skill: "reading", difficulty: 2,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Eja dan sebut perkataan ini:", display: "itik   ubat   ekor   ayam   oren", prompt: "Sebut: itik, ubat, ekor, ayam, oren" }),
    answer: "itik ubat ekor ayam oren", explanation: "Perkataan V+KVK.", layer: "investigation",
  },
  {
    id: "B-VKVK-02", subject: "membaca", skill: "word_v_kvk", sub_skill: "syllable_split", difficulty: 2,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Suku kata untuk 'ayam'?", display: "ayam = ___", options: ["a-yam", "ay-am", "a-ya-m", "aya-m"], correct: "a-yam" }),
    answer: "a-yam", explanation: "ayam = a (V) + yam (KVK).", layer: "investigation",
  },

  // ── KEMAHIRAN 11: KV+KVK ─────────────────────────────────
  {
    id: "B-KVKVK-01", subject: "membaca", skill: "word_kv_kvk", sub_skill: "reading", difficulty: 2,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca rangkai kata ini:", display: "tujuh kotak   kapal layar   tulis surat   cawan putih   jarum tajam", prompt: "Baca: tujuh kotak, kapal layar, tulis surat, cawan putih, jarum tajam" }),
    answer: "tujuh kotak kapal layar tulis surat cawan putih jarum tajam", explanation: "Rangkai kata KV+KVK.", layer: "investigation",
  },

  // ── KEMAHIRAN 12: KVK+KV ─────────────────────────────────
  {
    id: "B-KVKKV-01", subject: "membaca", skill: "word_kvk_kv", sub_skill: "reading", difficulty: 2,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Eja dan sebut perkataan:", display: "penyu   garpu   kunci   lembu   bendi   jambu", prompt: "Sebut: penyu, garpu, kunci, lembu, bendi, jambu" }),
    answer: "penyu garpu kunci lembu bendi jambu", explanation: "Perkataan KVK+KV.", layer: "investigation",
  },

  // ── KEMAHIRAN 13: KVK+KVK ─────────────────────────────
  {
    id: "B-KVKKVK-01", subject: "membaca", skill: "word_kvk_kvk", sub_skill: "reading", difficulty: 2,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan-perkataan ini:", display: "bantal   kertas   doktor   sampan   cincin   mancis   rumput", prompt: "Baca: bantal, kertas, doktor, sampan, cincin, mancis, rumput" }),
    answer: "bantal kertas doktor sampan cincin mancis rumput", explanation: "Perkataan KVK+KVK.", layer: "investigation",
  },

  // ── KEMAHIRAN 14: KV+KV+KVK ──────────────────────────────
  {
    id: "B-KVKVKVK-01", subject: "membaca", skill: "word_kv_kv_kvk", sub_skill: "reading", difficulty: 2,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan 3 suku kata:", display: "basikal   sekolah   selamat   ketupat   kelawar   selipar", prompt: "Baca: basikal, sekolah, selamat, ketupat, kelawar, selipar" }),
    answer: "basikal sekolah selamat ketupat kelawar selipar", explanation: "Perkataan KV+KV+KVK.", layer: "investigation",
  },

  // ── KEMAHIRAN 15: KVK+KV+KVK ─────────────────────────────
  {
    id: "B-KVKKVKVK-01", subject: "membaca", skill: "word_kvk_kv_kvkk", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan panjang ini:", display: "jambatan   rambutan   cempedak   cendawan   tempayan", prompt: "Baca: jambatan, rambutan, cempedak, cendawan, tempayan" }),
    answer: "jambatan rambutan cempedak cendawan tempayan", explanation: "Perkataan KVK+KV+KVK.", layer: "investigation",
  },

  // ── KEMAHIRAN 16: KVKK ───────────────────────────────────
  {
    id: "B-KVKK-01", subject: "membaca", skill: "syllable_kvkk", sub_skill: "reading", difficulty: 2,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan KVKK ini:", display: "tangki   tulang   loceng   pedang   bangku", prompt: "Baca: tangki, tulang, loceng, pedang, bangku" }),
    answer: "tangki tulang loceng pedang bangku", explanation: "Suku kata KVKK — berakhir 2 konsonan.", layer: "investigation",
  },
  {
    id: "B-KVKK-02", subject: "membaca", skill: "word_kvkk", sub_skill: "sentence_reading", difficulty: 2,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca ayat-ayat ini:", display: "Atas lori ada tong.\nAyah beli gong.\nLiza beri wang.\nZink itu telah karat.", prompt: "Baca ayat: Atas lori ada tong. Ayah beli gong. Liza beri wang." }),
    answer: "Atas lori ada tong Ayah beli gong Liza beri wang", explanation: "Ayat dengan perkataan KVKK.", layer: "investigation",
  },

  // ── KEMAHIRAN 18: KV+KVKK ────────────────────────────────
  {
    id: "B-KVKVKK-01", subject: "membaca", skill: "word_kv_kvkk", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Eja dan sebut perkataan:", display: "burung   kucing   piring   payung", prompt: "Sebut: burung, kucing, piring, payung" }),
    answer: "burung kucing piring payung", explanation: "Perkataan KV+KVKK.", layer: "investigation",
  },

  // ── KEMAHIRAN 19: V+KVKK ─────────────────────────────────
  {
    id: "B-VKVKK-01", subject: "membaca", skill: "word_v_kvkk", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan berdasarkan gambar:", display: "udang   orang   usung   abang", prompt: "Baca: udang, orang, usung, abang" }),
    answer: "udang orang usung abang", explanation: "Perkataan V+KVKK.", layer: "investigation",
  },

  // ── KEMAHIRAN 20: KVK+KVKK ───────────────────────────────
  {
    id: "B-KVKKVKK-01", subject: "membaca", skill: "word_kvk_kvkk", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan-perkataan ini:", display: "kandang   bintang   kumbang   kambing   terbang   jantung", prompt: "Baca: kandang, bintang, kumbang, kambing, terbang, jantung" }),
    answer: "kandang bintang kumbang kambing terbang jantung", explanation: "Perkataan KVK+KVKK.", layer: "investigation",
  },

  // ── KEMAHIRAN 21: KVKK+KV ────────────────────────────────
  {
    id: "B-KVKKKV-01", subject: "membaca", skill: "word_kvkk_kv", sub_skill: "sentence_reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca ayat-ayat ini:", display: "Dolah suka makan nangka.\nBangku ada di kantin.\nSalmah beli mangga di kedai.", prompt: "Baca: Dolah suka makan nangka. Bangku ada di kantin." }),
    answer: "Dolah suka makan nangka Bangku ada di kantin", explanation: "Ayat dengan perkataan KVKK+KV.", layer: "investigation",
  },

  // ── KEMAHIRAN 22: KVKK+KVK ───────────────────────────────
  {
    id: "B-KVKKKVK-01", subject: "membaca", skill: "word_kvkk_kvk", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan-perkataan ini:", display: "tingkap   songkok   tongkat   mangkuk   sangkar   langsir", prompt: "Baca: tingkap, songkok, tongkat, mangkuk, sangkar, langsir" }),
    answer: "tingkap songkok tongkat mangkuk sangkar langsir", explanation: "Perkataan KVKK+KVK.", layer: "investigation",
  },

  // ── KEMAHIRAN 23: KVKK+KVKK ──────────────────────────────
  {
    id: "B-KVKKKVKK-01", subject: "membaca", skill: "word_kvkk_kvkk", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan:", display: "kangkung   tongkang   longkang   jengking   tanglung", prompt: "Baca: kangkung, tongkang, longkang, jengking, tanglung" }),
    answer: "kangkung tongkang longkang jengking tanglung", explanation: "Perkataan KVKK+KVKK.", layer: "investigation",
  },

  // ── KEMAHIRAN 24: KV+KV+KVKK ─────────────────────────────
  {
    id: "B-KVKVKVKK-01", subject: "membaca", skill: "word_kv_kv_kvkk", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan panjang 3 suku kata:", display: "belalang   seladang   teropong   senapang   peladang", prompt: "Baca: belalang, seladang, teropong, senapang, peladang" }),
    answer: "belalang seladang teropong senapang peladang", explanation: "Perkataan KV+KV+KVKK.", layer: "investigation",
  },

  // ── KEMAHIRAN 25: KV+KVK+KVKK ────────────────────────────
  {
    id: "B-KVKVKKVKK-01", subject: "membaca", skill: "word_kv_kvk_kvkk", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan kompleks:", display: "memancin   belimbing   penumpang   pelampung   kerinting   menendang", prompt: "Baca: memancin, belimbing, penumpang, pelampung" }),
    answer: "memancin belimbing penumpang pelampung kerinting menendang", explanation: "Perkataan KV+KVK+KVKK.", layer: "investigation",
  },

  // ── KEMAHIRAN 26–28: PERKATAAN PANJANG ───────────────────
  {
    id: "B-LONG-01", subject: "membaca", skill: "word_kvk_kv_kvkk", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan panjang ini:", display: "pendayung   tempurung   tengkujuh   pemborong", prompt: "Baca: pendayung, tempurung, tengkujuh, pemborong" }),
    answer: "pendayung tempurung tengkujuh pemborong", explanation: "Perkataan KVK+KV+KVKK.", layer: "investigation",
  },
  {
    id: "B-LONG-02", subject: "membaca", skill: "word_kvkk_kv_kvk", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan:", display: "tengkolok   bungkusan   tengkorak   panggilan", prompt: "Baca: tengkolok, bungkusan, tengkorak, panggilan" }),
    answer: "tengkolok bungkusan tengkorak panggilan", explanation: "Perkataan KVKK+KV+KVK.", layer: "investigation",
  },
  {
    id: "B-LONG-03", subject: "membaca", skill: "word_kv_kvkk_kvk", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan yang sukar:", display: "merangkak   menangkap   melanggar   gelongsor   selonggok", prompt: "Baca: merangkak, menangkap, melanggar, gelongsor, selonggok" }),
    answer: "merangkak menangkap melanggar gelongsor selonggok", explanation: "Perkataan KV+KVKK+KVK.", layer: "investigation",
  },

  // ── KEMAHIRAN 29: DIFTONG ─────────────────────────────────
  {
    id: "B-DIFT-01", subject: "membaca", skill: "diphthong", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan diftong:", display: "daun   wau   biola   buaya   tuala   kerbau", prompt: "Baca: daun, wau, biola, buaya, tuala, kerbau" }),
    answer: "daun wau biola buaya tuala kerbau", explanation: "Diftong: au, ia, ua — dua vokal dalam satu suku kata.", layer: "investigation",
  },
  {
    id: "B-DIFT-02", subject: "membaca", skill: "diphthong", sub_skill: "identification", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Perkataan 'daun' mempunyai diftong apa?", display: "daun = d + ___ + n", options: ["au", "ai", "oi", "ui"], correct: "au" }),
    answer: "au", explanation: "Daun = d-au-n. Diftong 'au'.", layer: "investigation",
  },

  // ── KEMAHIRAN 30: DIAGRAF ─────────────────────────────────
  {
    id: "B-DIAG-01", subject: "membaca", skill: "diagraph", sub_skill: "reading", difficulty: 3,
    question_type: "voice",
    question_content: JSON.stringify({ question: "Baca perkataan konsonan bergabung:", display: "punya   sunyi   nganga   nyanyi   ngeri   sungai", prompt: "Baca: punya, sunyi, nganga, nyanyi, ngeri, sungai" }),
    answer: "punya sunyi nganga nyanyi ngeri sungai", explanation: "Konsonan bergabung: ny, ng.", layer: "investigation",
  },

  // ── KEMAHIRAN 31: AYAT MUDAH ──────────────────────────────
  {
    id: "B-SEN-01", subject: "membaca", skill: "sentence_reading", sub_skill: "fill_blank", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Lengkapkan: 'Bangku ada di ___.'", display: "Bangku ada di ___.", options: ["kantin", "langit", "sungai", "pokok"], correct: "kantin" }),
    answer: "kantin", explanation: "Bangku ada di kantin.", layer: "investigation",
  },
  {
    id: "B-SEN-02", subject: "membaca", skill: "sentence_reading", sub_skill: "fill_blank", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Lengkapkan: 'Adik lihat bintang di ___.'", display: "Adik lihat bintang di ___.", options: ["langit", "dapur", "kolam", "pasar"], correct: "langit" }),
    answer: "langit", explanation: "Bintang ada di langit.", layer: "investigation",
  },

  // ── KEMAHIRAN 32: BACAAN & PEMAHAMAN ─────────────────────
  {
    id: "B-COMP-01", subject: "membaca", skill: "comprehension", sub_skill: "literal", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Baca: 'Kereta Wira Amira warna merah.' → Apakah warna kereta Amira?", display: "Petikan: Amira beli kereta Wira. Kereta Wira Amira warna merah.\n\nApakah warna kereta Amira?", options: ["Merah", "Biru", "Hijau", "Hitam"], correct: "Merah" }),
    answer: "Merah", explanation: "Kereta Wira Amira warna merah.", layer: "investigation",
  },
  {
    id: "B-COMP-02", subject: "membaca", skill: "comprehension", sub_skill: "literal", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Ke manakah Amira bawa Anita?", display: "Petikan: Amira bawa Anita ke kota raya. Di Kota raya ada kereta Wira dan Waja.\n\nKe manakah Amira bawa Anita?", options: ["Kota raya", "Sekolah", "Pasar", "Hospital"], correct: "Kota raya" }),
    answer: "Kota raya", explanation: "Amira bawa Anita ke kota raya.", layer: "investigation",
  },
  {
    id: "B-COMP-03", subject: "membaca", skill: "comprehension", sub_skill: "inference", difficulty: 3,
    question_type: "mcq",
    question_content: JSON.stringify({ question: "Di Kota Raya ada kereta jenis apa?", display: "Petikan: Di Kota raya ada kereta Wira dan Waja.\n\nJenis kereta apa yang ada di Kota Raya?", options: ["Wira dan Waja", "Kancil dan Saga", "Hanya Wira", "Hanya Waja"], correct: "Wira dan Waja" }),
    answer: "Wira dan Waja", explanation: "Di Kota Raya ada kereta Wira dan Waja.", layer: "investigation",
  },
];
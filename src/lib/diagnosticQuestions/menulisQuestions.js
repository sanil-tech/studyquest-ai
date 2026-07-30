/**
 * Bank Soalan Diagnostik — MENULIS (Tulisan Tangan)
 * Menggunakan kaedah image_upload + AI analysis
 * Berdasarkan: Ujian Diagnostik Pemulihan Khas
 */

export const MENULIS_QUESTIONS = [
  {
    id: "W-LC-01", subject: "menulis", skill: "write_lowercase", sub_skill: "formation", difficulty: 1,
    question_type: "image_upload",
    question_content: JSON.stringify({
      question: "Tulis huruf kecil 'a b c d e' dalam ruang yang disediakan.",
      display: "✏️ Tulis dengan jelas:\na   b   c   d   e",
      prompt: "Tulis huruf kecil: a, b, c, d, e",
      instruction: "Tulis huruf-huruf ini di atas kertas, kemudian ambil gambar.",
    }),
    answer: "a b c d e",
    explanation: "Semak pembentukan huruf, saiz sekata, dan kejelasan tulisan.",
    layer: "screening",
  },
  {
    id: "W-UC-01", subject: "menulis", skill: "write_uppercase", sub_skill: "formation", difficulty: 1,
    question_type: "image_upload",
    question_content: JSON.stringify({
      question: "Tulis huruf besar 'A B C D E' dalam ruang yang disediakan.",
      display: "✏️ Tulis dengan jelas:\nA   B   C   D   E",
      prompt: "Tulis huruf besar: A, B, C, D, E",
      instruction: "Tulis di atas kertas, kemudian ambil gambar.",
    }),
    answer: "A B C D E",
    explanation: "Semak pembentukan huruf besar, saiz sekata, dan kejelasan.",
    layer: "screening",
  },
  {
    id: "W-NUM-01", subject: "menulis", skill: "write_numbers", sub_skill: "formation", difficulty: 1,
    question_type: "image_upload",
    question_content: JSON.stringify({
      question: "Tulis nombor 1 hingga 10.",
      display: "✏️ Tulis nombor:\n1  2  3  4  5  6  7  8  9  10",
      prompt: "Tulis nombor 1 hingga 10",
      instruction: "Tulis nombor di atas kertas, kemudian ambil gambar.",
    }),
    answer: "1 2 3 4 5 6 7 8 9 10",
    explanation: "Semak pembentukan nombor, arah penulisan, saiz sekata.",
    layer: "screening",
  },
  {
    id: "W-WORD-01", subject: "menulis", skill: "write_words_kv", sub_skill: "copy", difficulty: 2,
    question_type: "image_upload",
    question_content: JSON.stringify({
      question: "Salin perkataan-perkataan ini: buku, meja, kaki",
      display: "✏️ Salin perkataan:\nbuku   meja   kaki",
      prompt: "Tulis: buku, meja, kaki",
      instruction: "Salin perkataan di atas kertas, kemudian ambil gambar.",
    }),
    answer: "buku meja kaki",
    explanation: "Semak ejaan, bentuk huruf, jarak antara perkataan.",
    layer: "investigation",
  },
  {
    id: "W-WORD-02", subject: "menulis", skill: "write_words_kvk", sub_skill: "copy", difficulty: 2,
    question_type: "image_upload",
    question_content: JSON.stringify({
      question: "Tulis perkataan-perkataan ini: bas, pen, kek",
      display: "✏️ Tulis perkataan:\nbas   pen   kek",
      prompt: "Tulis: bas, pen, kek",
      instruction: "Tulis perkataan di atas kertas, kemudian ambil gambar.",
    }),
    answer: "bas pen kek",
    explanation: "Semak ejaan perkataan KVK dan pembentukan huruf.",
    layer: "investigation",
  },
  {
    id: "W-SEN-01", subject: "menulis", skill: "write_sentence", sub_skill: "copy", difficulty: 3,
    question_type: "image_upload",
    question_content: JSON.stringify({
      question: "Tulis ayat ini: 'Saya suka belajar.'",
      display: "✏️ Tulis ayat:\nSaya suka belajar.",
      prompt: "Tulis ayat: Saya suka belajar.",
      instruction: "Tulis ayat di atas kertas, kemudian ambil gambar.",
    }),
    answer: "Saya suka belajar.",
    explanation: "Semak pembentukan huruf, ejaan, huruf besar di awal ayat, dan tanda noktah.",
    layer: "investigation",
  },
];
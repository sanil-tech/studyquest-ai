/**
 * Bank Soalan Diagnostik 3M — Berdasarkan Program Pemulihan Khas Malaysia
 *
 * Dokumen sumber:
 * 1. Ujian Diagnostik Matematik (Kemahiran 1–18)
 *    - Pra-Nombor (warna, saiz, bentuk)
 *    - Konsep Nombor, Nombor 1–10, 11–20, 50, 100
 *    - Operasi: Tambah, Tolak, Darab, Bahagi
 *    - Masa, Wang, Penyelesaian Masalah
 *
 * 2. Ujian Diagnostik Pemulihan Khas 2 (Kemahiran 1–32)
 *    - Huruf kecil a–z, Huruf besar A–Z
 *    - Vokal, Suku kata KV/KVK/KVKK
 *    - Perkataan dari 2 hingga 3 suku kata
 *    - Diftong, Diagraf, Ayat, Pemahaman
 *
 * Kaedah ujian yang digunakan:
 * - MCQ: Pilihan berganda (untuk konsep dan fakta)
 * - Voice: Bacaan kuat (untuk sebutan dan kelancaran)
 * - Image Upload: Tulisan tangan (untuk kemahiran menulis)
 */

export { MENGIRA_QUESTIONS } from './diagnosticQuestions/mengiraQuestions';
export { MEMBACA_QUESTIONS } from './diagnosticQuestions/membacaQuestions';
export { MENULIS_QUESTIONS } from './diagnosticQuestions/menulisQuestions';

import { MENGIRA_QUESTIONS } from './diagnosticQuestions/mengiraQuestions';
import { MEMBACA_QUESTIONS } from './diagnosticQuestions/membacaQuestions';
import { MENULIS_QUESTIONS } from './diagnosticQuestions/menulisQuestions';

// ─────────────────────────────────────────────────────────────
// METADATA MODUL
// ─────────────────────────────────────────────────────────────
export const DIAGNOSTIC_MODULES_META = [
  {
    id: "mengira",
    label: "Mengira",
    emoji: "🔢",
    color: "amber",
    description: "Nombor, tambah, tolak, darab, bahagi, masa & wang",
    skillDisplayNames: {
      pre_number: "Pra-Nombor (Warna, Saiz, Bentuk)",
      number_concept: "Konsep Nombor (Banyak/Sedikit/Sama)",
      number_1_10: "Mengenal Nombor 1–10",
      number_sequence: "Turutan & Nilai Nombor",
      addition_10: "Operasi Tambah (≤10)",
      subtraction_10: "Operasi Tolak (≤10)",
      number_11_20: "Mengenal Nombor 11–20",
      addition_18: "Operasi Tambah (≤18)",
      subtraction_18: "Operasi Tolak (≤18)",
      number_50: "Nombor hingga 50",
      zero_concept: "Konsep Sifar",
      addition_50: "Operasi Tambah (≤50)",
      subtraction_50: "Operasi Tolak (≤50)",
      number_100: "Nombor hingga 100",
      multiplication: "Operasi Darab (hingga 9×5)",
      division: "Operasi Bahagi (hingga 45÷5)",
      time: "Masa & Waktu",
      money: "Wang (Sen & Ringgit)",
      problem_solving: "Penyelesaian Masalah",
    },
  },
  {
    id: "membaca",
    label: "Membaca",
    emoji: "📖",
    color: "emerald",
    description: "Huruf, suku kata, perkataan, ayat & pemahaman",
    skillDisplayNames: {
      lowercase_letters: "Huruf Kecil a–z",
      uppercase_letters: "Huruf Besar A–Z",
      vowels: "Huruf Vokal (a, e, i, o, u)",
      syllable_kv: "Suku Kata KV",
      word_kv_kv: "Perkataan KV+KV",
      word_v_kv: "Perkataan V+KV",
      word_kv_kv_kv: "Perkataan KV+KV+KV",
      word_kvk: "Perkataan KVK",
      syllable_kvk: "Suku Kata KVK",
      word_v_kvk: "Perkataan V+KVK",
      word_kv_kvk: "Perkataan KV+KVK",
      word_kvk_kv: "Perkataan KVK+KV",
      word_kvk_kvk: "Perkataan KVK+KVK",
      word_kv_kv_kvk: "Perkataan KV+KV+KVK",
      word_kvkk: "Perkataan KVKK",
      syllable_kvkk: "Suku Kata KVKK",
      word_kv_kvkk: "Perkataan KV+KVKK",
      word_v_kvkk: "Perkataan V+KVKK",
      word_kvk_kvkk: "Perkataan KVK+KVKK",
      word_kvkk_kv: "Perkataan KVKK+KV",
      word_kvkk_kvk: "Perkataan KVKK+KVK",
      word_kvkk_kvkk: "Perkataan KVKK+KVKK",
      word_kv_kv_kvkk: "Perkataan KV+KV+KVKK",
      word_kv_kvk_kvkk: "Perkataan KV+KVK+KVKK",
      word_kvk_kv_kvkk: "Perkataan KVK+KV+KVKK",
      word_kvkk_kv_kvk: "Perkataan KVKK+KV+KVK",
      word_kv_kvkk_kvk: "Perkataan KV+KVKK+KVK",
      diphthong: "Diftong & Vokal Berganding",
      diagraph: "Konsonan Bergabung (Diagraf)",
      sentence_reading: "Membaca & Membina Ayat",
      comprehension: "Bacaan & Pemahaman",
    },
  },
  {
    id: "menulis",
    label: "Menulis",
    emoji: "✏️",
    color: "blue",
    description: "Tulisan tangan huruf, nombor, perkataan dan ayat",
    skillDisplayNames: {
      write_lowercase: "Tulis Huruf Kecil",
      write_uppercase: "Tulis Huruf Besar",
      write_numbers: "Tulis Nombor 1–10",
      write_words_kv: "Tulis Perkataan KV+KV",
      write_words_kvk: "Tulis Perkataan KVK",
      write_sentence: "Tulis Ayat Mudah",
    },
  },
];

// ─────────────────────────────────────────────────────────────
// SEMUA SOALAN
// ─────────────────────────────────────────────────────────────
export const ALL_DIAGNOSTIC_QUESTIONS = [
  ...MENGIRA_QUESTIONS,
  ...MEMBACA_QUESTIONS,
  ...MENULIS_QUESTIONS,
];

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

export function getQuestionsByModule(subject, layer = "screening") {
  return ALL_DIAGNOSTIC_QUESTIONS.filter(
    (q) => q.subject === subject && q.layer === layer
  );
}

export function getQuestionsBySkill(subject, skill) {
  return ALL_DIAGNOSTIC_QUESTIONS.filter(
    (q) => q.subject === subject && q.skill === skill
  );
}

export function getScreeningQuestions(subject, count = 5) {
  return ALL_DIAGNOSTIC_QUESTIONS
    .filter((q) => q.subject === subject && q.layer === "screening")
    .slice(0, count);
}

export function getMasteryLabel(mastery) {
  const labels = {
    not_assessed: "Belum Dinilai",
    needs_foundation: "Perlu Asas",
    developing: "Sedang Berkembang",
    good: "Baik",
    strong: "Sangat Baik",
  };
  return labels[mastery] || mastery;
}

export function getMasteryEmoji(mastery) {
  const emojis = {
    not_assessed: "❓",
    needs_foundation: "🌱",
    developing: "🌤️",
    good: "⭐",
    strong: "🌟",
  };
  return emojis[mastery] || "❓";
}

export function calculateModuleScore(responses) {
  if (!responses || responses.length === 0) return 0;
  const correct = responses.filter((r) => r.is_correct).length;
  return Math.round((correct / responses.length) * 100);
}

export function determineMastery(score) {
  if (score >= 90) return "strong";
  if (score >= 70) return "good";
  if (score >= 50) return "developing";
  return "needs_foundation";
}

// Legacy aliases for adaptiveDiagnostic.js compatibility
export const QUESTION_BANK = ALL_DIAGNOSTIC_QUESTIONS;

export const MASTERY_THRESHOLDS = {
  mastered: 90,
  developing: 60,
  needs_foundation: 0,
};

export function getMasteryLevel(score) {
  if (score >= 90) return "mastered";
  if (score >= 60) return "developing";
  return "needs_foundation";
}

export default ALL_DIAGNOSTIC_QUESTIONS;
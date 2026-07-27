/**
 * Session Cache — menyimpan progres sesi kuiz & diagnostik ke localStorage.
 * Crash-proof: semua baca/tulis dibungkus try-catch.
 */

const QUIZ_PREFIX = "sq_quiz_session_";
const DIAG_PREFIX = "sq_diag_session";

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeWrite(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage penuh atau tidak tersedia — abaikan
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // abaikan
  }
}

// ─── KUIZ ───────────────────────────────────────────────

export function saveQuizSession(quizId, state) {
  if (!quizId) return;
  safeWrite(`${QUIZ_PREFIX}${quizId}`, {
    ...state,
    savedAt: Date.now(),
  });
}

export function getQuizSession(quizId) {
  if (!quizId) return null;
  return safeRead(`${QUIZ_PREFIX}${quizId}`);
}

export function clearQuizSession(quizId) {
  if (!quizId) return;
  safeRemove(`${QUIZ_PREFIX}${quizId}`);
}

// ─── DIAGNOSTIK ─────────────────────────────────────────

export function saveDiagnosticSession(state) {
  safeWrite(DIAG_PREFIX, {
    ...state,
    savedAt: Date.now(),
  });
}

export function getDiagnosticSession() {
  return safeRead(DIAG_PREFIX);
}

export function clearDiagnosticSession() {
  safeRemove(DIAG_PREFIX);
}
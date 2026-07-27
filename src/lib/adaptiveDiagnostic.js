// src/lib/adaptiveDiagnostic.js
// Adaptive Diagnostic Engine for StudyQuest 3M Foundation Assessment.
// Implements 2-layer adaptive flow: Screening → Investigation → Profile.

import {
  QUESTION_BANK,
  DIAGNOSTIC_MODULES_META,
  MASTERY_THRESHOLDS,
  getMasteryLevel,
  getMasteryLabel,
  getMasteryEmoji,
} from "./diagnosticQuestionBank";

// ================================================================
// LAYER 1: SCREENING QUESTION SELECTION
// ================================================================

/**
 * Selects screening questions for a given subject module.
 * Picks 2-3 questions per skill, prioritizing lower difficulty.
 * Returns ~8-10 questions per module.
 */
export function getScreeningQuestions(subject) {
  const moduleMeta = DIAGNOSTIC_MODULES_META.find((m) => m.id === subject);
  if (!moduleMeta) return [];

  const subjectQuestions = QUESTION_BANK.filter(
    (q) => q.subject === subject && q.layer === "screening" && q.question_type === "mcq"
  );

  const selected = [];
  for (const skill of moduleMeta.skills) {
    const skillQuestions = subjectQuestions
      .filter((q) => q.skill === skill)
      .sort((a, b) => a.difficulty - b.difficulty);

    // Pick 2 screening questions per skill (or 1 if that's all we have)
    const pickCount = Math.min(2, skillQuestions.length);
    selected.push(...skillQuestions.slice(0, pickCount));
  }

  return selected;
}

// ================================================================
// SCREENING ANALYSIS
// ================================================================

/**
 * Analyzes screening responses for a subject module.
 * Returns skill scores and identifies weak skills needing investigation.
 */
export function analyzeScreeningResults(responses, subject) {
  const moduleMeta = DIAGNOSTIC_MODULES_META.find((m) => m.id === subject);
  if (!moduleMeta) return { skillScores: {}, weakSkills: [] };

  const skillScores = {};
  const weakSkills = [];

  for (const skill of moduleMeta.skills) {
    const skillResponses = responses.filter(
      (r) => r.subject === subject && r.skill === skill
    );

    if (skillResponses.length === 0) continue;

    const correctCount = skillResponses.filter((r) => r.is_correct).length;
    const totalCount = skillResponses.length;
    const score = Math.round((correctCount / totalCount) * 100);
    const mastery = getMasteryLevel(score);

    skillScores[skill] = { score, mastery, correct: correctCount, total: totalCount };

    // Investigate if not mastered (< 90%)
    if (mastery !== "mastered") {
      weakSkills.push({ skill, score, mastery });
    }
  }

  return { skillScores, weakSkills };
}

// ================================================================
// LAYER 2: INVESTIGATION QUESTION SELECTION
// ================================================================

/**
 * Selects investigation questions for weak skills identified during screening.
 * Picks 1-2 investigation questions per weak skill, targeting specific sub-skills.
 */
export function getInvestigationQuestions(weakSkills, subject) {
  if (!weakSkills || weakSkills.length === 0) return [];

  const subjectQuestions = QUESTION_BANK.filter(
    (q) => q.subject === subject && q.layer === "investigation"
  );

  const selected = [];
  const usedSubSkills = new Set();

  for (const { skill } of weakSkills) {
    const skillQuestions = subjectQuestions
      .filter((q) => q.skill === skill)
      .sort((a, b) => a.difficulty - b.difficulty);

    // Pick up to 2 investigation questions, preferring different sub-skills
    let picked = 0;
    for (const q of skillQuestions) {
      if (picked >= 2) break;
      if (usedSubSkills.has(`${skill}_${q.sub_skill}`) && picked === 0) {
        selected.push(q);
        usedSubSkills.add(`${skill}_${q.sub_skill}`);
        picked++;
        continue;
      }
      if (!usedSubSkills.has(`${skill}_${q.sub_skill}`)) {
        selected.push(q);
        usedSubSkills.add(`${skill}_${q.sub_skill}`);
        picked++;
      }
    }

    // If no investigation questions exist for this skill, pick harder screening ones
    if (picked === 0) {
      const harderScreening = QUESTION_BANK.filter(
        (q) => q.subject === subject && q.skill === skill && q.layer === "screening" && q.difficulty >= 2
      );
      if (harderScreening.length > 0) {
        selected.push(harderScreening[0]);
      }
    }
  }

  return selected;
}

// ================================================================
// FULL SKILL PROFILE CALCULATION
// ================================================================

/**
 * Calculates comprehensive skill profiles from ALL responses (screening + investigation).
 * Returns an array of StudentSkillProfile objects.
 */
export function calculateSkillProfiles(allResponses) {
  const profiles = [];

  for (const moduleMeta of DIAGNOSTIC_MODULES_META) {
    for (const skill of moduleMeta.skills) {
      const skillResponses = allResponses.filter(
        (r) => r.subject === moduleMeta.id && r.skill === skill
      );

      if (skillResponses.length === 0) continue;

      const correctCount = skillResponses.filter((r) => r.is_correct).length;
      const totalCount = skillResponses.length;
      const score = Math.round((correctCount / totalCount) * 100);
      const mastery = getMasteryLevel(score);

      // Determine sub-skill breakdown
      const subSkillBreakdown = {};
      for (const r of skillResponses) {
        if (!r.sub_skill) continue;
        if (!subSkillBreakdown[r.sub_skill]) {
          subSkillBreakdown[r.sub_skill] = { correct: 0, total: 0 };
        }
        subSkillBreakdown[r.sub_skill].total++;
        if (r.is_correct) subSkillBreakdown[r.sub_skill].correct++;
      }

      profiles.push({
        student_id: null, // filled by backend
        session_id: null, // filled by backend
        subject: moduleMeta.id,
        skill,
        sub_skill: Object.keys(subSkillBreakdown).join(", ") || "general",
        mastery_level: mastery,
        score,
        questions_attempted: totalCount,
        questions_correct: correctCount,
        recommendation: getSkillRecommendation(moduleMeta.id, skill, mastery, score),
      });
    }
  }

  return profiles;
}

// ================================================================
// LEARNING PATH GENERATION
// ================================================================

/**
 * Generates a learning path from skill profiles.
 * Maps mastery levels to recommended starting points and missions.
 */
export function generateLearningPath(skillProfiles) {
  const path = {
    reading_level: "developing",
    writing_level: "developing",
    numeracy_level: "developing",
    reading_starting_point: "",
    writing_starting_point: "",
    numeracy_starting_point: "",
    recommended_topics: [],
    recommended_games: [],
    overall_recommendation: "",
  };

  // Reading path
  const readingProfiles = skillProfiles.filter((p) => p.subject === "membaca");
  if (readingProfiles.length > 0) {
    const avgScore = Math.round(
      readingProfiles.reduce((sum, p) => sum + p.score, 0) / readingProfiles.length
    );
    path.reading_level = mapToReadinessLevel(avgScore);
    path.reading_starting_point = getReadingStartingPoint(readingProfiles);
  }

  // Writing path
  const writingProfiles = skillProfiles.filter((p) => p.subject === "menulis");
  if (writingProfiles.length > 0) {
    const avgScore = Math.round(
      writingProfiles.reduce((sum, p) => sum + p.score, 0) / writingProfiles.length
    );
    path.writing_level = mapToReadinessLevel(avgScore);
    path.writing_starting_point = getWritingStartingPoint(writingProfiles);
  }

  // Numeracy path
  const numeracyProfiles = skillProfiles.filter((p) => p.subject === "mengira");
  if (numeracyProfiles.length > 0) {
    const avgScore = Math.round(
      numeracyProfiles.reduce((sum, p) => sum + p.score, 0) / numeracyProfiles.length
    );
    path.numeracy_level = mapToReadinessLevel(avgScore);
    path.numeracy_starting_point = getNumeracyStartingPoint(numeracyProfiles);
  }

  // Recommended topics
  path.recommended_topics = getRecommendedTopics(skillProfiles);

  // Recommended games
  path.recommended_games = getRecommendedGames(skillProfiles);

  // Overall recommendation
  path.overall_recommendation = getOverallRecommendation(path);

  return path;
}

function mapToReadinessLevel(score) {
  if (score >= 90) return "advanced";
  if (score >= 70) return "proficient";
  if (score >= 50) return "developing";
  return "foundation";
}

function getReadingStartingPoint(profiles) {
  const letterRecog = profiles.find((p) => p.skill === "letter_recognition");
  const syllableBlending = profiles.find((p) => p.skill === "syllable_blending");
  const wordReading = profiles.find((p) => p.skill === "word_reading");

  if (letterRecog && letterRecog.mastery_level === "needs_foundation") {
    return "Kembara Huruf — Mulakan dengan pengenalan huruf dan bunyi huruf setiap hari.";
  }
  if (syllableBlending && syllableBlending.mastery_level !== "mastered") {
    return "Kembara Suku Kata — Latih gabungan suku kata KV (ba, ma, sa, ta).";
  }
  if (wordReading && wordReading.mastery_level !== "mastered") {
    return "Kembara Perkataan — Latih membaca perkataan mudah (ibu, ayah, buku).";
  }
  return "Kembara Ayat — Pelajar sedia untuk membaca ayat dan perenggan.";
}

function getWritingStartingPoint(profiles) {
  const readiness = profiles.find((p) => p.skill === "writing_readiness");
  const letterWriting = profiles.find((p) => p.skill === "letter_writing");
  const wordWriting = profiles.find((p) => p.skill === "word_writing");

  if (readiness && readiness.mastery_level === "needs_foundation") {
    return "Latihan Motor Halus — Mulakan dengan aktiviti mewarna, mengesan garisan dan bentuk.";
  }
  if (letterWriting && letterWriting.mastery_level !== "mastered") {
    return "Penulisan Huruf — Latih menulis huruf vokal dan konsonan dengan panduan garisan.";
  }
  if (wordWriting && wordWriting.mastery_level !== "mastered") {
    return "Penulisan Perkataan — Latih menulis perkataan mudah (buku, bola, saya).";
  }
  return "Penulisan Ayat — Pelajar sedia untuk menulis ayat dengan huruf besar dan tanda baca.";
}

function getNumeracyStartingPoint(profiles) {
  const numRecog = profiles.find((p) => p.skill === "number_recognition");
  const counting = profiles.find((p) => p.skill === "counting");
  const comparison = profiles.find((p) => p.skill === "comparison");
  const operations = profiles.find((p) => p.skill === "basic_operations");

  if (numRecog && numRecog.mastery_level === "needs_foundation") {
    return "Kenali Nombor — Mulakan dengan mengenal nombor 0-10 menggunakan objek konkrit.";
  }
  if (counting && counting.mastery_level !== "mastered") {
    return "Mengira Objek — Latih mengira objek sehingga 10, kemudian sehingga 20.";
  }
  if (comparison && comparison.mastery_level !== "mastered") {
    return "Perbandingan Nombor — Latih membandingkan lebih besar, lebih kecil, lebih, kurang.";
  }
  if (operations && operations.mastery_level !== "mastered") {
    return "Operasi Asas — Latih tambah dan tolak within 10 dengan objek dan gambar.";
  }
  return "Penyelesaian Masalah — Pelajar sedia untuk masalah matematik yang lebih kompleks.";
}

function getRecommendedTopics(profiles) {
  const topics = [];

  for (const p of profiles) {
    if (p.mastery_level === "mastered") continue;

    const moduleName = DIAGNOSTIC_MODULES_META.find((m) => m.id === p.subject)?.title || p.subject;
    const skillName = DIAGNOSTIC_MODULES_META
      .find((m) => m.id === p.subject)
      ?.skillDisplayNames[p.skill] || p.skill;

    topics.push({
      subject: moduleName,
      topic: skillName,
      reason: p.recommendation,
      priority: p.mastery_level === "needs_foundation" ? "high" : "medium",
    });
  }

  return topics.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function getRecommendedGames(profiles) {
  const games = [];

  for (const p of profiles) {
    if (p.mastery_level === "mastered") continue;

    const gameRec = getGameRecommendation(p.subject, p.skill);
    if (gameRec) games.push(gameRec);
  }

  return games;
}

function getGameRecommendation(subject, skill) {
  const gameMap = {
    membaca: {
      letter_recognition: { game_type: "matching", skill: "letter_recognition", reason: "Padankan huruf dengan bunyi untuk mengukuhkan pengecaman huruf." },
      syllable_blending: { game_type: "word_builder", skill: "syllable_blending", reason: "Bina perkataan dari suku kata untuk latihan gabungan bunyi." },
      word_reading: { game_type: "memory", skill: "word_reading", reason: "Permainan ingatan untuk mengingat perkataan." },
      sentence_reading: { game_type: "sequence", skill: "sentence_reading", reason: "Susun ayat untuk latihan pemahaman." },
    },
    menulis: {
      writing_readiness: { game_type: "tracing", skill: "writing_readiness", reason: "Aktiviti mengesan untuk kemahiran motor halus." },
      letter_writing: { game_type: "puzzle", skill: "letter_writing", reason: "Teka bentuk huruf untuk latihan penulisan." },
      word_writing: { game_type: "word_builder", skill: "word_writing", reason: "Bina dan eja perkataan untuk latihan penulisan." },
      sentence_writing: { game_type: "sorting", skill: "sentence_writing", reason: "Susun perkataan menjadi ayat yang betul." },
    },
    mengira: {
      number_recognition: { game_type: "matching", skill: "number_recognition", reason: "Padankan nombor dengan kuantiti." },
      counting: { game_type: "time_challenge", skill: "counting", reason: "Cabaran masa untuk mengira objek dengan pantas." },
      comparison: { game_type: "sorting", skill: "comparison", reason: "Susun nombor mengikut tertib untuk latihan perbandingan." },
      basic_operations: { game_type: "time_challenge", skill: "basic_operations", reason: "Cabaran tambah dan tolak untuk kelajuan ketepatan." },
      problem_solving: { game_type: "adventure", skill: "problem_solving", reason: "Pengembaraan matematik untuk penyelesaian masalah." },
    },
  };

  return gameMap[subject]?.[skill] || null;
}

function getOverallRecommendation(path) {
  const parts = [];

  if (path.reading_level === "foundation") {
    parts.push("Pelajar memerlukan asas bacaan yang kukuh — mulakan dengan huruf dan suku kata.");
  } else if (path.reading_level === "advanced") {
    parts.push("Pelajar cemerlang dalam bacaan — boleh terus ke ayat dan perenggan.");
  }

  if (path.writing_level === "foundation") {
    parts.push("Penulisan perlatih aktiviti motor halus sebelum menulis huruf.");
  } else if (path.writing_level === "advanced") {
    parts.push("Pelajar sedia untuk penulisan ayat dan karangan pendek.");
  }

  if (path.numeracy_level === "foundation") {
    parts.push("Matematik perlu bermula dari pengenalan nombor 0-10.");
  } else if (path.numeracy_level === "advanced") {
    parts.push("Pelajar sedia untuk masalah matematik yang lebih kompleks.");
  }

  if (parts.length === 0) {
    return "Pelajar menunjukkan asas yang baik dalam kesemua 3M. Teruskan dengan pembelajaran KSSR tahap sesuai.";
  }

  return parts.join(" ");
}

function getSkillRecommendation(subject, skill, mastery, score) {
  const moduleMeta = DIAGNOSTIC_MODULES_META.find((m) => m.id === subject);
  const skillName = moduleMeta?.skillDisplayNames[skill] || skill;

  if (mastery === "mastered") {
    return `${skillName}: Dikuasai dengan baik (${score}%). Boleh terus ke kemahiran seterusnya.`;
  }
  if (mastery === "developing") {
    return `${skillName}: Sedang berkembang (${score}%). Perlukan latihan tambahan untuk mengukuhkan kemahiran ini.`;
  }
  return `${skillName}: Memerlukan asas (${score}%). Cadangkan bermula dari asas kemahiran ini.`;
}

// ================================================================
// MODULE-LEVEL RESULT CALCULATION
// ================================================================

/**
 * Calculates the result level for a module from its skill profiles.
 */
export function calculateModuleResult(subject, skillProfiles) {
  const moduleMeta = DIAGNOSTIC_MODULES_META.find((m) => m.id === subject);
  if (!moduleMeta) return { level: 1, mastery: "needs_foundation", score: 0 };

  const moduleProfiles = skillProfiles.filter((p) => p.subject === subject);
  if (moduleProfiles.length === 0) {
    return { level: 1, mastery: "needs_foundation", score: 0 };
  }

  const avgScore = Math.round(
    moduleProfiles.reduce((sum, p) => sum + p.score, 0) / moduleProfiles.length
  );

  // Map score to level (higher score = higher level)
  let level = 1;
  const skillCount = moduleMeta.skills.length;
  const masteredCount = moduleProfiles.filter((p) => p.mastery_level === "mastered").length;

  if (masteredCount === skillCount) {
    level = moduleMeta.levelMax; // All mastered → highest level
  } else if (masteredCount >= skillCount * 0.75) {
    level = Math.max(2, moduleMeta.levelMax - 1);
  } else if (masteredCount >= skillCount * 0.5) {
    level = Math.max(2, Math.floor(moduleMeta.levelMax / 2));
  } else if (avgScore >= 40) {
    level = 2;
  } else {
    level = 1;
  }

  return {
    level,
    mastery: getMasteryLevel(avgScore) === "mastered" ? "strong" : getMasteryLevel(avgScore) === "developing" ? "good" : "needs_foundation",
    score: avgScore,
  };
}

// ================================================================
// EXPORT HELPERS
// ================================================================
export {
  getMasteryLevel,
  getMasteryLabel,
  getMasteryEmoji,
  DIAGNOSTIC_MODULES_META,
  MASTERY_THRESHOLDS,
};
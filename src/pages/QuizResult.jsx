// src/pages/QuizResult.jsx
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams } from "react-router-dom";
import PracticeReport from "@/components/quiz/PracticeReport";
import MasteryReport from "@/components/quiz/MasteryReport";

export default function QuizResult() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.QuizAttempt.get(attemptId)
      .then((a) => {
        setAttempt(a);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">
          Keputusan kuiz tidak ditemui.
        </p>
      </div>
    );
  }

  const quizType = attempt?.quiz_type || "practice";

  if (quizType === "mastery") {
    return <MasteryReport attempt={attempt} quizId={attempt?.quiz_id} />;
  }

  return <PracticeReport attempt={attempt} />;
}
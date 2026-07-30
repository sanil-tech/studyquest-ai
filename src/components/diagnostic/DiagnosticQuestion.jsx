import React from "react";
import DiagnosticMCQ from "@/components/diagnostic/DiagnosticMCQ";
import DiagnosticVoiceQuestion from "@/components/diagnostic/DiagnosticVoiceQuestion";
import DiagnosticImageUploadQuestion from "@/components/diagnostic/DiagnosticImageUploadQuestion";

export default function DiagnosticQuestion({ question, questionNumber, totalQuestions, onAnswerNext }) {
  const type = question.type || "mcq";

  if (type === "voice") {
    return (
      <DiagnosticVoiceQuestion
        key={question.id}
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        onAnswerNext={onAnswerNext}
      />
    );
  }

  if (type === "image_upload") {
    return (
      <DiagnosticImageUploadQuestion
        key={question.id}
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        onAnswerNext={onAnswerNext}
      />
    );
  }

  return (
    <DiagnosticMCQ
      key={question.id}
      question={question}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      onAnswerNext={onAnswerNext}
    />
  );
}
// src/components/quiz/QuestionCard.jsx
import React from "react";
import OptionButton from "./OptionButton";

export default function QuestionCard({
  question,
  selectedOption,
  isSubmitted,
  onSelectOption
}) {
  if (!question) return null;

  const { question_text, question_image_url, options = [], correct_answer } = question;

  return (
    <div className="bg-stone-900/90 rounded-3xl p-6 border-2 border-stone-800 shadow-xl space-y-5">
      {/* Question Text */}
      <h2 className="text-sm sm:text-base font-black text-stone-100 leading-relaxed">
        {question_text}
      </h2>

      {/* Optional Illustration Image */}
      {question_image_url && (
        <div className="rounded-2xl overflow-hidden border border-stone-700 max-h-56 mx-auto">
          <img
            src={question_image_url}
            alt="Soalan"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* MCQ Choice Options */}
      <div className="space-y-2.5 pt-2">
        {options.map((opt, idx) => {
          const isSelected = selectedOption === opt.label;
          const isCorrectChoice = opt.label === correct_answer;

          return (
            <OptionButton
              key={opt.label || idx}
              option={opt}
              isSelected={isSelected}
              isSubmitted={isSubmitted}
              isCorrect={isCorrectChoice}
              onClick={() => onSelectOption(opt.label)}
              disabled={isSubmitted}
            />
          );
        })}
      </div>
    </div>
  );
}

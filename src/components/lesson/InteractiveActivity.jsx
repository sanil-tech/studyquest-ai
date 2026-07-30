import React, { useState } from "react";
import { CheckCircle2, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InteractiveActivity({ activity }) {
  if (!activity) return null;
  const { type, title, items = [] } = activity;
  const validItems = items.filter(i => i && Object.keys(i).length > 0);
  if (validItems.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🎮</span>
        <h3 className="font-heading font-bold text-amber-800">{title || "Aktiviti Interaktif"}</h3>
      </div>

      {type === "matching" && <MatchingActivity items={validItems} />}
      {type === "fill_blank" && <FillBlankActivity items={validItems} />}
      {type === "true_false" && <TrueFalseActivity items={validItems} />}
    </div>
  );
}

function ResultBar({ correct, total, onReset }) {
  return (
    <div className="space-y-2">
      <p className="text-center font-semibold text-amber-700">
        Markah: {correct}/{total} {correct === total ? "🎉 Hebat!" : "Cuba lagi! 💪"}
      </p>
      <Button variant="outline" onClick={onReset} className="w-full rounded-xl">
        <RefreshCw className="w-4 h-4 mr-2" /> Cuba Lagi
      </Button>
    </div>
  );
}

function MatchingActivity({ items }) {
  const [matches, setMatches] = useState({});
  const [checked, setChecked] = useState(false);
  const rights = [...items].map(i => i.right).sort(() => Math.random() - 0.5);

  const isCorrect = (i) => matches[i] === items[i].right;
  const correctCount = items.filter((_, i) => isCorrect(i)).length;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1 p-3 bg-white rounded-xl border border-amber-200 text-sm font-medium">
            {item.left}
          </div>
          <select
            value={matches[i] || ""}
            onChange={e => { if (!checked) setMatches(prev => ({ ...prev, [i]: e.target.value })); }}
            disabled={checked}
            className="flex-1 p-3 rounded-xl border border-amber-200 bg-white text-sm"
          >
            <option value="">— Pilih —</option>
            {rights.map((r, ri) => <option key={ri} value={r}>{r}</option>)}
          </select>
          {checked && (
            isCorrect(i)
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              : <X className="w-5 h-5 text-red-400 shrink-0" />
          )}
        </div>
      ))}
      {!checked ? (
        <Button
          onClick={() => setChecked(true)}
          disabled={Object.keys(matches).length !== items.length}
          className="w-full rounded-xl bg-amber-500 hover:bg-amber-600"
        >
          Semak Jawapan! ✅
        </Button>
      ) : (
        <ResultBar correct={correctCount} total={items.length} onReset={() => { setMatches({}); setChecked(false); }} />
      )}
    </div>
  );
}

function FillBlankActivity({ items }) {
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);

  const isCorrect = (i) => (answers[i] || "").trim().toLowerCase() === items[i].answer.trim().toLowerCase();
  const correctCount = items.filter((_, i) => isCorrect(i)).length;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 bg-white rounded-xl border border-amber-200">
          <p className="text-sm mb-2">{item.sentence}</p>
          <div className="flex items-center gap-2">
            <Input
              value={answers[i] || ""}
              onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
              disabled={checked}
              placeholder="Taip jawapan..."
              className="rounded-xl"
            />
            {checked && (
              isCorrect(i)
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                : <X className="w-5 h-5 text-red-400 shrink-0" />
            )}
          </div>
          {checked && !isCorrect(i) && (
            <p className="text-xs text-emerald-600 mt-1">Jawapan: {item.answer}</p>
          )}
        </div>
      ))}
      {!checked ? (
        <Button onClick={() => setChecked(true)} className="w-full rounded-xl bg-amber-500 hover:bg-amber-600">
          Semak Jawapan! ✅
        </Button>
      ) : (
        <ResultBar correct={correctCount} total={items.length} onReset={() => { setAnswers({}); setChecked(false); }} />
      )}
    </div>
  );
}

function TrueFalseActivity({ items }) {
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);

  const isCorrect = (i) => answers[i] === items[i].is_true;
  const correctCount = items.filter((_, i) => isCorrect(i)).length;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 bg-white rounded-xl border border-amber-200">
          <p className="text-sm mb-2">{item.statement}</p>
          <div className="flex gap-2">
            <button
              onClick={() => { if (!checked) setAnswers(prev => ({ ...prev, [i]: true })); }}
              disabled={checked}
              className={`flex-1 p-2 rounded-xl text-sm font-medium border-2 transition-all ${
                answers[i] === true
                  ? checked
                    ? isCorrect(i) ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-red-400 bg-red-50 text-red-600"
                    : "border-amber-400 bg-amber-50"
                  : "border-gray-200 hover:border-amber-200"
              }`}
            >
              ✅ Betul
            </button>
            <button
              onClick={() => { if (!checked) setAnswers(prev => ({ ...prev, [i]: false })); }}
              disabled={checked}
              className={`flex-1 p-2 rounded-xl text-sm font-medium border-2 transition-all ${
                answers[i] === false
                  ? checked
                    ? isCorrect(i) ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-red-400 bg-red-50 text-red-600"
                    : "border-amber-400 bg-amber-50"
                  : "border-gray-200 hover:border-amber-200"
              }`}
            >
              ❌ Salah
            </button>
          </div>
        </div>
      ))}
      {!checked ? (
        <Button
          onClick={() => setChecked(true)}
          disabled={Object.keys(answers).length !== items.length}
          className="w-full rounded-xl bg-amber-500 hover:bg-amber-600"
        >
          Semak Jawapan! ✅
        </Button>
      ) : (
        <ResultBar correct={correctCount} total={items.length} onReset={() => { setAnswers({}); setChecked(false); }} />
      )}
    </div>
  );
}
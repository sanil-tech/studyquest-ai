// src/components/parent/ai-insights/ParentAIChat.jsx
// Parent AI Assistant — asks questions about their child's learning.
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUGGESTED_QUESTIONS = [
  "Kenapa anak saya susah membaca?",
  "Apakah kekuatan anak saya?",
  "Bagaimana saya boleh bantu anak belajar di rumah?",
];

export default function ParentAIChat({ childId, report }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async (q) => {
    const query = q || question;
    if (!query.trim()) return;
    setLoading(true);
    setAnswer("");
    setQuestion(query);
    try {
      const reportContext = report
        ? `RINGKASAN: ${report.learning_summary}\nKEKUATAN: ${report.strengths}\nKELEMAHAN: ${report.weaknesses}\nCORAK: ${report.learning_pattern}`
        : "Tiada laporan AI tersedia.";

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Anda adalah Suku AI, pembantu pendidikan untuk ibu bapa Malaysia. Jawab soalan ibu bapa berdasarkan data pembelajaran anak mereka.

Data pelajar (ID: ${childId}):
${reportContext}

Soalan ibu bapa: "${query}"

Jawab dalam Bahasa Melayu dengan ringkas, mesra dan praktikal. Beri cadangan yang boleh dilakukan ibu bapa di rumah.`,
      });
      setAnswer(typeof res === "string" ? res : String(res));
    } catch (err) {
      setAnswer("Maaf, Suku AI tidak dapat menjawab sekarang. Sila cuba lagi sebentar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
          <MessageCircle className="w-4 h-4" />
        </div>
        <h3 className="text-xs font-black text-slate-700">Tanya Suku AI 🐢</h3>
      </div>

      {!answer && !loading && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleAsk(q)}
              className="text-[10px] bg-purple-50 text-purple-600 px-2.5 py-1.5 rounded-full font-bold border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Tulis soalan anda..."
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
        />
        <Button
          onClick={() => handleAsk()}
          disabled={loading || !question.trim()}
          size="icon"
          className="h-9 w-9 bg-purple-600 hover:bg-purple-700 rounded-xl shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      {answer && (
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
          <p className="text-xs text-slate-700 font-medium leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
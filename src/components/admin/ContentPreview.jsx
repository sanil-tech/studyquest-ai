import React from "react";
import ReactMarkdown from "react-markdown";
import {
  BookOpen, Layers, HelpCircle, Gamepad2, GraduationCap,
  Network, Video, Lightbulb, AlertTriangle, FileText, CheckCircle2,
  Target, KeyRound, Image as ImageIcon,
} from "lucide-react";

const Section = ({ icon: Icon, title, children }) => (
  <div className="mb-4 last:mb-0">
    <div className="flex items-center gap-1.5 mb-2 text-primary">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <h5 className="text-xs font-heading font-bold uppercase tracking-wide">{title}</h5>
    </div>
    {children}
  </div>
);

const Badge = ({ children, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    rose: "bg-rose-100 text-rose-700",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${colors[color]}`}>{children}</span>;
};

const MarkdownBody = ({ content }) => (
  <div className="prose prose-sm max-w-none lesson-content text-sm leading-relaxed text-foreground">
    <ReactMarkdown>{content || ""}</ReactMarkdown>
  </div>
);

const Card = ({ children }) => (
  <div className="p-3 rounded-lg border bg-white shadow-sm">{children}</div>
);

export default function ContentPreview({ contentType, content }) {
  if (!content) return null;
  const c = typeof content === "string" ? (() => { try { return JSON.parse(content); } catch { return null; } })() : content;
  if (!c) return <p className="text-xs text-muted-foreground">Kandungan tidak sah.</p>;

  switch (contentType) {
    case "lesson_notes":
      return (
        <>
          {c.title && <h3 className="text-lg font-heading font-bold text-primary mb-3">{c.title}</h3>}
          {c.learning_goal && (
            <Section icon={Target} title="Matlamat Pembelajaran">
              <p className="text-sm bg-emerald-50 p-3 rounded-lg border border-emerald-100">{c.learning_goal}</p>
            </Section>
          )}
          {Array.isArray(c.key_points) && c.key_points.length > 0 && (
            <Section icon={KeyRound} title="Fakta Utama">
              <ul className="list-disc list-inside text-sm space-y-1 ml-1">
                {c.key_points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </Section>
          )}
          {c.concept_explanation && (
            <Section icon={BookOpen} title="Penjelasan Konsep">
              <Card><MarkdownBody content={c.concept_explanation} /></Card>
            </Section>
          )}
          {Array.isArray(c.examples) && c.examples.length > 0 && (
            <Section icon={CheckCircle2} title={`Contoh (${c.examples.length})`}>
              <div className="space-y-2">
                {c.examples.map((ex, i) => (
                  <Card key={i}>
                    <p className="text-sm font-semibold mb-1">{i + 1}. {ex.problem}</p>
                    <p className="text-sm text-emerald-700"><span className="font-bold">Jawapan:</span> {ex.solution}</p>
                  </Card>
                ))}
              </div>
            </Section>
          )}
          {Array.isArray(c.visual_suggestions) && c.visual_suggestions.length > 0 && (
            <Section icon={ImageIcon} title="Cadangan Visual">
              <ul className="list-disc list-inside text-sm space-y-1 ml-1 text-muted-foreground">
                {c.visual_suggestions.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </Section>
          )}
          {c.memory_tips && (
            <Section icon={Lightbulb} title="Tip Ingatan">
              <p className="text-sm bg-amber-50 p-3 rounded-lg border border-amber-100 italic">{c.memory_tips}</p>
            </Section>
          )}
          {c.mini_activity && (
            <Section icon={Gamepad2} title="Aktiviti Mini">
              <p className="text-sm bg-purple-50 p-3 rounded-lg border border-purple-100">{c.mini_activity}</p>
            </Section>
          )}
          {Array.isArray(c.quick_check) && c.quick_check.length > 0 && (
            <Section icon={HelpCircle} title={`Semakan Pantas (${c.quick_check.length})`}>
              <div className="space-y-2">
                {c.quick_check.map((q, i) => (
                  <Card key={i}>
                    <p className="text-sm font-semibold mb-1">{i + 1}. {q.question}</p>
                    {q.answer && <p className="text-xs text-emerald-700"><span className="font-bold">Jawapan:</span> {q.answer}</p>}
                  </Card>
                ))}
              </div>
            </Section>
          )}
        </>
      );

    case "video_script":
      return (
        <Section icon={Video} title="Skrip Video">
          <Card>
            <p className="text-sm whitespace-pre-wrap mb-3">{c.video_script}</p>
            {c.video_url && <p className="text-xs text-muted-foreground">💡 Cadangan carian: <em>{c.video_url}</em></p>}
          </Card>
        </Section>
      );

    case "flashcards":
      return (
        <Section icon={Layers} title={`Flashcards (${c.flashcards?.length || 0})`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(c.flashcards || []).map((f, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-primary">#{i + 1}</span>
                </div>
                <p className="text-sm font-semibold mb-1">{f.front}</p>
                <div className="border-t border-dashed my-2" />
                <p className="text-sm text-emerald-700 font-medium">{f.back}</p>
                {f.explanation && <p className="text-xs text-muted-foreground mt-1.5 italic">{f.explanation}</p>}
              </Card>
            ))}
          </div>
        </Section>
      );

    case "questions":
      return (
        <Section icon={HelpCircle} title={`Soalan Kuiz (${c.questions?.length || 0})`}>
          <div className="space-y-2.5">
            {(c.questions || []).map((q, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold flex-1">{i + 1}. {q.question}</p>
                  <div className="flex gap-1 flex-shrink-0">
                    <Badge color={q.difficulty === "easy" ? "emerald" : q.difficulty === "hard" ? "rose" : "amber"}>{q.difficulty}</Badge>
                    {q.cognitive_level && <Badge color="purple">{q.cognitive_level}</Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-2">
                  {(q.options || []).map((opt, j) => {
                    const isCorrect = String(opt).startsWith(String(q.correct_answer)) || opt === q.correct_answer ||
                      String.fromCharCode(65 + j) === String(q.correct_answer).charAt(0);
                    return (
                      <div key={j} className={`text-xs px-2 py-1.5 rounded border ${isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold" : "bg-slate-50 border-slate-100"}`}>
                        <span className="font-bold mr-1">{String.fromCharCode(65 + j)}.</span>{opt}
                        {isCorrect && <CheckCircle2 className="w-3 h-3 inline ml-1 text-emerald-600" />}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && <p className="text-xs text-muted-foreground mb-1">💬 {q.explanation}</p>}
                {q.hint && <p className="text-xs text-blue-600">💡 Petunjuk: {q.hint}</p>}
              </Card>
            ))}
          </div>
        </Section>
      );

    case "activity":
      return (
        <Section icon={Gamepad2} title="Aktiviti Pembelajaran">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Badge color="blue">{c.activity_type}</Badge>
              <h5 className="text-sm font-bold">{c.title}</h5>
            </div>
            <p className="text-sm mb-2 whitespace-pre-wrap">{c.instructions}</p>
            {c.activity_data && (
              <pre className="text-xs bg-slate-50 p-2 rounded border mt-2 overflow-x-auto">{c.activity_data}</pre>
            )}
          </Card>
        </Section>
      );

    case "teacher_guide":
      return (
        <Section icon={GraduationCap} title="Panduan Guru">
          <Card className="space-y-2.5">
            {c.learning_objective && <div><p className="text-xs font-bold text-primary mb-0.5">🎯 Objektif</p><p className="text-sm">{c.learning_objective}</p></div>}
            {c.success_criteria && <div><p className="text-xs font-bold text-primary mb-0.5">✅ Kriteria Kejayaan</p><p className="text-sm">{c.success_criteria}</p></div>}
            {c.teaching_strategy && <div><p className="text-xs font-bold text-primary mb-0.5">📋 Strategi</p><p className="text-sm">{c.teaching_strategy}</p></div>}
            {c.suggested_activity && <div><p className="text-xs font-bold text-primary mb-0.5">🎮 Aktiviti Cadangan</p><p className="text-sm">{c.suggested_activity}</p></div>}
            {c.assessment_notes && <div><p className="text-xs font-bold text-primary mb-0.5">📝 Penilaian</p><p className="text-sm">{c.assessment_notes}</p></div>}
          </Card>
        </Section>
      );

    case "mindmap":
      return (
        <Section icon={Network} title="Peta Minda">
          <Card>
            <div className="space-y-2">
              {(c.branches || []).map((b, i) => (
                <div key={i} className="pl-3 border-l-2 border-primary/40">
                  <p className="text-sm font-bold text-primary">{b.label}</p>
                  {(b.children || []).length > 0 && (
                    <ul className="text-xs ml-4 mt-1 space-y-0.5">
                      {b.children.map((ch, j) => <li key={j} className="list-disc text-muted-foreground">{ch}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </Section>
      );

    case "infographic":
      return (
        <Section icon={ImageIcon} title="Infografik">
          <Card>
            {c.title && <h5 className="text-sm font-bold text-primary mb-2">{c.title}</h5>}
            {c.summary && <p className="text-sm bg-emerald-50 p-2 rounded border border-emerald-100 mb-2">{c.summary}</p>}
            {Array.isArray(c.key_takeaways) && c.key_takeaways.length > 0 && (
              <ul className="list-disc list-inside text-sm space-y-1 mb-2">
                {c.key_takeaways.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            )}
            {c.visual_layout && <p className="text-xs text-muted-foreground italic mb-2">🎨 {c.visual_layout}</p>}
            {Array.isArray(c.sections) && c.sections.map((s, i) => (
              <div key={i} className="mt-2 pt-2 border-t border-slate-100">
                <p className="text-sm font-semibold text-primary">{s.heading}</p>
                <p className="text-sm">{s.content}</p>
              </div>
            ))}
          </Card>
        </Section>
      );

    case "explanation":
      return (
        <Section icon={Lightbulb} title={`Penjelasan AI (${c.explanations?.length || 0})`}>
          <div className="space-y-2">
            {(c.explanations || []).map((e, i) => (
              <Card key={i}>
                <p className="text-sm font-bold text-primary mb-1">{e.concept}</p>
                <p className="text-sm mb-1.5">{e.explanation}</p>
                {e.example && <p className="text-xs text-muted-foreground mb-1">📋 Contoh: {e.example}</p>}
                {e.analogy && <p className="text-xs text-blue-600">🔗 Analogi: {e.analogy}</p>}
              </Card>
            ))}
          </div>
        </Section>
      );

    case "common_mistakes":
      return (
        <Section icon={AlertTriangle} title={`Kesilapan Biasa (${c.mistakes?.length || 0})`}>
          <div className="space-y-2">
            {(c.mistakes || []).map((m, i) => (
              <Card key={i}>
                <div className="flex items-start gap-2 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-rose-700">{m.mistake}</p>
                </div>
                <div className="ml-6 space-y-1">
                  <p className="text-sm text-emerald-700"><span className="font-bold">✓</span> {m.correction}</p>
                  {m.explanation && <p className="text-xs text-muted-foreground">{m.explanation}</p>}
                  {m.recommended_activity && <p className="text-xs text-blue-600">🎮 Cadangan aktiviti: {m.recommended_activity}</p>}
                </div>
              </Card>
            ))}
          </div>
        </Section>
      );

    case "worksheet":
      return (
        <Section icon={FileText} title="Lembaran Kerja">
          <Card><MarkdownBody content={c.content_markdown} /></Card>
        </Section>
      );

    default:
      return (
        <pre className="text-xs bg-slate-50 p-3 rounded-lg border overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(c, null, 2)}
        </pre>
      );
  }
}
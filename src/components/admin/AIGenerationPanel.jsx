import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle, XCircle, RefreshCw, Eye } from "lucide-react";
import ContentPreview from "@/components/admin/ContentPreview";

const CONTENT_TYPES = [
  { key: "lesson_notes", label: "Nota Pelajaran", icon: "📝" },
  { key: "flashcards", label: "Flashcards", icon: "🎴" },
  { key: "questions", label: "Soalan Kuiz", icon: "❓" },
  { key: "activity", label: "Aktiviti", icon: "🎮" },
  { key: "teacher_guide", label: "Panduan Guru", icon: "📖" },
  { key: "explanation", label: "Penjelasan AI", icon: "💡" },
  { key: "common_mistakes", label: "Kesilapan Biasa", icon: "⚠️" },
  { key: "video_script", label: "Skrip Video", icon: "🎬" },
  { key: "mindmap", label: "Peta Minda", icon: "🧠" },
];

export default function AIGenerationPanel({ lessonVersionId, onRequestComplete }) {
  const [generating, setGenerating] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [reviewContent, setReviewContent] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const handleGenerate = async (contentType) => {
    setGenerating(contentType);
    try {
      const res = await base44.functions.invoke("generateAIContent", {
        lesson_version_id: lessonVersionId,
        content_type: contentType,
      });
      if (res.data?.success) {
        setReviewContent({
          request_id: res.data.request_id,
          content_type: contentType,
          generated_content: res.data.generated_content,
        });
        onRequestComplete?.();
      } else {
        alert(res.data?.error || "Gagal menjana kandungan.");
      }
    } catch (err) {
      alert("Ralat: " + (err.message || "Gagal menjana."));
    } finally {
      setGenerating(null);
    }
  };

  const handleApprove = async (requestId, editedContent) => {
    setActionLoading("approve");
    try {
      const payload = { request_id: requestId };
      if (editedContent) payload.edited_content = editedContent;
      const res = await base44.functions.invoke("approveAIContent", payload);
      if (res.data?.success) {
        setReviewContent(null);
        onRequestComplete?.();
      } else {
        alert(res.data?.error || "Gagal meluluskan.");
      }
    } catch (err) {
      alert("Ralat: " + (err.message || "Gagal meluluskan."));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    setActionLoading("reject");
    try {
      await base44.entities.AIContentRequest.update(requestId, {
        status: "rejected",
        reviewed_by: "admin",
      });
      setReviewContent(null);
      onRequestComplete?.();
    } catch (err) {
      alert("Ralat: " + (err.message || "Gagal menolak."));
    } finally {
      setActionLoading(null);
    }
  };

  const renderReviewContent = () => {
    if (!reviewContent) return null;
    const { request_id, content_type, generated_content } = reviewContent;
    const typeInfo = CONTENT_TYPES.find((t) => t.key === content_type);

    return (
      <div className="mt-4 p-4 border-2 border-primary/20 rounded-xl bg-primary/5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-heading font-bold text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" /> Semakan: {typeInfo?.label}
          </h4>
          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">Draft</span>
        </div>
        <div className="max-h-[28rem] overflow-y-auto p-3 bg-white rounded-lg border">
          <ContentPreview contentType={content_type} content={generated_content} />
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => handleApprove(request_id)}
            disabled={actionLoading !== null}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {actionLoading === "approve" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
            Lulus & Simpan
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGenerate(content_type)}
            disabled={actionLoading !== null}
          >
            <RefreshCw className="w-3 h-3 mr-1" /> Jana Semula
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReject(request_id)}
            disabled={actionLoading !== null}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {actionLoading === "reject" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
            Tolak
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-heading font-bold text-primary">
        <Sparkles className="w-4 h-4" /> Jana Kandungan dengan AI
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CONTENT_TYPES.map((type) => (
          <Button
            key={type.key}
            variant="outline"
            size="sm"
            disabled={generating !== null}
            onClick={() => handleGenerate(type.key)}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            {generating === type.key ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="text-lg">{type.icon}</span>
            )}
            <span className="text-xs">{type.label}</span>
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        ⚠️ Semua kandungan AI disimpan sebagai <strong>draft</strong>. Pelulusan admin diperlukan sebelum penerbitan.
      </p>
      {renderReviewContent()}
    </div>
  );
}
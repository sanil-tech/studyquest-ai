import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ContentHierarchy from "@/components/admin/ContentHierarchy";
import CompletenessDashboard from "@/components/admin/CompletenessDashboard";
import AIGenerationPanel from "@/components/admin/AIGenerationPanel";
import LessonVideoField from "@/components/admin/LessonVideoField";
import { BookOpen, Loader2, Send, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminContentStudio() {
  const navigate = useNavigate();
  const [selectedVersion, setSelectedVersion] = useState("");
  const [completeness, setCompleteness] = useState(null);
  const [loadingCompleteness, setLoadingCompleteness] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  const handleHierarchySelect = useCallback((selection) => {
    setSelectedVersion(selection.version);
    setPublishResult(null);
  }, []);

  const fetchCompleteness = useCallback(async () => {
    if (!selectedVersion) { setCompleteness(null); return; }
    setLoadingCompleteness(true);
    try {
      const res = await base44.functions.invoke("getLessonCompleteness", {
        lesson_version_id: selectedVersion,
      });
      setCompleteness(res.data);
    } catch (err) {
      console.error("Completeness error:", err);
    } finally {
      setLoadingCompleteness(false);
    }
  }, [selectedVersion]);

  useEffect(() => {
    fetchCompleteness();
  }, [fetchCompleteness]);

  const handlePublish = async () => {
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await base44.functions.invoke("publishLessonVersion", {
        lesson_version_id: selectedVersion,
      });
      setPublishResult(res.data);
      if (res.data?.success) {
        fetchCompleteness();
      }
    } catch (err) {
      setPublishResult({ success: false, error: err.message || "Gagal menerbitkan." });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" /> Content Studio
            </h1>
            <p className="text-sm text-muted-foreground">Studio Pengurusan Kandungan Pelajaran</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <ContentHierarchy onSelect={handleHierarchySelect} />
        </CardContent>
      </Card>

      {!selectedVersion && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Pilih hierarki kandungan di atas untuk mula mengurus pelajaran.</p>
          </CardContent>
        </Card>
      )}

      {selectedVersion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Kandungan</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCompleteness ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <CompletenessDashboard completeness={completeness} />
            )}
          </CardContent>
        </Card>
      )}

      {selectedVersion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Media & Video</CardTitle>
          </CardHeader>
          <CardContent>
            <LessonVideoField lessonVersionId={selectedVersion} />
          </CardContent>
        </Card>
      )}

      {selectedVersion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Penciptaan Kandungan</CardTitle>
          </CardHeader>
          <CardContent>
            <AIGenerationPanel
              lessonVersionId={selectedVersion}
              onRequestComplete={fetchCompleteness}
            />
          </CardContent>
        </Card>
      )}

      {selectedVersion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Penerbitan Pelajaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pelajar hanya boleh mengakses pelajaran yang telah diterbitkan. Pastikan pakej kandungan lengkap sebelum menerbitkan.
            </p>
            <Button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full sm:w-auto"
              size="lg"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Terbitkan Pelajaran
            </Button>
            {publishResult && (
              <div className={`p-3 rounded-lg text-sm ${publishResult.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {publishResult.success ? (
                  <p>✅ {publishResult.message} ({publishResult.completion_percentage}% lengkap)</p>
                ) : (
                  <div>
                    <p className="font-semibold">❌ {publishResult.error}</p>
                    {publishResult.missing?.length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-xs">
                        {publishResult.missing.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
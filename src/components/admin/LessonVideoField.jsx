// src/components/admin/LessonVideoField.jsx
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Youtube, CheckCircle2 } from "lucide-react";

export default function LessonVideoField({ lessonVersionId }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.entities.LessonVersion.get(lessonVersionId)
      .then((v) => { if (active) setVideoUrl(v?.video_url || ""); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [lessonVersionId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await base44.entities.LessonVersion.update(lessonVersionId, { video_url: videoUrl.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert("Gagal menyimpan URL video.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-heading font-bold text-primary">
        <Youtube className="w-4 h-4" /> URL Video Pengenalan
      </div>
      <p className="text-xs text-muted-foreground">
        Tampal pautan YouTube. Video ini akan dipaparkan kepada pelajar pada langkah "Taklimat Video" selepas penerbitan.
      </p>
      <div className="flex gap-2">
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={loading || saving}
        />
        <Button onClick={handleSave} disabled={saving || loading} size="sm" className="shrink-0">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : saved ? <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" /> : <Save className="w-4 h-4 mr-1" />}
          {saving ? "Menyimpan..." : saved ? "Disimpan" : "Simpan"}
        </Button>
      </div>
    </div>
  );
}
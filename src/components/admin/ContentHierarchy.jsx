import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronRight, Layers, Plus, Loader2 } from "lucide-react";

export default function ContentHierarchy({ onSelect }) {
  const [curricula, setCurricula] = useState([]);
  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [versions, setVersions] = useState([]);

  const [selected, setSelected] = useState({
    curriculum: "",
    level: "",
    subject: "",
    topic: "",
    lesson: "",
    version: "",
  });

  const [creating, setCreating] = useState("");

  useEffect(() => {
    base44.entities.Curriculum.list().then(setCurricula).catch(() => {});
  }, []);

  const handleCreateLesson = async () => {
    if (!selected.topic || creating) return;
    setCreating("lesson");
    try {
      const topic = topics.find(t => t.id === selected.topic);
      const subject = subjects.find(s => s.id === topic?.subject_id);

      const newLesson = await base44.entities.Lesson.create({
        topic_id: selected.topic,
        subject_name: subject?.name || "",
        topic_name: topic?.name || "",
        version: 1,
        content_status: "draft",
      });

      const newVersion = await base44.entities.LessonVersion.create({
        lesson_id: newLesson.id,
        version_number: 1,
        status: "draft",
        review_status: "draft",
      });

      const updatedLessons = await base44.entities.Lesson.filter({ topic_id: selected.topic });
      setLessons(updatedLessons);
      setVersions([newVersion]);
      setSelected(prev => ({ ...prev, lesson: newLesson.id, version: newVersion.id }));
    } catch (err) {
      console.error("Create lesson error:", err);
    } finally {
      setCreating("");
    }
  };

  const handleCreateVersion = async () => {
    if (!selected.lesson || creating) return;
    setCreating("version");
    try {
      const nextNum = (versions.length ? Math.max(...versions.map(v => v.version_number || 0)) : 0) + 1;

      const newVersion = await base44.entities.LessonVersion.create({
        lesson_id: selected.lesson,
        version_number: nextNum,
        status: "draft",
        review_status: "draft",
      });

      const updatedVersions = await base44.entities.LessonVersion.filter({ lesson_id: selected.lesson });
      setVersions(updatedVersions);
      setSelected(prev => ({ ...prev, version: newVersion.id }));
    } catch (err) {
      console.error("Create version error:", err);
    } finally {
      setCreating("");
    }
  };

  useEffect(() => {
    if (!selected.curriculum) { setLevels([]); setSubjects([]); return; }
    base44.entities.Level.filter({ curriculum_id: selected.curriculum }).then(setLevels).catch(() => {});
    // Subjects are global (not tied to curriculum/level) — load all
    base44.entities.Subject.list().then(setSubjects).catch(() => {});
    setSelected(prev => ({ ...prev, level: "", subject: "", topic: "", lesson: "", version: "" }));
  }, [selected.curriculum]);

  useEffect(() => {
    if (!selected.subject) { setTopics([]); return; }
    // Topics use form_level (string) matching the Level name, not level_id
    const selectedLevel = levels.find(l => l.id === selected.level);
    const filter = { subject_id: selected.subject };
    if (selectedLevel) {
      filter.form_level = selectedLevel.name;
    }
    base44.entities.Topic.filter(filter).then(setTopics).catch(() => {});
    setSelected(prev => ({ ...prev, topic: "", lesson: "", version: "" }));
  }, [selected.subject, selected.level]);

  useEffect(() => {
    if (!selected.topic) { setLessons([]); return; }
    base44.entities.Lesson.filter({ topic_id: selected.topic }).then(setLessons).catch(() => {});
    setSelected(prev => ({ ...prev, lesson: "", version: "" }));
  }, [selected.topic]);

  useEffect(() => {
    if (!selected.lesson) { setVersions([]); return; }
    base44.entities.LessonVersion.filter({ lesson_id: selected.lesson }).then(setVersions).catch(() => {});
    setSelected(prev => ({ ...prev, version: "" }));
  }, [selected.lesson]);

  useEffect(() => {
    if (selected.version && onSelect) onSelect(selected);
  }, [selected.version]);

  const selectClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";

  const stage = (label, value, items, key, displayField = "name") => (
    <div className="flex-1 min-w-[140px]">
      <Label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</Label>
      <select
        className={selectClass}
        value={value}
        onChange={(e) => setSelected(prev => ({ ...prev, [key]: e.target.value }))}
        disabled={!items.length}
      >
        <option value="">— Pilih —</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>{item[displayField] || item.name || `v${item.version_number}`}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-heading font-bold text-primary">
        <Layers className="w-4 h-4" /> Hierarki Kandungan
      </div>
      <div className="flex flex-wrap gap-3">
        {stage("Kurikulum", selected.curriculum, curricula, "curriculum")}
        {stage("Tahap", selected.level, levels, "level")}
        {stage("Subjek", selected.subject, subjects, "subject")}
        {stage("Topik", selected.topic, topics, "topic")}
        {stage("Pelajaran", selected.lesson, lessons, "lesson")}
        {stage("Versi", selected.version, versions, "version", "version_number")}
      </div>
      {selected.topic && lessons.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700 flex-1">
            Belum ada pelajaran untuk topik ini. Cipta pelajaran baru untuk mula menjana kandungan.
          </p>
          <Button size="sm" onClick={handleCreateLesson} disabled={!!creating}>
            {creating === "lesson" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
            Cipta Pelajaran
          </Button>
        </div>
      )}
      {selected.lesson && lessons.length > 0 && versions.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700 flex-1">
            Belum ada versi untuk pelajaran ini. Cipta versi draf baru.
          </p>
          <Button size="sm" onClick={handleCreateVersion} disabled={!!creating}>
            {creating === "version" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
            Cipta Versi
          </Button>
        </div>
      )}
      {selected.version && (
        <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
          <ChevronRight className="w-3 h-3" /> Versi dipilih — kandungan tersedia di bawah
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { ChevronRight, Layers } from "lucide-react";

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

  useEffect(() => {
    base44.entities.Curriculum.list().then(setCurricula).catch(() => {});
  }, []);

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
      {selected.version && (
        <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
          <ChevronRight className="w-3 h-3" /> Versi dipilih — kandungan tersedia di bawah
        </div>
      )}
    </div>
  );
}
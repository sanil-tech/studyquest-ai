import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, BookOpen, Trash2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

const FORM_LEVELS = [
  "All Levels", "Standard 1", "Standard 2", "Standard 3",
  "Standard 4", "Standard 5", "Standard 6",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5",
];

export default function TextbookUpload() {
  const [subjects, setSubjects] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [formLevel, setFormLevel] = useState("All Levels");

  const [lessonJson, setLessonJson] = useState(`{
  "lesson_markdown": "",
  "summary": "",
  "keywords": []
}`);

  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [subs, les] = await Promise.all([
        base44.entities.Subject.list(),
        base44.entities.Lesson?.list?.() || []
      ]);

      setSubjects(subs);
      setLessons(les);
    } catch (err) {
      toast({ title: "Failed load", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpload = async () => {
    if (!title || !subjectId) {
      toast({ title: "Missing fields" });
      return;
    }

    setUploading(true);

    try {
      const user = await base44.auth.me();
      const subject = subjects.find(s => s.id === subjectId);

      let parsed;
      try {
        parsed = JSON.parse(lessonJson);
      } catch (e) {
        toast({ title: "Invalid JSON" });
        setUploading(false);
        return;
      }

      await base44.entities.Lesson.create({
        title,
        subject_id: subjectId,
        subject_name: subject?.name || "",
        form_level: formLevel,
        lesson_json: JSON.stringify(parsed),
        created_by: user.id
      });

      toast({ title: "Lesson saved 📚" });

      setTitle("");
      setSubjectId("");
      setFormLevel("All Levels");
      setLessonJson(`{
  "lesson_markdown": "",
  "summary": "",
  "keywords": []
}`);

      loadData();

    } catch (err) {
      toast({ title: "Save failed", description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.Lesson.delete(id);
    loadData();
  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Link to="/">
          <ArrowLeft />
        </Link>
        <h1 className="font-bold text-lg">Lesson Studio</h1>
      </div>

      {/* FORM */}
      <div className="bg-white p-5 rounded-xl border space-y-4">

        <div>
          <Label>Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div>
          <Label>Subject</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Form Level</Label>
          <Select value={formLevel} onValueChange={setFormLevel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_LEVELS.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Lesson JSON</Label>
          <textarea
            className="w-full border p-2 rounded-md h-40 text-xs"
            value={lessonJson}
            onChange={e => setLessonJson(e.target.value)}
          />
        </div>

        <Button onClick={handleUpload} disabled={uploading} className="w-full">
          {uploading ? "Saving..." : "Save Lesson"}
        </Button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {lessons.map(l => (
          <div key={l.id} className="border p-3 rounded-lg flex justify-between">
            <div>
              <p className="font-medium">{l.title}</p>
              <p className="text-xs text-gray-500">{l.subject_name}</p>
            </div>
            <Button onClick={() => handleDelete(l.id)} variant="destructive">
              Delete
            </Button>
          </div>
        ))}
      </div>

    </div>
  );
}
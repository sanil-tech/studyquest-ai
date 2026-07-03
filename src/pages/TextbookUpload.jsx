import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  BookOpen,
  Trash2,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

const FORM_LEVELS = [
  "All Levels",
  "Standard 1",
  "Standard 2",
  "Standard 3",
  "Standard 4",
  "Standard 5",
  "Standard 6",
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
];

export default function TextbookUpload() {
  const [subjects, setSubjects] = useState([]);
  const [textbooks, setTextbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [formLevel, setFormLevel] = useState("All Levels");

  const [file, setFile] = useState(null);

  const [lessonJson, setLessonJson] = useState(`{
  "lesson_markdown": "",
  "summary": "",
  "keywords": []
}`);

  const { toast } = useToast();

  // ================= LOAD DATA =================
  const loadData = async () => {
    try {
      const [subs, books] = await Promise.all([
        base44.entities.Subject.list(),
        base44.entities.Textbook.list("-created_date", 50),
      ]);
      setSubjects(subs);
      setTextbooks(books);
    } catch (err) {
      toast({
        title: "Failed to load",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= SAVE LESSON =================
  const handleUpload = async () => {
    if (!title || !subjectId || !lessonJson) {
      toast({
        title: "Missing fields",
        description: "Please complete all fields.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const user = await base44.auth.me();
      const subject = subjects.find((s) => s.id === subjectId);

      let parsed;
      try {
        parsed = JSON.parse(lessonJson.trim());
      } catch (err) {
        toast({
          title: "Invalid JSON",
          description: "Fix lesson JSON format first.",
          variant: "destructive",
        });
        return;
      }

      await base44.entities.Textbook.create({
        title,
        subject_id: subjectId,
        subject_name: subject?.name || "",
        form_level: formLevel,
        lesson_json: JSON.stringify(parsed),
        uploaded_by: user.id,
      });

      toast({
        title: "Lesson saved 📚",
        description: "Stored successfully.",
      });

      // reset
      setTitle("");
      setSubjectId("");
      setFormLevel("All Levels");
      setFile(null);

      setLessonJson(`{
  "lesson_markdown": "",
  "summary": "",
  "keywords": []
}`);

      loadData();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    try {
      await base44.entities.Textbook.delete(id);
      toast({ title: "Deleted" });
      loadData();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">Content Studio 📚</h1>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* FORM */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Create Lesson</h2>
          </div>

          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
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
                {FORM_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* JSON EDITOR */}
          <div>
            <Label>Lesson JSON</Label>
            <textarea
              className="w-full h-40 p-3 border rounded-lg font-mono text-xs"
              value={lessonJson}
              onChange={(e) => setLessonJson(e.target.value)}
            />
          </div>

          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Lesson"
            )}
          </Button>
        </motion.div>

        {/* LIST */}
        <div className="space-y-3">
          {textbooks.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between border p-3 rounded-xl"
            >
              <div>
                <p className="font-medium">{b.title}</p>
                <p className="text-xs text-gray-500">
                  {b.subject_name} • {b.form_level}
                </p>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(b.id)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

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
    setLoading(true);
    try {
      const subs = await base44.entities.Subject.list();
      const les = await base44.entities.Lesson.list("-created_date", 50);

      setSubjects(subs || []);
      setLessons(les || []);
    } catch (err) {
      toast({
        title: "Load failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async () => {
    if (!title || !subjectId) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const user = await base44.auth.me();
      const subject = subjects.find(s => s.id === subjectId);

      let parsed;
      try {
        parsed = JSON.parse(lessonJson);
      } catch {
        toast({
          title: "Invalid JSON format",
          variant: "destructive"
        });
        return;
      }

      await base44.entities.Lesson.create({
        title,
        subject_id: subjectId,
        subject_name: subject?.name || "",
        form_level: formLevel,

        // SAFE + EXTENSIBLE STRUCTURE
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

      await loadData();

    } catch (err) {
      toast({
        title: "Save failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Lesson.delete(id);

      // optimistic UI update (FAST UX)
      setLessons(prev => prev.filter(l => l.id !== id));

      toast({ title: "Deleted" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading...
      </div>
    );
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

        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? "Saving..." : "Save Lesson"}
        </Button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {lessons.length === 0 && (
          <p className="text-sm text-gray-400 text-center">
            No lessons yet
          </p>
        )}

        {lessons.map(l => (
          <div
            key={l.id}
            className="border p-3 rounded-lg flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{l.title}</p>
              <p className="text-xs text-gray-500">
                {l.subject_name}
              </p>
            </div>

            <Button
              onClick={() => handleDelete(l.id)}
              variant="destructive"
            >
              Delete
            </Button>
          </div>
        ))}
      </div>

    </div>
  );
}
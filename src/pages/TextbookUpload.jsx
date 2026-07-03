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
  "All Levels",
  "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5",
];

export default function TextbookUpload() {

  // =========================
  // STATE
  // =========================
  const [subjects, setSubjects] = useState([]);
  const [textbooks, setTextbooks] = useState([]);
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

  // =========================
  // LOAD DATA
  // =========================
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

  // =========================
  // SAVE LESSON (FIXED)
  // =========================
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
      const subject = subjects.find(s => s.id === subjectId);

      // SAFE JSON PARSE
      let parsed;
      try {
        parsed = JSON.parse(lessonJson.trim());
      } catch (err) {
        toast({
          title: "Invalid JSON",
          description: "Please fix lesson JSON format.",
          variant: "destructive",
        });
        return;
      }

      await base44.entities.Textbook.create({
        title,
        subject_id: subjectId,
        subject_name: subject?.name || "",
        form_level: formLevel,

        // CORE STORAGE
        lesson_json: JSON.stringify(parsed),

        uploaded_by: user.id,
      });

      toast({
        title: "Lesson saved 📚",
        description: "Content stored successfully.",
      });

      // RESET
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
      toast({
        title: "Save failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id) => {
    try {
      await base44.entities.Textbook.delete(id);
      toast({ title: "Deleted successfully" });
      loadData();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // =========================
  // LOADING STATE
  // =========================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // =========================
  // UI
  // =========================
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

        {/* CREATE LESSON */}
        <motion.div
         
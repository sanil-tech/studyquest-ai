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
  "All Levels", "Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5",
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
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [subs, books] = await Promise.all([
        base44.entities.Subject.list(),
        base44.entities.Textbook.list("-created_date", 50),
      ]);
      setSubjects(subs);
      setTextbooks(books);
    } catch (err) {
      toast({ title: "Failed to load", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpload = async () => {
    if (!file || !title || !subjectId) {
      toast({ title: "Missing fields", description: "Please fill in all fields and select a file.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const user = await base44.auth.me();
      const subject = subjects.find(s => s.id === subjectId);
      const tooLarge = file.size > 10 * 1024 * 1024;
      await base44.entities.Textbook.create({
        title,
        file_url,
        file_size: file.size,
        subject_id: subjectId,
        subject_name: subject?.name || "",
        form_level: formLevel,
        uploaded_by: user.id,
      });
      toast({
        title: "Textbook uploaded! 📚",
        description: tooLarge
          ? "Note: File is over 10 MB — students can view it, but AI will use web search for lessons."
          : "AI will use this for lessons and quizzes.",
      });
      setTitle("");
      setSubjectId("");
      setFormLevel("All Levels");
      setFile(null);
      loadData();
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Textbook.delete(id);
      toast({ title: "Textbook removed" });
      loadData();
    } catch (err) {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-heading font-bold">Textbook Library 📚</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Upload form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-border/50 p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold">Upload Textbook</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload Malaysian curriculum textbooks (PDF). The AI will use them as the primary source to generate lessons and quizzes topic by topic.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            ⚠️ Max 10 MB for AI to read the textbook. Larger files can still be shared as a student reference, but the AI will use web search instead. Split large PDFs into chapters to stay under the limit.
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Textbook Title</Label>
              <Input id="title" placeholder="e.g. Mathematics Year 4 KSSR" value={title} onChange={e => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Form Level</Label>
              <Select value={formLevel} onValueChange={setFormLevel}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORM_LEVELS.map(lvl => <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Textbook File (PDF)</Label>
              <div className="mt-1">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => setFile(e.target.files[0])}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-medium file:cursor-pointer hover:file:bg-primary/20"
                />
              </div>
              {file && (
                <p className={`text-xs mt-1 ${file.size > 10 * 1024 * 1024 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  {file.size > 10 * 1024 * 1024 && " — over 10 MB limit; AI will use web search instead"}
                </p>
              )}
            </div>
          </div>

          <Button onClick={handleUpload} disabled={uploading} className="w-full rounded-xl h-12">
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />Upload Textbook</>
            )}
          </Button>
        </motion.div>

        {/* Existing textbooks */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold">Uploaded Textbooks ({textbooks.length})</h2>
          </div>
          {textbooks.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-border/50">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No textbooks uploaded yet.</p>
            </div>
          ) : (
            textbooks.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-border/50 p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground">{book.subject_name} · {book.form_level}</p>
                </div>
                <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50 shrink-0" onClick={() => handleDelete(book.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
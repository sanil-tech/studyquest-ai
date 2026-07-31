import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  BookOpen, Video, HelpCircle, Plus, Trash2, Save, Sparkles, Loader2, PlusCircle, Edit3, Search, UploadCloud, FileJson, Link as LinkIcon, Image as ImageIcon, FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function LessonResources() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [borangMod, setBorangMod] = useState("create"); 
  const [lessonsList, setLessonsList] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");

  const [topicId, setTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState(""); 

  const [notes, setNotes] = useState(""); 
  const [noteImageUrl, setNoteImageUrl] = useState(""); 
  const [noteImageFile, setNoteImageFile] = useState(null); 
  const [noteImagePreview, setNoteImagePreview] = useState(""); 

  const [infographicUrl, setInfographicUrl] = useState(""); 
  const [infographicFile, setInfographicFile] = useState(null); 
  const [infographicPreview, setInfographicPreview] = useState(""); 

  const [questions, setQuestions] = useState([
    { questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["", "", "", ""], correctAnswer: "A", explanation: "" }
  ]);
  const [subtopics, setSubtopics] = useState([]);
  const [newSubtopic, setNewSubtopic] = useState("");
  const jsonFileInputRef = useRef(null);
  
  // State for copy-paste JSON functionality
  const [showPasteJson, setShowPasteJson] = useState(false);
  const [pastedJson, setPastedJson] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [modularTopics, setModularTopics] = useState([]);
  const [selectedModularTopicId, setSelectedModularTopicId] = useState("");
  const [isGeneratingModular, setIsGeneratingModular] = useState(false);
  const [topicSearchQuery, setTopicSearchQuery] = useState("");

  useEffect(() => {
    const semakAksesAdmin = async () => {
      try {
        setCheckingAuth(true);
        const me = await base44.auth.me();
        if (!me) throw new Error("Sesi tidak sah.");

        const peranan = me.app_role;
        if (peranan === "admin" || peranan === "teacher" || peranan === "parent" || me.is_admin === true) {
          setHasAccess(true); 
          muatTurunSenaraiLesson(); 
          muatTurunSenaraiTopic();
        } else {
          toast({ title: "Akses Disekat! 🛑", variant: "destructive" }); 
          navigate("/dashboard"); 
        }
      } catch (err) { 
        navigate("/login"); 
      } finally { 
        setCheckingAuth(false); 
      }
    };
    semakAksesAdmin();
  }, [navigate, toast]);

  const kompresFailGambarUlu = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader(); 
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image(); 
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width; 
          let height = img.height;
          const MAX_WIDTH = 1200; 
          if (width > MAX_WIDTH) { 
            height = Math.round((height * MAX_WIDTH) / width); 
            width = MAX_WIDTH; 
          }
          canvas.width = width; 
          canvas.height = height;
          const ctx = canvas.getContext("2d"); 
          ctx.drawImage(img, 0, 0, width, height);
          
          const isPNG = file.type === "image/png";
          const mimeType = isPNG ? "image/png" : "image/jpeg";
          const extension = isPNG ? ".png" : ".jpg";

          canvas.toBlob((blob) => { 
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + extension, { type: mimeType, lastModified: Date.now() })); 
          }, mimeType, isPNG ? undefined : 0.75); 
        };
      };
    });
  };

  const uploadKeServerRasmi = async (file) => {
    const mampat = await kompresFailGambarUlu(file);
    const formData = new FormData(); 
    formData.append("file", mampat);
    const cubaanSintaks = [
      async () => await base44.integrations.UploadFile.upload({ file: mampat }),
      async () => await base44.integrations.UploadFile.execute({ file: mampat }),
      async () => await base44.integrations.UploadFile({ file: mampat }),
      async () => await base44.integrations.UploadFile.upload(formData)
    ];
    for (let i = 0; i < cubaanSintaks.length; i++) {
      try {
        const res = await cubaanSintaks[i]();
        if (res) {
          const urlHasil = typeof res === "string" ? res : (res.url || res.file_url || res.link || Object.values(res)[0]);
          if (urlHasil && typeof urlHasil === "string" && urlHasil.startsWith("http")) return urlHasil;
        }
      } catch (e) {}
    }
    throw new Error("Kuota integrasi pelayan penuh.");
  };

  const kendaliPilihanInfographic = (e) => { 
    const file = e.target.files[0]; 
    if (!file) return; 
    setInfographicFile(file); 
    setInfographicPreview(URL.createObjectURL(file)); 
  };
  
  const kendaliPilihanNoteImage = (e) => { 
    const file = e.target.files[0]; 
    if (!file) return; 
    setNoteImageFile(file); 
    setNoteImagePreview(URL.createObjectURL(file)); 
  };
  
  const kendaliPilihanGambarSoalan = (index, file) => { 
    if (!file) return; 
    const updated = [...questions]; 
    updated[index].questionFile = file; 
    updated[index].questionPreview = URL.createObjectURL(file); 
    setQuestions(updated); 
  };

  const handleJSONFileUpload = (e) => {
    const file = e.target.files[0]; 
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { prosesDataJSONMentah(event.target.result); };
    reader.readAsText(file);
  };

  const handlePasteJSON = () => {
    if (!pastedJson.trim()) return toast({ title: "Kotak Kosong!", variant: "destructive" });
    prosesDataJSONMentah(pastedJson);
  };

  const prosesDataJSONMentah = (jsonString) => {
    try {
      let cleanString = jsonString.trim();
      if (cleanString.startsWith("```json")) {
        cleanString = cleanString.replace(/^```json/, "").replace(/```$/, "").trim();
      }
      
      const parsedData = JSON.parse(cleanString);
      if (!Array.isArray(parsedData)) throw new Error("Format mestilah Array bermula dengan [ dan berakhir dengan ].");
      
      const importedQuestions = parsedData.map(q => {
        const linkGambar = q.questionImageUrl || q.question_image_url || "";
        return {
          questionText: q.question || "", 
          questionImageUrl: linkGambar, 
          questionFile: null, 
          questionPreview: linkGambar, 
          options: Array.isArray(q.options) ? [...q.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""], 
          correctAnswer: q.correct_answer || "A", 
          explanation: q.explanation || "" 
        };
      });
      setQuestions(importedQuestions);
      toast({ title: "Import Berjaya Selesai! 🎉", description: `${importedQuestions.length} soalan disusun.` });
      
      setShowPasteJson(false);
      setPastedJson("");
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = "";
    } catch (error) { 
      toast({ title: "Ralat Membaca JSON ❌", description: "Pastikan format JSON anda tepat.", variant: "destructive" }); 
    }
  };

  const muatTurunSenaraiLesson = async () => { 
    setIsLoadingList(true); 
    try { 
      setLessonsList(await base44.entities.Quiz.filter({}) || []); 
    } catch (err) {} 
    finally { 
      setIsLoadingList(false); 
    } 
  };

  const handlePilihLesson = (e) => {
    const idPilihan = e.target.value; 
    setSelectedLessonId(idPilihan);
    if (!idPilihan) { resetSemuaMedanBorang(); return; }

    const lesson = lessonsList.find(l => l.id === idPilihan);
    if (lesson) {
      setTopicId(lesson.id); 
      setTitle(lesson.topic_name || ""); 
      setSubtitle(lesson.subject_name || "");
      setInfographicUrl(lesson.infographic_url || ""); 
      setInfographicPreview(lesson.infographic_url || ""); 
      setInfographicFile(null);
      setYoutubeUrl(lesson.video_url || "");
      try {
        const parsedSubtopics = typeof lesson.subtopics_json === "object" ? lesson.subtopics_json : JSON.parse(lesson.subtopics_json || "[]");
        setSubtopics(Array.isArray(parsedSubtopics) ? parsedSubtopics : []);
      } catch { setSubtopics([]); }

      const rawNotes = lesson.notes_content || "";
      if (rawNotes) {
        try {
          let cleanStr = String(rawNotes).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          if (cleanStr.startsWith('"') && cleanStr.endsWith('"')) { cleanStr = cleanStr.substring(1, cleanStr.length - 1); }
          const parsedNotes = typeof rawNotes === "object" ? rawNotes : JSON.parse(cleanStr);
          if (parsedNotes && (parsedNotes.text !== undefined || parsedNotes.image !== undefined)) {
            setNotes(parsedNotes.text || ""); setNoteImageUrl(parsedNotes.image || ""); setNoteImagePreview(parsedNotes.image || "");
          } else { setNotes(String(rawNotes)); setNoteImageUrl(""); setNoteImagePreview(""); }
        } catch (err) { setNotes(String(rawNotes)); setNoteImageUrl(""); setNoteImagePreview(""); }
      }

      try {
        const parsedQ = typeof lesson.questions_json === "object" ? lesson.questions_json : JSON.parse(lesson.questions_json || "[]");
        if (Array.isArray(parsedQ) && parsedQ.length > 0) {
          setQuestions(parsedQ.map(q => {
            const linkGambarDitemui = q.questionImageUrl || q.question_image_url || "";
            return {
              questionText: q.question || "", questionImageUrl: linkGambarDitemui, questionPreview: linkGambarDitemui, questionFile: null, 
              options: q.options || ["", "", "", ""], correctAnswer: q.correct_answer || q.correctAnswer || "A", explanation: q.explanation || ""
            };
          }));
        } else setQuestions([{ questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]);
      } catch (e) { setQuestions([{ questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]); }
    }
  };

  const resetSemuaMedanBorang = () => { 
    setTopicId(""); setTitle(""); setSubtitle(""); setYoutubeUrl(""); setNotes(""); setNoteImageUrl(""); setNoteImageFile(null); setNoteImagePreview(""); setInfographicUrl(""); setInfographicFile(null); setInfographicPreview(""); setQuestions([{ questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]); setSubtopics([]); setNewSubtopic(""); 
  };
  
  const tukarModBorang = (modBaru) => { 
    setBorangMod(modBaru); setSelectedLessonId(""); resetSemuaMedanBorang(); if (modBaru === "edit") muatTurunSenaraiLesson(); 
  };
  
  const handleAddQuestion = () => setQuestions([...questions, { questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]);
  const handleAddSubtopic = () => { const val = newSubtopic.trim(); if (!val) return; setSubtopics([...subtopics, val]); setNewSubtopic(""); };
  const handleRemoveSubtopic = (index) => setSubtopics(subtopics.filter((_, i) => i !== index));
  const handleRemoveQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));
  const handleQuestionChange = (index, field, value) => { const updated = [...questions]; updated[index][field] = value; setQuestions(updated); };
  const handleOptionChange = (qIndex, optIndex, value) => { const updated = [...questions]; if(!updated[qIndex].options) updated[qIndex].options = ["", "", "", ""]; updated[qIndex].options[optIndex] = value; setQuestions(updated); };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (borangMod === "create" && !topicId) { toast({ title: "ID Topik Diperlukan", variant: "destructive" }); return; }
    if (!title || !youtubeUrl) { toast({ title: "Medan Diperlukan", variant: "destructive" }); return; }

    setIsSaving(true);
    try {
      let serverInfographicUrl = infographicUrl; 
      if (infographicFile) { try { serverInfographicUrl = await uploadKeServerRasmi(infographicFile); } catch (e){} }

      let serverNoteImageUrl = noteImageUrl;
      if (noteImageFile) {
        try { serverNoteImageUrl = await uploadKeServerRasmi(noteImageFile); } catch (uploadError) {
          alert(`🛑 GAMBAR SEKATAN:\nAkaun Base44 anda tiada kuota muat naik fail.\nSila padam fail pilihan dan gunakan 'Pautan URL Gambar Alternatif' (Contoh: ImgBB / Google Drive Direct).`);
          setIsSaving(false); return;
        }
      }

      const susunanSoalanKuiz = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let serverQImageUrl = q.questionImageUrl; 
        if (q.questionFile) { try { serverQImageUrl = await uploadKeServerRasmi(q.questionFile); } catch (e){} }

        susunanSoalanKuiz.push({
          question: q.questionText.trim(), 
          question_image_url: serverQImageUrl || null, 
          questionImageUrl: serverQImageUrl || null,   
          options: (q.options || ["", "", "", ""]).map(opt => opt.trim()), 
          correct_answer: q.correctAnswer || "A", 
          correctAnswer: q.correctAnswer || "A", 
          explanation: (q.explanation || "").trim()
        });
      }

      const payloadFormatJSON = JSON.stringify({ text: notes.trim(), image: serverNoteImageUrl || null });

      const dataPayload = {
        topic_name: title.trim(), 
        subject_name: subtitle.trim() || "Matematik", 
        video_url: youtubeUrl.trim(),              
        notes_content: payloadFormatJSON, 
        infographic_url: serverInfographicUrl || null, 
        questions_json: JSON.stringify(susunanSoalanKuiz),
        subtopics_json: JSON.stringify(subtopics) 
      };

      if (borangMod === "create") {
        const targetId = topicId.trim().toLowerCase().replace(/\s+/g, "-");
        await base44.entities.Quiz.create({ id: targetId, ...dataPayload });
      } else {
        await base44.entities.Quiz.update(selectedLessonId, dataPayload);
      }

      toast({ title: "Kandungan Berjaya Dikunci! 🎉", description: "Bahan pengajian selamat disimpan menggunakan URL murni." });
      resetSemuaMedanBorang(); setSelectedLessonId(""); if (borangMod === "edit") setTimeout(muatTurunSenaraiLesson, 500);

    } catch (err) { alert("❌ RALAT DATABASE KRITIKAL: " + err.message); } finally { setIsSaving(false); }
  };

  // 🌟 SECOND AI BUTTON: Updated to use generateModularLessonContent logic (same as the first button)
  const handleGenerateAIContent = async () => {
    if (!selectedLessonId) {
      toast({ title: "Pilih topik dahulu", variant: "destructive" });
      return;
    }
    const sahkan = window.confirm(
      `Jana semua kandungan AI modular untuk topik ini?\n\nIni akan menjana ke entiti modular: Nota, Peta Minda, Soalan Kuiz, Flashcard, Permainan, Panduan Guru, dan Maklum Balas.\n\nKandungan sedia ada akan ditimpa.`
    );
    if (!sahkan) return;

    setIsGeneratingAI(true);
    try {
      const res = await base44.functions.invoke("generateModularLessonContent", {
        topic_id: selectedLessonId,
        force: true,
      });
      if (res.data?.success) {
        toast({
          title: "Kandungan Modular Dijana! 🎉",
          description: `Kandungan modular berjaya dijana dan disimpan ke entiti berasingan.`,
        });
      } else {
        toast({ title: "Ralat", description: res.data?.error || "Gagal menjana.", variant: "destructive" });
      }
    } catch (err) {
      const errStr = String(err.message || err).toLowerCase();
      const isTimeout = errStr.includes("timeout") || errStr.includes("timed out") || errStr.includes("aborted") || errStr.includes("network");
      const isQuotaError = !isTimeout && (errStr.includes("403") || errStr.includes("quota") || errStr.includes("credit limit") || errStr.includes("insufficient"));
      toast({
        title: isTimeout ? "Panggilan Lama / Timeout ⏳" : isQuotaError ? "Token AI Habis ⚠️" : "Ralat Sistem",
        description: isTimeout
          ? "Penjanaan mengambil masa terlalu lama. Kandungan mungkin masih sedang diproses di server. Tunggu sebentar dan segarkan halaman, atau gunakan borang manual."
          : isQuotaError
          ? "Kuota AI tamat. Sila gunakan borang manual di bawah untuk cipta lesson resource."
          : err.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const muatTurunSenaraiTopic = async () => {
    try {
      const topics = await base44.entities.Topic.list('-created_date', 100);
      setModularTopics(topics || []);
    } catch (err) {
      console.error("Gagal memuatkan topik:", err);
    }
  };

  // 🌟 FIRST AI BUTTON: Modular content generation
  const handleGenerateModularContent = async () => {
    if (!selectedModularTopicId) {
      toast({ title: "Pilih topik dahulu", variant: "destructive" });
      return;
    }
    const sahkan = window.confirm(
      `Jana semua kandungan AI modular untuk topik ini?\n\nIni akan menjana ke entiti modular: Nota, Peta Minda, Soalan Kuiz, Flashcard, Permainan, Panduan Guru, dan Maklum Balas.\n\nKandungan sedia ada akan ditimpa.`
    );
    if (!sahkan) return;

    setIsGeneratingModular(true);
    try {
      const res = await base44.functions.invoke("generateModularLessonContent", {
        topic_id: selectedModularTopicId,
        force: true,
      });
      if (res.data?.success) {
        toast({
          title: "Kandungan Modular Dijana! 🎉",
          description: `Kandungan modular berjaya dijana dan disimpan ke entiti berasingan.`,
        });
      } else {
        toast({ title: "Ralat", description: res.data?.error || "Gagal menjana.", variant: "destructive" });
      }
    } catch (err) {
      const errStr = String(err.message || err).toLowerCase();
      const isTimeout = errStr.includes("timeout") || errStr.includes("timed out") || errStr.includes("aborted") || errStr.includes("network");
      const isQuotaError = !isTimeout && (errStr.includes("403") || errStr.includes("quota") || errStr.includes("credit limit") || errStr.includes("insufficient"));
      toast({
        title: isTimeout ? "Panggilan Lama / Timeout ⏳" : isQuotaError ? "Token AI Habis ⚠️" : "Ralat Sistem",
        description: isTimeout
          ? "Penjanaan mengambil masa terlalu lama. Kandungan mungkin masih sedang diproses di server. Tunggu sebentar dan segarkan halaman, atau gunakan borang manual."
          : isQuotaError
          ? "Kuota AI tamat. Sila gunakan borang manual di bawah untuk cipta lesson resource."
          : err.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingModular(false);
    }
  };

  if (checkingAuth) return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 bg-slate-50/30 min-h-screen font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" /> Pengurusan Lesson Resources</h1>
          <p className="text-xs text-slate-500 mt-0.5">Enjin Harmoni: Menyokong ciri Copy-Paste JSON Kuiz terpantas.</p>
        </div>
        <div className="flex bg-slate-200/70 p-1 rounded-xl shadow-inner self-start sm:self-center">
          <button type="button" onClick={() => tukarModBorang("create")} className={`px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 ${borangMod === "create" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"}`}><PlusCircle className="w-3.5 h-3.5 text-emerald-500" /> Cipta Baru</button>
          <button type="button" onClick={() => tukarModBorang("edit")} className={`px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 ${borangMod === "edit" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"}`}><Edit3 className="w-3.5 h-3.5 text-amber-500" /> Edit / Padam</button>
        </div>
      </div>

      {/* TOP CARD: First AI Generation Button */}
      <Card className="p-4 bg-purple-50/30 border border-purple-200/60 rounded-2xl shadow-2xs space-y-3">
        <label className="text-xs font-black text-purple-800 uppercase flex items-center gap-1.5 mb-1"><Sparkles className="w-4 h-4 animate-pulse" /> Jana Kandungan AI Modular (Sistem Baru)</label>
        <p className="text-[11px] text-slate-500 font-medium">Jana SEMUA aset pelajaran (Nota, Peta Minda, Kuiz, Flashcard, Permainan, Panduan Guru) ke entiti modular berasingan dalam satu panggilan AI.</p>
        <div className="relative space-y-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={topicSearchQuery}
              onChange={(e) => setTopicSearchQuery(e.target.value)}
              placeholder="Taip nama topik untuk cari..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div className="max-h-44 overflow-y-auto rounded-xl border border-purple-100 bg-white shadow-sm">
            {(() => {
              const filtered = modularTopics.filter(t =>
                (t.name || "").toLowerCase().includes(topicSearchQuery.toLowerCase())
              );
              if (filtered.length === 0) {
                return <p className="text-[11px] text-slate-400 font-medium p-3 text-center">Tiada topik dijumpai.</p>;
              }
              return filtered.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setSelectedModularTopicId(t.id); setTopicSearchQuery(t.name); }}
                  className={`w-full text-left px-3 py-2 text-xs font-bold border-b border-slate-50 last:border-0 transition-colors ${
                    selectedModularTopicId === t.id ? "bg-purple-100 text-purple-900" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {t.name}
                </button>
              ));
            })()}
          </div>
          {selectedModularTopicId && (
            <p className="text-[10px] text-purple-600 font-bold">✓ Topik dipilih: {modularTopics.find(t => t.id === selectedModularTopicId)?.name}</p>
          )}
        </div>
        <Button type="button" onClick={handleGenerateModularContent} disabled={isGeneratingModular || !selectedModularTopicId} className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
          {isGeneratingModular ? <><Loader2 className="w-4 h-4 animate-spin" /> Menjana Kandungan Modular...</> : <><Sparkles className="w-4 h-4" /> Jana Kandungan AI Modular</>}
        </Button>
      </Card>

      {/* BOTTOM CARD: Second AI Generation Button */}
      {borangMod === "edit" && (
        <Card className="p-4 bg-amber-50/30 border border-amber-200/60 rounded-2xl shadow-2xs space-y-3">
          <label className="text-xs font-black text-amber-800 uppercase flex items-center gap-1.5 mb-1"><Search className="w-4 h-4" /> Pilih Topik Semasa Untuk Disunting</label>
          <select value={selectedLessonId} onChange={handlePilihLesson} disabled={isLoadingList || isDeleting} className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm">
            <option value="">-- Sila Pilih Modul Pelajaran --</option>
            {lessonsList.map(l => (<option key={l.id} value={l.id}>{l.topic_name} (ID: {l.id})</option>))}
          </select>
          {selectedLessonId && (
            <Button type="button" onClick={handleGenerateAIContent} disabled={isGeneratingAI} className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2">
              {isGeneratingAI ? <><Loader2 className="w-4 h-4 animate-spin" /> Menjana Kandungan Modular...</> : <><Sparkles className="w-4 h-4" /> Jana Kandungan AI Modular</>}
            </Button>
          )}
        </Card>
      )}

      {(borangMod === "create" || selectedLessonId) ? (
        <form onSubmit={handleSaveForm} className="space-y-6">
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 border-b pb-2 uppercase text-[11px] tracking-wider text-emerald-600"><BookOpen className="w-4 h-4 inline mr-1" /> 1. Parameter Teras</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">ID Unik Topik*</label><input type="text" required value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={borangMod === "edit"} className="w-full px-3 py-2 border rounded-xl text-xs font-bold bg-slate-50" /></div>
              <div className="sm:col-span-2 space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Tajuk Utama Modul*</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" /></div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-emerald-500" /> Subtopik (Pilihan — jika berkenaan)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtopic}
                  onChange={(e) => setNewSubtopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSubtopic(); } }}
                  placeholder="cth: Penambahan, Penolakan, Pendaraban..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
                <Button type="button" size="sm" onClick={handleAddSubtopic} className="h-9 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold gap-1 shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </Button>
              </div>
              {subtopics.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {subtopics.map((st, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                      {st}
                      <button type="button" onClick={() => handleRemoveSubtopic(i)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 border-b pb-2 uppercase text-[11px] tracking-wider text-emerald-600"><Video className="w-4 h-4 inline mr-1" /> 2. Dahan 1: Video Youtube</h3>
            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">URL YouTube Video*</label><input type="url" required value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" /></div>
          </Card>

          <Card className="p-5 bg-blue-50/40 border border-blue-200/70 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-blue-700 border-b border-blue-200 pb-2 uppercase text-[11px] tracking-wider"><ImageIcon className="w-4 h-4 inline mr-1" /> 3. Dahan 2: Kandungan Nota & Infografik (PNG)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">🖼️ Muat Naik Infografik Nota</label>
                <input type="file" accept="image/png, image/jpeg" onChange={kendaliPilihanNoteImage} className="w-full text-xs text-slate-500 border border-blue-200 rounded-xl bg-white p-1 cursor-pointer" />
              </div>
              <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Pautan URL Gambar Alternatif</label>
                <input type="text" placeholder="URL Gambar (PNG/JPG)" value={noteImageUrl} onChange={(e) => { setNoteImageUrl(e.target.value); if(e.target.value) setNoteImagePreview(e.target.value); }} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium" />
              </div>
            </div>
            {noteImagePreview && (<div className="p-2 bg-white border border-dashed border-blue-300 rounded-xl max-w-xs"><img src={noteImagePreview} alt="Preview" className="w-full h-auto rounded-lg max-h-32 object-contain" /><button type="button" onClick={() => { setNoteImageFile(null); setNoteImagePreview(""); setNoteImageUrl(""); }} className="text-[9px] font-bold text-rose-500 mt-1">Buang Gambar</button></div>)}

            <div className="space-y-1 pt-2 border-t border-blue-100">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Teks Ayat Nota Pengajian (Pilihan)</label>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Taip huraian pengajaran (jika ada)..." className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-medium shadow-inner" />
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 border-b pb-2 uppercase text-[11px] tracking-wider text-purple-600"><UploadCloud className="w-4 h-4 inline mr-1" /> 4. Dahan 4: Peta Minda Keseluruhan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">Muat Naik Gambar Peta Minda</label><input type="file" accept="image/*" onChange={kendaliPilihanInfographic} className="w-full text-xs text-slate-500 border border-slate-200 rounded-xl bg-slate-50/50 p-1 cursor-pointer" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">URL Gambar Alternatif</label><input type="text" placeholder="URL Peta Minda" value={infographicUrl} onChange={(e) => { setInfographicUrl(e.target.value); if(e.target.value) setInfographicPreview(e.target.value); }} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium" /></div>
            </div>
            {infographicPreview && (<div className="mt-2 p-2 bg-slate-50 border border-dashed rounded-xl max-w-xs"><img src={infographicPreview} alt="Preview" className="w-full h-auto rounded-lg max-h-32 object-contain bg-white" /><button type="button" onClick={() => { setInfographicFile(null); setInfographicPreview(""); setInfographicUrl(""); }} className="text-[9px] font-bold text-rose-500 mt-1">Buang Fail</button></div>)}
          </Card>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 gap-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase text-[12px]"><HelpCircle className="w-4 h-4 text-emerald-600" /> 5. Set Kuiz Objektif ({questions.length})</h3>
              
              <div className="flex flex-wrap bg-slate-100/60 p-1.5 rounded-xl border border-slate-200 gap-2 shadow-inner">
                <input type="file" accept=".json,application/json" ref={jsonFileInputRef} onChange={handleJSONFileUpload} className="hidden" />
                <Button type="button" size="sm" onClick={() => jsonFileInputRef.current?.click()} className="h-9 text-[11px] bg-slate-800 text-white rounded-xl font-bold gap-1.5">
                  <FileJson className="w-4 h-4 text-amber-400" /> Fail .JSON
                </Button>
                <Button type="button" size="sm" onClick={() => setShowPasteJson(!showPasteJson)} className="h-9 text-[11px] bg-indigo-600 text-white rounded-xl font-bold gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Tampal Teks
                </Button>
                <Button type="button" size="sm" onClick={handleAddQuestion} className="h-9 text-[11px] bg-emerald-600 text-white rounded-xl font-bold">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Manual
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showPasteJson && (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="p-4 bg-indigo-50/50 border-2 border-indigo-200 rounded-2xl space-y-3 shadow-inner">
                  <label className="text-xs font-black text-indigo-800 uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Tampal (Paste) Kod JSON Dari ChatGPT Di Sini:
                  </label>
                  <textarea 
                    rows={6} 
                    value={pastedJson} 
                    onChange={(e) => setPastedJson(e.target.value)} 
                    placeholder={`Contoh:\n[\n  {\n    "question": "1 + 1 = ?",\n    "options": ["1", "2", "3", "4"],\n    "correct_answer": "B"\n  }\n]`} 
                    className="w-full p-3 text-[11px] font-mono leading-relaxed text-stone-700 bg-white border border-indigo-200 rounded-xl shadow-xs" 
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="outline" onClick={() => setShowPasteJson(false)} className="h-9 text-xs font-bold rounded-xl text-stone-500">Batal</Button>
                    <Button type="button" onClick={handlePasteJSON} className="h-9 text-xs font-black rounded-xl bg-indigo-600 text-white">Susun Soalan Sekarang 🚀</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {questions.map((q, qIndex) => (
              <Card key={qIndex} className="p-5 bg-white border border-emerald-100/60 rounded-2xl space-y-4 relative">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px]">Soalan #{qIndex + 1}</span>
                  {questions.length > 1 && (<Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveQuestion(qIndex)} className="text-rose-500 h-7 text-[10px]"><Trash2 className="w-3.5 h-3.5" /></Button>)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Ayat Soalan *</label><textarea rows={2} required value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Gambar Soalan</label><input type="file" accept="image/*" onChange={(e) => kendaliPilihanGambarSoalan(qIndex, e.target.files[0])} className="w-full text-xs text-slate-500 border rounded-xl bg-slate-50 p-1 cursor-pointer" /></div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1"><LinkIcon className="w-3 h-3 text-emerald-500" /> Pautan URL Gambar Soalan #{qIndex + 1}</label>
                  <input type="text" placeholder="Masukkan URL gambar langsung jika dari AI / Google Drive" value={q.questionImageUrl || ""} onChange={(e) => { handleQuestionChange(qIndex, "questionImageUrl", e.target.value); if(e.target.value) handleQuestionChange(qIndex, "questionPreview", e.target.value); }} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium" />
                </div>
                {q.questionPreview && (<div className="p-2 bg-slate-50 border border-dashed rounded-xl max-w-xs"><img src={q.questionPreview} alt="Preview" className="w-full h-auto rounded-lg max-h-24 object-contain bg-white border" /><button type="button" onClick={() => { const updated = [...questions]; updated[qIndex].questionFile = null; updated[qIndex].questionPreview = ""; updated[qIndex].questionImageUrl = ""; setQuestions(updated); }} className="text-[9px] font-bold text-rose-500 mt-1">Buang Gambar</button></div>)}

                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["A", "B", "C", "D"].map((label, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-xl border border-slate-100"><span className="w-6 h-6 rounded-lg bg-white border font-black text-xs text-slate-700 flex items-center justify-center">{label}</span><input type="text" required value={q.options ? q.options[optIndex] : ""} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)} className="flex-1 px-2.5 py-1 bg-white border rounded-lg text-xs font-medium" /></div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border flex items-center shrink-0"><span className="text-[10px] font-bold text-slate-600 uppercase">Jawapan Betul:</span><select value={q.correctAnswer || "A"} onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", e.target.value)} className="ml-3 bg-white border rounded-lg text-xs font-black px-4 py-1 text-purple-700 cursor-pointer"><option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option></select></div>
                  <div className="flex-1 w-full bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100"><textarea rows={1} placeholder="Penerangan jawapan..." value={q.explanation || ""} onChange={(e) => handleQuestionChange(qIndex, "explanation", e.target.value)} className="w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-medium shadow-inner" /></div>
                </div>
              </Card>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-end border-t">
            <Button type="submit" disabled={isSaving} className="text-white font-black text-xs rounded-xl shadow-md px-6 h-10 bg-gradient-to-r from-emerald-500 to-teal-500">
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sedang Mengunci...</> : <><Save className="w-4 h-4" /> Kunci Kandungan Modul</>}
            </Button>
          </div>
        </form>
      ) : (
        <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-2xl bg-white"><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pilih satu modul pelajaran di atas untuk suntingan.</p></Card>
      )}
    </div>
  );
}
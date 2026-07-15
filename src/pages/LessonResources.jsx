// src/pages/LessonResources.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  BookOpen, Video, HelpCircle, Plus, Trash2, Save, Sparkles, AlertCircle, Loader2, 
  PlusCircle, Edit3, Search, UploadCloud, FileJson, Link as LinkIcon, Image as ImageIcon, FileText, CheckCircle
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
  const jsonFileInputRef = useRef(null);
  
  const [showPasteJson, setShowPasteJson] = useState(false);
  const [pastedJson, setPastedJson] = useState("");

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
      if (!Array.isArray(parsedData)) throw new Error("Format mestilah Array.");
      
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
      toast({ title: "Import Berjaya! 🎉", description: `${importedQuestions.length} soalan kuiz disusun.` });
      
      setShowPasteJson(false);
      setPastedJson("");
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = "";
    } catch (error) { 
      toast({ title: "Ralat JSON ❌", description: "Pastikan sintaks JSON tepat.", variant: "destructive" }); 
    }
  };

  const muatTurunSenaraiLesson = async () => { 
    setIsLoadingList(true); 
    try { 
      setLessonsList(await base44.entities.Quiz.filter({}) || []); 
    } catch (err) {} finally { 
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

      const rawNotes = lesson.notes_content || "";
      if (rawNotes) {
        try {
          let cleanStr = String(rawNotes).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          if (cleanStr.startsWith('"') && cleanStr.endsWith('"')) { 
            cleanStr = cleanStr.substring(1, cleanStr.length - 1); 
          }
          const parsedNotes = typeof rawNotes === "object" ? rawNotes : JSON.parse(cleanStr);
          if (parsedNotes && (parsedNotes.text !== undefined || parsedNotes.image !== undefined)) {
            setNotes(parsedNotes.text || ""); 
            setNoteImageUrl(parsedNotes.image || ""); 
            setNoteImagePreview(parsedNotes.image || "");
          } else { 
            setNotes(String(rawNotes)); 
            setNoteImageUrl(""); 
            setNoteImagePreview(""); 
          }
        } catch (err) { 
          setNotes(String(rawNotes)); 
          setNoteImageUrl(""); 
          setNoteImagePreview(""); 
        }
      }

      try {
        const parsedQ = typeof lesson.questions_json === "object" ? lesson.questions_json : JSON.parse(lesson.questions_json || "[]");
        if (Array.isArray(parsedQ) && parsedQ.length > 0) {
          setQuestions(parsedQ.map(q => {
            const linkGambarDitemui = q.questionImageUrl || q.question_image_url || "";
            return {
              questionText: q.question || "", 
              questionImageUrl: linkGambarDitemui, 
              questionPreview: linkGambarDitemui, 
              questionFile: null, 
              options: q.options || ["", "", "", ""], 
              correctAnswer: q.correct_answer || q.correctAnswer || "A", 
              explanation: q.explanation || ""
            };
          }));
        } else {
          setQuestions([{ questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]);
        }
      } catch (e) { 
        setQuestions([{ questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]); 
      }
    }
  };

  const resetSemuaMedanBorang = () => { 
    setTopicId(""); setTitle(""); setSubtitle(""); setYoutubeUrl(""); setNotes(""); setNoteImageUrl(""); setNoteImageFile(null); setNoteImagePreview(""); setInfographicUrl(""); setInfographicFile(null); setInfographicPreview(""); setQuestions([{ questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]); 
  };
  
  const tukarModBorang = (modBaru) => { 
    setBorangMod(modBaru); 
    setSelectedLessonId(""); 
    resetSemuaMedanBorang(); 
    if (modBaru === "edit") muatTurunSenaraiLesson(); 
  };
  
  const handleAddQuestion = () => setQuestions([...questions, { questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]);
  const handleRemoveQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));
  const handleQuestionChange = (index, field, value) => { const updated = [...questions]; updated[index][field] = value; setQuestions(updated); };
  const handleOptionChange = (qIndex, optIndex, value) => { const updated = [...questions]; if(!updated[qIndex].options) updated[qIndex].options = ["", "", "", ""]; updated[qIndex].options[optIndex] = value; setQuestions(updated); };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (borangMod === "create" && !topicId) { toast({ title: "ID Topik Diperlukan", variant: "destructive" }); return; }
    if (!title || !youtubeUrl) { toast({ title: "Medan Wajib Diperlukan", variant: "destructive" }); return; }

    setIsSaving(true);
    try {
      let serverInfographicUrl = infographicUrl; 
      if (infographicFile) { try { serverInfographicUrl = await uploadKeServerRasmi(infographicFile); } catch (e){} }

      let serverNoteImageUrl = noteImageUrl;
      if (noteImageFile) {
        try { serverNoteImageUrl = await uploadKeServerRasmi(noteImageFile); } catch (uploadError) {
          alert(`🛑 AMARAN SEKATAN:\nAkaun Base44 anda tiada kuota muat naik fail.\nSila gunakan 'Pautan URL Gambar Alternatif'.`);
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
        questions_json: JSON.stringify(susunanSoalanKuiz) 
      };

      if (borangMod === "create") {
        const targetId = topicId.trim().toLowerCase().replace(/\s+/g, "-");
        await base44.entities.Quiz.create({ id: targetId, ...dataPayload });
      } else {
        await base44.entities.Quiz.update(selectedLessonId, dataPayload);
      }

      toast({ title: "Misi Kandungan Dikunci! 🎉", description: "Bahan pembelajaran berjaya dilancarkan ke portal murid." });
      resetSemuaMedanBorang(); 
      setSelectedLessonId(""); 
      if (borangMod === "edit") setTimeout(muatTurunSenaraiLesson, 500);

    } catch (err) { 
      alert("❌ Ralat Simpan Database: " + err.message); 
    } finally { 
      setIsSaving(false); 
    }
  };

  if (checkingAuth) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      <p className="text-xs font-bold text-slate-400 mt-2">Mengesahkan Kuasa Studio... 🔐</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 min-h-screen font-sans bg-[#F9FAFC]">
      
      {/* HEADER UTAMA DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500 fill-amber-400 animate-pulse" /> Creator Studio: Harta Karun Ilmu
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Bina dan urus kandungan pembelajaran 5 dahan interaktif untuk wira cilik StudyQuest.
          </p>
        </div>
        
        {/* TAB PEMILIHAN MOD (CREATE VS EDIT) */}
        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl shadow-inner self-start sm:self-center border border-slate-200/20">
          <button 
            type="button" 
            onClick={() => tukarModBorang("create")} 
            className={`px-5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${borangMod === "create" ? "bg-white text-slate-800 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-500" /> Cipta Modul Baru
          </button>
          <button 
            type="button" 
            onClick={() => tukarModBorang("edit")} 
            className={`px-5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${borangMod === "edit" ? "bg-white text-slate-800 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Edit3 className="w-4 h-4 text-amber-500" /> Sunting Modul
          </button>
        </div>
      </div>

      {/* JIKA MOD EDIT: DROPDOWN CARIAN TOPIK */}
      {borangMod === "edit" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 bg-gradient-to-br from-amber-50/40 to-orange-50/20 border-2 border-amber-200/70 rounded-[2rem] shadow-sm">
            <label className="text-xs font-black text-amber-800 uppercase flex items-center gap-2 mb-2">
              <Search className="w-4 h-4" /> Pilih Topik Semasa Untuk Disunting
            </label>
            <select 
              value={selectedLessonId} 
              onChange={handlePilihLesson} 
              disabled={isLoadingList || isDeleting} 
              className="w-full h-11 px-4 bg-white border-2 border-amber-200 focus:border-amber-500 rounded-xl text-xs font-bold text-slate-700 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="">-- Klik Untuk Memilih Kertas Pembelajaran --</option>
              {lessonsList.map(l => (
                <option key={l.id} value={l.id}>{l.topic_name} (ID: {l.id})</option>
              ))}
            </select>
          </Card>
        </motion.div>
      )}

      {/* BORANG MULTI-SEKSYEN UTAMA */}
      {(borangMod === "create" || selectedLessonId) ? (
        <form onSubmit={handleSaveForm} className="space-y-6">
          
          {/* SEKSYEN 1: PARAMETER TERAS */}
          <Card className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-slate-400" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b pb-3">
              <BookOpen className="w-4 h-4 text-slate-600" /> 1. Parameter Teras Modul
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">ID Unik Topik *</label>
                <input 
                  type="text" 
                  required 
                  value={topicId} 
                  onChange={(e) => setTopicId(e.target.value)} 
                  placeholder="Cth: darab-mudah"
                  disabled={borangMod === "edit"} 
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 focus:outline-none" 
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Tajuk Utama Modul (Dilihat Murid) *</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Cth: Formula Sifir Darab Ekspres! 🎯"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-700 focus:outline-none shadow-inner transition-colors" 
                />
              </div>
            </div>
          </Card>

          {/* DAHAN 1: VIDEO YOUTUBE */}
          <Card className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b pb-3">
              <Video className="w-4 h-4" /> Dahan 1: Video Animasi Guru (YouTube)
            </h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Pautan URL Penuh YouTube Video *</label>
              <input 
                type="url" 
                required 
                value={youtubeUrl} 
                onChange={(e) => setYoutubeUrl(e.target.value)} 
                placeholder="[https://www.youtube.com/watch?v=](https://www.youtube.com/watch?v=)..."
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-medium text-slate-600 focus:outline-none shadow-inner transition-colors" 
              />
            </div>
          </Card>

          {/* DAHAN 2: NOTA PINTAR & INFOGRAFIK */}
          <Card className="p-6 bg-emerald-50/20 border border-emerald-100/60 rounded-[2rem] shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 border-b border-emerald-100 pb-3">
              <ImageIcon className="w-4 h-4" /> Dahan 2: Nota Pintar & Infografik Visual
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">🖼️ Fail Gambar Infografik</label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  onChange={kendaliPilihanNoteImage} 
                  className="w-full text-xs text-slate-500 border border-emerald-200 rounded-xl bg-white p-1.5 cursor-pointer focus:outline-none" 
                />
              </div>
              <div className="p-3 bg-white rounded-2xl border border-emerald-100/80 space-y-1.5 shadow-xs">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Pautan URL Alternatif (Direct URL)</label>
                <input 
                  type="text" 
                  placeholder="[https://imgbb.com/gambar-anda.png](https://imgbb.com/gambar-anda.png)" 
                  value={noteImageUrl} 
                  onChange={(e) => { setNoteImageUrl(e.target.value); if(e.target.value) setNoteImagePreview(e.target.value); }} 
                  className="w-full h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none" 
                />
              </div>
            </div>

            {/* PREVIEW GAMBAR NOTA */}
            {noteImagePreview && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="p-2.5 bg-white border-2 border-dashed border-emerald-200 rounded-2xl max-w-xs shadow-xs relative">
                <img src={noteImagePreview} alt="Preview Nota" className="w-full h-auto rounded-xl max-h-32 object-contain bg-slate-50" />
                <button type="button" onClick={() => { setNoteImageFile(null); setNoteImagePreview(""); setNoteImageUrl(""); }} className="text-[10px] font-black text-rose-500 mt-2 block w-full text-center hover:underline">Padam Fail Imej</button>
              </motion.div>
            )}

            <div className="space-y-1.5 pt-2 border-t border-emerald-100">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Teks Petunjuk Huraian Nota (Sokongan Markdown)</label>
              <textarea 
                rows={3} 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Tulis tip rahsia atau nota ringkas di sini..." 
                className="w-full px-4 py-3 bg-white border border-emerald-200 focus:border-emerald-500 rounded-2xl text-xs font-medium text-slate-700 shadow-inner focus:outline-none transition-colors" 
              />
            </div>
          </Card>

          {/* DAHAN 4: PETA MINDA */}
          <Card className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-purple-500" />
            <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest flex items-center gap-2 border-b pb-3">
              <UploadCloud className="w-4 h-4" /> Dahan 4: Peta Minda Keseluruhan Topik
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Muat Naik Fail Imej Peta Minda</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={kendaliPilihanInfographic} 
                  className="w-full text-xs text-slate-500 border border-slate-200 rounded-xl bg-slate-50/50 p-1.5 cursor-pointer focus:outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">URL Gambar Alternatif Peta Minda</label>
                <input 
                  type="text" 
                  placeholder="[https://drive.google.com/](https://drive.google.com/)..." 
                  value={infographicUrl} 
                  onChange={(e) => { setInfographicUrl(e.target.value); if(e.target.value) setInfographicPreview(e.target.value); }} 
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none" 
                />
              </div>
            </div>
            {infographicPreview && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="mt-2 p-2.5 bg-slate-50 border-2 border-dashed border-purple-200 rounded-2xl max-w-xs shadow-inner">
                <img src={infographicPreview} alt="Preview Peta Minda" className="w-full h-auto rounded-xl max-h-32 object-contain bg-white border border-slate-100" />
                <button type="button" onClick={() => { setInfographicFile(null); setInfographicPreview(""); setInfographicUrl(""); }} className="text-[10px] font-black text-rose-500 mt-2 block w-full text-center hover:underline">Padam Fail Peta Minda</button>
              </motion.div>
            )}
          </Card>

          {/* DAHAN 5: SET KUIZ OBJEKTIF */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 gap-3">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                <HelpCircle className="w-4 h-4 text-orange-500" /> Dahan 5: Kertas Kuiz Boss Objektif ({questions.length})
              </h3>
              
              {/* ALATAN IMPORT & MANUAL */}
              <div className="flex flex-wrap bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 gap-2 shadow-inner">
                <input type="file" accept=".json,application/json" ref={jsonFileInputRef} onChange={handleJSONFileUpload} className="hidden" />
                
                <Button type="button" size="sm" onClick={() => jsonFileInputRef.current?.click()} className="h-9 text-[11px] bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black gap-1.5 transition-all shadow-xs">
                  <FileJson className="w-4 h-4 text-amber-400 fill-amber-400" /> Muat Fail JSON
                </Button>
                
                <Button type="button" size="sm" onClick={() => setShowPasteJson(!showPasteJson)} className="h-9 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black gap-1.5 transition-all shadow-xs">
                  <FileText className="w-3.5 h-3.5 text-indigo-200" /> Tampal Teks AI
                </Button>
                
                <Button type="button" size="sm" onClick={handleAddQuestion} className="h-9 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black gap-1 transition-all shadow-xs">
                  <Plus className="w-3.5 h-3.5" /> Tambah Soalan Manual
                </Button>
              </div>
            </div>

            {/* PANEL DEDIKASI TAMPAL TEXT (KOD CHATGPT / GEMINI) */}
            <AnimatePresence>
              {showPasteJson && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="p-5 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border-2 border-indigo-200 rounded-[2rem] space-y-3 shadow-inner"
                >
                  <label className="text-[11px] font-black text-indigo-900 uppercase flex items-center gap-2 tracking-wide">
                    <FileText className="w-4 h-4 text-indigo-600" /> Salin Kod JSON Dari Bot AI Anda & Tampal Di Bawah:
                  </label>
                  <textarea 
                    rows={6} 
                    value={pastedJson} 
                    onChange={(e) => setPastedJson(e.target.value)} 
                    placeholder={`Paste format Array di sini. Contoh:\n[\n  {\n    "question": "Berapakah 5 x 5?",\n    "options": ["15", "20", "25", "30"],\n    "correct_answer": "C"\n  }\n]`} 
                    className="w-full p-4 text-[11px] font-mono leading-relaxed text-slate-700 bg-white border-2 border-indigo-100 rounded-2xl shadow-xs focus:outline-none focus:border-indigo-400" 
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="ghost" onClick={() => setShowPasteJson(false)} className="h-9 text-xs font-bold rounded-xl text-slate-500 hover:bg-white/50">Batal</Button>
                    <Button type="button" onClick={handlePasteJSON} className="h-9 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">Susun Kertas Soalan Semasa 🚀</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* RENDERING DYNAMIC CARDS UNTUK KUIZ */}
            <div className="space-y-4">
              {questions.map((q, qIndex) => (
                <motion.div key={qIndex} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-6 bg-white border-2 border-orange-100/60 rounded-[2rem] space-y-4 relative shadow-xs hover:border-orange-200 transition-colors">
                    
                    {/* SUB-HEADER KAD SOALAN */}
                    <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                      <span className="text-[10px] font-black tracking-wider text-orange-700 bg-orange-50 px-3 py-1 rounded-full uppercase">Soalan Petualangan #{qIndex + 1}</span>
                      {questions.length > 1 && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveQuestion(qIndex)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 px-2.5 rounded-xl text-xs font-bold transition-colors">
                          <Trash2 className="w-4 h-4 mr-1" /> Padam Soalan
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Pernyataan Ayat Soalan *</label>
                        <textarea rows={2} required value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)} placeholder="Tuliskan soalan kuiz di sini..." className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-inner focus:outline-none focus:border-orange-400" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Fail Gambar Pembantu</label>
                        <input type="file" accept="image/*" onChange={(e) => kendaliPilihanGambarSoalan(qIndex, e.target.files[0])} className="w-full text-xs text-slate-500 border border-slate-200 rounded-xl bg-slate-50 p-1.5 cursor-pointer focus:outline-none" />
                      </div>
                    </div>
                    
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><LinkIcon className="w-3 h-3 text-orange-500" /> URL Gambar Alternatif Untuk Soalan #{qIndex + 1}</label>
                      <input type="text" placeholder="[https://domain.com/infografik-soalan.jpg](https://domain.com/infografik-soalan.jpg)" value={q.questionImageUrl || ""} onChange={(e) => { handleQuestionChange(qIndex, "questionImageUrl", e.target.value); if(e.target.value) handleQuestionChange(qIndex, "questionPreview", e.target.value); }} className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-orange-400" />
                    </div>
                    
                    {q.questionPreview && (
                      <div className="p-2 bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-2xl max-w-xs relative shadow-inner">
                        <img src={q.questionPreview} alt="Preview Soalan" className="w-full h-auto rounded-xl max-h-24 object-contain bg-white" />
                        <button type="button" onClick={() => { const updated = [...questions]; updated[qIndex].questionFile = null; updated[qIndex].questionPreview = ""; updated[qIndex].questionImageUrl = ""; setQuestions(updated); }} className="text-[9px] font-black text-rose-500 mt-2 block w-full text-center hover:underline">Buang Gambar</button>
                      </div>
                    )}

                    {/* INPUT PILIHAN A, B, C, D */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Senarai Pilihan Jawapan Objektif *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {["A", "B", "C", "D"].map((label, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 bg-slate-50/40 p-2 rounded-2xl border border-slate-100 focus-within:border-orange-300 transition-colors">
                            <span className="w-7 h-7 rounded-xl bg-white border font-black text-xs text-slate-700 flex items-center justify-center shadow-xs shrink-0">{label}</span>
                            <input type="text" required value={q.options ? q.options[optIndex] : ""} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)} placeholder={`Pilihan ${label}`} className="flex-1 h-8 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none shadow-xs" />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* PILIHAN SKOR BETUL & EXPLANATION */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pt-2 border-t border-slate-100">
                      <div className="bg-orange-50/40 p-2 rounded-2xl border border-orange-100/70 flex items-center shrink-0 shadow-inner">
                        <span className="text-[10px] font-black text-orange-800 uppercase pl-1 tracking-wider">Kunci Jawapan:</span>
                        <select value={q.correctAnswer || "A"} onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", e.target.value)} className="ml-3 bg-white border border-orange-200 rounded-xl text-xs font-black px-4 h-8 text-purple-700 cursor-pointer shadow-xs focus:outline-none">
                          <option value="A">Pilihan A</option>
                          <option value="B">Pilihan B</option>
                          <option value="C">Pilihan C</option>
                          <option value="D">Pilihan D</option>
                        </select>
                      </div>
                      <div className="flex-1 w-full bg-emerald-50/30 p-2 rounded-2xl border border-emerald-100/60 shadow-inner flex items-center">
                        <textarea rows={1} placeholder="Tulis huraian / penerangan kenapa jawapan ini betul (Akan dipaparkan pada lembaran maklum balas AI)..." value={q.explanation || ""} onChange={(e) => handleQuestionChange(qIndex, "explanation", e.target.value)} className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-400" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* FLUID ACTION FOOTER SAVE */}
          <div className="pt-5 flex items-center justify-end border-t border-slate-200/80">
            <Button 
              type="submit" 
              disabled={isSaving} 
              className="text-white font-black text-xs rounded-xl shadow-md px-8 h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sedang Mengunci Khas Misi...</>
              ) : (
                <><Save className="w-4 h-4" /> Lancarkan Kandungan Kertas Ilmu 🚀</>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <Card className="p-12 text-center border-dashed border-4 border-slate-200 rounded-[2.5rem] bg-white shadow-inner max-w-xl mx-auto mt-6">
          <div className="text-4xl animate-bounce">📚</div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-3 leading-relaxed">
            Sila pilih satu modul pengajian sedia ada di atas,<br/>atau klik butang <span className="text-emerald-500">"Cipta Modul Baru"</span> untuk bermula.
          </p>
        </Card>
      )}
    </div>
  );
}

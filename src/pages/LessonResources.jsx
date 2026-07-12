import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  BookOpen, Video, HelpCircle, Plus, Trash2, Save, Sparkles, AlertCircle, Loader2, PlusCircle, Edit3, Search, UploadCloud, FileJson
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function LessonResources() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 🔒 STATE KESELAMATAN & LOADING SYSTEM
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // 🔄 STRATEGI SUIS MOD: "create" ATAU "edit"
  const [borangMod, setBorangMod] = useState("create"); 
  const [lessonsList, setLessonsList] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");

  // STATE DATA PENGISIAN BORANG CORE
  const [topicId, setTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [coinReward, setCoinReward] = useState(50);
  const [notes, setNotes] = useState(""); 

  // STATE PETA MINDA / INFOGRAFIK RASMI
  const [infographicUrl, setInfographicUrl] = useState(""); 
  const [infographicFile, setInfographicFile] = useState(null); 
  const [infographicPreview, setInfographicPreview] = useState(""); 

  // STATE BANK SOALAN KUIZ DINAMIK
  const [questions, setQuestions] = useState([
    { questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["", "", "", ""], correctAnswer: "A", explanation: "" }
  ]);

  // Rujukan Input Fail Sematan
  const jsonFileInputRef = useRef(null);

  // 🎯 1. AUTH GUARD (PENGESAHAN PERANAN ADMIN)
  useEffect(() => {
    const semakAksesAdmin = async () => {
      try {
        setCheckingAuth(true);
        const me = await base44.auth.me();
        if (!me) throw new Error("Sesi tidak sah.");

        const peranan = me.app_role;
        const sahAdmin = peranan === "admin" || peranan === "teacher" || peranan === "parent" || me.is_admin === true;

        if (sahAdmin) {
          setHasAccess(true);
          muatTurunSenaraiLesson(); 
        } else {
          toast({ title: "Akses Disekat! 🛑", description: "Modul ini khas untuk Pentadbir.", variant: "destructive" });
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

  // 🎯 2. PENGEMAMPAT & CONVERTER BASE64 (BYPASS STORAGE)
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
          
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { 
              type: "image/jpeg", 
              lastModified: Date.now() 
            });
            resolve(compressedFile);
          }, "image/jpeg", 0.70); 
        };
      };
    });
  };

  const tukarKeBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const kendaliPilihanInfographic = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setInfographicFile(file);
    setInfographicPreview(URL.createObjectURL(file));
  };

  const kendaliPilihanGambarSoalan = (index, file) => {
    if (!file) return;
    const updatedQuestions = [...questions];
    updatedQuestions[index].questionFile = file;
    updatedQuestions[index].questionPreview = URL.createObjectURL(file);
    setQuestions(updatedQuestions);
  };

  // 🎯 3. SISTEM AUTO-EXTRACT: MUAT NAIK FAIL .JSON TERUS DARI AI
  const handleJSONFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        
        if (!Array.isArray(parsedData)) {
          throw new Error("Format dalam fail JSON mestilah Array.");
        }

        const importedQuestions = parsedData.map(q => ({
          questionText: q.question || "",
          questionImageUrl: q.question_image_url || "", 
          questionFile: null,
          questionPreview: q.question_image_url || "", 
          options: Array.isArray(q.options) ? [...q.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""],
          correctAnswer: q.correct_answer || "A",
          explanation: q.explanation || "" 
        }));

        setQuestions(importedQuestions);
        toast({ title: "Import Selesai! 🎉", description: `${importedQuestions.length} soalan bersama jawapan & explanation berjaya disusun.` });
        
      } catch (error) {
        console.error("JSON Parse Error:", error);
        toast({ title: "Gagal Membaca Fail ❌", description: "Fail ini bukan format JSON yang sah.", variant: "destructive" });
      }
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  // 🎯 4. CRUDS LOGIK NETWORK
  const muatTurunSenaraiLesson = async () => {
    setIsLoadingList(true);
    try {
      const rekodKuiz = await base44.entities.Quiz.filter({});
      setLessonsList(rekodKuiz || []);
    } catch (err) {
      console.error("Gagal menarik senarai:", err);
    } finally { setIsLoadingList(false); }
  };

  const handlePilihLesson = (e) => {
    const idPilihan = e.target.value;
    setSelectedLessonId(idPilihan);

    if (!idPilihan) { resetSemuaMedanBorang(); return; }

    const lessonDipilih = lessonsList.find(l => l.id === idPilihan);
    if (lessonDipilih) {
      setTopicId(lessonDipilih.id); 
      setTitle(lessonDipilih.topic_name || ""); 
      setSubtitle(lessonDipilih.subject_name || "");
      setYoutubeUrl(lessonDipilih.video_url || ""); 
      setCoinReward(lessonDipilih.coins_reward || 50);
      setInfographicUrl(lessonDipilih.infographic_url || ""); 
      setInfographicPreview(lessonDipilih.infographic_url || ""); 
      setInfographicFile(null);

      try {
        const parsedNotes = lessonDipilih.notes_json ? JSON.parse(lessonDipilih.notes_json) : "";
        setNotes(Array.isArray(parsedNotes) ? parsedNotes.join("\n") : (typeof parsedNotes === "string" ? parsedNotes : ""));
      } catch (e) { setNotes(""); }

      try {
        const parsedQuestions = lessonDipilih.questions_json ? JSON.parse(lessonDipilih.questions_json) : [];
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          setQuestions(parsedQuestions.map(q => ({
            questionText: q.question || "",
            questionImageUrl: q.question_image_url || "", 
            questionPreview: q.question_image_url || "",
            questionFile: null,
            options: q.options || ["", "", "", ""],
            correctAnswer: q.correct_answer || "A",
            explanation: q.explanation || ""
          })));
        } else {
          setQuestions([{ questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]);
        }
      } catch (e) { 
        setQuestions([{ questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]); 
      }
    }
  };

  const resetSemuaMedanBorang = () => {
    setTopicId(""); setTitle(""); setSubtitle(""); setYoutubeUrl(""); setCoinReward(50); setNotes("");
    setInfographicUrl(""); setInfographicFile(null); setInfographicPreview("");
    setQuestions([{ questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]);
  };

  const tukarModBorang = (modBaru) => {
    setBorangMod(modBaru); 
    setSelectedLessonId(""); 
    resetSemuaMedanBorang();
    if (modBaru === "edit") muatTurunSenaraiLesson();
  };

  const handleAddQuestion = () => setQuestions([...questions, { questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]);
  const handleRemoveQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));
  const handleQuestionChange = (index, field, value) => { const updatedQuestions = [...questions]; updatedQuestions[index][field] = value; setQuestions(updatedQuestions); };
  const handleOptionChange = (qIndex, optIndex, value) => { const updatedQuestions = [...questions]; if(!updatedQuestions[qIndex].options) updatedQuestions[qIndex].options = ["", "", "", ""]; updatedQuestions[qIndex].options[optIndex] = value; setQuestions(updatedQuestions); };

  const handleDeleteLesson = async () => {
    if (!selectedLessonId) return;
    if (!window.confirm(`⚠️ PADAM KEKAL:\n\nAdakah anda pasti mahu memadam modul ID: [${selectedLessonId}] ini?`)) return;
    setIsDeleting(true);
    try {
      await base44.entities.Quiz.delete(selectedLessonId);
      toast({ title: "Berjaya Dipadam! 🗑️", description: "Modul berjaya dibuang." });
      setSelectedLessonId(""); resetSemuaMedanBorang(); muatTurunSenaraiLesson();
    } catch (err) { toast({ title: "Ralat Pemadaman", description: err.message, variant: "destructive" }); } finally { setIsDeleting(false); }
  };

  // 🎯 5. PROSES PENGHANTARAN DATA (FIXED UPDATE PARAMETERS + ERROR DECODER)
  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (borangMod === "create" && !topicId) { toast({ title: "Ralat 🛑", description: "Sila isi ID Unik Topik.", variant: "destructive" }); return; }
    if (!title || !youtubeUrl) { toast({ title: "Medan Diperlukan", description: "Tajuk dan Video wajib diisi.", variant: "destructive" }); return; }

    setIsSaving(true);
    try {
      // TUKAR PETA MINDA KEPADA BASE64 STRING
      let serverInfographicUrl = infographicUrl;
      if (infographicFile) {
        const compressedInfo = await kompresFailGambarUlu(infographicFile); 
        serverInfographicUrl = await tukarKeBase64(compressedInfo); 
      }

      const susunanSoalanKuiz = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let serverQImageUrl = q.questionImageUrl;

        // TUKAR GAMBAR SOALAN KEPADA BASE64 STRING
        if (q.questionFile) {
          const compressedQ = await kompresFailGambarUlu(q.questionFile); 
          serverQImageUrl = await tukarKeBase64(compressedQ); 
        }

        susunanSoalanKuiz.push({
          question: q.questionText.trim(),
          question_image_url: serverQImageUrl,
          options: (q.options || ["", "", "", ""]).map(opt => opt.trim()),
          correct_answer: q.correctAnswer || "A",
          explanation: (q.explanation || "").trim() 
        });
      }

      const dataPayload = {
        topic_name: title.trim(), 
        subject_name: subtitle.trim() || "Matematik", 
        video_url: youtubeUrl.trim(), 
        infographic_url: serverInfographicUrl, 
        coins_reward: Number(coinReward), 
        notes_json: JSON.stringify(notes.trim()), 
        questions_json: JSON.stringify(susunanSoalanKuiz)
      };

      if (borangMod === "create") {
        const targetId = topicId.trim().toLowerCase().replace(/\s+/g, "-");
        await base44.entities.Quiz.create({ id: targetId, ...dataPayload });
        toast({ title: "Misi Baru Dicipta! 🎉", description: "Semua kandungan buatan anda selamat dikunci." });
      } else {
        // 🌟 KEMBALI KEPADA 2 PARAMETER: (id, payload) mengikut standard SDK Base44
        await base44.entities.Quiz.update(selectedLessonId, dataPayload);
        toast({ title: "Kemaskini Berjaya! 🔄", description: "Kandungan baharu anda selamat dikunci pada pangkalan data." });
      }

      resetSemuaMedanBorang(); 
      setSelectedLessonId(""); 
      if (borangMod === "edit") muatTurunSenaraiLesson();

    } catch (err) {
      console.error("INFO RALAT PENUH UNTUK ADMIN:", err);
      
      // 🌟 PENYAHKOD RALAT PINTAR: Mengelakkan paparan ralat [object Object]
      let mesejRalat = "Ralat semasa menghubungi pelayan pangkalan data.";
      if (typeof err === "string") mesejRalat = err;
      else if (err?.response?.data?.message) mesejRalat = err.response.data.message;
      else if (err?.message) mesejRalat = err.message;
      else if (err?.error) mesejRalat = err.error;
      else mesejRalat = JSON.stringify(err);

      toast({ 
        title: "Ralat Simpanan Server ❌", 
        description: mesejRalat, 
        variant: "destructive" 
      });
    } finally { setIsSaving(false); }
  };

  if (checkingAuth) return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" /><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Menyemak Kebenaran Pentadbir...</p></div>);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 bg-slate-50/30 min-h-screen font-sans">
      
      {/* HEADER PANEL TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" /> Pengurusan Lesson Resources</h1>
          <p className="text-xs text-slate-500 mt-0.5">Sistem Pintar Base64 Berintegrasi: Gambar diproses automatik ke database tanpa isu Server Storage.</p>
        </div>
        <div className="flex bg-slate-200/70 p-1 rounded-xl shadow-inner self-start sm:self-center">
          <button type="button" onClick={() => tukarModBorang("create")} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${borangMod === "create" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}><PlusCircle className="w-3.5 h-3.5 text-indigo-500" /> Cipta Baru</button>
          <button type="button" onClick={() => tukarModBorang("edit")} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${borangMod === "edit" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}><Edit3 className="w-3.5 h-3.5 text-amber-500" /> Edit / Padam</button>
        </div>
      </div>

      {/* MOD SELECTION DROPDOWN */}
      {borangMod === "edit" && (
        <Card className="p-4 bg-amber-50/30 border border-amber-200/60 rounded-2xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center shadow-2xs">
          <div className="flex-1">
            <label className="text-xs font-black text-amber-800 uppercase flex items-center gap-1.5 mb-1"><Search className="w-4 h-4" /> Pilih Topik Semasa Untuk Disunting</label>
            <select value={selectedLessonId} onChange={handlePilihLesson} disabled={isLoadingList || isDeleting} className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-indigo-500 shadow-sm">
              <option value="">-- Sila Pilih Modul Pelajaran --</option>
              {lessonsList.map(l => (<option key={l.id} value={l.id}>{l.topic_name} (ID: {l.id ? l.id : "---"})</option>))}
            </select>
          </div>
          <Button type="button" variant="destructive" disabled={!selectedLessonId || isDeleting} onClick={handleDeleteLesson} className="h-9 px-4 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shrink-0 self-end sm:self-center shadow-xs active:scale-95 disabled:opacity-40">
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Padam Modul
          </Button>
        </Card>
      )}

      {(borangMod === "create" || selectedLessonId) ? (
        <form onSubmit={handleSaveForm} className="space-y-6">
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5 border-b pb-2 uppercase text-[11px] tracking-wider text-indigo-600"><BookOpen className="w-4 h-4" /> 1. Parameter Teras & ID Misi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">ID Unik Topik*</label><input type="text" required placeholder="Contoh: 6a518e..." value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={borangMod === "edit"} className={`w-full px-3 py-2 border rounded-xl text-xs font-bold ${borangMod === "edit" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-50"}`} /></div>
              <div className="sm:col-span-2 space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Tajuk Utama Modul*</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3 space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Nama Subjek / Deskripsi Pendek</label><input type="text" placeholder="Contoh: Matematik Tahun 1" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">XP Ganjaran</label><input type="number" min={1} value={coinReward} onChange={(e) => setCoinReward(e.target.value)} className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-black text-amber-700 text-center" /></div>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5 border-b pb-2 uppercase text-[11px] tracking-wider text-indigo-600"><Video className="w-4 h-4" /> 2. Media Pengajaran & Peta Minda</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">URL YouTube Video*</label><input type="url" required placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><UploadCloud className="w-3.5 h-3.5 text-indigo-500" /> Muat Naik Peta Minda (Jadi Teks Base64)</label><input type="file" accept="image/*" onChange={kendaliPilihanInfographic} className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-xl bg-slate-50/50 cursor-pointer p-1" /></div>
            </div>
            {infographicPreview && (
              <div className="mt-2 p-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl max-w-md"><img src={infographicPreview} alt="Pratinjau" className="w-full h-auto rounded-lg max-h-44 object-contain bg-white border" /><button type="button" onClick={() => { setInfographicFile(null); setInfographicPreview(""); setInfographicUrl(""); }} className="text-[9px] font-bold text-rose-500 hover:underline mt-1 block">Buang Fail Gambar</button></div>
            )}
          </Card>

          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5 border-b pb-1.5 uppercase text-[11px] tracking-wider text-indigo-600">📝 3. Kandungan Nota Pengajian Bebas</h3>
            <textarea rows={4} required placeholder="Tulis perenggan nota ringkas..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500 shadow-inner" />
          </Card>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 gap-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase text-[12px] tracking-wide"><HelpCircle className="w-4 h-4 text-purple-600" /> 4. Set Penyediaan Soalan Kuiz ({questions.length})</h3>
              <div className="flex bg-slate-100/60 p-1.5 rounded-xl border border-slate-200 gap-2 w-full sm:w-auto shadow-inner">
                <input type="file" accept=".json,application/json" ref={jsonFileInputRef} onChange={handleJSONFileUpload} className="hidden" />
                <Button type="button" size="sm" onClick={() => jsonFileInputRef.current?.click()} className="h-9 text-[11px] bg-slate-800 text-white hover:bg-slate-900 rounded-xl font-bold gap-2">
                  <FileJson className="w-4 h-4 text-amber-400" /> Muat Naik Fail JSON AI
                </Button>
                <Button type="button" size="sm" onClick={handleAddQuestion} className="h-9 text-[11px] bg-purple-600 text-white hover:bg-purple-700 rounded-xl font-bold gap-1 shadow-xs">
                  <Plus className="w-3.5 h-3.5" /> Tambah Manual
                </Button>
              </div>
            </div>

            {questions.map((q, qIndex) => (
              <Card key={qIndex} className="p-5 bg-white border border-purple-100/60 rounded-2xl shadow-xs space-y-4 relative">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full uppercase text-[10px]">Soalan #{qIndex + 1}</span>
                  {questions.length > 1 && (<Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveQuestion(qIndex)} className="h-7 text-[10px] text-rose-500 hover:bg-rose-50 rounded-lg px-2"><Trash2 className="w-3.5 h-3.5 mr-1" /> Padam</Button>)}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Ayat Soalan Kuiz *</label><textarea rows={2} required value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-purple-500" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><UploadCloud className="w-3.5 h-3.5 text-purple-600" /> Muat Naik Gambar (Base64)</label><input type="file" accept="image/*" onChange={(e) => kendaliPilihanGambarSoalan(qIndex, e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 border border-slate-200 rounded-xl bg-slate-50/50 cursor-pointer p-1" /></div>
                </div>

                {q.questionPreview && (
                  <div className="p-2 bg-slate-50 border border-dashed rounded-xl max-w-xs animate-in fade-in duration-200"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">👀 Rajah Visual Soalan #{qIndex + 1}:</p><img src={q.questionPreview} alt="Preview" className="w-full h-auto rounded-lg max-h-28 object-contain bg-white border" /><button type="button" onClick={() => { const updated = [...questions]; updated[qIndex].questionFile = null; updated[qIndex].questionPreview = ""; updated[qIndex].questionImageUrl = ""; setQuestions(updated); }} className="text-[9px] font-bold text-rose-500 hover:underline mt-1 block">Buang Gambar</button></div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Pilihan Jawapan Objektif:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["A", "B", "C", "D"].map((label, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-xl border border-slate-100">
                        <span className="w-6 h-6 rounded-lg bg-white border font-black text-xs text-slate-700 flex items-center justify-center shadow-2xs">{label}</span>
                        <input type="text" required value={q.options ? q.options[optIndex] : ""} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)} className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-purple-500" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shrink-0"><span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-purple-600" /> Kunci Jawapan:</span><select value={q.correctAnswer || "A"} onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", e.target.value)} className="ml-3 bg-white border border-slate-200 rounded-lg text-xs font-black px-4 py-1 text-purple-700 shadow-2xs cursor-pointer focus:outline-purple-600"><option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option></select></div>
                  <div className="flex-1 w-full bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100"><span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" /> Penerangan Jawapan</span><textarea rows={1} placeholder="Terangkan rumusan mengapa jawapan pilihan ini tepat..." value={q.explanation || ""} onChange={(e) => handleQuestionChange(qIndex, "explanation", e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-medium focus:outline-emerald-500 shadow-inner" /></div>
                </div>
              </Card>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-end border-t">
            <Button type="submit" disabled={isSaving} className={`text-white font-black text-xs rounded-xl shadow-md px-6 h-10 gap-1.5 active:scale-[0.99] transition-all ${borangMod === 'create' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}>
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Data Base64...</> : <><Save className="w-4 h-4" /> Kunci Kandungan Modul</>}
            </Button>
          </div>
        </form>
      ) : (
        <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-2xl bg-white"><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Silakan pilih satu modul pelajaran daripada menu di atas untuk memulakan suntingan.</p></Card>
      )}
    </div>
  );
}

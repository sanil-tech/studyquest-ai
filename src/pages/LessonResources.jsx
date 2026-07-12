import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  BookOpen, Video, HelpCircle, Plus, Trash2, Save, Sparkles, AlertCircle, Loader2, PlusCircle, Edit3, Search, UploadCloud, FileJson, Link as LinkIcon, Image as ImageIcon, FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function LessonResources() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 🔒 STATE KESELAMATAN & LOADING
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // 🔄 STRATEGI SUIS MOD
  const [borangMod, setBorangMod] = useState("create"); 
  const [lessonsList, setLessonsList] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");

  // STATE PARAMETER TERAS
  const [topicId, setTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState(""); 
  const [coinReward, setCoinReward] = useState(50); 

  // 📝 3. NOTA, GAMBAR & PDF INFOGRAFIK (SISTEM JSON NOTA)
  const [notes, setNotes] = useState(""); 
  const [noteImageUrl, setNoteImageUrl] = useState(""); 
  const [noteImageFile, setNoteImageFile] = useState(null); 
  const [noteImagePreview, setNoteImagePreview] = useState(""); 
  const [notePdfUrl, setNotePdfUrl] = useState("");           // URL PDF dari server
  const [notePdfFile, setNotePdfFile] = useState(null);       // Fail PDF mentah
  const [notePdfName, setNotePdfName] = useState("");         // Nama fail PDF dipilih

  // 🗺️ 4. PETA MINDA UTAMA (Dahan 4)
  const [infographicUrl, setInfographicUrl] = useState(""); 
  const [infographicFile, setInfographicFile] = useState(null); 
  const [infographicPreview, setInfographicPreview] = useState(""); 

  // ⚔️ 5. KUIZ
  const [questions, setQuestions] = useState([
    { questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["", "", "", ""], correctAnswer: "A", explanation: "" }
  ]);
  const jsonFileInputRef = useRef(null);

  // 🎯 1. AUTH GUARD
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

  // 🎯 2. ENJIN MUAT NAIK GAMBAR (MAMPAT)
  const kompresFailGambarUlu = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image(); img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width; let height = img.height;
          const MAX_WIDTH = 1200; 
          if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d"); ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => { resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg", lastModified: Date.now() })); }, "image/jpeg", 0.70); 
        };
      };
    });
  };

  const uploadKeServerRasmi = async (file) => {
    const mampat = await kompresFailGambarUlu(file);
    const formData = new FormData(); formData.append("file", mampat);
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
    throw new Error("Pelayan menolak fail imej.");
  };

  // 🎯 3. ENJIN MUAT NAIK DOKUMEN TULEN (PDF) - TANPA MAMPATAN GAMBAR
  const uploadDokumenGeneric = async (file) => {
    const formData = new FormData(); formData.append("file", file);
    const cubaanSintaks = [
      async () => await base44.integrations.UploadFile.upload({ file }),
      async () => await base44.integrations.UploadFile.execute({ file }),
      async () => await base44.integrations.UploadFile({ file }),
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
    throw new Error("Pelayan menolak dokumen PDF.");
  };

  const kendaliPilihanInfographic = (e) => { const file = e.target.files[0]; if (!file) return; setInfographicFile(file); setInfographicPreview(URL.createObjectURL(file)); };
  const kendaliPilihanNoteImage = (e) => { const file = e.target.files[0]; if (!file) return; setNoteImageFile(file); setNoteImagePreview(URL.createObjectURL(file)); };
  
  // Pengendali PDF Baru
  const kendaliPilihanNotePdf = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setNotePdfFile(file); setNotePdfName(file.name);
  };

  const kendaliPilihanGambarSoalan = (index, file) => { if (!file) return; const updated = [...questions]; updated[index].questionFile = file; updated[index].questionPreview = URL.createObjectURL(file); setQuestions(updated); };

  const handleJSONFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        if (!Array.isArray(parsedData)) throw new Error("Format mesti Array.");
        setQuestions(parsedData.map(q => ({
          questionText: q.question || "", questionImageUrl: q.question_image_url || "", questionFile: null, questionPreview: q.question_image_url || "", 
          options: Array.isArray(q.options) ? [...q.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""], correctAnswer: q.correct_answer || "A", explanation: q.explanation || "" 
        })));
        toast({ title: "Import Selesai! 🎉", description: `${parsedData.length} soalan disusun.` });
      } catch (error) { toast({ title: "Gagal Membaca Fail ❌", variant: "destructive" }); }
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const muatTurunSenaraiLesson = async () => { setIsLoadingList(true); try { setLessonsList(await base44.entities.Quiz.filter({}) || []); } catch (err) {} finally { setIsLoadingList(false); } };

  // 🎯 4. MOD EDIT: DECODE STRUKTUR JSON NOTA LENGKAP
  const handlePilihLesson = (e) => {
    const idPilihan = e.target.value; setSelectedLessonId(idPilihan);
    if (!idPilihan) { resetSemuaMedanBorang(); return; }

    const lesson = lessonsList.find(l => l.id === idPilihan);
    if (lesson) {
      setTopicId(lesson.id); setTitle(lesson.topic_name || ""); setSubtitle(lesson.subject_name || "");
      setCoinReward(lesson.coins_reward || 50);
      setInfographicUrl(lesson.infographic_url || ""); setInfographicPreview(lesson.infographic_url || ""); setInfographicFile(null);
      setYoutubeUrl(lesson.video_url || ""); 

      // Peledak struktur JSON Nota lama + PDF Baharu
      try {
        const parsedNotes = JSON.parse(lesson.notes_content);
        if (parsedNotes && typeof parsedNotes === "object") {
          setNotes(parsedNotes.text || "");
          setNoteImageUrl(parsedNotes.image || "");
          setNoteImagePreview(parsedNotes.image || "");
          setNotePdfUrl(parsedNotes.pdf || "");
          setNotePdfName(parsedNotes.pdf ? "📄 Dokumen PDF Sedia Ada Telah Dikunci" : "");
        } else {
          setNotes(lesson.notes_content || ""); setNoteImageUrl(""); setNoteImagePreview(""); setNotePdfUrl(""); setNotePdfName("");
        }
      } catch (err) {
        setNotes(lesson.notes_content || ""); setNoteImageUrl(""); setNoteImagePreview(""); setNotePdfUrl(""); setNotePdfName("");
      }

      try {
        const parsedQ = typeof lesson.questions_json === "object" ? lesson.questions_json : JSON.parse(lesson.questions_json || "[]");
        if (Array.isArray(parsedQ) && parsedQ.length > 0) {
          setQuestions(parsedQ.map(q => ({
            questionText: q.question || "", questionImageUrl: q.question_image_url || "", questionPreview: q.question_image_url || "",
            questionFile: null, options: q.options || ["", "", "", ""], correctAnswer: q.correct_answer || "A", explanation: q.explanation || ""
          })));
        } else setQuestions([{ questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]);
      } catch (e) { setQuestions([{ questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]); }
    }
  };

  const resetSemuaMedanBorang = () => { 
    setTopicId(""); setTitle(""); setSubtitle(""); setYoutubeUrl(""); setCoinReward(50); 
    setNotes(""); setNoteImageUrl(""); setNoteImageFile(null); setNoteImagePreview("");
    setNotePdfUrl(""); setNotePdfFile(null); setNotePdfName("");
    setInfographicUrl(""); setInfographicFile(null); setInfographicPreview(""); 
    setQuestions([{ questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]); 
  };
  const tukarModBorang = (modBaru) => { setBorangMod(modBaru); setSelectedLessonId(""); resetSemuaMedanBorang(); if (modBaru === "edit") muatTurunSenaraiLesson(); };
  const handleAddQuestion = () => setQuestions([...questions, { questionText: "", questionImageUrl: "", questionFile: null, questionPreview: "", options: ["","","",""], correctAnswer: "A", explanation: "" }]);
  const handleRemoveQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));
  const handleQuestionChange = (index, field, value) => { const updated = [...questions]; updated[index][field] = value; setQuestions(updated); };
  const handleOptionChange = (qIndex, optIndex, value) => { const updated = [...questions]; if(!updated[qIndex].options) updated[qIndex].options = ["", "", "", ""]; updated[qIndex].options[optIndex] = value; setQuestions(updated); };
  const handleDeleteLesson = async () => { if (!selectedLessonId) return; if (!window.confirm(`⚠️ PADAM KEKAL?`)) return; setIsDeleting(true); try { await base44.entities.Quiz.delete(selectedLessonId); toast({ title: "Berjaya Dipadam! 🗑️" }); setSelectedLessonId(""); resetSemuaMedanBorang(); muatTurunSenaraiLesson(); } catch (err) {} finally { setIsDeleting(false); } };

  // 🎯 5. PROSES PAYLOAD PENYIMPANAN HARMONI
  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (borangMod === "create" && !topicId) { toast({ title: "Ralat 🛑", description: "Sila isi ID Unik Topik.", variant: "destructive" }); return; }
    if (!title || !youtubeUrl) { toast({ title: "Medan Diperlukan", description: "Tajuk dan Video wajib diisi.", variant: "destructive" }); return; }

    setIsSaving(true);
    try {
      let serverInfographicUrl = infographicUrl; 
      if (infographicFile) try { serverInfographicUrl = await uploadKeServerRasmi(infographicFile); } catch (e){}

      let serverNoteImageUrl = noteImageUrl;
      if (noteImageFile) try { serverNoteImageUrl = await uploadKeServerRasmi(noteImageFile); } catch (e){}

      // Proses Muat Naik PDF Asli (Kalis Kompresi Gambar)
      let serverNotePdfUrl = notePdfUrl;
      if (notePdfFile) {
        try { serverNotePdfUrl = await uploadDokumenGeneric(notePdfFile); } catch (e){
          toast({ title: "Ralat Muat Naik PDF", description: e.message, variant: "destructive" });
        }
      }

      const susunanSoalanKuiz = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let serverQImageUrl = q.questionImageUrl; 
        if (q.questionFile) try { serverQImageUrl = await uploadKeServerRasmi(q.questionFile); } catch (e){}
        susunanSoalanKuiz.push({
          question: q.questionText.trim(), question_image_url: serverQImageUrl || null,
          options: (q.options || ["", "", "", ""]).map(opt => opt.trim()), correctAnswer: q.correctAnswer || "A", explanation: (q.explanation || "").trim()
        });
      }

      // 🧠 STRATEGI INTEGRASI TIGA ELEMEN NOTA (TEKS + IMEJ + PDF)
      const strukturNotaJSON = JSON.stringify({
        text: notes.trim(),
        image: serverNoteImageUrl || null,
        pdf: serverNotePdfUrl || null
      });

      const dataPayload = {
        topic_name: title.trim(), 
        subject_name: subtitle.trim() || "Matematik", 
        video_url: youtubeUrl.trim(),              
        notes_content: strukturNotaJSON, 
        infographic_url: serverInfographicUrl || null, 
        questions_json: JSON.stringify(susunanSoalanKuiz) 
      };

      if (borangMod === "create") {
        const targetId = topicId.trim().toLowerCase().replace(/\s+/g, "-");
        await base44.entities.Quiz.create({ id: targetId, ...dataPayload });
      } else {
        await base44.entities.Quiz.update(selectedLessonId, { id: selectedLessonId, ...dataPayload });
      }

      toast({ title: "Disimpan Berjaya! 🎉", description: "Bahan Media & Dokumen PDF Berjaya Disegerakkan." });
      resetSemuaMedanBorang(); setSelectedLessonId(""); if (borangMod === "edit") setTimeout(muatTurunSenaraiLesson, 500);

    } catch (err) {
      toast({ title: "Ralat Simpanan ❌", description: err.message, variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  if (checkingAuth) return (<div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" /></div>);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 bg-slate-50/30 min-h-screen font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" /> Pengurusan Lesson Resources</h1>
          <p className="text-xs text-slate-500 mt-0.5">Enjin Schema Asli v2: Kini Menyokong Nota Infografik Fail PDF.</p>
        </div>
        <div className="flex bg-slate-200/70 p-1 rounded-xl shadow-inner self-start sm:self-center">
          <button type="button" onClick={() => tukarModBorang("create")} className={`px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 ${borangMod === "create" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"}`}><PlusCircle className="w-3.5 h-3.5 text-emerald-500" /> Cipta Baru</button>
          <button type="button" onClick={() => tukarModBorang("edit")} className={`px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 ${borangMod === "edit" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"}`}><Edit3 className="w-3.5 h-3.5 text-amber-500" /> Edit / Padam</button>
        </div>
      </div>

      {borangMod === "edit" && (
        <Card className="p-4 bg-amber-50/30 border border-amber-200/60 rounded-2xl flex flex-col sm:flex-row gap-3 items-center shadow-2xs">
          <div className="flex-1 w-full">
            <label className="text-xs font-black text-amber-800 uppercase flex items-center gap-1.5 mb-1"><Search className="w-4 h-4" /> Pilih Topik Semasa Untuk Disunting</label>
            <select value={selectedLessonId} onChange={handlePilihLesson} disabled={isLoadingList || isDeleting} className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm">
              <option value="">-- Sila Pilih Modul Pelajaran --</option>
              {lessonsList.map(l => (<option key={l.id} value={l.id}>{l.topic_name} (ID: {l.id ? l.id : "---"})</option>))}
            </select>
          </div>
          <Button type="button" variant="destructive" disabled={!selectedLessonId || isDeleting} onClick={handleDeleteLesson} className="h-9 px-4 text-xs font-black rounded-xl bg-rose-600 text-white flex items-center gap-1.5 shadow-xs"><Trash2 className="w-4 h-4" /> Padam Modul</Button>
        </Card>
      )}

      {(borangMod === "create" || selectedLessonId) ? (
        <form onSubmit={handleSaveForm} className="space-y-6">
          {/* SEKSYEN 1 */}
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 border-b pb-2 uppercase text-[11px] tracking-wider text-emerald-600"><BookOpen className="w-4 h-4 inline mr-1" /> 1. Parameter Teras</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">ID Unik Topik*</label><input type="text" required value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={borangMod === "edit"} className={`w-full px-3 py-2 border rounded-xl text-xs font-bold ${borangMod === "edit" ? "bg-slate-100 text-slate-400" : "bg-slate-50"}`} /></div>
              <div className="sm:col-span-2 space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Tajuk Utama Modul*</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" /></div>
            </div>
          </Card>

          {/* SEKSYEN 2 */}
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 border-b pb-2 uppercase text-[11px] tracking-wider text-emerald-600"><Video className="w-4 h-4 inline mr-1" /> 2. Dahan 1: Video Youtube</h3>
            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">URL YouTube Video*</label><input type="url" required value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" /></div>
          </Card>

          {/* SEKSYEN 3 (UPGRADED MEDIA NOTA DUA PILIHAN: GAMBAR & PDF) */}
          <Card className="p-5 bg-blue-50/40 border border-blue-200/70 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-blue-700 border-b border-blue-200 pb-2 uppercase text-[11px] tracking-wider"><ImageIcon className="w-4 h-4 inline mr-1" /> 3. Dahan 2: Kandungan Nota & Alat Bantu (JSON)</h3>
            
            {/* INPUT FAIL GAMBAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">🖼️ Muat Naik Gambar Nota (Jika Ada)</label>
                <input type="file" accept="image/*" onChange={kendaliPilihanNoteImage} className="w-full text-xs text-slate-500 border border-blue-200 rounded-xl bg-white p-1" />
              </div>
              <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Pautan URL Gambar Nota Alternatif</label>
                <input type="text" placeholder="URL Gambar" value={noteImageUrl} onChange={(e) => { setNoteImageUrl(e.target.value); if(e.target.value) setNoteImagePreview(e.target.value); }} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium" />
              </div>
            </div>
            {noteImagePreview && (<div className="p-2 bg-white border border-dashed border-blue-300 rounded-xl max-w-xs"><img src={noteImagePreview} alt="Preview" className="w-full h-auto rounded-lg max-h-24 object-contain" /><button type="button" onClick={() => { setNoteImageFile(null); setNoteImagePreview(""); setNoteImageUrl(""); }} className="text-[9px] font-bold text-rose-500 mt-1">Buang Gambar</button></div>)}

            {/* 🌟 BARU: INPUT FAIL PDF LEMBARAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-blue-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-blue-700 uppercase flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Muat Naik Dokumen Infografik PDF*</label>
                <input type="file" accept="application/pdf" onChange={kendaliPilihanNotePdf} className="w-full text-xs text-slate-500 border border-blue-200 rounded-xl bg-white p-1 file:bg-blue-600 file:text-white file:border-0 file:rounded-lg file:px-2 file:py-1 file:font-bold file:text-[10px] cursor-pointer" />
              </div>
              <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Pautan URL PDF Manual (Jika Ada)</label>
                <input type="text" placeholder="URL Fail PDF Langsung" value={notePdfUrl} onChange={(e) => { setNotePdfUrl(e.target.value); if(e.target.value) setNotePdfName("📄 Membaca URL PDF Alternatif"); }} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium" />
              </div>
            </div>
            {notePdfName && (
              <div className="p-2 bg-blue-100/50 border border-blue-200 rounded-xl text-[11px] font-bold text-blue-800 flex items-center justify-between">
                <span>{notePdfName}</span>
                <button type="button" onClick={() => { setNotePdfFile(null); setNotePdfName(""); setNotePdfUrl(""); }} className="text-[9px] font-black text-rose-600 underline">Kosongkan PDF</button>
              </div>
            )}

            {/* TEXTAREA UTAMA */}
            <div className="space-y-1 pt-2 border-t border-blue-100">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Teks Ayat Nota Pengajian</label>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Taip huraian pengajaran..." className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-medium shadow-inner" />
            </div>
          </Card>

          {/* SEKSYEN 4 */}
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 border-b pb-2 uppercase text-[11px] tracking-wider text-purple-600"><UploadCloud className="w-4 h-4 inline mr-1" /> 4. Dahan 4: Peta Minda Keseluruhan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">Muat Naik Gambar Peta Minda</label><input type="file" accept="image/*" onChange={kendaliPilihanInfographic} className="w-full text-xs text-slate-500 border border-slate-200 rounded-xl bg-slate-50/50 p-1" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">URL Gambar Alternatif</label><input type="text" placeholder="URL Peta Minda" value={infographicUrl} onChange={(e) => { setInfographicUrl(e.target.value); if(e.target.value) setInfographicPreview(e.target.value); }} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium" /></div>
            </div>
            {infographicPreview && (<div className="mt-2 p-2 bg-slate-50 border border-dashed rounded-xl max-w-xs"><img src={infographicPreview} alt="Preview" className="w-full h-auto rounded-lg max-h-32 object-contain bg-white" /><button type="button" onClick={() => { setInfographicFile(null); setInfographicPreview(""); setInfographicUrl(""); }} className="text-[9px] font-bold text-rose-500 mt-1">Buang Fail</button></div>)}
          </Card>

          {/* SEKSYEN 5 */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 gap-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase text-[12px] tracking-wide"><HelpCircle className="w-4 h-4 text-emerald-600" /> 5. Penyediaan Kuiz ({questions.length})</h3>
              <div className="flex bg-slate-100/60 p-1.5 rounded-xl border border-slate-200 gap-2 w-full sm:w-auto shadow-inner">
                <input type="file" accept=".json,application/json" ref={jsonFileInputRef} onChange={handleJSONFileUpload} className="hidden" />
                <Button type="button" size="sm" onClick={() => jsonFileInputRef.current?.click()} className="h-9 text-[11px] bg-slate-800 text-white rounded-xl font-bold gap-2"><FileJson className="w-4 h-4 text-amber-400" /> Muat Naik JSON</Button>
                <Button type="button" size="sm" onClick={handleAddQuestion} className="h-9 text-[11px] bg-emerald-600 text-white rounded-xl font-bold gap-1"><Plus className="w-3.5 h-3.5" /> Tambah Manual</Button>
              </div>
            </div>

            {questions.map((q, qIndex) => (
              <Card key={qIndex} className="p-5 bg-white border border-emerald-100/60 rounded-2xl shadow-xs space-y-4 relative">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase text-[10px]">Soalan #{qIndex + 1}</span>
                  {questions.length > 1 && (<Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveQuestion(qIndex)} className="h-7 text-[10px] text-rose-500 px-2"><Trash2 className="w-3.5 h-3.5 mr-1" /> Padam</Button>)}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Ayat Soalan Kuiz *</label><textarea rows={2} required value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><UploadCloud className="w-3.5 h-3.5 text-emerald-600" /> Gambar Soalan</label><input type="file" accept="image/*" onChange={(e) => kendaliPilihanGambarSoalan(qIndex, e.target.files[0])} className="w-full text-xs text-slate-500 border border-slate-200 rounded-xl bg-slate-50/50 p-1" /></div>
                </div>

                {q.questionPreview && (<div className="p-2 bg-slate-50 border border-dashed rounded-xl max-w-xs"><img src={q.questionPreview} alt="Preview" className="w-full h-auto rounded-lg max-h-24 object-contain bg-white border" /><button type="button" onClick={() => { const updated = [...questions]; updated[qIndex].questionFile = null; updated[qIndex].questionPreview = ""; updated[qIndex].questionImageUrl = ""; setQuestions(updated); }} className="text-[9px] font-bold text-rose-500 mt-1">Buang Gambar</button></div>)}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Pilihan Jawapan Objektif:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["A", "B", "C", "D"].map((label, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-xl border border-slate-100"><span className="w-6 h-6 rounded-lg bg-white border font-black text-xs text-slate-700 flex items-center justify-center">{label}</span><input type="text" required value={q.options ? q.options[optIndex] : ""} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)} className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium" /></div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between shrink-0"><span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-emerald-600" /> Kunci Jawapan:</span><select value={q.correctAnswer || "A"} onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", e.target.value)} className="ml-3 bg-white border border-slate-200 rounded-lg text-xs font-black px-4 py-1 text-purple-700 cursor-pointer"><option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option></select></div>
                  <div className="flex-1 w-full bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100"><span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" /> Penerangan Jawapan</span><textarea rows={1} placeholder="Terangkan rumusan..." value={q.explanation || ""} onChange={(e) => handleQuestionChange(qIndex, "explanation", e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-medium shadow-inner" /></div>
                </div>
              </Card>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-end border-t">
            <Button type="submit" disabled={isSaving} className="text-white font-black text-xs rounded-xl shadow-md px-6 h-10 bg-gradient-to-r from-emerald-500 to-teal-500">
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan Data...</> : <><Save className="w-4 h-4" /> Kunci Kandungan Modul</>}
            </Button>
          </div>
        </form>
      ) : (
        <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-2xl bg-white"><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pilih satu modul pelajaran di atas untuk suntingan.</p></Card>
      )}
    </div>
  );
}

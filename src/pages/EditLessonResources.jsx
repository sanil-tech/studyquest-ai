import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  BookOpen, Video, Image, HelpCircle, Plus, Trash2, Save, Sparkles, AlertCircle, ShieldAlert, Loader2, Edit3, Search
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export default function EditLessonResources() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 🔒 STATE KESELAMATAN & LOADING
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Spinner semasa proses padam

  // STATE UNTUK SENARAI MODUL SEDIA ADA
  const [lessonsList, setLessonsList] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");

  // STATE DATA BORANG KEMASKINI
  const [topicId, setTopicId] = useState(""); 
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [infographicUrl, setInfographicUrl] = useState("");
  const [coinReward, setCoinReward] = useState(50);
  const [notes, setNotes] = useState([""]);
  const [questions, setQuestions] = useState([{
    questionText: "", questionImageUrl: "", options: ["", "", "", ""], correctAnswer: "A" 
  }]);

  // 🎯 1. PENGESAHAN IDENTITI (AKSES PARENT DIBENARKAN UNTUK TESTING)
  useEffect(() => {
    const semakAksesAdmin = async () => {
      try {
        setCheckingAuth(true);
        const me = await base44.auth.me();
        if (!me) throw new Error("Sesi tidak sah.");

        const peranan = me.app_role;
        const sahAdmin = 
          peranan === "admin" || 
          peranan === "teacher" || 
          peranan === "parent" || 
          me.is_admin === true;

        if (sahAdmin) {
          setHasAccess(true);
          muatTurunSenaraiLesson(); 
        } else {
          toast({ title: "Akses Disekat! 🛑", description: "Hanya Pentadbir dibenarkan.", variant: "destructive" });
          navigate("/dashboard"); 
        }
      } catch (err) {
        console.error("Ralat pengesahan peranan:", err);
        navigate("/login");
      } finally {
        setCheckingAuth(false);
      }
    };
    semakAksesAdmin();
  }, [navigate, toast]);

  // 🎯 2. MUAT TURUN SEMUA LESSON DARI DATABASE
  const muatTurunSenaraiLesson = async () => {
    setIsLoadingList(true);
    try {
      const rekodKuiz = await base44.entities.Quiz.filter({});
      setLessonsList(rekodKuiz || []);
    } catch (err) {
      console.error("Gagal menarik senarai lesson:", err);
      toast({ title: "Ralat Server", description: "Gagal memuatkan senarai topik sedia ada.", variant: "destructive" });
    } finally {
      setIsLoadingList(false);
    }
  };

  // 🎯 3. LOGIK PEMADAMAN MODUL PENDUA (ANTI-DUPLICATE CRUSHER)
  const handleDeleteLesson = async () => {
    if (!selectedLessonId) return;

    const lessonAktif = lessonsList.find(l => l.id === selectedLessonId);
    const sahkan = window.confirm(
      `⚠️ AMARAN PENTADBIR:\n\nAdakah anda pasti mahu memadam "${lessonAktif?.topic_name}" dengan ID [${selectedLessonId}] ini secara kekal dari database?\n\nTindakan ini tidak boleh diundurkan.`
    );

    if (!sahkan) return;

    setIsDeleting(true);
    try {
      // Perintah pangkalan data untuk memadam rekod spesifik berdasarkan ID
      await base44.entities.Quiz.delete(selectedLessonId);

      toast({
        title: "Berjaya Dipadam! 🗑️",
        description: "Modul pelajaran pendua berjaya dibuang dari database.",
      });

      // Reset semula semua input borang ke kosong
      setSelectedLessonId("");
      setTopicId("");
      setTitle("");
      setSubtitle("");
      setYoutubeUrl("");
      setInfographicUrl("");
      setCoinReward(50);
      setNotes([""]);
      setQuestions([{ questionText: "", questionImageUrl: "", options: ["", "", "", ""], correctAnswer: "A" }]);

      // Muat semula senarai dari server untuk mengemas kini dropdown
      muatTurunSenaraiLesson();

    } catch (err) {
      console.error("Gagal memadam modul:", err);
      toast({
        title: "Ralat Pemadaman ❌",
        description: err.message || "Gagal memadam data dari pelayan.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 🎯 4. AUTO-ISI BORANG BILA TOPIK DIPILIH
  const handlePilihLesson = (e) => {
    const idPilihan = e.target.value;
    setSelectedLessonId(idPilihan);

    if (!idPilihan) {
      setTopicId(""); setTitle(""); setSubtitle(""); setYoutubeUrl(""); setInfographicUrl(""); setCoinReward(50);
      setNotes([""]); setQuestions([{ questionText: "", questionImageUrl: "", options: ["", "", "", ""], correctAnswer: "A" }]);
      return;
    }

    const lessonDipilih = lessonsList.find(l => l.id === idPilihan);
    if (lessonDipilih) {
      setTopicId(lessonDipilih.id);
      setTitle(lessonDipilih.topic_name || "");
      setSubtitle(lessonDipilih.subject_name || "");
      setYoutubeUrl(lessonDipilih.video_url || "");
      setInfographicUrl(lessonDipilih.infographic_url || "");
      setCoinReward(lessonDipilih.coins_reward || 50);

      try {
        const parsedNotes = lessonDipilih.notes_json ? JSON.parse(lessonDipilih.notes_json) : [""];
        setNotes(Array.isArray(parsedNotes) && parsedNotes.length > 0 ? parsedNotes : [""]);
      } catch (e) { setNotes([""]); }

      try {
        const parsedQuestions = lessonDipilih.questions_json ? JSON.parse(lessonDipilih.questions_json) : [];
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          const formatBorangSoalan = parsedQuestions.map(q => ({
            questionText: q.question || "",
            questionImageUrl: q.question_image_url || "",
            options: q.options || ["", "", "", ""],
            correctAnswer: q.correct_answer || "A"
          }));
          setQuestions(formatBorangSoalan);
        } else {
          setQuestions([{ questionText: "", questionImageUrl: "", options: ["", "", "", ""], correctAnswer: "A" }]);
        }
      } catch (e) { 
        setQuestions([{ questionText: "", questionImageUrl: "", options: ["", "", "", ""], correctAnswer: "A" }]); 
      }
    }
  };

  // --- URUSAN BARIS NOTA DINAMIK ---
  const handleAddNote = () => setNotes([...notes, ""]);
  const handleRemoveNote = (index) => setNotes(notes.filter((_, i) => i !== index));
  const handleNoteChange = (index, value) => {
    const updatedNotes = [...notes]; updatedNotes[index] = value; setNotes(updatedNotes);
  };

  // --- URUSAN BANK SOALAN KUIZ BERGAMBAR ---
  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: "", questionImageUrl: "", options: ["", "", "", ""], correctAnswer: "A" }]);
  };
  const handleRemoveQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions]; updatedQuestions[index][field] = value; setQuestions(updatedQuestions);
  };
  const handleOptionChange = (qIndex, optIndex, value) => {
    const updatedQuestions = [...questions]; updatedQuestions[qIndex].options[optIndex] = value; setQuestions(updatedQuestions);
  };

  // --- KEMASKINI (UPDATE) DATA KE DATABASE ---
  const handleUpdateForm = async (e) => {
    e.preventDefault();

    if (!selectedLessonId || !title || !youtubeUrl) {
      toast({ title: "Gagal", description: "Pastikan Misi dipilih, Tajuk dan Video telah diisi.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const susunanSoalanKuiz = questions.map((q) => ({
        question: q.questionText.trim(),
        question_image_url: q.questionImageUrl.trim(), 
        options: q.options.map(opt => opt.trim()),
        correct_answer: q.correctAnswer.trim()
      }));

      await base44.entities.Quiz.update(selectedLessonId, {
        topic_name: title.trim(),
        subject_name: subtitle.trim(), 
        video_url: youtubeUrl.trim(),
        infographic_url: infographicUrl.trim(),
        coins_reward: Number(coinReward),
        notes_json: JSON.stringify(notes.filter(n => n.trim() !== "")),
        questions_json: JSON.stringify(susunanSoalanKuiz)
      });

      toast({
        title: "Kemaskini Berjaya! 🔄",
        description: `Maklumat terbaru untuk '${title}' telah dikunci ke dalam pangkalan data.`,
      });

      muatTurunSenaraiLesson();

    } catch (err) {
      console.error("Gagal mengemaskini:", err);
      toast({ title: "Ralat Kemaskini ❌", description: err.message || "Gagal menyambung ke server.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Menyemak Kebenaran Pentadbir...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-500 animate-bounce" />
        <h2 className="text-base font-black text-slate-800 uppercase">Akses Tidak Dibenarkan</h2>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 bg-slate-50/30 min-h-screen font-sans">
      
      {/* Pengepala Antaramuka Edit */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-600" /> Kemaskini Lesson Resources
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Pilih modul yang telah dicipta untuk menyunting isi kandungan, video, atau membuang pendua.</p>
        </div>
        <Badge className="bg-amber-500 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full border-0 shadow-xs">
          ✏️ Edit Mode (Testing)
        </Badge>
      </div>

      {/* 🛠️ BLOK PILIHAN TOPIK BERSERTA BUTANG PEMADAM KEKAL */}
      <Card className="p-5 bg-white border border-indigo-100 rounded-2xl shadow-sm bg-indigo-50/30 flex flex-col space-y-3">
        <div>
          <label className="text-xs font-black text-indigo-700 uppercase flex items-center gap-1.5 mb-1">
            <Search className="w-4 h-4" /> Pilih Modul Untuk Dikemaskini / Dipadam
          </label>
          <p className="text-[10px] text-slate-400 font-medium">Bandingkan kod ID di hujung nama topik untuk membezakan modul pendua.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <select 
            value={selectedLessonId} 
            onChange={handlePilihLesson}
            disabled={isLoadingList || isDeleting}
            className="flex-1 px-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-indigo-500 shadow-sm"
          >
            <option value="">-- Sila Pilih Modul Pelajaran --</option>
            {lessonsList.map(l => (
              <option key={l.id} value={l.id}>
                {l.topic_name} (ID: {l.id ? l.id.substring(0, 8) : "---"})
              </option>
            ))}
          </select>
          
          {/* 🗑️ BUTANG DELETE: Hanya menyala jika modul telah dipilih */}
          <Button
            type="button"
            variant="destructive"
            disabled={!selectedLessonId || isDeleting}
            onClick={handleDeleteLesson}
            className="h-10 px-4 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shrink-0 transition-all shadow-sm active:scale-95 disabled:opacity-40"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Padam Modul Pendua
          </Button>

          {isLoadingList && <Loader2 className="w-5 h-5 animate-spin text-indigo-500 shrink-0 self-center" />}
        </div>
      </Card>

      {/* PAPAR FORM HANYA JIKA ADA TOPIK DIPILIH */}
      {selectedLessonId && (
        <form onSubmit={handleUpdateForm} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* BLOK 1: DATA TERAS MODUL */}
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5 border-b pb-2 uppercase text-[11px] tracking-wider text-indigo-600">
              <BookOpen className="w-4 h-4" /> 1. Parameter Teras & ID Misi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">ID Sistem Unik (Terkunci) 🔒</label>
                <input 
                  type="text" value={topicId} disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-400 cursor-not-allowed"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tajuk Utama Modul Misi*</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Subjek / Deskripsi Pendek</label>
                <input 
                  type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Ganjaran Koin Lulus</label>
                <input 
                  type="number" min={1} value={coinReward} onChange={(e) => setCoinReward(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-black text-amber-700 text-center focus:outline-amber-500"
                />
              </div>
            </div>
          </Card>

          {/* BLOK 2: PAUTAN MEDIA VISUAL */}
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5 border-b pb-2 uppercase text-[11px] tracking-wider text-indigo-600">
              <Video className="w-4 h-4" /> 2. Sumber Media Pengajaran & Infografik
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">URL Video YouTube Pengajaran*</label>
                <input 
                  type="url" required value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
                />
              </div>
              <div className="grid space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Image className="w-3.5 h-3.5" /> URL Gambar Infografik / Poster</label>
                <input 
                  type="url" value={infographicUrl} onChange={(e) => setInfographicUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
                />
              </div>
            </div>
          </Card>

          {/* BLOK 3: PENYEDIAAN NOTA RINGKAS */}
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-indigo-600">
                📌 3. Poin Nota Ringkas Pengajian Murid
              </h3>
              <Button type="button" size="sm" onClick={handleAddNote} className="h-7 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold gap-1">
                <Plus className="w-3 h-3" /> Tambah Baris Nota
              </Button>
            </div>
            <div className="space-y-2">
              {notes.map((note, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-5 text-center">{index + 1}.</span>
                  <input 
                    type="text" required value={note} onChange={(e) => handleNoteChange(index, e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
                  />
                  {notes.length > 1 && (
                    <button type="button" onClick={() => handleRemoveNote(index)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* BLOK 4: BANK SOALAN KUIZ MINI BERGAMBAR */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase text-[12px] tracking-wide">
                <HelpCircle className="w-4 h-4 text-purple-600" /> 4. Set Soalan Kuiz ({questions.length})
              </h3>
              <Button type="button" size="sm" onClick={handleAddQuestion} className="h-8 text-xs bg-purple-600 text-white hover:bg-purple-700 rounded-xl font-bold gap-1 shadow-xs">
                <Plus className="w-3.5 h-3.5" /> Tambah Soalan Baharu
              </Button>
            </div>

            {questions.map((q, qIndex) => (
              <Card key={qIndex} className="p-5 bg-white border border-purple-100/60 rounded-2xl shadow-xs space-y-4 relative">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full uppercase text-[10px]">
                    Soalan #{qIndex + 1}
                  </span>
                  {questions.length > 1 && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveQuestion(qIndex)} className="h-7 text-xs text-rose-500 hover:bg-rose-50 rounded-lg px-2">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Buang Soalan
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pertanyaan / Ayat Soalan Kuiz *</label>
                    <textarea 
                      rows={2} required value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Image className="w-3 h-3" /> URL Gambar Soalan</label>
                    <input 
                      type="url" value={q.questionImageUrl} onChange={(e) => handleQuestionChange(qIndex, "questionImageUrl", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-purple-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilihan Jawapan Objektif:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["A", "B", "C", "D"].map((label, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-xl border border-slate-100">
                        <span className="w-6 h-6 rounded-lg bg-white border font-black text-xs text-slate-700 flex items-center justify-center shadow-2xs">{label}</span>
                        <input 
                          type="text" required value={q.options[optIndex]} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-purple-600" /> Kunci Jawapan Betul:
                  </span>
                  <select
                    value={q.correctAnswer} onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg text-xs font-black px-4 py-1 text-purple-700 focus:outline-purple-600 shadow-2xs cursor-pointer"
                  >
                    <option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option>
                  </select>
                </div>
              </Card>
            ))}
          </div>

          {/* BUTANG SIMPAN KEMASKINI */}
          <div className="pt-4 flex items-center justify-end border-t">
            <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-md px-6 h-10 gap-1.5 active:scale-[0.99] transition-transform">
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengemaskini...</> : <><Save className="w-4 h-4" /> Kemaskini Rekod Misi Ini</>}
            </Button>
          </div>

        </form>
      )}

    </div>
  );
}

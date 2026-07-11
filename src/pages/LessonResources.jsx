import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  BookOpen, Video, Image, HelpCircle, Plus, Trash2, Save, Sparkles, AlertCircle, ShieldAlert, Loader2, PlusCircle, Edit3, Search
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export default function LessonResources() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 🔒 STATE KESELAMATAN & PENGESAHAN PERANAN
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // 🔄 STRATEGI SUIS MOD: "create" atau "edit"
  const [borangMod, setBorangMod] = useState("create"); 
  const [lessonsList, setLessonsList] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");

  // STATE DATA PENGISIAN BORANG
  const [topicId, setTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [infographicUrl, setInfographicUrl] = useState("");
  const [coinReward, setCoinReward] = useState(50);
  
  // 🎯 DIKEMASKINI: Sekarang menggunakan satu string kosong untuk perenggan nota bebas
  const [notes, setNotes] = useState(""); 
  
  const [questions, setQuestions] = useState([
    { questionText: "", questionImageUrl: "", options: ["", "", "", ""], correctAnswer: "A" }
  ]);

  // 🎯 1. AUTH GUARD & AMBIL DATA APABILA SELESAI
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

  // 🎯 2. MUAT TURUN DATA DARI SERVER (UNTUK MOD EDIT)
  const muatTurunSenaraiLesson = async () => {
    setIsLoadingList(true);
    try {
      const rekodKuiz = await base44.entities.Quiz.filter({});
      setLessonsList(rekodKuiz || []);
    } catch (err) {
      console.error("Gagal menarik senarai lesson:", err);
    } {
      setIsLoadingList(false);
    }
  };

  // 🎯 3. AUTO-ISI BORANG BILA TOPIK DIPILIH (MOD EDIT)
  const handlePilihLesson = (e) => {
    const idPilihan = e.target.value;
    setSelectedLessonId(idPilihan);

    if (!idPilihan) {
      resetSemuaMedanBorang();
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

      // 🎯 DIKEMASKINI: Logik pintar membaca nota JSON (Array lama vs String baru)
      try {
        const parsedNotes = lessonDipilih.notes_json ? JSON.parse(lessonDipilih.notes_json) : "";
        if (Array.isArray(parsedNotes)) {
          // Jika data lama berbentuk array bullet points, gabungkan dengan baris baru (\n)
          setNotes(parsedNotes.join("\n"));
        } else {
          setNotes(typeof parsedNotes === "string" ? parsedNotes : "");
        }
      } catch (e) { 
        setNotes(""); 
      }

      try {
        const parsedQuestions = lessonDipilih.questions_json ? JSON.parse(lessonDipilih.questions_json) : [];
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          setQuestions(parsedQuestions.map(q => ({
            questionText: q.question || "",
            questionImageUrl: q.question_image_url || "",
            options: q.options || ["", "", "", ""],
            correctAnswer: q.correct_answer || "A"
          })));
        } else {
          setQuestions([{ questionText: "", questionImageUrl: "", options: ["", "", "", ""], correctAnswer: "A" }]);
        }
      } catch (e) { 
        setQuestions([{ questionText: "", questionImageUrl: "", options: ["", "", "", ""], correctAnswer: "A" }]); 
      }
    }
  };

  // --- LOGIK NAVIGASI RESET ---
  const resetSemuaMedanBorang = () => {
    setTopicId(""); setTitle(""); setSubtitle(""); setYoutubeUrl(""); setInfographicUrl(""); setCoinReward(50);
    setNotes(""); setQuestions([{ questionText: "", questionImageUrl: "", options: ["", "", "", ""], correctAnswer: "A" }]);
  };

  const tukarModBorang = (modBaru) => {
    setBorangMod(modBaru);
    setSelectedLessonId("");
    resetSemuaMedanBorang();
    if (modBaru === "edit") muatTurunSenaraiLesson();
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

  // 🎯 5. LOGIK PADAM MODUL
  const handleDeleteLesson = async () => {
    if (!selectedLessonId) return;
    const sahkan = window.confirm(`⚠️ PADAM KEKAL:\n\nAdakah anda pasti mahu memadam modul ID: [${selectedLessonId}] ini?`);
    if (!sahkan) return;

    setIsDeleting(true);
    try {
      await base44.entities.Quiz.delete(selectedLessonId);
      toast({ title: "Berjaya Dipadam! 🗑️", description: "Modul pendua berjaya dibuang." });
      setSelectedLessonId("");
      resetSemuaMedanBorang();
      muatTurunSenaraiLesson();
    } catch (err) {
      toast({ title: "Ralat Pemadaman", description: err.message, variant: "destructive" });
    } finally { setIsDeleting(false); }
  };

  // 🎯 6. LOGIK UTAMA SAVE
  const handleSaveForm = async (e) => {
    e.preventDefault();

    if (borangMod === "create" && !topicId) {
      toast({ title: "Ralat 🛑", description: "Sila isi ID Unik Topik.", variant: "destructive" });
      return;
    }
    if (!title || !youtubeUrl) {
      toast({ title: "Medan Diperlukan", description: "Tajuk dan Video wajib diisi.", variant: "destructive" });
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

      const dataPayload = {
        topic_name: title.trim(),
        subject_name: subtitle.trim() || "Matematik", 
        video_url: youtubeUrl.trim(),
        infographic_url: infographicUrl.trim(),
        coins_reward: Number(coinReward),
        notes_json: JSON.stringify(notes.trim()), // 🎯 DIKEMASKINI: Disimpan terus sebagai string teks mampat
        questions_json: JSON.stringify(susunanSoalanKuiz)
      };

      if (borangMod === "create") {
        const targetId = topicId.trim().toLowerCase().replace(/\s+/g, "-");
        await base44.entities.Quiz.create({ id: targetId, ...dataPayload });
        toast({ title: "Misi Baru Dicipta! 🎉", description: `'${title}' sedia diakses murid.` });
      } else {
        await base44.entities.Quiz.update(selectedLessonId, dataPayload);
        toast({ title: "Kemaskini Berjaya! 🔄", description: `Maklumat '${title}' telah diperbaharui.` });
      }

      resetSemuaMedanBorang();
      setSelectedLessonId("");
      if (borangMod === "edit") muatTurunSenaraiLesson();

    } catch (err) {
      toast({ title: "Ralat Simpanan ❌", description: err.message, variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Menyemak Kebenaran...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 bg-slate-50/30 min-h-screen font-sans">
      
      {/* HEADER UTAMA & TOGGLE MOD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" /> Pengurusan Lesson Resources
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Pusat kawalan kurikulum bersepadu untuk mencipta, mengemas kini, dan memadam topik pelajaran.</p>
        </div>
        
        <div className="flex bg-slate-200/70 p-1 rounded-xl self-start sm:self-center shadow-inner">
          <button 
            type="button" onClick={() => tukarModBorang("create")}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${borangMod === "create" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-500" /> Cipta Baru
          </button>
          <button 
            type="button" onClick={() => tukarModBorang("edit")}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${borangMod === "edit" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-500" /> Edit / Padam
          </button>
        </div>
      </div>

      {/* JIKA MOD EDIT: TUNJUK PANEL PEMILIH */}
      {borangMod === "edit" && (
        <Card className="p-4 bg-amber-50/30 border border-amber-200/60 rounded-2xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center shadow-2xs">
          <div className="flex-1">
            <label className="text-xs font-black text-amber-800 uppercase flex items-center gap-1.5 mb-1">
              <Search className="w-4 h-4" /> Pilih Topik Semasa / Padam Pendua
            </label>
            <select 
              value={selectedLessonId} onChange={handlePilihLesson} disabled={isLoadingList || isDeleting}
              className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-indigo-500 shadow-sm"
            >
              <option value="">-- Sila Pilih Modul Pelajaran --</option>
              {lessonsList.map(l => (
                <option key={l.id} value={l.id}>{l.topic_name} (ID: {l.id ? l.id.substring(0,8) : "---"})</option>
              ))}
            </select>
          </div>

          <Button
            type="button" variant="destructive" disabled={!selectedLessonId || isDeleting} onClick={handleDeleteLesson}
            className="h-9 px-4 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shrink-0 self-end sm:self-center shadow-xs active:scale-95 disabled:opacity-40"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Padam Modul
          </Button>
        </Card>
      )}

      {/* BORANG BORANG UTAMA */}
      {(borangMod === "create" || selectedLessonId) ? (
        <form onSubmit={handleSaveForm} className="space-y-6 animate-in fade-in duration-300">
          
          {/* SEC 1: ASAS */}
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5 border-b pb-2 uppercase text-[11px] tracking-wider text-indigo-600">
              <BookOpen className="w-4 h-4" /> 1. Parameter Teras & ID Misi
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">ID Sistem Unik Topik*</label>
                <input 
                  type="text" required placeholder="Contoh: topik-nombor-asas"
                  value={topicId} onChange={(e) => setTopicId(e.target.value)}
                  disabled={borangMod === "edit"} 
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-indigo-500 ${borangMod === "edit" ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200" : "bg-slate-50 border-slate-200"}`}
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tajuk Utama Modul Misi*</label>
                <input 
                  type="text" required placeholder="Contoh: Misi 1: Cabaran Banyak & Sedikit 🦖"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Subjek / Deskripsi Pendek</label>
                <input 
                  type="text" placeholder="Contoh: Matematik Tahun 1"
                  value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Ganjaran Koin</label>
                <input 
                  type="number" min={1} value={coinReward} onChange={(e) => setCoinReward(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-black text-amber-700 text-center focus:outline-amber-500"
                />
              </div>
            </div>
          </Card>

          {/* SEC 2: MEDIA */}
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5 border-b pb-2 uppercase text-[11px] tracking-wider text-indigo-600">
              <Video className="w-4 h-4" /> 2. Sumber Media Pengajaran & Infografik
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">URL Video YouTube Pengajaran*</label>
                <input 
                  type="url" required placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Image className="w-3.5 h-3.5" /> URL Gambar Infografik / Poster</label>
                <input 
                  type="url" placeholder="https://cloud-storage.com/nota-visual.png"
                  value={infographicUrl} onChange={(e) => setInfographicUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
                />
              </div>
            </div>
          </Card>

          {/* 🎯 DIKEMASKINI - SEC 3: NOTA RINGKAS BEBAS (PARAGRAPH MODE) */}
          <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5 border-b pb-1.5 uppercase text-[11px] tracking-wider text-indigo-600">
                📝 3. Kandungan Nota Pengajian Bebas
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Anda boleh menaip perenggan penuh, nota pendek, emoji, tanda baca, serta menggunakan baris baru (Enter).</p>
            </div>
            
            <div className="space-y-1">
              <textarea 
                rows={5}
                required
                placeholder="Tuliskan nota ringkas di sini. Contoh:&#13;• Nombor 1 hingga 5 dipanggil Nombor Asas.&#13;• Sentiasa mengira dari arah kiri ke kanan! 🦖"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500 shadow-inner"
              />
            </div>
          </Card>

          {/* SEC 4: KUIZ BERGAMBAR */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase text-[12px] tracking-wide">
                <HelpCircle className="w-4 h-4 text-purple-600" /> 4. Set Penyediaan Soalan Kuiz Mini Bergambar ({questions.length})
              </h3>
              <Button type="button" size="sm" onClick={handleAddQuestion} className="h-8 text-xs bg-purple-600 text-white hover:bg-purple-700 rounded-xl font-bold gap-1 shadow-xs">
                <Plus className="w-3.5 h-3.5" /> Tambah Soalan
              </Button>
            </div>

            {questions.map((q, qIndex) => (
              <Card key={qIndex} className="p-5 bg-white border border-purple-100/60 rounded-2xl shadow-xs space-y-4 relative">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full uppercase text-[10px]">Soalan #{qIndex + 1}</span>
                  {questions.length > 1 && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveQuestion(qIndex)} className="h-7 text-xs text-rose-500 hover:bg-rose-50 rounded-lg px-2">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Buang Soalan
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Ayat Soalan Kuiz *</label>
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
                  <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-purple-600" /> Kunci Jawapan Betul:</span>
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

          {/* AKSI SIMPAN DINAMIK */}
          <div className="pt-4 flex items-center justify-end border-t">
            <Button 
              type="submit" disabled={isSaving}
              className={`text-white font-black text-xs rounded-xl shadow-md px-6 h-10 gap-1.5 active:scale-[0.99] transition-transform ${borangMod === 'create' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {borangMod === "create" ? "Simpan & Kunci Modul Baru" : "Kemaskini Rekod Misi"}
            </Button>
          </div>

        </form>
      ) : (
        <Card className="p-8 text-center border-dashed border-2 border-slate-200 rounded-2xl bg-white">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Silakan pilih satu modul pengajian daripada menu pilihan di atas untuk mula menyunting.</p>
        </Card>
      )}

    </div>
  );
}

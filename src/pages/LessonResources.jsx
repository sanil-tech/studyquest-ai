import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { 
  BookOpen, Video, Image, HelpCircle, Plus, Trash2, Save, Sparkles, AlertCircle, ShieldAlert, Loader2 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export default function LessonResources() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 🔒 STATE KESELAMATAN (AUTH & ROLE GUARD)
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Spinner semasa simpan data

  // STATE DATA BORANG SUMBER PELAJARAN
  const [topicId, setTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [infographicUrl, setInfographicUrl] = useState("");
  const [coinReward, setCoinReward] = useState(50);
  
  // State Dinamik bagi Nota Ringkas (Array of Strings)
  const [notes, setNotes] = useState([""]);

  // State Dinamik bagi Soalan Kuiz Bergambar (Array of Objects)
  const [questions, setQuestions] = useState([
    {
      questionText: "",
      questionImageUrl: "", 
      options: ["", "", "", ""], 
      correctAnswer: "A" 
    }
  ]);

  // 🎯 PENGESAHAN IDENTITI PENTADBIR (ADMIN)
  useEffect(() => {
    const semakAksesAdmin = async () => {
      try {
        setCheckingAuth(true);
        const me = await base44.auth.me();

        if (!me) {
          throw new Error("Sesi tidak sah. Sila log masuk semula.");
        }

        // Memeriksa peranan pengguna daripada skema identiti sistem auth
        const peranan = me.app_role;
        const sahAdmin = peranan === "admin" || peranan === "teacher" || me.is_admin === true;

        if (sahAdmin) {
          setHasAccess(true);
        } else {
          toast({
            title: "Akses Disekat! 🛑",
            description: "Halaman ini dikunci eksklusif untuk peranan Pentadbir (Admin) sahaja.",
            variant: "destructive"
          });
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

  // --- URUSAN BARIS NOTA DINAMIK ---
  const handleAddNote = () => setNotes([...notes, ""]);
  const handleRemoveNote = (index) => setNotes(notes.filter((_, i) => i !== index));
  const handleNoteChange = (index, value) => {
    const updatedNotes = [...notes];
    updatedNotes[index] = value;
    setNotes(updatedNotes);
  };

  // --- URUSAN BANK SOALAN KUIZ BERGAMBAR ---
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", questionImageUrl: "", options: ["", "", "", ""], correctAnswer: "A" }
    ]);
  };
  const handleRemoveQuestion = (index) => setQuestions(questions.filter((_, i) => i !== index));
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };
  const handleOptionChange = (qIndex, optIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[optIndex] = value;
    setQuestions(updatedQuestions);
  };

  // --- 🚀 PENGHANTARAN & PENYELARASAN DATA KUIZ DENGAN QUIZPAGE.JSX ---
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!topicId || !title || !youtubeUrl) {
      toast({ 
        title: "Medan Diperlukan 🛑", 
        description: "Sila lengkapkan ID Unik, Tajuk Misi, dan Pautan YouTube.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSaving(true);
    try {
      // 🎯 SELARI: Susun array soalan mengikut format medan bahasa Inggeris tepat kehendak QuizPage.jsx
      const susunanSoalanKuiz = questions.map((q) => ({
        question: q.questionText.trim(),
        question_image_url: q.questionImageUrl.trim(), 
        options: q.options.map(opt => opt.trim()), // Array isi pilihan [A, B, C, D]
        correct_answer: q.correctAnswer.trim() // Nilai rentetan "A", "B", "C", atau "D"
      }));

      // 🎯 DIRECT DB INJECTION: Cipta rekod baru terus ke dalam jadual Quiz server
      await base44.entities.Quiz.create({
        id: topicId.trim().toLowerCase().replace(/\s+/g, "-"),
        topic_name: title.trim(),
        subject_name: subtitle.trim() || "Matematik", 
        video_url: youtubeUrl.trim(),
        infographic_url: infographicUrl.trim(),
        coins_reward: Number(coinReward),
        notes_json: JSON.stringify(notes.filter(n => n.trim() !== "")),
        questions_json: JSON.stringify(susunanSoalanKuiz) // Di-stringkan mengikut keperluan QuizPage
      });

      toast({
        title: "Sumber & Kuiz AI Berjaya Disimpan! 🚀",
        description: `Topik '${title}' kini aktif di database dan sedia diuji oleh murid menggunakan kanvas lukisan.`,
      });

      // Reset borang ke keadaan asal selepas berjaya disimpan
      setTopicId("");
      setTitle("");
      setSubtitle("");
      setYoutubeUrl("");
      setInfographicUrl("");
      setCoinReward(50);
      setNotes([""]);
      setQuestions([{ questionText: "", questionImageUrl: "", options: ["", "", "", ""], correctAnswer: "A" }]);

    } catch (err) {
      console.error("Gagal menyimpan data pelajaran ke database:", err);
      toast({
        title: "Ralat Simpanan Server ❌",
        description: err.message || "Gagal menyambung ke pangkalan data cloud. Sila semak RLS.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ⏳ 1. Skrin Memuatkan Pengesahan Identiti Peranan Admin
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Menyemak Kebenaran Pentadbir...</p>
      </div>
    );
  }

  // 🚨 2. Skrin Perlindungan: Jika Bukan Admin Cuba Ceroboh URL
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center space-y-3">
        <ShieldAlert className="w-12 h-12 text-rose-500 animate-bounce" />
        <h2 className="text-base font-black text-slate-800 uppercase">Akses Tidak Dibenarkan</h2>
        <p className="text-xs text-slate-500 max-w-xs">Anda perlu log masuk menggunakan akaun rasmi Pentadbir (Admin/Teacher) untuk mengubah suai kandungan modul.</p>
      </div>
    );
  }

  //  3. Paparan Utama Borang (Lepas Tapisan Keselamatan)
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 bg-slate-50/30 min-h-screen font-sans">
      
      {/* Pengepala Antaramuka Admin */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" /> Pengurusan Lesson Resources
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Hab pembangunan kurikulum: Muatkan pautan YouTube, poster infografik, dan set kuiz interaktif.</p>
        </div>
        <Badge className="bg-indigo-600 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full border-0 tracking-wider shadow-xs">
          🛡️ Admin Mode
        </Badge>
      </div>

      <form onSubmit={handleSubmitForm} className="space-y-6">
        
        {/* BLOK 1: DATA TERAS MODUL */}
        <Card className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5 border-b pb-2 uppercase text-[11px] tracking-wider text-indigo-600">
            <BookOpen className="w-4 h-4" /> 1. Parameter Teras & ID Misi
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">ID Sistem Unik Topik (Guna - )*</label>
              <input 
                type="text" required placeholder="Contoh: topik-nombor-asas"
                value={topicId} onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Tajuk Utama Modul Misi (Topic Name)*</label>
              <input 
                type="text" required placeholder="Contoh: Misi 1: Cabaran Operasi Tolak 🦖"
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Subjek / Deskripsi Pendek (Subject Name)</label>
              <input 
                type="text" placeholder="Contoh: Matematik Tahun 1"
                value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Ganjaran Koin Lulus</label>
              <input 
                type="number" min={1}
                value={coinReward} onChange={(e) => setCoinReward(e.target.value)}
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
                type="url" required placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Image className="w-3.5 h-3.5" /> URL Gambar Infografik / Poster Slide Nota</label>
              <input 
                type="url" placeholder="https://cloud-storage.com/infografik-nota-1.png"
                value={infographicUrl} onChange={(e) => setInfographicUrl(e.target.value)}
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
                  type="text" required placeholder={`Pengisian isi kandungan nota ringkas poin ke-${index + 1}`}
                  value={note} onChange={(e) => handleNoteChange(index, e.target.value)}
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
              <HelpCircle className="w-4 h-4 text-purple-600" /> 4. Set Penyediaan Soalan Kuiz Mini Bergambar ({questions.length})
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

              {/* Teks Soalan & Gambar Rajah Soalan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pertanyaan / Ayat Soalan Kuiz *</label>
                  <textarea 
                    rows={2} required placeholder="Contoh: Berapakah baki epal sekiranya Ali makan 3 daripada 10 biji epal?"
                    value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Image className="w-3 h-3" /> URL Gambar Soalan (Jika Ada)</label>
                  <input 
                    type="url" placeholder="https://web-storage.com/soalan-rajah.jpg"
                    value={q.questionImageUrl} onChange={(e) => handleQuestionChange(qIndex, "questionImageUrl", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-purple-500"
                  />
                </div>
              </div>

              {/* Pilihan Jawapan A, B, C, D */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilihan Jawapan Objektif:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {["A", "B", "C", "D"].map((label, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2 bg-slate-50/50 p-1.5 rounded-xl border border-slate-100">
                      <span className="w-6 h-6 rounded-lg bg-white border font-black text-xs text-slate-700 flex items-center justify-center shadow-2xs">
                        {label}
                      </span>
                      <input 
                        type="text" required placeholder={`Isi teks pilihan jawapan ${label}`}
                        value={q.options[optIndex]} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-purple-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Pemilihan Jawapan Betul */}
              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-purple-600" /> Kunci Jawapan Betul Bagi Soalan Di Atas:
                </span>
                <select
                  value={q.correctAnswer}
                  onChange={(e) => handleQuestionChange(qIndex, "correctAnswer", e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg text-xs font-black px-4 py-1 text-purple-700 focus:outline-purple-600 shadow-2xs cursor-pointer"
                >
                  <option value="A">Pilihan A</option>
                  <option value="B">Pilihan B</option>
                  <option value="C">Pilihan C</option>
                  <option value="D">Pilihan D</option>
                </select>
              </div>

            </Card>
          ))}
        </div>

        {/* PENYIMPANAN AKHIR */}
        <div className="pt-4 flex items-center justify-end border-t">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs rounded-xl shadow-md px-6 h-10 gap-1.5 active:scale-[0.99] transition-transform"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengunci Kandungan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Simpan & Kunci Sumber Pelajaran
              </>
            )}
          </Button>
        </div>

      </form>
    </div>
  );
}
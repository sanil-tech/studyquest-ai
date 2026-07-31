import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  BookOpen, Edit3, FileText, Crown, Loader2, LogOut, Brain, ClipboardList, TrendingUp, Plus, ArrowRight, Sparkles
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-black text-stone-800 mt-2">{value}</p>
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">{label}</p>
    </motion.div>
  );
}

function ToolCard({ icon: Icon, title, description, to, color, navigate }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
      onClick={() => navigate(to)}
      className={`group text-left bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-all w-full`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-stone-800">{title}</h3>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({ users: 0, topics: 0, lessons: 0, quizAttempts: 0 });
  const [recentLessons, setRecentLessons] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await base44.auth.me();
        setAdmin(me);
        if (me?.role !== "admin" && me?.app_role !== "admin") {
          toast({ title: "Akses Disekat", description: "Hanya pentadbir dibenarkan.", variant: "destructive" });
          navigate("/");
          return;
        }

        const [topics, lessons, quizzes] = await Promise.all([
          base44.entities.Topic.list().catch(() => []),
          base44.entities.Lesson.list().catch(() => []),
          base44.entities.Quiz.list().catch(() => []),
        ]);

        const sortedLessons = (quizzes || [])
          .sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0))
          .slice(0, 6);

        setStats({
          users: 0,
          topics: topics?.length || 0,
          lessons: lessons?.length || 0,
          quizAttempts: sortedLessons.length,
        });
        setRecentLessons(sortedLessons);
      } catch (err) {
        toast({ title: "Sesi Tamat", description: "Sila log masuk semula.", variant: "destructive" });
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await base44.auth.logout("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-stone-800">Panel Pentadbir</h1>
              <p className="text-xs text-stone-400">{admin?.full_name || admin?.email || "Admin"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log Keluar
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-black text-stone-800">Selamat datang, {admin?.full_name?.split(" ")[0] || "Pentadbir"}! 👋</h2>
          <p className="text-sm text-stone-500 mt-1">Urus kandungan pelajaran dan tetapan aplikasi dari sini.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={FileText} label="Topik" value={stats.topics} color="bg-blue-500" />
          <StatCard icon={BookOpen} label="Pelajaran" value={stats.lessons} color="bg-emerald-500" />
          <StatCard icon={ClipboardList} label="Modul Kuiz" value={stats.quizAttempts} color="bg-amber-500" />
          <StatCard icon={TrendingUp} label="Status" value="Aktif" color="bg-indigo-500" />
        </div>

        {/* Tools */}
        <div>
          <h3 className="text-sm font-black text-stone-700 mb-3 px-1">Alat Pengurusan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ToolCard
              icon={Sparkles}
              title="Content Studio (AI)"
              description="Jana, semak, dan terbitkan kandungan pelajaran dengan bantuan AI."
              to="/admin/content-studio"
              color="bg-gradient-to-br from-violet-500 to-purple-600"
              navigate={navigate}
            />
            <ToolCard
              icon={Plus}
              title="Cipta Kandungan Pelajaran"
              description="Tambah pelajaran baharu dengan video, nota, infografik, dan soalan kuiz."
              to="/admin/lesson-resources"
              color="bg-gradient-to-br from-emerald-500 to-teal-600"
              navigate={navigate}
            />
            <ToolCard
              icon={Edit3}
              title="Kemaskini Pelajaran"
              description="Edit atau padam pelajaran sedia ada dalam pangkalan data."
              to="/admin/edit-lesson"
              color="bg-gradient-to-br from-blue-500 to-indigo-600"
              navigate={navigate}
            />
            <ToolCard
              icon={FileText}
              title="Muat Naik Buku Teks"
              description="Import buku teks KSSR/KSSM untuk membina pangkalan pengetahuan."
              to="/admin/textbooks"
              color="bg-gradient-to-br from-amber-500 to-orange-600"
              navigate={navigate}
            />
            <ToolCard
              icon={Crown}
              title="Akses Premium"
              description="Urus akses premium untuk pengguna aplikasi."
              to="/admin/premium-access"
              color="bg-gradient-to-br from-purple-500 to-fuchsia-600"
              navigate={navigate}
            />
          </div>
        </div>

        {/* Recent Lessons */}
        {recentLessons.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-black text-stone-700">Pelajaran Terkini</h3>
              <button
                onClick={() => navigate("/admin/edit-lesson")}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                Lihat semua <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
              {recentLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => navigate("/admin/edit-lesson")}
                  className="w-full flex items-center gap-3 p-3.5 hover:bg-stone-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-800 truncate">{lesson.topic_name || "Tanpa nama"}</p>
                    <p className="text-xs text-stone-400 truncate">
                      {lesson.subject_name || "—"} · {lesson.difficulty || "medium"}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                    lesson.lesson_content_status === "published" ? "bg-emerald-50 text-emerald-600" :
                    lesson.lesson_content_status === "reviewed" ? "bg-blue-50 text-blue-600" :
                    lesson.lesson_content_status === "ai_generated" ? "bg-amber-50 text-amber-600" :
                    "bg-stone-100 text-stone-400"
                  }`}>
                    {lesson.lesson_content_status || "draft"}
                  </span>
                  <Edit3 className="w-4 h-4 text-stone-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
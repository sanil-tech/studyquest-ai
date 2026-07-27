import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Clock, Heart, BookOpen, Lightbulb, ChevronDown, Trophy, Star } from "lucide-react";

const TIP_CATEGORIES = [
  {
    id: "rewards",
    icon: Gift,
    title: "Sistem Ganjaran",
    subtitle: "Gunakan syiling emas dengan bijak",
    color: "from-amber-500 to-orange-500",
    tips: [
      { title: "Tetapkan Matlamat Bersama", body: "Duduk bersama anak anda dan tetapkan matlamat syiling yang realistik. Contohnya: 'Kumpul 50 syiling untuk ganjaran kecil, 200 syiling untuk ganjaran besar.'" },
      { title: "Ganjaran Bukan Material", body: "Tidak semua ganjaran perlu barang. Masa berkualiti bersama keluarga, pilihan filem malam, atau aktiviti kegemaran juga merupakan ganjaran yang berkesan." },
      { title: "Jangan Terlalu Mudah atau Susah", body: "Ganjaran yang terlalu mudah dicapai hilang motivasi. Yang terlalu susah pula membuat anak putus asa. Cari keseimbangan yang sesuai." },
      { title: "Konsisten dengan Pengesahan", body: "Luluskan permintaan ganjaran dengan cepat. Anak akan kehilangan semangat jika terlalu lama menunggu pengesahan." },
    ],
  },
  {
    id: "habits",
    icon: Clock,
    title: "Tabiat Belajar Konsisten",
    subtitle: "Bina rutin belajar yang berkekalan",
    color: "from-blue-500 to-indigo-500",
    tips: [
      { title: "Tetapkan Masa Belajar Tetap", body: "Pilih masa yang sama setiap hari untuk belajar, contohnya selepas Asar atau selepas makan malam. Konsistensi membina tabiat." },
      { title: "Sesi Pendek tetapi Kerap", body: "20-30 minit setiap sessi lebih berkesan daripada 2 jam sekali seminggu. Otak anak belajar lebih baik dalam tempoh pendek." },
      { title: "Rayakan Streak", body: "Apabila anak belajar 7 hari berturut-turut, raikan! Beri pujian dan kenalpasti ganjaran kecil untuk menggalakkan streak berterusan." },
      { title: "Hari Rehat yang Sihat", body: "Benarkan satu hari rehat seminggu untuk mengelakkan keletihan. Belajar berlebihan boleh membakar motivasi." },
    ],
  },
  {
    id: "motivation",
    icon: Heart,
    title: "Motivasi & Sokongan",
    subtitle: "Galakkan tanpa tekanan",
    color: "from-rose-500 to-pink-500",
    tips: [
      { title: "Puji Usaha, Bukan Skor", body: "Katakan 'Saya bangga kamu berusaha hari ini!' bukan 'Baguslah dapat 90 markah'. Ini membina mentaliti yang sihat terhadap pembelajaran." },
      { title: "Tanya tentang Pembelajaran", body: "Tanya 'Apa yang kamu belajar hari ini?' bukan 'Berapa markah kamu?'. Ini menunjukkan kamu menghargai proses belajar." },
      { title: "Elakkan Bandingkan", body: "Jangan bandingkan anak dengan rakan atau adik beradik. Setiap anak berkembang pada kadar yang berbeza." },
      { title: "Jadi Contoh", body: "Tunjukkan minat kepada pembelajaran sendiri. Anak meniru tingkah laku ibu bapa." },
    ],
  },
  {
    id: "screen",
    icon: BookOpen,
    title: "Pengurusan Skrin",
    subtitle: "Keseimbangan antara belajar dan rehat",
    color: "from-emerald-500 to-teal-500",
    tips: [
      { title: "Had Masa yang Jelas", body: "Tetapkan had masa penggunaan aplikasi, contohnya 30-45 minit setiap sessi. Gunakan pemasa jika perlu." },
      { title: "Kawal Suasana", body: "Pastikan anak belajar di tempat yang selesa, cukup cahaya, dan jauh dari gangguan seperti TV atau permainan." },
      { title: "Rehat Aktif", body: "Galakkan rehat yang aktif — berdiri, regang, atau jalan-jalan sebentar. Ini menyegarkan otak dan mata." },
      { title: "Tidur Cukup", body: "Pastikan anak tidur 8-10 jam setiap malam. Tidur yang cukup penting untuk pembelajaran dan ingatan." },
    ],
  },
  {
    id: "progress",
    icon: Trophy,
    title: "Memantau Kemajuan",
    subtitle: "Gunakan data dengan bijak",
    color: "from-violet-500 to-purple-500",
    tips: [
      { title: "Semak Laporan Mingguan", body: "Luangkan masa setiap minggu untuk menyemak laporan AI Insight. Ia membantu kamu faham kekuatan dan kelemahan anak." },
      { title: "Fokus pada Penambahbaikan", body: "Lihat trend skor dari masa ke masa, bukan satu skor sahaja. Peningkatan kecil tetapi konsisten lebih bernilai." },
      { title: "Kenalpasti Corak Belajar", body: "Perhatikan bila anak paling produktif — pagi atau petang? Susun jadual belajar mengikut corak ini." },
      { title: "Bercakap dengan Guru", body: "Kongsi maklumat kemajuan dari StudyQuest dengan guru sekolah untuk sokongan tambahan." },
    ],
  },
];

function TipCard({ tip }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 text-indigo-500 fill-indigo-400" />
          </div>
          <span className="font-bold text-slate-700 text-sm">{tip.title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 pl-15 text-sm text-slate-500 leading-relaxed">{tip.body}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ParentTips() {
  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-100 px-4 py-2 rounded-full mb-3">
          <Lightbulb className="w-5 h-5 text-indigo-600" />
          <span className="font-black text-indigo-700 text-sm uppercase tracking-wide">Tips Ibu Bapa</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-800">Panduan Ibu Bapa</h1>
        <p className="text-sm text-slate-500 mt-1">Tip praktikal untuk menyokong pembelajaran anak anda</p>
      </div>

      {/* Tip Categories */}
      {TIP_CATEGORIES.map((category, idx) => {
        const Icon = category.icon;
        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="space-y-3"
          >
            {/* Category Header */}
            <div className={`bg-gradient-to-r ${category.color} rounded-2xl p-4 text-white shadow-sm flex items-center gap-3`}>
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-black text-lg leading-tight">{category.title}</h2>
                <p className="text-white/80 text-xs">{category.subtitle}</p>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-2">
              {category.tips.map((tip, tipIdx) => (
                <TipCard key={tipIdx} tip={tip} />
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Footer note */}
      <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 text-center">
        <p className="text-sm text-indigo-700 font-bold">
          💡 Setiap anak unik — sesuaikan tip ini mengikut keperluan anak anda.
        </p>
      </div>
    </div>
  );
}
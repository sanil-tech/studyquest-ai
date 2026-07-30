// src/components/lesson/BlockRenderer.jsx
// Reusable Polymorphic Block Renderer for StudyQuest Learning Packages

import React, { useMemo } from "react";
import { personalize } from "@/lib/personalize";
import {
  Tv,
  BookOpen,
  Brain,
  Sparkles,
  Gamepad2,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

import Flashcards from "@/components/lesson/Flashcards";
import MindMap from "@/components/lesson/MindMap";

// ==========================================
// TEXT FORMATTING UTILITIES
// ==========================================
export const bersihkanTeksUntukSuara = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/\\n/g, "\n")
    .replace(/[#*>\-_`🔸]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const parseMarkdownToHTML = (text) => {
  if (!text) return "";
  const cleanText = String(text).replace(/\\n/g, "\n");
  const lines = cleanText.split("\n");
  let htmlOutput = [];

  lines.forEach((line) => {
    let trimmed = line.trim();
    if (trimmed === "") return;
    if (trimmed.startsWith("# ")) {
      htmlOutput.push(`<h1 class="text-base sm:text-lg font-black text-amber-300 my-3">${trimmed.replace("# ", "")}</h1>`);
      return;
    }
    if (trimmed.startsWith("## ")) {
      htmlOutput.push(`<h2 class="text-sm sm:text-base font-black text-lime-400 my-2">✨ ${trimmed.replace("## ", "")}</h2>`);
      return;
    }
    htmlOutput.push(`<p class="text-xs sm:text-sm text-stone-200 font-bold mb-2">${trimmed}</p>`);
  });

  return htmlOutput.join("\n").replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-amber-300">$1</strong>');
};

// ==========================================
// YOUTUBE VIDEO EMBED SUB-COMPONENT
// ==========================================
function YouTubeLesson({ videoUrl, onCompleted, isCompleted }) {
  const videoId = useMemo(() => {
    if (!videoUrl) return null;
    const match = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return (match && match[1].length === 11) ? match[1] : null;
  }, [videoUrl]);

  if (!videoId) {
    return (
      <div className="p-8 text-center bg-stone-900/80 border-2 border-dashed border-amber-500/40 rounded-3xl space-y-3">
        <p className="text-amber-200 font-black text-xs">🎬 Video taklimat belum disediakan untuk topik ini.</p>
        <Button className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl px-5 py-2.5" onClick={onCompleted}>
          Teruskan Misi! 🚀
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="relative aspect-video w-full rounded-3xl overflow-hidden border-2 border-stone-700 bg-black shadow-2xl">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
          className="w-full h-full border-0 absolute inset-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video Taklimat"
        />
      </div>

      <Button
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl h-11 border-b-4 border-emerald-700 active:translate-y-1 transition-all"
        onClick={onCompleted}
      >
        {isCompleted ? "Selesai Video ✓" : "Selesai & Ambil +10 XP 🔥"}
      </Button>
    </div>
  );
}

// ==========================================
// MAIN BLOCK RENDERER COMPONENT
// ==========================================
export default function BlockRenderer({
  block,
  studentName = "Pengembara",
  isSpeaking = false,
  onSpeak = () => {},
  onComplete = () => {}
}) {
  if (!block) return null;

  // Safely resolve payload (handles both pre-parsed JSON objects and raw JSON strings)
  const payload = typeof block.payload === "string"
    ? (() => { try { return JSON.parse(block.payload); } catch { return {}; } })()
    : (block.payload || {});

  switch (block.block_type) {
    case "TEXT_MARKDOWN":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" /> {block.title || "Nota Pengembaraan"}
            </h3>
            {payload.markdown && (
              <Button
                onClick={() => onSpeak(payload.markdown)}
                className={`h-9 px-3 rounded-xl font-black text-xs ${
                  isSpeaking ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-amber-400 hover:bg-amber-300 text-stone-950"
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4 mr-1" /> : <Volume2 className="w-4 h-4 mr-1" />}
                {isSpeaking ? "Berhenti" : "Dengar"}
              </Button>
            )}
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-4 bg-black/40 rounded-2xl border border-stone-800 text-xs sm:text-sm leading-relaxed font-bold space-y-3">
            {payload.image_url && (
              <img src={payload.image_url} alt="Illustration" className="w-full max-w-md mx-auto rounded-2xl mb-4 border border-stone-700" />
            )}
            <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(personalize(payload.markdown || "", studentName)) }} />
          </div>
          <Button
            onClick={onComplete}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-emerald-700 active:translate-y-1 transition-all"
          >
            Selesai Hadam Nota! 🎒
          </Button>
        </div>
      );

    case "VIDEO_EMBED":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
              <Tv className="w-5 h-5 text-emerald-400" /> {block.title || "Taklimat Video"}
            </h3>
          </div>
          <YouTubeLesson
            videoUrl={payload.youtube_url || payload.search_query}
            onCompleted={onComplete}
            isCompleted={false}
          />
        </div>
      );

    case "MIND_MAP":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" /> {block.title || "Peta Minda"}
            </h3>
          </div>
          <div className="p-4 bg-black/40 rounded-2xl border border-stone-800">
            <MindMap mindMap={{ central_topic: block.title || "Topik Utama", branches: payload.branches || [] }} />
          </div>
          <Button
            onClick={onComplete}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-emerald-700 active:translate-y-1 transition-all"
          >
            Selesai Peta Minda! 🧠
          </Button>
        </div>
      );

    case "FLASHCARD_DECK":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> {block.title || "Kad Kilat"}
            </h3>
          </div>
          <Flashcards flashcards={payload.cards || []} />
          <Button
            onClick={onComplete}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-emerald-700 active:translate-y-1 transition-all"
          >
            Selesai Kad Kilat! 🎴
          </Button>
        </div>
      );

    case "INTERACTIVE_GAME":
      return (
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3 text-left">
            <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-cyan-400" /> {block.title || "Permainan Edukatif"}
            </h3>
          </div>
          <div className="py-6 space-y-3">
            <span className="text-5xl">🎮</span>
            <p className="text-xs text-stone-300 font-bold">{payload.instructions || "Bermain sambil menguji kefahaman anda!"}</p>
          </div>
          <Button
            onClick={onComplete}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-emerald-700 active:translate-y-1 transition-all"
          >
            Selesai Permainan! 🎮
          </Button>
        </div>
      );

    case "INFOGRAPHIC":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-pink-400" /> {block.title || "Infografik"}
            </h3>
          </div>
          <div className="p-4 bg-black/40 rounded-2xl border border-stone-800 space-y-3">
            {payload.image_url && <img src={payload.image_url} alt="Infographic" className="max-h-[50vh] mx-auto rounded-xl" />}
            {payload.summary && <p className="text-xs text-stone-300 font-bold">{payload.summary}</p>}
          </div>
          <Button
            onClick={onComplete}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-emerald-700 active:translate-y-1 transition-all"
          >
            Selesai Infografik! 📊
          </Button>
        </div>
      );

    case "AUDIO_TTS":
      return (
        <div className="space-y-4 text-center">
          <h3 className="text-base font-black text-amber-300 flex items-center justify-center gap-2">
            <Volume2 className="w-5 h-5 text-cyan-400" /> {block.title || "Audio Pengajaran"}
          </h3>
          <p className="text-xs text-stone-300 font-bold">{payload.voice_script}</p>
          {payload.audio_url && <audio controls src={payload.audio_url} className="mx-auto" />}
          <Button
            onClick={onComplete}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-base rounded-2xl border-b-4 border-emerald-700 active:translate-y-1 transition-all"
          >
            Selesai Audio! 🎧
          </Button>
        </div>
      );

    default:
      return (
        <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl text-center space-y-2">
          <HelpCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-xs font-bold text-stone-300">Blok Kandungan Tidak Dikenali ({block.block_type})</p>
          <Button onClick={onComplete} variant="outline" className="text-xs text-stone-200 border-stone-700">
            Langkah Seterusnya
          </Button>
        </div>
      );
  }
}

import { Loader2, Volume2 } from "lucide-react";

export default function TTSButton({ loading, audioUrl, onPlay, label = "Dengar Soalan" }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-stone-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Sedang sediakan audio...
      </div>
    );
  }
  if (!audioUrl) return null;
  return (
    <button
      onClick={onPlay}
      className="flex items-center gap-2 bg-blue-500/20 border-2 border-blue-400/40 text-blue-300 font-black px-4 py-2.5 rounded-2xl text-sm active:scale-95 transition-all"
    >
      <Volume2 className="w-4 h-4" /> {label}
    </button>
  );
}
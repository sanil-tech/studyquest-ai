import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VoicePlayer({ text, language = "auto" }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState(null);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [audio]);

  const generateSpeech = async () => {
    if (audioUrl) {
      togglePlay();
      return;
    }

    setLoading(true);
    try {
      const result = await base44.integrations.Core.GenerateSpeech({
        text: text.substring(0, 5000),
        voice: "spark",
        language_code: language === "ms" ? "ms" : undefined,
      });
      setAudioUrl(result.url);
      const newAudio = new Audio(result.url);
      newAudio.onended = () => setPlaying(false);
      setAudio(newAudio);
      newAudio.play();
      setPlaying(true);
    } catch (err) {
      console.error("Speech generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={generateSpeech}
        disabled={loading}
        className="rounded-full h-9 px-3"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : playing ? (
          <VolumeX className="w-4 h-4 text-primary" />
        ) : (
          <Volume2 className="w-4 h-4 text-primary" />
        )}
        <span className="ml-1 text-xs font-medium">
          {loading ? "Generating..." : playing ? "Playing" : "Listen"}
        </span>
      </Button>
    </div>
  );
}
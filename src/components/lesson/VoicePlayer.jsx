import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const numberToMalayWords = (num) => {
  const ones = ["sifar", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "lapan", "sembilan"];
  const teens = ["sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas", "tujuh belas", "lapan belas", "sembilan belas"];
  const tens = ["", "", "dua puluh", "tiga puluh", "empat puluh", "lima puluh", "enam puluh", "tujuh puluh", "lapan puluh", "sembilan puluh"];
  
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    return (hundreds === 1 ? "seratus" : ones[hundreds] + " ratus") + (remainder > 0 ? " " + numberToMalayWords(remainder) : "");
  }
  if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return numberToMalayWords(thousands) + " ribu" + (remainder > 0 ? " " + numberToMalayWords(remainder) : "");
  }
  return num.toString();
};

const preprocessText = (text, language) => {
  let processed = text;
  // Remove symbols and special characters but keep letters, numbers, spaces, and basic punctuation
  processed = processed.replace(/[^\w\s.,!?;:'"()-]/g, "");
  // Convert numbers to words for Malay
  if (language === "ms") {
    processed = processed.replace(/\b(\d+)\b/g, (match, num) => {
      const number = parseInt(num, 10);
      return numberToMalayWords(number);
    });
  }
  return processed;
};

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
      const processedText = preprocessText(text, language);
      const result = await base44.integrations.Core.GenerateSpeech({
        text: processedText.substring(0, 5000),
        voice: "honey",
        language_code: language === "ms" ? "ms" : "en",
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
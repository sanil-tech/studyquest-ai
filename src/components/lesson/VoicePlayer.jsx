import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Volume2, VolumeX, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

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

const VOICE_OPTIONS = [
  { id: "honey", name: "Cikgu Female", type: "female", description: "Warm, soft teacher voice" },
  { id: "river", name: "Cikgu Male", type: "male", description: "Calm, neutral voice" },
  { id: "sunny", name: "Cartoon Bright", type: "cartoon", description: "Energetic, upbeat" },
  { id: "spark", name: "Cartoon Quick", type: "cartoon", description: "Fast, playful" },
];

export default function VoicePlayer({ text, language = "auto" }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(() => {
    return localStorage.getItem("voicePreference") || "honey";
  });
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [audio]);

  const generateSpeech = async (voiceOverride) => {
    if (audioUrl) {
      togglePlay();
      return;
    }

    setLoading(true);
    try {
      const processedText = preprocessText(text, language);
      const voice = voiceOverride || selectedVoice;
      const result = await base44.integrations.Core.GenerateSpeech({
        text: processedText.substring(0, 5000),
        voice,
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

  const handleVoiceSelect = (voiceId) => {
    setSelectedVoice(voiceId);
    localStorage.setItem("voicePreference", voiceId);
    setAudioUrl(null); // Clear cached audio to regenerate with new voice
    setVoiceDialogOpen(false);
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

  const currentVoice = VOICE_OPTIONS.find(v => v.id === selectedVoice);

  return (
    <div className="flex items-center gap-2">
      <Dialog open={voiceDialogOpen} onOpenChange={setVoiceDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full h-9 px-3 mr-1"
          >
            <Mic className="w-4 h-4 text-muted-foreground" />
            <span className="ml-1 text-xs font-medium">{currentVoice?.name || "Voice"}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold">Choose Voice</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {VOICE_OPTIONS.map((voice) => (
              <Card
                key={voice.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedVoice === voice.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
                onClick={() => handleVoiceSelect(voice.id)}
              >
                <div className="text-sm font-semibold mb-1">{voice.name}</div>
                <div className="text-xs text-muted-foreground">{voice.description}</div>
                <div className="text-xs text-primary mt-2 capitalize">{voice.type}</div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Button
        size="sm"
        variant="outline"
        onClick={() => generateSpeech()}
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
import { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Loads and plays diagnostic TTS audio.
 * @param {string} questionId
 * @param {string} textToSpeak
 * @param {boolean} autoPlay - if true, plays audio automatically once loaded (for non-readers)
 */
export function useDiagnosticAudio(questionId, textToSpeak, autoPlay = false) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    if (!questionId || !textToSpeak) {
      setLoading(false);
      return;
    }

    const loadAudio = async () => {
      try {
        const res = await base44.functions.invoke("getDiagnosticAudio", {
          question_id: questionId,
          target_text: textToSpeak,
        });
        if (!cancelled && res.data?.success && res.data.audio_url) {
          setAudioUrl(res.data.audio_url);
          if (autoPlay) {
            // Small delay so UI settles before audio kicks in
            setTimeout(() => {
              if (!cancelled) {
                const audio = new Audio(res.data.audio_url);
                audioRef.current = audio;
                audio.play().catch(() => {});
              }
            }, 400);
          }
        }
      } catch (err) {
        console.error("Audio load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAudio();
    return () => { cancelled = true; };
  }, [questionId, textToSpeak, autoPlay]);

  const playAudio = useCallback(() => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play().catch((err) => console.error("Audio play error:", err));
    }
  }, [audioUrl]);

  return { audioUrl, loading, playAudio };
}
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export default function Celebration({ active }) {
  const playedRef = useRef(false);

  useEffect(() => {
    if (!active || playedRef.current) return;
    playedRef.current = true;

    // --- Fireworks confetti ---
    const duration = 3000;
    const end = Date.now() + duration;

    const fire = () => {
      confetti({
        particleCount: 80,
        spread: 100,
        startVelocity: 45,
        origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.3 + 0.1 },
        colors: ["#fbbf24", "#f97316", "#ec4899", "#8b5cf6", "#22c55e", "#3b82f6"],
      });
      if (Date.now() < end) requestAnimationFrame(fire);
    };

    // Initial burst
    confetti({
      particleCount: 150,
      spread: 120,
      startVelocity: 55,
      origin: { y: 0.5 },
      colors: ["#fbbf24", "#f97316", "#ec4899", "#8b5cf6", "#22c55e", "#3b82f6"],
    });
    fire();

    // --- Cheer/clap sound via Web Audio API ---
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Clap sounds — short noise bursts with fast decay
      const playClap = (delay) => {
        const t0 = ctx.currentTime + delay;
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1500;
        filter.Q.value = 1.5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(t0);
      };

      // Cheering "whistle" — rising sine sweep
      const playWhistle = () => {
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, t0);
        osc.frequency.exponentialRampToValueAtTime(1800, t0 + 0.3);
        gain.gain.setValueAtTime(0.15, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.4);
      };

      // Stagger claps to simulate a crowd cheering
      const clapPattern = [0, 0.12, 0.22, 0.33, 0.44, 0.55, 0.66, 0.78, 0.9, 1.0, 1.1, 1.2];
      clapPattern.forEach((d) => playClap(d));
      playWhistle();
    } catch {
      // AudioContext not available — silently skip
    }
  }, [active]);

  return null;
}
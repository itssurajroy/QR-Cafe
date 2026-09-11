"use client";

/**
 * useAudioTone — Web Audio API tone player
 * Extracted from MenuClient.tsx and PosClient.tsx
 * Provides a single reusable audio feedback function across all pages.
 */

import { useCallback } from "react";

export type AudioToneType = "add" | "order" | "notify" | "alert" | "success" | "statusChange" | "newOrder";

interface ToneConfig {
  frequency: number;
  frequency2?: number;
  type: OscillatorType;
  gain: number;
  duration: number;
}

const TONE_CONFIGS: Record<AudioToneType, ToneConfig> = {
  add: {
    frequency: 660,
    frequency2: 880,
    type: "sine",
    gain: 0.15,
    duration: 0.25,
  },
  order: {
    frequency: 440,
    frequency2: 660,
    type: "triangle",
    gain: 0.3,
    duration: 0.4,
  },
  newOrder: {
    frequency: 587, // D5 chime
    frequency2: 880, // A5 bell
    type: "triangle",
    gain: 0.35,
    duration: 0.5,
  },
  notify: {
    frequency: 523,
    frequency2: 784,
    type: "triangle",
    gain: 0.2,
    duration: 0.5,
  },
  alert: {
    frequency: 300,
    frequency2: 200,
    type: "sawtooth",
    gain: 0.25,
    duration: 0.6,
  },
  success: {
    frequency: 523,
    frequency2: 784,
    type: "sine",
    gain: 0.2,
    duration: 0.5,
  },
  statusChange: {
    frequency: 523,
    frequency2: 784,
    type: "triangle",
    gain: 0.2,
    duration: 0.5,
  },
};

export function useAudioTone() {
  const playAudioTone = useCallback((type: AudioToneType = "notify") => {
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const cfg = TONE_CONFIGS[type];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = cfg.type;
      osc.frequency.setValueAtTime(cfg.frequency, ctx.currentTime);
      if (cfg.frequency2) {
        osc.frequency.setValueAtTime(cfg.frequency2, ctx.currentTime + cfg.duration * 0.5);
      }

      gain.gain.setValueAtTime(cfg.gain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cfg.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + cfg.duration);

      // Clean up context after tone
      osc.onended = () => {
        setTimeout(() => ctx.close(), 100);
      };
    } catch {
      // AudioContext blocked or unavailable — silent fail
    }
  }, []);

  /**
   * playRushAlert — alert tone plus physical vibration for high-priority
   * Rush orders. Vibration is guarded: unsupported browsers just get audio.
   */
  const playRushAlert = useCallback(() => {
    playAudioTone("alert");
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch {
      // Vibration unsupported or blocked — audio already played.
    }
  }, [playAudioTone]);

  return { playAudioTone, playRushAlert };
}

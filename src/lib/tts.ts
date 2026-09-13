// Copyright (c) 2026 QRslice. All rights reserved.
/**
 * Human-Tone Web Text-To-Speech (TTS) Engine for QRslice
 * Enhances standard Web Speech API with natural voice selection,
 * warm pitch/cadence tuning, and humanized announcement phrasing.
 */

// Cached voice reference for instant speech execution
let cachedVoice: SpeechSynthesisVoice | null = null;

/**
 * Finds the highest quality, most natural human voice available in the user's browser.
 * Prioritizes Neural/Natural Google, Microsoft, and Apple natural voices (en-IN, en-US, en-GB).
 */
export function getHumanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  if (cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1st Priority: Natural Indian English Voices (Best for Indian Café POS/KDS)
  const indianNatural = voices.find(
    (v) =>
      v.lang.startsWith("en-IN") &&
      (v.name.includes("Natural") ||
        v.name.includes("Neerja") ||
        v.name.includes("Rishi") ||
        v.name.includes("Google") ||
        v.name.includes("Veena"))
  );
  if (indianNatural) {
    cachedVoice = indianNatural;
    return indianNatural;
  }

  // 2nd Priority: Premium Natural / Neural Voices (Google / Microsoft Natural / Apple Enhanced)
  const premiumNatural = voices.find(
    (v) =>
      (v.name.includes("Natural") ||
        v.name.includes("Neural") ||
        v.name.includes("Google") ||
        v.name.includes("Enhanced") ||
        v.name.includes("Premium") ||
        v.name.includes("Jenny") ||
        v.name.includes("Guy") ||
        v.name.includes("Samantha") ||
        v.name.includes("Serena")) &&
      v.lang.startsWith("en")
  );
  if (premiumNatural) {
    cachedVoice = premiumNatural;
    return premiumNatural;
  }

  // 3rd Priority: Any English Voice
  const englishVoice = voices.find((v) => v.lang.startsWith("en"));
  if (englishVoice) {
    cachedVoice = englishVoice;
    return englishVoice;
  }

  cachedVoice = voices[0];
  return voices[0];
}

// Pre-load voices on browser initialization
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    getHumanVoice();
  };
}

/**
 * Transforms robotic technical status messages into warm, natural human speech.
 */
export function formatHumanPhrase(text: string): string {
  if (!text) return "";

  let phrase = text.trim();

  // Common KDS & POS announcement replacements
  phrase = phrase
    .replace(/^New order arrived in kitchen queue$/i, "Attention kitchen team! A new order has just arrived.")
    .replace(/^Kitchen queue updated$/i, "Kitchen queue has been updated.")
    .replace(/^High priority rush order flagged$/i, "Attention! A high priority rush order has been flagged for the kitchen.")
    .replace(/^Ticket number (\d+) recalled to queue$/i, "Ticket number $1 has been recalled back to the prep queue.")
    .replace(/^Table (\d+) order number (\d+) is ready to serve$/i, "Order number $2 for Table $1 is now ready for service!")
    .replace(/^Table (\w+) needs Water!$/i, "Staff assistance needed! Table $1 has requested fresh water.")
    .replace(/^Table (\w+) needs Bill!$/i, "Staff assistance needed! Table $1 has requested the final bill.")
    .replace(/^Table (\w+) called Waiter!$/i, "Waiter requested at Table $1.");

  // Add warm natural cadence period if missing
  if (!/[.!?]$/.test(phrase)) {
    phrase += ".";
  }

  return phrase;
}

/**
 * Speaks the text with a warm, natural human tone.
 */
export function speakHumanVoice(rawText: string, options?: { pitch?: number; rate?: number; volume?: number }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  try {
    const text = formatHumanPhrase(rawText);
    if (!text) return;

    window.speechSynthesis.cancel(); // Stop current speech to prevent overlapping

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getHumanVoice();

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    // Warm human acoustic tuning (0.96 rate + 1.02 pitch produces a conversational, friendly voice)
    utterance.rate = options?.rate ?? 0.96;
    utterance.pitch = options?.pitch ?? 1.02;
    utterance.volume = options?.volume ?? 1.0;

    // Small delay ensures speechSynthesis.cancel() finishes cleanly
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 40);
  } catch {
    /* ignore TTS exceptions */
  }
}


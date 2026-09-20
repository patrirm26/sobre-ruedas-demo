import { useCallback, useEffect, useState } from 'react';

/** Las voces de es-* suelen leer "$" como "pesos" (heurística fija de motor,
 * no configurable) — acá se lo decimos explícito en el texto antes de
 * hablarlo, sin tocar lo que se ve escrito en el chat. También se limpian
 * los emojis, que muchos motores intentan deletrear ("marca de verificación
 * pesada"). */
function toSpeakableText(text: string): string {
  // El grupo numérico exige dígitos después de cada "," o "." (separador de
  // miles/decimales real) — así no se traga una coma de puntuación de la
  // frase que venga pegada al monto (ej. "Bs 35.000,00, más...").
  return text
    .replace(/\$\s*(\d+(?:[.,]\d+)*)/g, '$1 dólares')
    .replace(/\bBs\.?\s*(\d+(?:[.,]\d+)*)/gi, '$1 bolívares')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .trim();
}

/** Lectura en voz alta de las respuestas del Copilot (Web Speech API,
 * `speechSynthesis` — nativo del navegador, sin backend ni credenciales). */
export function useSpeechSynthesis(lang = 'es-VE') {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(toSpeakableText(text));
      utterance.lang = lang;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [lang, supported]
  );

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  // Corta la lectura si el componente se desmonta mientras habla (ej. se cierra el drawer).
  useEffect(() => stop, [stop]);

  return { speak, stop, speaking, supported };
}

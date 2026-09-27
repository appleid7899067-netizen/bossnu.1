import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน",
  "service-not-allowed": "เบราว์เซอร์ไม่อนุญาตให้ใช้การพิมพ์ด้วยเสียง",
  "no-speech": "ไม่ได้ยินเสียงพูด ลองอีกครั้งนะคะ",
  "audio-capture": "ไม่พบไมโครโฟน",
  network: "การรู้จำเสียงต้องใช้อินเทอร์เน็ต",
};

/**
 * Push-to-talk dictation via the Web Speech API. `onText` receives the full
 * transcript for this session (final + interim) so the caller can merge it
 * with whatever was typed before dictation started.
 */
export function useDictation(onText: (transcript: string) => void, onError?: (message: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  const onErrorRef = useRef(onError);
  onTextRef.current = onText;
  onErrorRef.current = onError;

  useEffect(() => {
    setSupported(recognitionCtor() !== null);
    return () => recognition.current?.abort();
  }, []);

  const stop = useCallback(() => {
    recognition.current?.stop();
  }, []);

  const start = useCallback((lang = "th-TH") => {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      onErrorRef.current?.("เบราว์เซอร์นี้ยังไม่รองรับการพิมพ์ด้วยเสียง");
      return;
    }
    recognition.current?.abort();
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = "";
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      onTextRef.current((finalText + interim).trim());
    };
    rec.onerror = (event) => {
      if (event.error !== "aborted") onErrorRef.current?.(ERROR_MESSAGES[event.error] ?? "การพิมพ์ด้วยเสียงหยุดทำงาน");
    };
    rec.onend = () => {
      setListening(false);
      if (recognition.current === rec) recognition.current = null;
    };
    recognition.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      onErrorRef.current?.("เริ่มการพิมพ์ด้วยเสียงไม่สำเร็จ");
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, start, stop, toggle };
}

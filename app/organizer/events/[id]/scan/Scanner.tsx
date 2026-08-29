"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Keyboard,
  RotateCcw,
  XCircle,
} from "lucide-react";

type Result = {
  ok: boolean;
  code: string;
  message: string;
  ticketType?: string;
  eventTitle?: string;
};

export default function Scanner({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const [camera, setCamera] = useState(false);
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [hint, setHint] = useState(
    "Tik op Camera starten en richt op de QR-code.",
  );

  function stopCamera() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCamera(false);
  }

  useEffect(() => () => stopCamera(), []);

  async function submitCode(code: string) {
    if (busyRef.current || !code.trim()) return;
    busyRef.current = true;
    try {
      const response = await fetch("/api/organizer/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, code }),
      });
      const body = await response.json();
      setResult(body);
      if (body.ok) stopCamera();
    } catch {
      setResult({
        ok: false,
        code: "network",
        message: "Geen verbinding. Controleer internet en probeer opnieuw.",
      });
    } finally {
      busyRef.current = false;
    }
  }

  async function startCamera() {
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia)
      return setHint(
        "Deze browser geeft geen cameratoegang. Gebruik handmatige invoer.",
      );
    const Detector = (window as any).BarcodeDetector;
    if (!Detector)
      return setHint(
        "QR-herkenning wordt niet ondersteund in deze browser. Gebruik Chrome op Android of handmatige invoer.",
      );
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamera(true);
      setHint("Scanner actief — houd de QR-code binnen het vlak.");
      const detector = new Detector({ formats: ["qr_code"] });
      timerRef.current = window.setInterval(async () => {
        if (
          !videoRef.current ||
          busyRef.current ||
          videoRef.current.readyState < 2
        )
          return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) await submitCode(codes[0].rawValue);
        } catch {}
      }, 450);
    } catch {
      setHint(
        "Cameratoegang geweigerd. Sta camera toe in je browserinstellingen of voer de code handmatig in.",
      );
    }
  }

  function manualSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    void submitCode(manual);
  }

  if (result)
    return (
      <section
        className={`rounded-[2rem] border p-7 text-center ${result.ok ? "border-[#b8ff5a]/40 bg-[#b8ff5a]/10" : "border-red-400/40 bg-red-500/10"}`}
      >
        {result.ok ? (
          <CheckCircle2 size={72} className="mx-auto text-[#b8ff5a]" />
        ) : (
          <XCircle size={72} className="mx-auto text-red-400" />
        )}
        <h2 className="mt-5 text-3xl font-black">{result.message}</h2>
        {result.ticketType && (
          <p className="mt-3 text-white/60">{result.ticketType}</p>
        )}
        <button
          onClick={() => {
            setResult(null);
            setManual("");
            void startCamera();
          }}
          className="btn-primary mt-7 inline-flex items-center gap-2"
        >
          <RotateCcw size={18} /> Volgende ticket
        </button>
      </section>
    );

  return (
    <div className="grid gap-5">
      <section className="relative aspect-[3/4] max-h-[620px] overflow-hidden rounded-[2rem] border border-white/10 bg-black sm:aspect-video">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        {!camera && (
          <div className="absolute inset-0 grid place-items-center text-white/25">
            <CameraOff size={72} />
          </div>
        )}
        {camera && (
          <div className="pointer-events-none absolute inset-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-3xl border-4 border-[#b8ff5a] shadow-[0_0_0_999px_rgba(0,0,0,.4)]" />
        )}
      </section>
      <p className="text-center text-sm text-white/50">{hint}</p>
      <div className="flex justify-center">
        {camera ? (
          <button
            onClick={stopCamera}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <CameraOff size={18} /> Camera stoppen
          </button>
        ) : (
          <button
            onClick={startCamera}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Camera size={18} /> Camera starten
          </button>
        )}
      </div>
      <details className="card rounded-2xl">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-5 font-black">
          <Keyboard size={18} className="text-[#b8ff5a]" /> Code handmatig
          invoeren
        </summary>
        <form
          onSubmit={manualSubmit}
          className="flex gap-3 border-t border-white/10 p-5"
        >
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            className="support-input min-w-0 flex-1"
            placeholder="Plak QR-link of code"
          />
          <button className="btn-primary">Controleren</button>
        </form>
      </details>
    </div>
  );
}

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Camera, CheckCircle2, ExternalLink, ImagePlus, Loader2, PauseCircle, PlayCircle, RotateCcw, Search, ScanLine, ShieldCheck, Sparkles, XCircle } from 'lucide-react'
import { bestScannerValue, type CardScannerResult } from '@/lib/card-scanner'

type ScanStatus = 'idle' | 'camera' | 'scanning' | 'unsupported' | 'error'
type ScanZone = 'top' | 'bottom' | 'full'

type BrowserTextDetector = new () => { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> }
type BrowserBarcodeDetector = new (options?: { formats?: string[] }) => { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> }
type TesseractWorkerLike = {
  recognize: (image: HTMLCanvasElement) => Promise<{ data?: { text?: string } }>
  setParameters?: (parameters: Record<string, string>) => Promise<void>
  terminate: () => Promise<void>
}

type BrowserTesseract = {
  createWorker?: (language?: string) => Promise<TesseractWorkerLike>
  recognize?: (image: HTMLCanvasElement, language?: string, options?: Record<string, unknown>) => Promise<{ data?: { text?: string } }>
}

declare global {
  interface Window {
    TextDetector?: BrowserTextDetector
    BarcodeDetector?: BrowserBarcodeDetector
    Tesseract?: BrowserTesseract
  }
}

function euro(value: number) {
  if (!value) return '—'
  return `€${Number(value || 0).toFixed(2)}`
}

function cleanDetectedText(value: string) {
  return String(value || '')
    .split(/[\n\r]+/)
    .map((line) => line.replace(/\s+/g, ' ').replace(/[^a-zA-Z0-9À-ÿ .:/#'’\-]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

function normalizeForScanner(value: string) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9/#\- ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function shortText(value: string, max = 180) {
  const clean = value.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max)}…` : clean
}

function findCollectorNumber(value: string) {
  const raw = String(value || '')
  const fraction = raw.match(/\b([A-Z]{0,5}\s*\d{1,3}[a-z]?)\s*[\/／]\s*(\d{1,3})\b/i)
  if (fraction?.[0]) return fraction[0].replace(/\s+/g, '')
  const promo = raw.match(/\b([A-Z]{2,6}\s*[- ]?\s*\d{1,3})\b/i)
  if (promo?.[1]) return promo[1].replace(/\s+/g, '')
  return ''
}

function likelyNameLine(topText: string, fullText = '') {
  const ignore = /\b(hp|ps|pv|basic|basis|stage|fase|evolves|evolution|trainer|supporter|item|stadium|energy|ability|attack|weakness|resistance|retreat|illustrator|illus|nintendo|creatures|gamefreak|copyright)\b/i
  const lines = `${topText}\n${fullText}`
    .split(/[\n\r]+/)
    .map((line) => line.replace(/\b\d{2,3}\s*(hp|ps|pv)\b/ig, '').replace(/[•·]/g, ' ').trim())
    .map((line) => line.replace(/^[#\s]+/, '').replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 3 && line.length <= 34)
    .filter((line) => !ignore.test(line))
    .filter((line) => /[a-zA-ZÀ-ÿ]{3,}/.test(line))

  const ranked = lines
    .map((line, index) => {
      let score = 20 - index
      if (/\b(ex|gx|v|vmax|vstar|radiant|trainer|prism|delta)\b/i.test(line)) score += 4
      if (/\d/.test(line)) score -= 3
      if (line.split(' ').length > 5) score -= 5
      return { line, score }
    })
    .sort((a, b) => b.score - a.score)

  return ranked[0]?.line || ''
}

function buildSmartQuery(parts: { top: string; bottom: string; full: string }) {
  const name = likelyNameLine(parts.top, parts.full)
  const number = findCollectorNumber(`${parts.bottom}\n${parts.full}`)
  const bottomWords = parts.bottom
    .split(/[\n\r]+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 2 && line.length <= 32)
    .slice(0, 2)
    .join(' ')

  const query = [name, number || bottomWords].filter(Boolean).join(' ').trim()
  if (query.length >= 3) return query
  return cleanDetectedText(`${parts.top}\n${parts.bottom}\n${parts.full}`).slice(0, 140)
}

function sameScanCandidate(a: string, b: string) {
  const one = normalizeForScanner(a)
  const two = normalizeForScanner(b)
  if (!one || !two) return false
  if (one === two) return true
  return one.includes(two) || two.includes(one)
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function preprocessCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
    const boosted = Math.max(0, Math.min(255, (gray - 118) * 1.55 + 145))
    data[i] = boosted
    data[i + 1] = boosted
    data[i + 2] = boosted
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

export default function CardScannerClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const autoScanTimerRef = useRef<number | null>(null)
  const ocrWorkerRef = useRef<Promise<TesseractWorkerLike | null> | null>(null)
  const ocrScriptRef = useRef<Promise<BrowserTesseract | null> | null>(null)
  const autoScanBusyRef = useRef(false)
  const stableCandidateRef = useRef({ text: '', count: 0 })
  const lastAutoSearchAtRef = useRef(0)
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [query, setQuery] = useState('')
  const [detectedText, setDetectedText] = useState('')
  const [results, setResults] = useState<CardScannerResult[]>([])
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [autoScan, setAutoScan] = useState(true)
  const [message, setMessage] = useState('Start de camera. Zodra een kaart in beeld komt, analyseert hij automatisch bovenkant naam + onderkant kaartnummer.')

  const canUseCamera = useMemo(() => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia), [])
  const hasDeviceRecognition = typeof window !== 'undefined' && Boolean(window.TextDetector || window.BarcodeDetector)

  useEffect(() => () => {
    stopCamera()
    if (ocrWorkerRef.current) {
      void ocrWorkerRef.current.then((worker) => worker?.terminate()).catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void searchCards(query)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    if (status !== 'camera' || !autoScan) {
      stopAutoScanLoop()
      return
    }
    startAutoScanLoop()
    return () => stopAutoScanLoop()
  }, [status, autoScan])

  async function loadTesseractFromCdn() {
    if (typeof window === 'undefined') return null
    if (window.Tesseract) return window.Tesseract
    if (!ocrScriptRef.current) {
      setOcrLoading(true)
      ocrScriptRef.current = new Promise<BrowserTesseract | null>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-asorta-tesseract]')
        if (existing) {
          existing.addEventListener('load', () => resolve(window.Tesseract || null), { once: true })
          existing.addEventListener('error', () => reject(new Error('OCR-script kon niet worden geladen.')), { once: true })
          return
        }
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
        script.async = true
        script.defer = true
        script.crossOrigin = 'anonymous'
        script.dataset.asortaTesseract = 'true'
        script.onload = () => resolve(window.Tesseract || null)
        script.onerror = () => reject(new Error('OCR-script kon niet worden geladen. Handmatig zoeken blijft beschikbaar.'))
        document.head.appendChild(script)
      }).finally(() => setOcrLoading(false))
    }
    return ocrScriptRef.current
  }

  async function getOcrWorker() {
    if (!ocrWorkerRef.current) {
      setOcrLoading(true)
      ocrWorkerRef.current = loadTesseractFromCdn()
        .then(async (tesseract) => {
          if (!tesseract?.createWorker) return null
          const worker = await tesseract.createWorker('eng')
          await worker.setParameters?.({
            tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789éÉèÈáÁàÀöÖüÜ'’:-/# .",
            preserve_interword_spaces: '1',
          })
          return worker
        })
        .finally(() => setOcrLoading(false))
    }
    return ocrWorkerRef.current
  }

  async function searchCards(value: string) {
    const q = value.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`/api/card-scanner?q=${encodeURIComponent(q)}&external=1`, { cache: 'no-store' })
      const payload = await response.json()
      const nextResults = Array.isArray(payload.results) ? payload.results : []
      setResults(nextResults)
      if (payload.error) setMessage(payload.error)
      else if (!nextResults.length) setMessage('Nog geen match. Houd de bovenkant én onderkant scherp in beeld of typ kaartnaam + nummer.')
      else {
        const external = Number(payload.externalCount || 0)
        const local = Number(payload.localCount || 0)
        setMessage(`${nextResults.length} match${nextResults.length === 1 ? '' : 'es'} gevonden (${local} ASORTA, ${external} externe bronnen). Controleer variant, taal en conditie.`)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Zoeken mislukt.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  async function startCamera() {
    if (!canUseCamera) {
      setStatus('unsupported')
      setMessage('Deze browser geeft geen camera-toegang. Gebruik handmatig zoeken of upload een foto.')
      return
    }
    try {
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('camera')
      setAutoScan(true)
      setMessage(hasDeviceRecognition ? 'Camera actief. Hij scant automatisch naam bovenaan en nummer onderaan.' : 'Camera actief. Lokale browser-OCR wordt geladen; hij scant daarna automatisch zonder knop.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Camera kon niet worden geopend.')
    }
  }

  function stopCamera() {
    stopAutoScanLoop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    autoScanBusyRef.current = false
  }

  function startAutoScanLoop() {
    stopAutoScanLoop()
    void captureAndScan({ automatic: true })
    autoScanTimerRef.current = window.setInterval(() => {
      void captureAndScan({ automatic: true })
    }, hasDeviceRecognition ? 1200 : 2300)
  }

  function stopAutoScanLoop() {
    if (autoScanTimerRef.current) {
      window.clearInterval(autoScanTimerRef.current)
      autoScanTimerRef.current = null
    }
  }

  function drawZone(zone: ScanZone) {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return null
    const sourceWidth = video.videoWidth
    const sourceHeight = video.videoHeight
    const crop = zone === 'top'
      ? { x: sourceWidth * 0.06, y: sourceHeight * 0.03, w: sourceWidth * 0.88, h: sourceHeight * 0.27 }
      : zone === 'bottom'
        ? { x: sourceWidth * 0.06, y: sourceHeight * 0.66, w: sourceWidth * 0.88, h: sourceHeight * 0.31 }
        : { x: sourceWidth * 0.04, y: sourceHeight * 0.02, w: sourceWidth * 0.92, h: sourceHeight * 0.96 }

    const targetWidth = zone === 'full' ? 900 : 1200
    const targetHeight = Math.max(160, Math.round((crop.h / crop.w) * targetWidth))
    const canvas = makeCanvas(targetWidth, targetHeight)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.filter = 'contrast(1.25) brightness(1.08) saturate(0.9)'
    ctx.drawImage(video, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height)
    ctx.filter = 'none'
    return preprocessCanvas(canvas)
  }

  function drawFileZones(image: HTMLImageElement) {
    const sourceWidth = image.naturalWidth
    const sourceHeight = image.naturalHeight
    const draw = (zone: ScanZone) => {
      const crop = zone === 'top'
        ? { x: sourceWidth * 0.06, y: sourceHeight * 0.03, w: sourceWidth * 0.88, h: sourceHeight * 0.27 }
        : zone === 'bottom'
          ? { x: sourceWidth * 0.06, y: sourceHeight * 0.66, w: sourceWidth * 0.88, h: sourceHeight * 0.31 }
          : { x: sourceWidth * 0.04, y: sourceHeight * 0.02, w: sourceWidth * 0.92, h: sourceHeight * 0.96 }
      const targetWidth = zone === 'full' ? 1000 : 1300
      const targetHeight = Math.max(180, Math.round((crop.h / crop.w) * targetWidth))
      const canvas = makeCanvas(targetWidth, targetHeight)
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.filter = 'contrast(1.25) brightness(1.08) saturate(0.9)'
      ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height)
      ctx.filter = 'none'
      return preprocessCanvas(canvas)
    }
    return { top: draw('top'), bottom: draw('bottom'), full: draw('full') }
  }

  async function recognizeCanvas(canvas: HTMLCanvasElement | null) {
    if (!canvas) return ''
    const snippets: string[] = []
    if (window.TextDetector) {
      const detector = new window.TextDetector()
      const textBlocks = await detector.detect(canvas)
      snippets.push(...textBlocks.map((block) => block.rawValue || '').filter(Boolean))
    }
    if (window.BarcodeDetector) {
      const detector = new window.BarcodeDetector()
      const codes = await detector.detect(canvas)
      snippets.push(...codes.map((code) => code.rawValue || '').filter(Boolean))
    }
    if (!snippets.length) {
      const worker = await getOcrWorker()
      if (worker) {
        const result = await worker.recognize(canvas)
        snippets.push(result.data?.text || '')
      } else {
        const tesseract = await loadTesseractFromCdn()
        const result = await tesseract?.recognize?.(canvas, 'eng')
        snippets.push(result?.data?.text || '')
      }
    }
    return cleanDetectedText(snippets.join('\n'))
  }

  function maybeAutoCommitQuery(nextQuery: string, rawText: string, automatic?: boolean) {
    const cleanQuery = cleanDetectedText(nextQuery).replace(/\n+/g, ' ').trim()
    if (cleanQuery.length < 3) return

    const previous = stableCandidateRef.current
    if (sameScanCandidate(previous.text, cleanQuery)) {
      previous.count += 1
      previous.text = cleanQuery
    } else {
      previous.text = cleanQuery
      previous.count = 1
    }

    const hasNumber = Boolean(findCollectorNumber(cleanQuery))
    const stableEnough = previous.count >= 2 || hasNumber || !automatic
    const cooledDown = Date.now() - lastAutoSearchAtRef.current > 2400
    setDetectedText(rawText)

    if (stableEnough && cooledDown) {
      lastAutoSearchAtRef.current = Date.now()
      setQuery(cleanQuery)
      if (automatic) setMessage(`Automatisch geanalyseerd: ${shortText(cleanQuery, 100)}`)
    } else if (automatic) {
      setMessage(`Kaart gezien, analyseert naam/nummer… ${shortText(cleanQuery, 80)}`)
    }
  }

  async function scanZones(zones: { top: HTMLCanvasElement | null; bottom: HTMLCanvasElement | null; full: HTMLCanvasElement | null }, options: { automatic?: boolean } = {}) {
    if (!zones.top && !zones.bottom && !zones.full) return
    if (!options.automatic) setStatus('scanning')
    try {
      const [top, bottom, full] = await Promise.all([
        recognizeCanvas(zones.top),
        recognizeCanvas(zones.bottom),
        recognizeCanvas(zones.full),
      ])
      const parts = { top, bottom, full }
      const rawText = cleanDetectedText(`Bovenkant:\n${top}\n\nOnderkant:\n${bottom}\n\nVolledig:\n${full}`)
      const smartQuery = buildSmartQuery(parts)
      if (!smartQuery || smartQuery.length < 3) {
        if (!options.automatic) {
          setDetectedText(rawText)
          setMessage('Geen bruikbare kaartnaam of kaartnummer herkend. Zorg voor licht, rechte kaart en scherp beeld.')
        }
        setStatus('camera')
        return
      }
      maybeAutoCommitQuery(smartQuery, rawText, options.automatic)
      setStatus('camera')
    } catch (error) {
      if (!options.automatic) {
        setStatus('unsupported')
        setMessage(error instanceof Error ? error.message : 'Automatische herkenning mislukt. Handmatig zoeken blijft beschikbaar.')
      }
    }
  }

  async function captureAndScan(options: { automatic?: boolean } = {}) {
    if (autoScanBusyRef.current && options.automatic) return
    autoScanBusyRef.current = true
    try {
      const zones = { top: drawZone('top'), bottom: drawZone('bottom'), full: drawZone('full') }
      if (!zones.top && !zones.bottom && !zones.full) {
        if (!options.automatic) setMessage('Kon geen camerabeeld vastleggen. Probeer opnieuw of upload een foto.')
        return
      }
      await scanZones(zones, options)
    } finally {
      autoScanBusyRef.current = false
    }
  }

  async function scanUploadedFile(file: File | undefined) {
    if (!file) return
    const image = new Image()
    image.onload = async () => {
      await scanZones(drawFileZones(image), { automatic: false })
      URL.revokeObjectURL(image.src)
    }
    image.src = URL.createObjectURL(file)
  }

  return <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
    <section className="rounded-[2rem] border border-white/10 bg-white/[.045] p-4 shadow-[0_24px_90px_rgba(0,0,0,.28)] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-[#b7c8ad]">Automatische scanner</p>
          <h2 className="mt-2 text-2xl font-black">Scan kaartwaarde live</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={startCamera} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-black transition hover:-translate-y-0.5"><Camera size={16}/> Camera</button>
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"><ImagePlus size={16}/> Foto</button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => void scanUploadedFile(event.target.files?.[0])}/>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/55">
        <div className="relative aspect-[4/3] w-full">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover"/>
          {status !== 'camera' && status !== 'scanning' && <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,rgba(183,200,173,.16),transparent_45%)] p-6 text-center">
            <div>
              <ScanLine className="mx-auto mb-3 text-[#b7c8ad]" size={42}/>
              <p className="text-lg font-black">Camera-preview</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/55">Start de camera. Zodra een kaart in frame komt scant hij automatisch bovenkant en onderkant.</p>
            </div>
          </div>}
          <div className="pointer-events-none absolute left-6 right-6 top-6 rounded-2xl border border-[#b7c8ad]/60 bg-[#b7c8ad]/10 p-3 text-center text-[11px] font-black uppercase tracking-[.18em] text-[#e9f7e2] shadow-[0_0_35px_rgba(183,200,173,.35)]">Naamzone: houd de kaartnaam hier scherp</div>
          <div className="pointer-events-none absolute bottom-6 left-6 right-6 rounded-2xl border border-[#f4d58d]/60 bg-[#f4d58d]/10 p-3 text-center text-[11px] font-black uppercase tracking-[.18em] text-[#fff4ce] shadow-[0_0_35px_rgba(244,213,141,.25)]">Nummerzone: setnummer onderaan in beeld</div>
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-[#b7c8ad]/70 shadow-[0_0_30px_rgba(183,200,173,.8)]"/>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden"/>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setAutoScan((value) => !value)} disabled={status !== 'camera'} className="inline-flex items-center gap-2 rounded-full bg-[#b7c8ad] px-5 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-45">
          {autoScan ? <PauseCircle size={16}/> : <PlayCircle size={16}/>} {autoScan ? 'Auto-scan pauzeren' : 'Auto-scan starten'}
        </button>
        <button type="button" onClick={() => void captureAndScan({ automatic: false })} disabled={status !== 'camera'} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-45">
          {status === 'scanning' || ocrLoading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} Scan nu
        </button>
        <button type="button" onClick={() => { stopCamera(); setStatus('idle'); setAutoScan(false) }} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/65 transition hover:bg-white/10 hover:text-white"><RotateCcw size={16}/> Stop/reset</button>
      </div>

      <label className="mt-5 grid gap-2">
        <span className="text-xs font-black uppercase tracking-[.22em] text-white/40">Automatisch herkend of handmatig corrigeren</span>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18}/>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bijv. Charizard ex 199/165, Pikachu 025/025..." className="w-full rounded-2xl border border-white/10 bg-black/50 py-4 pl-12 pr-4 font-bold text-white outline-none transition placeholder:text-white/25 focus:border-[#b7c8ad]"/>
        </div>
      </label>

      {detectedText && <div className="mt-4 max-h-52 overflow-auto rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 p-4 text-sm text-[#e6f2df]"><strong>Analyse:</strong> <span className="whitespace-pre-wrap">{shortText(detectedText, 520)}</span></div>}
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm leading-6 text-white/55">
        {loading || ocrLoading ? <Loader2 className="mt-1 shrink-0 animate-spin text-[#b7c8ad]" size={18}/> : results.length ? <CheckCircle2 className="mt-1 shrink-0 text-[#b7c8ad]" size={18}/> : <XCircle className="mt-1 shrink-0 text-white/35" size={18}/>}<span>{ocrLoading ? 'OCR wordt op je apparaat geladen via de browser. Dit gebruikt geen npm-package in de build, geen token en geen externe AI-limiet.' : message}</span>
      </div>
    </section>

    <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025))] p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-white/35">ASORTA + Pokemonkaart.nl</p>
          <h2 className="mt-2 text-2xl font-black">Matches</h2>
        </div>
        <ShieldCheck className="text-[#b7c8ad]"/>
      </div>

      {!results.length ? <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-black/25 p-6 text-sm leading-6 text-white/55">
        Nog geen kaart gevonden. Houd de kaart recht in beeld: naam bovenaan, kaartnummer/setnummer onderaan. De scanner gebruikt ASORTA-data, Pokemonkaart.nl-prijsdata en TCGdex als fallback.
      </div> : <div className="grid gap-3">
        {results.map((item) => {
          const value = bestScannerValue(item)
          return <article key={item.id} className="grid grid-cols-[88px_1fr] gap-4 rounded-[1.35rem] border border-white/10 bg-black/35 p-3">
            <img src={item.image} alt="" className="h-28 w-[88px] rounded-2xl object-cover ring-1 ring-white/10"/>
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black">{item.name}</h3>
                  <p className="mt-1 text-xs font-black uppercase tracking-[.16em] text-white/35">{item.setName || item.conditionLabel || 'Variant controleren'} {item.localId ? `• #${item.localId}` : item.category ? `• ${item.category}` : ''}</p>
                </div>
                <div className="rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 px-3 py-2 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#dbe9d4]/75">{value.label}</p>
                  <p className="text-xl font-black text-[#f4ffef]">{euro(value.value)}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-white/58 sm:grid-cols-3">
                <Info label="Bron" value={item.marketSource || (item.source === 'tcgdex' ? 'TCGdex' : 'Handmatig')}/>
                <Info label="Rarity" value={item.rarity || item.conditionLabel || '—'}/>
                <Info label="Voorraad" value={item.source === 'asorta' ? String(item.inventoryTotal || item.inventoryOnline || item.inventoryMarket || 0) : 'Extern'}/>
              </div>
              {item.cardmarketUpdatedAt && <p className="mt-2 text-xs text-white/40">Cardmarket-prijs bijgewerkt: {new Date(item.cardmarketUpdatedAt).toLocaleDateString('nl-NL')}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {item.slug && <Link href={`/product/${item.slug}`} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs font-black text-white/65 transition hover:bg-white/10 hover:text-white">Product <ExternalLink size={13}/></Link>}
                {item.cardmarketUrl && <a href={item.cardmarketUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs font-black text-white/65 transition hover:bg-white/10 hover:text-white">{item.source === 'pokemonkaart' ? 'Pokemonkaart openen' : 'Bron controleren'} <ExternalLink size={13}/></a>}
              </div>
            </div>
          </article>
        })}
      </div>}
    </section>
  </div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[.035] px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/35">{label}</p><p className="mt-1 truncate font-black text-white/82">{value}</p></div>
}

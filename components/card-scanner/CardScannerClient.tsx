'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Camera, CheckCircle2, ExternalLink, ImagePlus, Loader2, PauseCircle, PlayCircle, RotateCcw, Search, ScanLine, ShieldCheck, Sparkles, XCircle } from 'lucide-react'
import { bestScannerValue, type CardScannerResult } from '@/lib/card-scanner'

type ScanStatus = 'idle' | 'camera' | 'scanning' | 'unsupported' | 'error'

type BrowserTextDetector = new () => { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> }
type BrowserBarcodeDetector = new (options?: { formats?: string[] }) => { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> }

declare global {
  interface Window {
    TextDetector?: BrowserTextDetector
    BarcodeDetector?: BrowserBarcodeDetector
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

function shortText(value: string, max = 180) {
  const clean = value.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max)}…` : clean
}

export default function CardScannerClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const autoScanTimerRef = useRef<number | null>(null)
  const lastAutoTextRef = useRef('')
  const lastAutoSearchAtRef = useRef(0)
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [query, setQuery] = useState('')
  const [detectedText, setDetectedText] = useState('')
  const [results, setResults] = useState<CardScannerResult[]>([])
  const [loading, setLoading] = useState(false)
  const [autoScan, setAutoScan] = useState(true)
  const [message, setMessage] = useState('Start de camera. De scanner zoekt daarna automatisch zonder knop; handmatig typen blijft als fallback werken.')

  const canUseCamera = useMemo(() => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia), [])
  const hasDeviceRecognition = typeof window !== 'undefined' && Boolean(window.TextDetector || window.BarcodeDetector)

  useEffect(() => () => stopCamera(), [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void searchCards(query)
    }, 350)
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
      else if (!nextResults.length) setMessage('Nog geen match. Houd de kaartnaam bovenin scherp in beeld of typ kaartnaam + setnummer.')
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
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('camera')
      setAutoScan(true)
      setMessage(hasDeviceRecognition ? 'Camera actief. Automatische herkenning loopt; richt vooral op de kaartnaam en het nummer.' : 'Camera actief, maar deze browser ondersteunt geen ingebouwde tekst/barcodeherkenning. Upload een foto of typ handmatig.')
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
  }

  function startAutoScanLoop() {
    stopAutoScanLoop()
    if (!hasDeviceRecognition) return
    autoScanTimerRef.current = window.setInterval(() => {
      void captureAndScan({ automatic: true })
    }, 1500)
  }

  function stopAutoScanLoop() {
    if (autoScanTimerRef.current) {
      window.clearInterval(autoScanTimerRef.current)
      autoScanTimerRef.current = null
    }
  }

  function drawVideoToCanvas() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return false
    const sourceWidth = video.videoWidth
    const sourceHeight = video.videoHeight
    const cropY = Math.floor(sourceHeight * 0.02)
    const cropHeight = Math.floor(sourceHeight * 0.58)
    canvas.width = sourceWidth
    canvas.height = cropHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    ctx.filter = 'contrast(1.18) saturate(1.05)'
    ctx.drawImage(video, 0, cropY, sourceWidth, cropHeight, 0, 0, canvas.width, canvas.height)
    ctx.filter = 'none'
    return true
  }

  async function scanCanvas(options: { automatic?: boolean } = {}) {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!window.TextDetector && !window.BarcodeDetector) {
      if (!options.automatic) {
        setStatus('unsupported')
        setMessage('Automatische herkenning wordt door deze browser niet ondersteund. Handmatig zoeken of foto-upload blijft beschikbaar.')
      }
      return
    }

    if (!options.automatic) setStatus('scanning')
    try {
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
      const text = cleanDetectedText(snippets.join('\n'))
      const comparable = text.toLowerCase().replace(/\s+/g, ' ').trim()
      if (!text || comparable.length < 3) {
        if (!options.automatic) {
          setDetectedText('')
          setMessage('Geen tekst herkend. Richt op de kaartnaam of typ kaartnaam + setnummer.')
        }
        setStatus('camera')
        return
      }

      const now = Date.now()
      const changedEnough = comparable !== lastAutoTextRef.current
      const cooledDown = now - lastAutoSearchAtRef.current > 2600
      setDetectedText(text)
      if (!options.automatic || (changedEnough && cooledDown)) {
        lastAutoTextRef.current = comparable
        lastAutoSearchAtRef.current = now
        setQuery(text)
        if (options.automatic) setMessage(`Automatisch herkend: ${shortText(text, 100)}`)
      }
      setStatus('camera')
    } catch {
      if (!options.automatic) {
        setStatus('unsupported')
        setMessage('Automatische herkenning wordt door deze browser niet ondersteund. Handmatig zoeken blijft beschikbaar.')
      }
    }
  }

  async function captureAndScan(options: { automatic?: boolean } = {}) {
    if (!drawVideoToCanvas()) {
      if (!options.automatic) setMessage('Kon geen camerabeeld vastleggen. Probeer opnieuw of upload een foto.')
      return
    }
    await scanCanvas(options)
  }

  async function scanUploadedFile(file: File | undefined) {
    if (!file) return
    const canvas = canvasRef.current
    if (!canvas) return
    const image = new Image()
    image.onload = async () => {
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.filter = 'contrast(1.15) saturate(1.05)'
      ctx.drawImage(image, 0, 0)
      ctx.filter = 'none'
      await scanCanvas({ automatic: false })
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
              <p className="mt-2 max-w-md text-sm leading-6 text-white/55">Start de camera. Daarna scant hij automatisch; je hoeft niet meer op herkennen te drukken.</p>
            </div>
          </div>}
          <div className="pointer-events-none absolute left-6 right-6 top-8 rounded-2xl border border-[#b7c8ad]/55 bg-[#b7c8ad]/5 p-3 text-center text-[11px] font-black uppercase tracking-[.18em] text-[#e9f7e2] shadow-[0_0_35px_rgba(183,200,173,.35)]">Houd kaartnaam + nummer in dit vlak</div>
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-[#b7c8ad]/70 shadow-[0_0_30px_rgba(183,200,173,.8)]"/>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden"/>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setAutoScan((value) => !value)} disabled={status !== 'camera'} className="inline-flex items-center gap-2 rounded-full bg-[#b7c8ad] px-5 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-45">
          {autoScan ? <PauseCircle size={16}/> : <PlayCircle size={16}/>} {autoScan ? 'Auto-scan pauzeren' : 'Auto-scan starten'}
        </button>
        <button type="button" onClick={() => void captureAndScan({ automatic: false })} disabled={status !== 'camera'} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-45">
          {status === 'scanning' ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} Scan nu
        </button>
        <button type="button" onClick={() => { stopCamera(); setStatus('idle'); setAutoScan(false) }} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/65 transition hover:bg-white/10 hover:text-white"><RotateCcw size={16}/> Stop/reset</button>
      </div>

      <label className="mt-5 grid gap-2">
        <span className="text-xs font-black uppercase tracking-[.22em] text-white/40">Automatisch herkend of handmatig corrigeren</span>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18}/>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bijv. Charizard 199/165, Obsidian Flames, Pikachu..." className="w-full rounded-2xl border border-white/10 bg-black/50 py-4 pl-12 pr-4 font-bold text-white outline-none transition placeholder:text-white/25 focus:border-[#b7c8ad]"/>
        </div>
      </label>

      {detectedText && <div className="mt-4 rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 p-4 text-sm text-[#e6f2df]"><strong>Herkende tekst:</strong> <span className="whitespace-pre-wrap">{shortText(detectedText, 260)}</span></div>}
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm leading-6 text-white/55">
        {loading ? <Loader2 className="mt-1 shrink-0 animate-spin text-[#b7c8ad]" size={18}/> : results.length ? <CheckCircle2 className="mt-1 shrink-0 text-[#b7c8ad]" size={18}/> : <XCircle className="mt-1 shrink-0 text-white/35" size={18}/>}<span>{message}</span>
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
        Nog geen kaart gevonden. Start de camera en houd de bovenkant van de kaart scherp in beeld. De scanner gebruikt ASORTA-data, Pokemonkaart.nl-prijsdata en TCGdex als fallback.
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

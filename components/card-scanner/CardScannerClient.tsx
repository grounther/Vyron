'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Camera, CheckCircle2, ExternalLink, ImagePlus, Loader2, RotateCcw, Search, ScanLine, ShieldCheck, Sparkles, XCircle } from 'lucide-react'
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
  return `€${Number(value || 0).toFixed(2)}`
}

function cleanDetectedText(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z0-9À-ÿ .:/#'’\-]+/g, ' ')
    .trim()
}

export default function CardScannerClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [query, setQuery] = useState('')
  const [detectedText, setDetectedText] = useState('')
  const [results, setResults] = useState<CardScannerResult[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Richt je camera op de kaartnaam, setnaam of nummer. Je kunt ook gewoon typen; dat blijft altijd werken.')

  const canUseCamera = useMemo(() => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia), [])
  const hasDeviceText = typeof window !== 'undefined' && Boolean(window.TextDetector || window.BarcodeDetector)

  useEffect(() => () => stopCamera(), [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void searchCards(query)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [query])

  async function searchCards(value: string) {
    const q = value.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`/api/card-scanner?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
      const payload = await response.json()
      setResults(Array.isArray(payload.results) ? payload.results : [])
      if (payload.error) setMessage(payload.error)
      else if (!payload.results?.length) setMessage('Geen match gevonden. Probeer kaartnaam + setnummer, of voeg deze kaart eerst toe aan Atlas producten/pricing.')
      else setMessage(`${payload.results.length} mogelijke match${payload.results.length === 1 ? '' : 'es'} gevonden.`)
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('camera')
      setMessage(hasDeviceText ? 'Camera actief. Maak een scan; tekstherkenning gebeurt op je eigen apparaat.' : 'Camera actief. Deze browser ondersteunt geen ingebouwde tekstherkenning; gebruik foto/manual fallback.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Camera kon niet worden geopend.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  function drawVideoToCanvas() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return false
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return true
  }

  async function scanCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    setStatus('scanning')
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
      const text = cleanDetectedText(snippets.join(' '))
      if (!text) {
        setStatus('camera')
        setDetectedText('')
        setMessage('Geen tekst herkend. Typ de kaartnaam/setcode handmatig; die fallback werkt altijd.')
        return
      }
      setDetectedText(text)
      setQuery(text)
      setStatus('camera')
    } catch {
      setStatus('unsupported')
      setMessage('Automatische herkenning wordt door deze browser niet ondersteund. Handmatig zoeken blijft beschikbaar.')
    }
  }

  async function captureAndScan() {
    if (!drawVideoToCanvas()) {
      setMessage('Kon geen camerabeeld vastleggen. Probeer opnieuw of upload een foto.')
      return
    }
    await scanCanvas()
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
      ctx.drawImage(image, 0, 0)
      await scanCanvas()
      URL.revokeObjectURL(image.src)
    }
    image.src = URL.createObjectURL(file)
  }

  return <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
    <section className="rounded-[2rem] border border-white/10 bg-white/[.045] p-4 shadow-[0_24px_90px_rgba(0,0,0,.28)] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-[#b7c8ad]">Scanner zonder externe API</p>
          <h2 className="mt-2 text-2xl font-black">Scan of zoek een kaart</h2>
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
              <p className="mt-2 max-w-md text-sm leading-6 text-white/55">Gebruik de camera, upload een foto of zoek direct op kaartnaam. Er is geen betaalde AI/OCR-token nodig.</p>
            </div>
          </div>}
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-[#b7c8ad]/70 shadow-[0_0_30px_rgba(183,200,173,.8)]"/>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden"/>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={captureAndScan} disabled={status !== 'camera'} className="inline-flex items-center gap-2 rounded-full bg-[#b7c8ad] px-5 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-45">
          {status === 'scanning' ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} Herken kaarttekst
        </button>
        <button type="button" onClick={() => { stopCamera(); setStatus('idle') }} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/65 transition hover:bg-white/10 hover:text-white"><RotateCcw size={16}/> Stop/reset</button>
      </div>

      <label className="mt-5 grid gap-2">
        <span className="text-xs font-black uppercase tracking-[.22em] text-white/40">Kaartnaam, setcode, nummer of SKU</span>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18}/>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bijv. Charizard 199/165, Obsidian Flames, Pikachu..." className="w-full rounded-2xl border border-white/10 bg-black/50 py-4 pl-12 pr-4 font-bold text-white outline-none transition placeholder:text-white/25 focus:border-[#b7c8ad]"/>
        </div>
      </label>

      {detectedText && <div className="mt-4 rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 p-4 text-sm text-[#e6f2df]"><strong>Herkende tekst:</strong> {detectedText}</div>}
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm leading-6 text-white/55">
        {loading ? <Loader2 className="mt-1 shrink-0 animate-spin text-[#b7c8ad]" size={18}/> : results.length ? <CheckCircle2 className="mt-1 shrink-0 text-[#b7c8ad]" size={18}/> : <XCircle className="mt-1 shrink-0 text-white/35" size={18}/>}<span>{message}</span>
      </div>
    </section>

    <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025))] p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-white/35">Waarde uit ASORTA database</p>
          <h2 className="mt-2 text-2xl font-black">Matches</h2>
        </div>
        <ShieldCheck className="text-[#b7c8ad]"/>
      </div>

      {!results.length ? <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-black/25 p-6 text-sm leading-6 text-white/55">
        Nog geen kaart gevonden. De scanner gebruikt je eigen product- en pricingdata. Voeg losse kaarten toe in Atlas en vul `market_value`/Cardmarket paste in voor de beste waardes.
      </div> : <div className="grid gap-3">
        {results.map((item) => {
          const value = bestScannerValue(item)
          return <article key={item.id} className="grid grid-cols-[88px_1fr] gap-4 rounded-[1.35rem] border border-white/10 bg-black/35 p-3">
            <img src={item.image} alt="" className="h-28 w-[88px] rounded-2xl object-cover ring-1 ring-white/10"/>
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black">{item.name}</h3>
                  <p className="mt-1 text-xs font-black uppercase tracking-[.16em] text-white/35">{item.conditionLabel || 'Conditie onbekend'} {item.category ? `• ${item.category}` : ''}</p>
                </div>
                <div className="rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 px-3 py-2 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#dbe9d4]/75">{value.label}</p>
                  <p className="text-xl font-black text-[#f4ffef]">{euro(value.value)}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-white/58 sm:grid-cols-3">
                <Info label="Webshop" value={euro(item.price)}/>
                <Info label="Voorraad" value={String(item.inventoryTotal || item.inventoryOnline || item.inventoryMarket || 0)}/>
                <Info label="Bron" value={item.marketSource || 'Handmatig'}/>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.slug && <Link href={`/product/${item.slug}`} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs font-black text-white/65 transition hover:bg-white/10 hover:text-white">Product <ExternalLink size={13}/></Link>}
                {item.cardmarketUrl && <a href={item.cardmarketUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs font-black text-white/65 transition hover:bg-white/10 hover:text-white">Cardmarket <ExternalLink size={13}/></a>}
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

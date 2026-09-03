'use client'

import { LoaderCircle, MapPin, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import InfoTip from '@/components/InfoTip'

type Suggestion = { id: string; name: string; municipality?: string | null; province?: string | null }

export default function LocationPicker({ initialLocations = [] }: { initialLocations?: string[] }) {
  const [locations, setLocations] = useState(() => [...new Set(initialLocations.map((value) => value.trim()).filter(Boolean))])
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [focused, setFocused] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const value = query.trim()
    if (value.length < 2) { setSuggestions([]); setLoading(false); setUnavailable(false); return }
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true); setUnavailable(false)
      try {
        const response = await fetch(`/api/locations?q=${encodeURIComponent(value)}`, { signal: controller.signal })
        const payload = await response.json()
        setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : [])
        setUnavailable(Boolean(payload.unavailable))
        setActiveIndex(-1)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') { setSuggestions([]); setUnavailable(true) }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query])

  function addLocation(name: string) {
    const clean = name.trim().slice(0, 100)
    if (clean.length < 2 || locations.length >= 12) return
    setLocations((current) => current.some((item) => item.toLocaleLowerCase('nl-NL') === clean.toLocaleLowerCase('nl-NL')) ? current : [...current, clean])
    setQuery(''); setSuggestions([]); setActiveIndex(-1); setUnavailable(false)
  }

  const canAddManually = query.trim().length >= 2 && !suggestions.some((item) => item.name.toLocaleLowerCase('nl-NL') === query.trim().toLocaleLowerCase('nl-NL'))
  const optionCount = suggestions.length + (canAddManually ? 1 : 0)

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && optionCount) { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, optionCount - 1)) }
    if (event.key === 'ArrowUp' && optionCount) { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)) }
    if (event.key === 'Escape') { setSuggestions([]); setActiveIndex(-1) }
    if (event.key === 'Enter' && query.trim().length >= 2) {
      event.preventDefault()
      const selected = activeIndex >= 0 && activeIndex < suggestions.length ? suggestions[activeIndex].name : query.trim()
      addLocation(selected)
    }
  }

  return <div>
    <div className="mb-2 flex items-center justify-between gap-3">
      <label htmlFor="location-search" className="text-sm font-bold text-white/70">Plaats of gemeente <span className="text-[#b8ff5a]">*</span></label>
      <InfoTip text="Kies minimaal één woonplaats. Typ twee letters en selecteer een officiële plaatsnaam. Je kunt maximaal twaalf locaties toevoegen." label="Uitleg gewenste locaties" />
    </div>
    <input type="hidden" name="locations" value={locations.join(',')} />
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/28" size={18} />
      <input id="location-search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onKeyDown} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={focused && query.trim().length >= 2} aria-controls="location-suggestions" className="field pl-11 pr-11" placeholder="Typ bijvoorbeeld Raalte" />
      {loading && <LoaderCircle className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#b8ff5a]" size={18} aria-label="Plaatsen zoeken" />}
      {focused && query.trim().length >= 2 && !loading && <div id="location-suggestions" role="listbox" className="absolute left-0 right-0 top-[calc(100%+.5rem)] z-30 overflow-hidden rounded-2xl border border-white/12 bg-[#0e141b] shadow-2xl">
        {suggestions.map((suggestion, index) => <button key={suggestion.id} type="button" role="option" aria-selected={index === activeIndex} onMouseDown={(event) => event.preventDefault()} onClick={() => addLocation(suggestion.name)} className={`flex w-full items-start gap-3 border-b border-white/8 px-4 py-3 text-left transition last:border-0 ${index === activeIndex ? 'bg-[#b8ff5a]/12' : 'hover:bg-white/[.05]'}`}>
          <MapPin className="mt-0.5 shrink-0 text-[#b8ff5a]" size={16} /><span><strong className="block text-sm">{suggestion.name}</strong>{(suggestion.municipality || suggestion.province) && <span className="mt-0.5 block text-xs text-white/38">{[suggestion.municipality, suggestion.province].filter(Boolean).join(' · ')}</span>}</span>
        </button>)}
        {canAddManually && <button type="button" role="option" aria-selected={activeIndex === suggestions.length} onMouseDown={(event) => event.preventDefault()} onClick={() => addLocation(query)} className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${activeIndex === suggestions.length ? 'bg-[#b8ff5a]/12' : 'hover:bg-white/[.05]'}`}><MapPin className="text-white/35" size={16}/>Gebruik “{query.trim()}” handmatig</button>}
        {!suggestions.length && !canAddManually && <p className="px-4 py-3 text-sm text-white/42">Geen plaatsen gevonden.</p>}
      </div>}
    </div>
    {locations.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{locations.map((location) => <span key={location} className="inline-flex items-center gap-2 rounded-full border border-[#b8ff5a]/20 bg-[#b8ff5a]/[.07] px-3 py-2 text-sm font-bold text-[#dcffb5]">{location}<button type="button" onClick={() => setLocations((current) => current.filter((item) => item !== location))} aria-label={`Verwijder ${location}`} className="rounded-full text-white/45 hover:text-white"><X size={15}/></button></span>)}</div>}
    {unavailable && <p className="mt-3 text-sm text-amber-100/70">De officiële plaatsnamenservice reageert tijdelijk niet. Je kunt de plaatsnaam handmatig toevoegen.</p>}
    <p className="mt-3 text-sm text-white/38">{locations.length ? `${locations.length} locatie${locations.length === 1 ? '' : 's'} gekozen` : 'Kies minimaal één locatie om je profiel op te slaan.'} · Officiële plaatsnamen via PDOK.</p>
  </div>
}

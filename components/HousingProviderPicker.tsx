'use client'

import { Building2, Check, ChevronDown, Search, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import InfoTip from '@/components/InfoTip'

export type HousingProviderOption = {
  id: string
  name: string
  provider_type: string
  verified: boolean
}

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('nl-NL')

function providerLabel(provider: HousingProviderOption) {
  if (provider.name === 'De Woningzoeker') return 'Woonruimteplatform'
  if (provider.name === 'Andere verhuurder') return 'Staat niet in de lijst'
  return provider.provider_type === 'housing_corporation' ? 'Woningcorporatie' : 'Verhuurder'
}

export default function HousingProviderPicker({ providers }: { providers: HousingProviderOption[] }) {
  const inputId = useId()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<HousingProviderOption | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const results = useMemo(() => {
    const search = normalize(query.trim())
    const filtered = search ? providers.filter((provider) => normalize(provider.name).includes(search)) : providers
    return [...filtered].sort((a, b) => {
      if (!search) {
        const pinned = ['Andere verhuurder', 'De Woningzoeker']
        const aPinned = pinned.indexOf(a.name)
        const bPinned = pinned.indexOf(b.name)
        if (aPinned !== -1 || bPinned !== -1) return (aPinned === -1 ? 99 : aPinned) - (bPinned === -1 ? 99 : bPinned)
      }
      return a.name.localeCompare(b.name, 'nl-NL')
    })
  }, [providers, query])

  function choose(provider: HousingProviderOption) {
    setSelected(provider)
    setQuery(provider.name)
    setOpen(false)
    setActiveIndex(-1)
  }

  function clear() {
    setSelected(null)
    setQuery('')
    setOpen(true)
    setActiveIndex(-1)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, results.length - 1))
    }
    if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.max(index - 1, 0))
    }
    if (event.key === 'Enter' && open && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault()
      choose(results[activeIndex])
    }
    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return <div>
    <div className="mb-2 flex items-center justify-between gap-3">
      <label htmlFor={inputId} className="text-sm font-bold text-white/70">Woningcorporatie of verhuurder <span className="text-[#b8ff5a]">*</span></label>
      <InfoTip text="Zoek op de naam die op je huurcontract staat. Staat je verhuurder er niet tussen, kies dan ‘Andere verhuurder’ en stuur de naam ter controle in." label="Uitleg verhuurder kiezen" />
    </div>
    <input type="hidden" name="housing_provider_id" value={selected?.id || ''} />
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/28" size={18} />
      <input
        id={inputId}
        value={query}
        onChange={(event) => { setQuery(event.target.value); setSelected(null); setOpen(true); setActiveIndex(-1) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        className="field pl-11 pr-12"
        placeholder="Typ bijvoorbeeld De Woningzoeker of SallandWonen"
      />
      {selected
        ? <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={clear} aria-label="Verhuurderkeuze wissen" className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/42 hover:bg-white/8 hover:text-white"><X size={17}/></button>
        : <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35" size={18}/>
      }
      {open && <div id={listId} role="listbox" className="absolute left-0 right-0 top-[calc(100%+.5rem)] z-30 max-h-80 overflow-y-auto rounded-2xl border border-white/12 bg-[#0e141b] shadow-2xl">
        {results.map((provider, index) => <button
          id={`${listId}-${index}`}
          key={provider.id}
          type="button"
          role="option"
          aria-selected={selected?.id === provider.id}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => choose(provider)}
          className={`flex w-full items-start gap-3 border-b border-white/8 px-4 py-3 text-left transition last:border-0 ${index === activeIndex ? 'bg-[#b8ff5a]/12' : 'hover:bg-white/[.05]'}`}
        >
          <Building2 className="mt-0.5 shrink-0 text-[#b8ff5a]" size={17}/>
          <span className="min-w-0 flex-1"><strong className="block text-sm">{provider.name}</strong><span className="mt-0.5 block text-xs text-white/38">{providerLabel(provider)}</span></span>
          {selected?.id === provider.id && <Check className="mt-1 shrink-0 text-[#b8ff5a]" size={17}/>} 
        </button>)}
        {!results.length && <div className="px-4 py-4"><p className="text-sm font-bold">Geen verhuurder gevonden</p><p className="mt-1 text-xs leading-5 text-white/45">Kies “Andere verhuurder” door het zoekveld leeg te maken, zodat je toch verder kunt.</p></div>}
      </div>}
    </div>
    {selected && <div className="mt-3 rounded-2xl border border-[#b8ff5a]/20 bg-[#b8ff5a]/[.06] p-3 text-sm">
      <span className="inline-flex items-center gap-2 font-black text-[#dcffb5]"><Check size={16}/> {selected.name} gekozen</span>
      {selected.name === 'De Woningzoeker' && <p className="mt-2 leading-6 text-amber-100/70">De Woningzoeker is een woonruimteplatform van meerdere corporaties. Kies bij voorkeur de corporatie op je huurcontract; weet je die nog niet, dan kun je met deze keuze wel verder en het later aanpassen.</p>}
      {selected.name === 'Andere verhuurder' && <p className="mt-2 leading-6 text-white/52">Je kunt verder met plaatsen. Stuur de ontbrekende naam via “Staat jouw verhuurder niet in de lijst?” naar ASORTA.</p>}
    </div>}
    <p className="mt-3 text-sm text-white/38">Zoek in de landelijke corporatielijst of kies “Andere verhuurder”.</p>
  </div>
}

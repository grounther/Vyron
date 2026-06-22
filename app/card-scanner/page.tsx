import CardScannerClient from '@/components/card-scanner/CardScannerClient'

export const metadata = {
  title: 'Kaartscanner | ASORTA',
  description: 'Scan of zoek TCG kaarten en bekijk de waarde via ASORTA, Pokemonkaart.nl en fallback data.',
}

export default function CardScannerPage() {
  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(183,200,173,.22),transparent_42%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
      <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">ASORTA TCG waardescanner</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Kaartwaarde scanner</h1>
      <p className="mt-4 max-w-3xl text-white/60">Scan kaarttekst met je camera of zoek handmatig. De scanner zoekt automatisch in ASORTA, Pokemonkaart.nl en TCGdex-fallback. Pokemonkaart-prijzen worden netjes gecachet, zodat scans snel blijven en de bron niet onnodig belast wordt.</p>
    </section>
    <CardScannerClient />
  </main>
}

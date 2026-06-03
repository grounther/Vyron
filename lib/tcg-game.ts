export type TcgSeriesKey = 'perfect-order' | 'chaos-rising'
export type TcgRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'reverse_holo'
  | 'holo'
  | 'full_art'
  | 'ultra_rare'
  | 'secret_rare'
  | 'gold_rare'

export type TcgCard = {
  id: string
  number: string
  series: TcgSeriesKey
  seriesName: string
  name: string
  type: string
  rarity: TcgRarity
  variant: string
  flavor: string
  artStyle: string
  collectorTitle: string
}

export const tcgSeries: Array<{ key: TcgSeriesKey; name: string; short: string; accent: string; description: string; totalCards: number }> = [
  {
    key: 'perfect-order',
    name: 'Perfect Order',
    short: 'Licht, balans en premium pulls',
    accent: 'gold',
    totalCards: 120,
    description: 'Een eigen ASORTA collector-serie met lichtenergie, guardians, symmetrie en master-set chase cards.',
  },
  {
    key: 'chaos-rising',
    name: 'Chaos Rising',
    short: 'Storm, schaduw en wilde pulls',
    accent: 'blue',
    totalCards: 120,
    description: 'Een eigen ASORTA collector-serie met stormenergie, rift beasts, neon chaos en zeldzame holo-pulls.',
  },
]

const rarityPlan: Array<[TcgRarity, number]> = [
  ['common', 44],
  ['uncommon', 32],
  ['rare', 18],
  ['reverse_holo', 10],
  ['holo', 8],
  ['full_art', 4],
  ['ultra_rare', 2],
  ['secret_rare', 1],
  ['gold_rare', 1],
]

const typeCycle = ['Flame', 'Aqua', 'Terra', 'Volt', 'Frost', 'Shadow', 'Light', 'Arcane', 'Beast', 'Dragon', 'Metal', 'Wind']

const perfectOrderNames = [
  'Aurelith Squire','Lunacrest Cub','Ivory Scout','Solvayne Sprite','Order Keeper','Golden Fox','Crystal Pup','Sleeve Imp','Toploader Toad','Tiny Guardian',
  'Vault Lynx','Golden Courier','Gemscale Drake','Lumen Vulpes','Box Sentinel','Order Mage','Mint Keeper','Clean Cut Griffin','Perfect Hydra','Archive Phoenix',
  'Prism Stag','Atlas Guardian','Crown Seraph','Royal Packmaster','Aurora Judge','Golden Dragon','Collector King','Perfect Order Emblem','Market Crown','Order Rift',
  'Holo Binder','Sealed Promise','Perfect Pull','Asorta Crest','Order Storm','Master Set Seal','Aurelith Warden','Lunacrest Oracle','Ivory Paladin','Solvayne Monk',
  'Order Finch','Golden Stag','Crystal Mender','Sleeve Scribe','Toploader Knight','Tiny Archivist','Vault Panther','Golden Postmaster','Gemscale Wyvern','Lumen Moth',
  'Box Monarch','Order Alchemist','Mint Dryad','Clean Cut Falcon','Perfect Basilisk','Archive Roc','Prism Elk','Atlas Colossus','Crown Valkyrie','Royal Sorter',
  'Aurora Arbiter','Golden Wyrm','Collector Prince','Order Keystone','Market Halo','Order Gate','Holo Index','Sealed Oath','Perfect Spark','Asorta Banner',
  'Order Cascade','Master Seal Guardian','Aurelith Champion','Lunacrest Seer','Ivory Commander','Solvayne Sage','Order Hare','Golden Pegasus','Crystal Otter','Sleeve Adept',
  'Toploader Golem','Tiny Cartographer','Vault Tiger','Golden Runner','Gemscale Leviathan','Lumen Unicorn','Box Aegis','Order Chronomancer','Mint Treant','Clean Cut Harrier',
  'Perfect Chimera','Archive Thunderbird','Prism Antelope','Atlas Titan','Crown Archon','Royal Vaultmaster','Aurora Magistrate','Golden Elder Dragon','Collector Emperor','Perfect Order Sigil',
  'Market Sun Crown','Order Nexus','Holo Master Binder','Sealed Covenant','Perfect Revelation','Asorta Royal Crest','Order Aurora','Master Set Crown','Aurelith Ascendant','Lunacrest Ascendant',
  'Ivoryon Full Art','Solvayne Full Art','Aurelith Gold Seal','Lunacrest Secret Gate','Perfect Order Masterpiece','Golden Dragon Full Art','Collector King Full Art','Crown Seraph Full Art','Master Set Gold Seal','Perfect Order Crown Rare',
]

const chaosRisingNames = [
  'Chaos Cub','Storm Kitten','Rift Rat','Spark Imp','Smoke Pup','Wild Sprite','Night Scout','Rogue Sleeve','Thunder Moth','Market Goblin',
  'Chaos Lynx','Storm Herald','Blue Flame Drake','Rift Serpent','Pack Reaper','Neon Wraith','Breaker Beetle','Chaos Keeper','Storm Hydra','Blue Lion',
  'Shadow Phoenix','Rift Titan','Thunder Crown','Chaos Dragon','Void Collector','Storm Lion EX','Rift Dragon EX','Chaos Rising Emblem','Blue Thunder Seal','Chaos Gate',
  'Wild Pull','Storm Warning','Blue Holo Burst','Chaos Crest','Rising Storm','Master Chaos Seal','Vexigar Pup','Noctyra Scout','Ruinflare Imp','Voltshade Sprite',
  'Kharvox Cub','Chaorune Fox','Dravok Rat','Riftwing Moth','Neon Goblin','Stormclaw Lynx','Void Herald','Bluefire Drake','Shadow Serpent','Pack Phantom',
  'Neon Reaper','Breaker Hornet','Chaos Warden','Storm Basilisk','Blue Mane Lion','Shadow Roc','Rift Colossus','Thunder Diadem','Chaos Wyvern','Void Oracle',
  'Storm Lion Prime','Rift Dragon Prime','Chaos Keystone','Blue Static Seal','Rift Gate','Wild Gamble','Storm Siren','Blue Burst Nova','Chaos Banner','Rising Tempest',
  'Master Rift Seal','Vexigar Alpha','Noctyra Shade','Ruinflare Rogue','Voltshade Phantom','Kharvox Brute','Chaorune Trickster','Dravok Scavenger','Riftwing Harpy','Neon Gremlin',
  'Stormclaw Panther','Void Prophet','Bluefire Wyrm','Shadow Leviathan','Pack Banshee','Neon Revenant','Breaker Scarab','Chaos Monarch','Storm Chimera','Blue Mane Emperor',
  'Shadow Thunderbird','Rift Behemoth','Thunder Crowned King','Chaos Dragon Overdrive','Void Collector Prime','Storm Lion Full Art','Rift Dragon Full Art','Chaos Rising Sigil','Blue Thunder Crown','Chaos Nexus',
  'Wild Pull Max','Storm Warning Full Art','Blue Holo Supernova','Chaos Royal Crest','Rising Chaos Wave','Master Chaos Crown','Vexigar Ascendant','Noctyra Ascendant','Ruinflare Full Art','Voltshade Full Art',
  'Chaos Dragon Gold Seal','Storm Lion Secret Gate','Chaos Rising Masterpiece','Rift Dragon Full Art','Void Collector Full Art','Thunder Crown Full Art','Master Chaos Gold Seal','Chaos Rising Crown Rare','Blue Lion Gold Rare','Rift Titan Secret Rare',
]

const perfectFlavors = [
  'Een lichtwezen dat iedere verzameling strak op nummer houdt.',
  'Beschermt sealed voorraad met kalme precisie.',
  'Verschijnt wanneer een collector zijn master set bijna compleet heeft.',
  'Laat holo-randen oplichten zonder chaos te veroorzaken.',
  'Een kaart uit de orde-lijn van ASORTA, gemaakt voor completionists.',
]

const chaosFlavors = [
  'Een wild wezen dat elke pack opening spannender maakt.',
  'Scheurt door de stilte met neon stormenergie.',
  'Verschijnt precies wanneer de pull-streak begint te kantelen.',
  'Laat riftlicht achter op iedere holo-rand.',
  'Een kaart uit de chaos-lijn van ASORTA, gemaakt voor jagers op chase cards.',
]

function rarityAtIndex(index: number): TcgRarity {
  let current = 0
  for (const [rarity, count] of rarityPlan) {
    current += count
    if (index < current) return rarity
  }
  return 'common'
}

function artStyleFor(series: TcgSeriesKey, rarity: TcgRarity, index: number) {
  const finish = rarityLabel(rarity)
  if (series === 'perfect-order') {
    return `${finish} frame met witgouden licht, symmetrische runes en premium collector-glans #${index + 1}`
  }
  return `${finish} frame met neonblauwe storm, paarse rift-energie en chaotische foil-glans #${index + 1}`
}

function buildSeriesCards(series: TcgSeriesKey, names: string[], seriesName: string, flavors: string[]): TcgCard[] {
  return names.slice(0, 120).map((name, index) => {
    const rarity = rarityAtIndex(index)
    const number = `${String(index + 1).padStart(3, '0')}/120`
    const prefix = series === 'perfect-order' ? 'po' : 'cr'
    const type = typeCycle[index % typeCycle.length]
    return {
      id: `${prefix}-${String(index + 1).padStart(3, '0')}`,
      number,
      series,
      seriesName,
      name,
      type,
      rarity,
      variant: rarity,
      flavor: flavors[index % flavors.length],
      artStyle: artStyleFor(series, rarity, index),
      collectorTitle: `${seriesName} ${number}`,
    }
  })
}

export const tcgCardCatalog: TcgCard[] = [
  ...buildSeriesCards('perfect-order', perfectOrderNames, 'Perfect Order', perfectFlavors),
  ...buildSeriesCards('chaos-rising', chaosRisingNames, 'Chaos Rising', chaosFlavors),
]

export function getSeries(key: string | null | undefined) {
  return tcgSeries.find((series) => series.key === key)
}

export function getCardsForSeries(seriesKey: TcgSeriesKey) {
  return tcgCardCatalog.filter((card) => card.series === seriesKey)
}

export function rarityLabel(rarity: string) {
  const labels: Record<string, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    reverse_holo: 'Reverse Holo',
    holo: 'Holo',
    full_art: 'Full Art',
    ultra_rare: 'Ultra Rare',
    secret_rare: 'Secret Rare',
    gold_rare: 'Gold Rare',
  }
  return labels[rarity] || rarity
}

export function rarityRank(rarity: string) {
  const ranks: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    reverse_holo: 4,
    holo: 5,
    full_art: 6,
    ultra_rare: 7,
    secret_rare: 8,
    gold_rare: 9,
  }
  return ranks[rarity] || 0
}

export function cardVisualClass(card: Pick<TcgCard, 'series' | 'rarity'>) {
  const base = card.series === 'perfect-order'
    ? 'from-amber-200/25 via-slate-100/10 to-black'
    : 'from-sky-400/25 via-fuchsia-500/10 to-black'
  const rarityGlow: Record<string, string> = {
    common: 'border-white/10',
    uncommon: 'border-emerald-300/35',
    rare: 'border-sky-300/45',
    reverse_holo: 'border-fuchsia-300/50 shadow-[0_0_40px_rgba(217,70,239,.16)]',
    holo: 'border-amber-200/60 shadow-[0_0_45px_rgba(251,191,36,.18)]',
    full_art: 'border-violet-200/70 shadow-[0_0_55px_rgba(167,139,250,.22)]',
    ultra_rare: 'border-cyan-100/75 shadow-[0_0_65px_rgba(125,211,252,.24)]',
    secret_rare: 'border-yellow-100/85 shadow-[0_0_75px_rgba(250,204,21,.28)]',
    gold_rare: 'border-yellow-200 shadow-[0_0_90px_rgba(250,204,21,.38)]',
  }
  return `${rarityGlow[card.rarity] || rarityGlow.common} ${base}`
}

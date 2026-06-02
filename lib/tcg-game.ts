export type TcgSeriesKey = 'perfect-order' | 'chaos-rising'
export type TcgRarity = 'common' | 'uncommon' | 'rare' | 'reverse_holo' | 'holo' | 'ultra_rare' | 'secret_rare'

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
}

export const tcgSeries: Array<{ key: TcgSeriesKey; name: string; short: string; accent: string; description: string }> = [
  {
    key: 'perfect-order',
    name: 'Perfect Order',
    short: 'Order, licht en premium pulls',
    accent: 'gold',
    description: 'Een ASORTA collector-serie met strak georganiseerde energie, guardians en premium hits.',
  },
  {
    key: 'chaos-rising',
    name: 'Chaos Rising',
    short: 'Storm, schaduw en wilde pulls',
    accent: 'blue',
    description: 'Een ASORTA collector-serie met stormenergie, chaos beasts en zeldzame holo-pulls.',
  },
]

const perfectOrderBase = [
  ['po-001', '001/036', 'Asorta Squire', 'Normal', 'common', 'Een starterkaart voor iedere verzamelaar.'],
  ['po-002', '002/036', 'Bronze Cub', 'Earth', 'common', 'Klein, loyaal en verrassend stevig.'],
  ['po-003', '003/036', 'Market Scout', 'Wind', 'common', 'Vindt altijd de beste deal op de markt.'],
  ['po-004', '004/036', 'Binder Sprite', 'Light', 'common', 'Beschermt kaarten tegen krassen en chaos.'],
  ['po-005', '005/036', 'Pack Keeper', 'Metal', 'common', 'Bewaakt sealed voorraad met perfecte precisie.'],
  ['po-006', '006/036', 'Order Fox', 'Fire', 'common', 'Snel, slim en altijd op tijd.'],
  ['po-007', '007/036', 'Crystal Pup', 'Water', 'common', 'Glanzend maar nog niet zeldzaam.'],
  ['po-008', '008/036', 'Sleeve Imp', 'Dark', 'common', 'Past in iedere binder-pocket.'],
  ['po-009', '009/036', 'Toploader Toad', 'Earth', 'common', 'Staat stevig voor je hits.'],
  ['po-010', '010/036', 'Tiny Guardian', 'Light', 'common', 'Een kleine wachter met groot hart.'],
  ['po-011', '011/036', 'Vault Lynx', 'Metal', 'uncommon', 'Sluipt tussen sealed dozen door.'],
  ['po-012', '012/036', 'Golden Courier', 'Wind', 'uncommon', 'Brengt iedere pull veilig thuis.'],
  ['po-013', '013/036', 'Gemscale Drake', 'Dragon', 'uncommon', 'Zijn schubben lijken op perfect gesorteerde kaarten.'],
  ['po-014', '014/036', 'Lumen Vulpes', 'Light', 'uncommon', 'Laat holo-randen oplichten in het donker.'],
  ['po-015', '015/036', 'Box Sentinel', 'Metal', 'uncommon', 'Wacht over Elite Trainer Boxes.'],
  ['po-016', '016/036', 'Order Mage', 'Psychic', 'uncommon', 'Legt elke verzameling op nummer.'],
  ['po-017', '017/036', 'Mint Keeper', 'Grass', 'uncommon', 'Zorgt dat kaarten mint blijven.'],
  ['po-018', '018/036', 'Clean Cut Griffin', 'Wind', 'uncommon', 'Scheurt packs open met perfecte lijn.'],
  ['po-019', '019/036', 'Perfect Hydra', 'Dragon', 'rare', 'Drie koppen, één perfecte strategie.'],
  ['po-020', '020/036', 'Archive Phoenix', 'Fire', 'rare', 'Herrijst uit oude binders en sealed dozen.'],
  ['po-021', '021/036', 'Prism Stag', 'Light', 'rare', 'Elke hoorn breekt licht in holo-kleuren.'],
  ['po-022', '022/036', 'Atlas Guardian', 'Metal', 'rare', 'De bewaker van het ASORTA archief.'],
  ['po-023', '023/036', 'Crown Seraph', 'Light', 'holo', 'Een holo-hit die orde brengt in elke collectie.'],
  ['po-024', '024/036', 'Royal Packmaster', 'Normal', 'holo', 'Opent nooit packs, maar bewaart ze perfect.'],
  ['po-025', '025/036', 'Aurora Judge', 'Psychic', 'holo', 'Weegt geen packs, maar wel beslissingen.'],
  ['po-026', '026/036', 'Golden Dragon', 'Dragon', 'ultra_rare', 'De signature hit van Perfect Order.'],
  ['po-027', '027/036', 'Collector King', 'Light', 'ultra_rare', 'Ziet iedere missende kaart in één oogopslag.'],
  ['po-028', '028/036', 'Perfect Order Emblem', 'Item', 'secret_rare', 'Een geheime kaart met ASORTA-energie.'],
  ['po-029', '029/036', 'Market Crown', 'Item', 'secret_rare', 'Alleen de scherpste jagers vinden deze kaart.'],
  ['po-030', '030/036', 'Order Rift', 'Stadium', 'rare', 'Een portaal naar premium voorraad.'],
  ['po-031', '031/036', 'Holo Binder', 'Item', 'uncommon', 'Laat zelfs commons bijzonder voelen.'],
  ['po-032', '032/036', 'Sealed Promise', 'Support', 'rare', 'Niet geopend, niet gewogen, niet opnieuw verpakt.'],
  ['po-033', '033/036', 'Perfect Pull', 'Support', 'holo', 'De kaart waar iedere collector op hoopt.'],
  ['po-034', '034/036', 'Asorta Crest', 'Item', 'common', 'Het teken van jouw verzameling.'],
  ['po-035', '035/036', 'Order Storm', 'Stadium', 'uncommon', 'Rustig aan de buitenkant, sterk van binnen.'],
  ['po-036', '036/036', 'Master Set Seal', 'Item', 'secret_rare', 'De droom van elke set-builder.'],
] as const

const chaosRisingBase = [
  ['cr-001', '001/036', 'Chaos Cub', 'Dark', 'common', 'Klein, wild en moeilijk te sorteren.'],
  ['cr-002', '002/036', 'Storm Kitten', 'Lightning', 'common', 'Rent dwars door de binder heen.'],
  ['cr-003', '003/036', 'Rift Rat', 'Dark', 'common', 'Duikt op waar kaarten verdwijnen.'],
  ['cr-004', '004/036', 'Spark Imp', 'Lightning', 'common', 'Geeft iedere pack opening spanning.'],
  ['cr-005', '005/036', 'Smoke Pup', 'Fire', 'common', 'Laat een spoor van rook en glitter achter.'],
  ['cr-006', '006/036', 'Wild Sprite', 'Grass', 'common', 'Past nooit netjes in de rij.'],
  ['cr-007', '007/036', 'Night Scout', 'Dark', 'common', 'Zoekt hits in de schaduw.'],
  ['cr-008', '008/036', 'Rogue Sleeve', 'Item', 'common', 'Beschermt kaarten op zijn eigen manier.'],
  ['cr-009', '009/036', 'Thunder Moth', 'Lightning', 'common', 'Fladdert rond bij iedere holo-flash.'],
  ['cr-010', '010/036', 'Market Goblin', 'Dark', 'common', 'Wil altijd net nog één pack.'],
  ['cr-011', '011/036', 'Chaos Lynx', 'Dark', 'uncommon', 'Verplaatst kaarten wanneer niemand kijkt.'],
  ['cr-012', '012/036', 'Storm Herald', 'Lightning', 'uncommon', 'Kondigt een zeldzame pull aan.'],
  ['cr-013', '013/036', 'Blue Flame Drake', 'Fire', 'uncommon', 'Brandt met koude, blauwe vlammen.'],
  ['cr-014', '014/036', 'Rift Serpent', 'Dragon', 'uncommon', 'Glijdt tussen twee series door.'],
  ['cr-015', '015/036', 'Pack Reaper', 'Dark', 'uncommon', 'Laat alleen de kaarten over.'],
  ['cr-016', '016/036', 'Neon Wraith', 'Psychic', 'uncommon', 'Verschijnt als het licht de kaart raakt.'],
  ['cr-017', '017/036', 'Breaker Beetle', 'Metal', 'uncommon', 'Breekt door elke slechte pull-streak.'],
  ['cr-018', '018/036', 'Chaos Keeper', 'Dark', 'uncommon', 'Bewaker van rommelige mastersets.'],
  ['cr-019', '019/036', 'Storm Hydra', 'Dragon', 'rare', 'Elke kop trekt een andere kaart.'],
  ['cr-020', '020/036', 'Blue Lion', 'Lightning', 'rare', 'De stormkoning van Chaos Rising.'],
  ['cr-021', '021/036', 'Shadow Phoenix', 'Fire', 'rare', 'Herrijst uit mislukte pulls.'],
  ['cr-022', '022/036', 'Rift Titan', 'Dark', 'rare', 'Een monster dat zelfs sealed dozen laat trillen.'],
  ['cr-023', '023/036', 'Thunder Crown', 'Lightning', 'holo', 'Een holo-hit met elektrische randen.'],
  ['cr-024', '024/036', 'Chaos Dragon', 'Dragon', 'holo', 'Zijn vleugels kleuren blauw en zwart.'],
  ['cr-025', '025/036', 'Void Collector', 'Psychic', 'holo', 'Verzamelt de kaarten die anderen missen.'],
  ['cr-026', '026/036', 'Storm Lion EX', 'Lightning', 'ultra_rare', 'De signature hit van Chaos Rising.'],
  ['cr-027', '027/036', 'Rift Dragon EX', 'Dragon', 'ultra_rare', 'Scheurt de lucht open bij elke aanval.'],
  ['cr-028', '028/036', 'Chaos Rising Emblem', 'Item', 'secret_rare', 'Een geheime kaart met stormenergie.'],
  ['cr-029', '029/036', 'Blue Thunder Seal', 'Item', 'secret_rare', 'Zeldzaam, luid en onmogelijk te negeren.'],
  ['cr-030', '030/036', 'Chaos Gate', 'Stadium', 'rare', 'Iedere opening kan alle kanten op.'],
  ['cr-031', '031/036', 'Wild Pull', 'Support', 'uncommon', 'Een kaart voor gokkers en collectors.'],
  ['cr-032', '032/036', 'Storm Warning', 'Support', 'rare', 'Waarschuwt voor aankomende hits.'],
  ['cr-033', '033/036', 'Blue Holo Burst', 'Support', 'holo', 'Een flits voordat de kaart zichtbaar wordt.'],
  ['cr-034', '034/036', 'Chaos Crest', 'Item', 'common', 'Het teken van een wilde verzameling.'],
  ['cr-035', '035/036', 'Rising Storm', 'Stadium', 'uncommon', 'De lucht wordt donker, de pulls worden beter.'],
  ['cr-036', '036/036', 'Master Chaos Seal', 'Item', 'secret_rare', 'Alleen voor echte completionists.'],
] as const

function cardFromRow(row: readonly [string, string, string, string, string, string], series: TcgSeriesKey, seriesName: string): TcgCard {
  return {
    id: row[0],
    number: row[1],
    series,
    seriesName,
    name: row[2],
    type: row[3],
    rarity: row[4] as TcgRarity,
    variant: row[4] as TcgRarity,
    flavor: row[5],
  }
}

export const tcgCardCatalog: TcgCard[] = [
  ...perfectOrderBase.map((row) => cardFromRow(row, 'perfect-order', 'Perfect Order')),
  ...chaosRisingBase.map((row) => cardFromRow(row, 'chaos-rising', 'Chaos Rising')),
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
    ultra_rare: 'Ultra Rare',
    secret_rare: 'Secret Rare',
  }
  return labels[rarity] || rarity
}

export function rarityRank(rarity: string) {
  const ranks: Record<string, number> = { common: 1, uncommon: 2, rare: 3, reverse_holo: 4, holo: 5, ultra_rare: 6, secret_rare: 7 }
  return ranks[rarity] || 0
}

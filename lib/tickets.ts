export type EventItem = {
  slug: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  category: string;
  price: number;
  color: string;
  closed?: boolean;
  closedLabel?: string;
};
export const events: EventItem[] = [
  {
    slug: "nacht-van-salland",
    title: "Nacht van Salland",
    venue: "De Leeren Lampe",
    city: "Raalte",
    date: "12 sep 2026",
    category: "Festival",
    price: 29.5,
    color: "#b8ff5a",
  },
  {
    slug: "zwolle-live",
    title: "Zwolle Live",
    venue: "Hedon",
    city: "Zwolle",
    date: "26 sep 2026",
    category: "Concert",
    price: 34,
    color: "#73c7ff",
  },
  {
    slug: "deventer-dance",
    title: "Deventer Dance",
    venue: "Burgerweeshuis",
    city: "Deventer",
    date: "10 okt 2026",
    category: "Dance",
    price: 24.5,
    color: "#ff8ac8",
  },
  {
    slug: "eagles-thuis",
    title: "Go Ahead Eagles — Thuiswedstrijd",
    venue: "De Adelaarshorst",
    city: "Deventer",
    date: "18 okt 2026",
    category: "Sport",
    price: 42.5,
    color: "#ff625d",
  },
  {
    slug: "comedy-night",
    title: "Comedy Night Overijssel",
    venue: "Theater de Spiegel",
    city: "Zwolle",
    date: "7 nov 2026",
    category: "Theater",
    price: 27,
    color: "#ffc55a",
  },
  {
    slug: "winterbeats",
    title: "Winterbeats",
    venue: "IJsselhallen",
    city: "Zwolle",
    date: "19 dec 2026",
    category: "Festival",
    price: 49.5,
    color: "#a993ff",
  },
];
export const buyerFeeRate = 0.085,
  sellerFeeRate = 0.045,
  primaryFixedFee = 0.75,
  primaryFeeRate = 0.025;
export const euro = (value: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
    value,
  );

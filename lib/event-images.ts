export function eventCover(category: string) {
  const value = String(category || "").toLowerCase();
  if (/(sport|voetbal|wedstrijd|stadion)/.test(value))
    return "/event-covers/sport.webp";
  if (/(theater|comedy|cabaret|show)/.test(value))
    return "/event-covers/theatre.webp";
  return "/event-covers/music-festival.webp";
}

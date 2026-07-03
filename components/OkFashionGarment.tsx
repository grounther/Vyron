export default function OkFashionGarment({
  kind,
  tone,
  accent,
  className = '',
}: {
  kind: 'tee' | 'shirt' | 'trouser' | 'short' | 'overshirt' | 'silk'
  tone: string
  accent: string
  className?: string
}) {
  if (kind === 'trouser') {
    return (
      <div className={`mx-auto h-[190px] max-w-[135px] ${className}`}>
        <div className="relative mx-auto h-full w-[90px]">
          <div style={{ backgroundColor: tone }} className="absolute left-1/2 top-0 h-6 w-20 -translate-x-1/2 rounded-t-xl shadow-sm" />
          <div style={{ backgroundColor: tone }} className="absolute left-[14px] top-4 h-[158px] w-11 -skew-x-6 rounded-b-[1.25rem] shadow-sm" />
          <div style={{ backgroundColor: tone }} className="absolute right-[14px] top-4 h-[158px] w-11 skew-x-6 rounded-b-[1.25rem] shadow-sm" />
          <div style={{ backgroundColor: accent }} className="absolute left-1/2 top-3 h-1.5 w-10 -translate-x-1/2 rounded-full opacity-75" />
        </div>
      </div>
    )
  }

  if (kind === 'short') {
    return (
      <div className={`mx-auto h-[190px] max-w-[135px] ${className}`}>
        <div className="relative mx-auto h-full w-[105px] pt-8">
          <div style={{ backgroundColor: tone }} className="absolute left-1/2 top-8 h-6 w-24 -translate-x-1/2 rounded-t-xl shadow-sm" />
          <div style={{ backgroundColor: tone }} className="absolute left-[14px] top-12 h-[74px] w-12 -skew-x-3 rounded-b-[1.15rem] shadow-sm" />
          <div style={{ backgroundColor: tone }} className="absolute right-[14px] top-12 h-[74px] w-12 skew-x-3 rounded-b-[1.15rem] shadow-sm" />
          <div style={{ backgroundColor: accent }} className="absolute left-1/2 top-11 h-1.5 w-12 -translate-x-1/2 rounded-full opacity-70" />
        </div>
      </div>
    )
  }

  return (
    <div className={`mx-auto h-[190px] max-w-[145px] ${className}`}>
      <div className="relative mx-auto h-full w-[118px]">
        <div style={{ backgroundColor: tone }} className="absolute left-1/2 top-0 h-11 w-11 -translate-x-1/2 rounded-full shadow-sm" />
        <div style={{ backgroundColor: tone }} className="absolute left-[8px] top-[24px] h-5 w-11 -rotate-[28deg] rounded-full shadow-sm" />
        <div style={{ backgroundColor: tone }} className="absolute right-[8px] top-[24px] h-5 w-11 rotate-[28deg] rounded-full shadow-sm" />
        <div style={{ backgroundColor: tone }} className="absolute left-1/2 top-[20px] h-[134px] w-[84px] -translate-x-1/2 rounded-[1.25rem] shadow-sm" />
        {(kind === 'shirt' || kind === 'overshirt' || kind === 'silk') && (
          <div className="absolute left-1/2 top-[30px] h-[108px] w-px -translate-x-1/2 bg-[#1f1712]/15" />
        )}
        {(kind === 'shirt' || kind === 'overshirt' || kind === 'silk') && (
          <div className="absolute left-1/2 top-[20px] h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-[#1f1712]/12" />
        )}
        {kind === 'overshirt' && (
          <>
            <div className="absolute left-[26px] top-[54px] h-6 w-6 rounded-md border border-[#1f1712]/10 bg-[#f8f1e5]/28" />
            <div className="absolute right-[26px] top-[54px] h-6 w-6 rounded-md border border-[#1f1712]/10 bg-[#f8f1e5]/28" />
          </>
        )}
        <div style={{ backgroundColor: accent }} className="absolute left-[83px] top-[82px] h-[12px] w-[19px] rounded-full opacity-85" />
        <div className="absolute left-[86px] top-[79px] font-serif text-[11px] italic tracking-[-.18em] text-[#3d2c20]">OK</div>
      </div>
    </div>
  )
}

export type SupplierInfo = {
  name: string
  productUrl: string
  warehouse: string
  estimatedProductCost: number
  estimatedShipping: number
  landedCost: number
  status: 'approved' | 'high-priority' | 'testing'
  notes: string
  productId?: string
  variantIds?: string[]
  variants?: string[]
  processingTime?: string
  deliveryTime?: string
}

export type Product = {
  slug:string
  name:string
  category:string
  price:number
  compareAt?:number
  cost:number
  hero:string
  images?: string[]
  badge:string
  short:string
  description:string
  features:string[]
  specs:string[]
  tags:string[]
  shippingInfo:string
  contentIdeas:string[]
  supplierNotes:string
  marginNote:string
  supplier?: SupplierInfo
}

export const categories = [
  {slug:'tactical', name:'Tactical', text:'Everyday carry, utility bags and compact gear.'},
  {slug:'automotive', name:'Automotive', text:'Premium utility upgrades for your car interior.'},
  {slug:'desk-setup', name:'Desk Setup', text:'Clean desk tools for work, gaming and productivity.'},
  {slug:'gaming', name:'Gaming', text:'Creator and gaming setup accessories with utility.'},
  {slug:'smart-utility', name:'Smart Utility', text:'Useful tech gadgets for daily life.'},
  {slug:'outdoor', name:'Outdoor', text:'Compact gear for travel, camping and exploration.'},
]

export const products: Product[] = [
  {
    slug:'asorta-urban-sling-pro',
    name:'ASORTA Urban Sling Pro',
    category:'tactical',
    price:39.95,
    compareAt:59.95,
    cost:12.72,
    hero:'/products/tactical-sling-bag-pro.svg',
    images:['/products/tactical-sling-bag-pro.svg','/products/minimalist-rfid-wallet.svg','/products/tactical-carabiner-tool.svg'],
    badge:'Launch Pick',
    short:'Urban everyday carry sling with modern tactical utility.',
    description:'Designed for modern everyday carry. The ASORTA Urban Sling Pro combines tactical utility with a clean urban aesthetic for travel, commuting, daily essentials and lightweight gear organization.',
    features:['Water-resistant exterior','Adjustable crossbody fit','Multi-compartment storage','Lightweight utility design','Urban tactical aesthetic'],
    specs:['Category: Tactical / EDC','Estimated landed cost: ± €12.72','Warehouse: China','Recommended retail price: €39.95 incl. VAT','Refund risk: Low'],
    tags:['edc','sling bag','tactical','urban utility','travel'],
    shippingInfo:'Estimated delivery: 7–15 business days after processing. Tracked shipping included.',
    contentIdeas:['EDC loadout video','Travel day carry setup','Before/after pocket dump','Urban commute POV'],
    supplierNotes:'Approved CJ product. CJ data received: product cost €3.41 + estimated shipping €9.31. Variants include Black, Khaki, Military Green and camouflage options. Prefer Black/Khaki/Military Green for ASORTA positioning.',
    marginNote:'Launch price is adjusted around the real landed cost while preserving VAT, support reserve and future marketing room.',
    supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/outdoor-wear-resistant-sports-chest-bag-p-1739198066604904448.html',warehouse:'China',estimatedProductCost:3.41,estimatedShipping:9.31,landedCost:12.72,status:'approved',notes:'Strong ASORTA fit, low technical defect risk.',productId:'CJYD1929689',variantIds:['CJYD192968906FU','CJYD192968902BY','CJYD192968905EV','CJYD192968904DW','CJYD192968903CX','CJYD192968901AZ','CJYD192968908HS','CJYD192968907GT'],variants:['ACU Digital','Black','CP camouflage','Desert Digital','Jungle Digital','Khaki','Military Green','Sansha camouflage'],processingTime:'1–3 days for 90% orders',deliveryTime:'7–15 days'}
  },
  {
    slug:'asorta-drivecharge-mount',
    name:'ASORTA DriveCharge Mount',
    category:'automotive',
    price:59.95,
    compareAt:79.95,
    cost:34,
    hero:'/products/wireless-charging-car-dock.svg',
    images:['/products/wireless-charging-car-dock.svg','/products/magsafe-car-mount-pro.svg','/products/premium-car-ambient-kit.svg'],
    badge:'Smart Car',
    short:'Automatic wireless charging mount for modern drivers.',
    description:'A clean and intelligent charging solution for modern drivers. The ASORTA DriveCharge Mount combines automatic clamping technology with wireless charging for a seamless dashboard experience.',
    features:['Wireless charging','Automatic sensor clamp','One-hand operation','Dashboard and vent compatible','Clean premium design'],
    specs:['Category: Automotive','Estimated landed cost: ± €34','Warehouse: China','Recommended retail price: €59.95 incl. VAT','Refund risk: Medium-low'],
    tags:['car mount','wireless charging','automotive','dashboard','phone holder'],
    shippingInfo:'Estimated delivery: 5–12 business days. Tracked shipping included.',
    contentIdeas:['Drop-and-charge demo','Clean dashboard setup','Commute setup reel','Cable-free cockpit transformation'],
    supplierNotes:'Check charging speed, phone compatibility and heat complaints before scaling.',
    marginNote:'Good margin if quality is stable; avoid overclaiming MagSafe compatibility unless confirmed.',
    supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/infrared-induction-car-wireless-charger-car-phone-holder-p-1424257508926689280.html',warehouse:'China',estimatedProductCost:14,estimatedShipping:20,landedCost:34,status:'approved',notes:'Evergreen automotive utility product.'}
  },
  {
    slug:'asorta-ambientdrive-rgb',
    name:'ASORTA AmbientDrive RGB',
    category:'automotive',
    price:89.95,
    compareAt:119.95,
    cost:42,
    hero:'/products/premium-car-ambient-kit.svg',
    images:['/products/premium-car-ambient-kit.svg','/products/wireless-charging-car-dock.svg','/products/luxury-trunk-organizer.svg'],
    badge:'High Priority',
    short:'Premium interior ambient lighting with strong visual impact.',
    description:'Transform your interior with immersive ambient lighting. Designed to create a premium nighttime driving atmosphere with customizable RGB illumination and a high-end interior feel.',
    features:['Multi-color RGB lighting','Dual remote control','Music-reactive modes','Premium interior ambiance','Universal vehicle compatibility'],
    specs:['Category: Automotive','Estimated landed cost: ± €42','Warehouse: China','Recommended retail price: €89.95 incl. VAT','Refund risk: Medium'],
    tags:['ambient lighting','rgb car','automotive','led interior','night drive'],
    shippingInfo:'Estimated delivery: 6–12 business days. Tracked shipping included.',
    contentIdeas:['Before/after night interior','Luxury car vibe transformation','Install timelapse','Night drive POV'],
    supplierNotes:'Traffic product. Needs clear installation expectations and honest compatibility copy.',
    marginNote:'Strong premium pricing is justified by high perceived value and visual impact.',
    supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/dual-remote-24-button-ambient-light-p-1391653099806003200.html',warehouse:'China',estimatedProductCost:22,estimatedShipping:20,landedCost:42,status:'high-priority',notes:'Likely first viral traffic product.'}
  },
  {
    slug:'asorta-wavemic-rgb',
    name:'ASORTA WaveMic RGB',
    category:'gaming',
    price:109.95,
    compareAt:139.95,
    cost:48,
    hero:'/products/rgb-headset-stand.svg',
    images:['/products/rgb-headset-stand.svg','/products/controller-charging-dock.svg','/products/gaming-light-panels.svg'],
    badge:'Creator Setup',
    short:'RGB desktop microphone for creators, gamers and clean setups.',
    description:'Built for creators, gamers and modern desk setups. The ASORTA WaveMic RGB delivers a creator-style look with plug-and-play utility and a premium desk aesthetic.',
    features:['RGB lighting','Streaming-ready design','USB connectivity','Modern desk aesthetic','Plug-and-play setup'],
    specs:['Category: Gaming / Desk Setup','Estimated landed cost: ± €48','Warehouse: China','Recommended retail price: €109.95 incl. VAT','Refund risk: Medium'],
    tags:['gaming microphone','rgb setup','streaming','desk setup','creator'],
    shippingInfo:'Estimated delivery: 6–12 business days. Tracked shipping included.',
    contentIdeas:['Streamer desk setup','RGB setup glow-up','Before/after audio desk upgrade','Creator workspace reel'],
    supplierNotes:'Quality control matters. Audio products need honest expectations and clear compatibility.',
    marginNote:'Higher ticket item with good perceived value, but support risk is higher than non-electronics.',
    supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/desktop-microphone-live-conference-microphone-p-1699966126878371840.html',warehouse:'China',estimatedProductCost:28,estimatedShipping:20,landedCost:48,status:'approved',notes:'Good niche product, not main hero.'}
  },
  {
    slug:'asorta-trailpoint-mini',
    name:'ASORTA TrailPoint Mini',
    category:'outdoor',
    price:64.95,
    compareAt:84.95,
    cost:36,
    hero:'/products/foldable-solar-powerbank.svg',
    images:['/products/foldable-solar-powerbank.svg','/products/portable-mini-compressor.svg','/products/edc-flashlight-titan.svg'],
    badge:'Outdoor Utility',
    short:'Compact outdoor navigation utility for travel and exploration.',
    description:'Compact navigation utility for outdoor exploration. Designed for hiking, camping and lightweight travel support with a modern minimalist form factor.',
    features:['Compact outdoor design','Lightweight utility build','Navigation support','Portable form factor','Adventure-ready aesthetic'],
    specs:['Category: Outdoor Utility','Estimated landed cost: ± €36','Warehouse: China','Recommended retail price: €64.95 incl. VAT','Refund risk: Medium'],
    tags:['gps','outdoor','hiking','utility gadget','camping'],
    shippingInfo:'Estimated delivery: 6–12 business days. Tracked shipping included.',
    contentIdeas:['Hiking gear loadout','Camping utility kit','Outdoor exploration POV','Travel backup tool'],
    supplierNotes:'Do not make false GPS claims. Confirm whether it is true GPS, GPS assist or basic locator before scaling.',
    marginNote:'Good niche utility product; position as outdoor support tool, not emergency rescue device.',
    supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/mini-gps-multi-function-locator-road-search-treasure-outdoor-climbing-gps-tracker-mini-handheld-gps-positioning-p-094DC89C-2D2F-4726-868E-4F388BB7CF0E.html',warehouse:'China',estimatedProductCost:16,estimatedShipping:20,landedCost:36,status:'approved',notes:'Interesting outdoor utility product, needs claim control.'}
  },
  {slug:'monitor-lightbar-ultra',name:'Monitor Lightbar Ultra',category:'desk-setup',price:64.95,compareAt:84.95,cost:42,hero:'/products/monitor-lightbar-ultra.svg',badge:'Next Candidate',short:'Clean desk lighting without screen glare.',description:'A highly visual desk upgrade for work, gaming and content setups. Candidate product pending supplier validation.',features:['Glare-reduced desk lighting','Minimal monitor mount','Warm/cool light modes','Clean setup aesthetic'],specs:['Status: pending CJ product link','Use: desk/gaming','Content potential: high','Refund risk: low-medium'],tags:['desk setup','lightbar','productivity'],shippingInfo:'Estimated delivery will be confirmed after supplier validation.',contentIdeas:['Desk setup transformation','Night productivity reel'],supplierNotes:'Find CJ supplier with stable mounting and brightness control.',marginNote:'Target price €64.95–€79.95 depending on landed cost.'}
]

export const featured = products.filter(p=>['asorta-ambientdrive-rgb','asorta-urban-sling-pro','asorta-drivecharge-mount','asorta-wavemic-rgb'].includes(p.slug))
export function getProduct(slug:string){return products.find(p=>p.slug===slug)}
export function getCategory(slug:string){return categories.find(c=>c.slug===slug)}
export function byCategory(slug:string){return products.filter(p=>p.category===slug)}

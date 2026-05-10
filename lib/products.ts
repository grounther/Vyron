
export type ProductVariant = {
  name: string
  sku: string
  image: string
  price?: number
  cost?: number
  factoryStock?: number
  cjStock?: number
}

export type ProductMedia = {
  type: 'image' | 'video'
  src: string
  thumb?: string
  alt?: string
  variantName?: string
}

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
  media?: ProductMedia[]
  variants?: ProductVariant[]
  boxItems?: string[]
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
  seoTitle?: string
  seoDescription?: string
}

export const categories = [
  {slug:'tactical', name:'Tactical', text:'Everyday carry, utility bags and compact gear.'},
  {slug:'automotive', name:'Automotive', text:'Premium utility upgrades for your car interior.'},
  {slug:'desk-setup', name:'Desk Setup', text:'Clean desk tools for work, gaming and productivity.'},
  {slug:'gaming', name:'Gaming', text:'Creator and gaming setup accessories with utility.'},
  {slug:'smart-utility', name:'Smart Utility', text:'Useful tech gadgets for daily life.'},
  {slug:'outdoor', name:'Outdoor', text:'Compact gear for travel, camping and exploration.'},
]

const sling = '/products/asorta-urban-sling-pro'
const drive = '/products/asorta-drivecharge-mount'
const ambient = '/products/asorta-ambientdrive-rgb'
const mic = '/products/asorta-wavemic-rgb'
const gps = '/products/asorta-trailpoint-mini'

export const products: Product[] = [
  {
    slug:'asorta-urban-sling-pro',
    name:'ASORTA Urban Sling Pro',
    category:'tactical',
    price:39.95,
    compareAt:59.95,
    cost:12.72,
    hero:`${sling}/13.jpg`,
    media:[
      {type:'image',src:`${sling}/13.jpg`,alt:'Black variant',variantName:'Black'},
      {type:'image',src:`${sling}/1.jpg`,alt:'Khaki variant',variantName:'Khaki'},
      {type:'image',src:`${sling}/12.jpg`,alt:'Military Green variant',variantName:'Military Green'},
      {type:'image',src:`${sling}/6.jpg`,alt:'Jungle Digital variant',variantName:'Jungle Digital'},
      {type:'image',src:`${sling}/11.jpg`,alt:'ACU Digital variant',variantName:'ACU Digital'},
      {type:'image',src:`${sling}/7.jpg`,alt:'Desert Digital variant',variantName:'Desert Digital'},
      {type:'image',src:`${sling}/9.jpg`,alt:'CP Camouflage variant',variantName:'CP Camouflage'},
      {type:'image',src:`${sling}/10.jpg`,alt:'Sansha Camouflage variant',variantName:'Sansha Camouflage'},
      {type:'image',src:`${sling}/2.jpg`,alt:'Interior storage view'},
      {type:'image',src:`${sling}/4.jpg`,alt:'Product dimensions'},
    ],
    variants:[
      {name:'Black',sku:'CJYD192968902BY',image:`${sling}/13.jpg`,cost:3.41,factoryStock:10261,cjStock:0},
      {name:'Khaki',sku:'CJYD192968901AZ',image:`${sling}/1.jpg`,cost:3.41,factoryStock:11638,cjStock:0},
      {name:'Military Green',sku:'CJYD192968908HS',image:`${sling}/12.jpg`,cost:3.41,factoryStock:10817,cjStock:0},
      {name:'Jungle Digital',sku:'CJYD192968903CX',image:`${sling}/6.jpg`,cost:3.41,factoryStock:11934,cjStock:0},
      {name:'ACU Digital',sku:'CJYD192968906FU',image:`${sling}/11.jpg`,cost:3.41,factoryStock:10705,cjStock:0},
      {name:'Desert Digital',sku:'CJYD192968904DW',image:`${sling}/7.jpg`,cost:3.41,factoryStock:10187,cjStock:0},
      {name:'CP Camouflage',sku:'CJYD192968905EV',image:`${sling}/9.jpg`,cost:3.41,factoryStock:12389,cjStock:0},
      {name:'Sansha Camouflage',sku:'CJYD192968907GT',image:`${sling}/10.jpg`,cost:3.41,factoryStock:14069,cjStock:0},
    ],
    images:[`${sling}/13.jpg`,`${sling}/1.jpg`,`${sling}/12.jpg`],
    badge:'Launch Pick',
    short:'Urban everyday carry sling with modern tactical utility.',
    description:'Designed for modern everyday carry. The ASORTA Urban Sling Pro combines tactical utility with a clean urban aesthetic for travel, commuting, daily essentials and lightweight gear organization.',
    features:['Water-resistant nylon fabric','Adjustable crossbody fit','Multi-compartment storage','Below 20L compact carry size','Urban tactical aesthetic'],
    specs:['Material: nylon / cloth','Size: 19 × 9 × 27 cm','Capacity: below 20L','Weight: approx. 0.38 kg','Processing: 1–3 days for 90% orders'],
    boxItems:['1 × Messenger bag'],
    tags:['edc','sling bag','tactical','urban utility','travel'],
    shippingInfo:'Estimated delivery: 7–15 business days after processing. Tracked shipping included. Delivery can vary during customs or peak periods.',
    contentIdeas:['EDC loadout video','Travel day carry setup','Before/after pocket dump','Urban commute POV'],
    supplierNotes:'Approved CJ product. Product cost €3.41 + estimated shipping €9.31. Prefer Black/Khaki/Military Green for ASORTA positioning.',
    marginNote:'Launch price is adjusted around the real landed cost while preserving VAT, support reserve and future marketing room.',
    supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/outdoor-wear-resistant-sports-chest-bag-p-1739198066604904448.html',warehouse:'China',estimatedProductCost:3.41,estimatedShipping:9.31,landedCost:12.72,status:'approved',notes:'Strong ASORTA fit, low technical defect risk.',productId:'CJYD1929689',variantIds:['CJYD192968906FU','CJYD192968902BY','CJYD192968905EV','CJYD192968904DW','CJYD192968903CX','CJYD192968901AZ','CJYD192968908HS','CJYD192968907GT'],variants:['ACU Digital','Black','CP Camouflage','Desert Digital','Jungle Digital','Khaki','Military Green','Sansha Camouflage'],processingTime:'1–3 days for 90% orders',deliveryTime:'7–15 days'},
    seoTitle:'ASORTA Urban Sling Pro | Modern EDC Sling Bag',
    seoDescription:'Compact urban sling bag for everyday carry, travel and utility organization.'
  },
  {
    slug:'asorta-drivecharge-mount',
    name:'ASORTA DriveCharge Mount',
    category:'automotive',
    price:59.95,
    compareAt:79.95,
    cost:34,
    hero:`${drive}/17.jpg`,
    media:[
      {type:'image',src:`${drive}/5.jpg`,alt:'Black wireless charger in car'},
      {type:'image',src:`${drive}/17.jpg`,alt:'Black Plus Version',variantName:'Black Plus Version'},
      {type:'image',src:`${drive}/18.jpg`,alt:'Red Plus Version',variantName:'Red Plus Version'},
      {type:'image',src:`${drive}/19.jpg`,alt:'Yellow Plus Version',variantName:'Yellow Plus Version'},
      {type:'image',src:`${drive}/20.jpg`,alt:'Blue Plus Version',variantName:'Blue Plus Version'},
      {type:'image',src:`${drive}/1.jpg`,alt:'Color presentation'},
      {type:'image',src:`${drive}/3.jpg`,alt:'Smart tap unlock'},
      {type:'image',src:`${drive}/4.png`,alt:'Smart sensor clamp'},
      {type:'image',src:`${drive}/13.jpg`,alt:'Black set Plus Version',variantName:'Black set Plus Version'},
      {type:'image',src:`${drive}/14.png`,alt:'Blue set Plus Version',variantName:'Blue set Plus Version'},
      {type:'image',src:`${drive}/15.png`,alt:'Yellow set Plus Version',variantName:'Yellow set Plus Version'},
      {type:'video',src:`${drive}/video-1.mp4`,thumb:`${drive}/5.jpg`,alt:'DriveCharge demo video'},
      {type:'video',src:`${drive}/video-2.mp4`,thumb:`${drive}/1.jpg`,alt:'DriveCharge product video'},
    ],
    variants:[
      {name:'Black Plus Version',sku:'CJSJ124411305EV',image:`${drive}/17.jpg`,cost:5.77,factoryStock:40334,cjStock:0},
      {name:'Black set Plus Version',sku:'CJSJ124411311KP',image:`${drive}/13.jpg`,cost:7.57,factoryStock:45765,cjStock:0},
      {name:'Blue Plus Version',sku:'CJSJ124411307GT',image:`${drive}/20.jpg`,cost:5.77,factoryStock:43853,cjStock:0},
      {name:'Blue set Plus Version',sku:'CJSJ124411313MN',image:`${drive}/14.png`,cost:7.57,factoryStock:45601,cjStock:0},
      {name:'Red Plus Version',sku:'CJSJ124411306FU',image:`${drive}/18.jpg`,cost:5.77,factoryStock:45581,cjStock:0},
      {name:'Red set Plus Version',sku:'CJSJ124411309IR',image:`${drive}/11.png`,cost:7.57,factoryStock:49277,cjStock:0},
      {name:'Yellow Plus Version',sku:'CJSJ124411308HS',image:`${drive}/19.jpg`,cost:5.77,factoryStock:35859,cjStock:0},
      {name:'Yellow set Plus Version',sku:'CJSJ124411315OL',image:`${drive}/15.png`,cost:7.57,factoryStock:46270,cjStock:0},
    ],
    images:[`${drive}/5.jpg`,`${drive}/17.jpg`,`${drive}/18.jpg`],
    badge:'Smart Car',
    short:'Automatic wireless charging mount for modern drivers.',
    description:'A clean and intelligent charging solution for modern drivers. The ASORTA DriveCharge Mount combines automatic clamping technology with wireless charging for a seamless dashboard experience.',
    features:['10W wireless charging','Automatic infrared sensor clamp','One-hand operation','360° dashboard/vent positioning','Universal for 4–6.5 inch phones'],
    specs:['Material: ABS + metal','Input: 5V/2A','Output: 5V/1A, 10W max','Charging distance: 4–8 mm','Package size: 170 × 140 × 110 mm or 170 × 60 × 110 mm'],
    boxItems:['1 × Wireless charger','1 × Air outlet bracket','1 × Type-C line','1 × User manual'],
    tags:['car mount','wireless charging','automotive','dashboard','phone holder'],
    shippingInfo:'Estimated delivery: 5–12 business days after processing. Tracked shipping included.',
    contentIdeas:['Drop-and-charge demo','Clean dashboard setup','Commute setup reel','Cable-free cockpit transformation'],
    supplierNotes:'USB-only versions removed from ASORTA selection. Focus on Plus/set versions for better perceived value.',
    marginNote:'Good margin if quality is stable; avoid overclaiming MagSafe compatibility unless confirmed.',
    supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/infrared-induction-car-wireless-charger-car-phone-holder-p-1424257508926689280.html',warehouse:'China',estimatedProductCost:7.57,estimatedShipping:20,landedCost:27.57,status:'approved',notes:'Evergreen automotive utility product.'},
    seoTitle:'ASORTA DriveCharge Mount | Wireless Charging Car Holder',
    seoDescription:'Automatic wireless charging phone holder for a cleaner car interior and daily driving convenience.'
  },
  {
    slug:'asorta-ambientdrive-rgb',
    name:'ASORTA AmbientDrive RGB',
    category:'automotive',
    price:89.95,
    compareAt:119.95,
    cost:42,
    hero:`${ambient}/1.jpg`,
    media:[1,2,3,4,5].map(n=>({type:'image' as const,src:`${ambient}/${n}.jpg`,alt:`AmbientDrive RGB view ${n}`})),
    variants:[{name:'Black',sku:'CJQT112130701AZ',image:`${ambient}/1.jpg`,cost:24.28,factoryStock:40000,cjStock:0}],
    images:[`${ambient}/1.jpg`,`${ambient}/2.jpg`,`${ambient}/3.jpg`],
    badge:'High Priority',
    short:'Premium interior ambient lighting with strong visual impact.',
    description:'Transform your interior with immersive ambient lighting. Designed to create a premium nighttime driving atmosphere with customizable RGB illumination and a high-end interior feel.',
    features:['DC12V interior ambient lighting','50W lighting system','Dual remote control kit','Designed for visual interior upgrades','Strong content and night-driving appeal'],
    specs:['Material: plastic / electronic parts','Product attributes: battery contains','Voltage: DC12V','Power: 50W','Package size: 340 × 210 × 30 mm'],
    boxItems:['1 × Ambient light set / suit'],
    tags:['ambient lighting','rgb car','automotive','led interior','night drive'],
    shippingInfo:'Estimated delivery: 6–12 business days after processing. Tracked shipping included.',
    contentIdeas:['Before/after night interior','Luxury car vibe transformation','Install timelapse','Night drive POV'],
    supplierNotes:'Traffic product. Needs clear installation expectations and honest compatibility copy.',
    marginNote:'Strong premium pricing is justified by high perceived value and visual impact.',
    supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/dual-remote-24-button-ambient-light-p-1391653099806003200.html',warehouse:'China',estimatedProductCost:24.28,estimatedShipping:20,landedCost:44.28,status:'high-priority',notes:'Likely first viral traffic product.'},
    seoTitle:'ASORTA AmbientDrive RGB | Premium Car Ambient Lighting',
    seoDescription:'Interior RGB ambient lighting system for a premium night-driving atmosphere.'
  },
  {
    slug:'asorta-wavemic-rgb',
    name:'ASORTA WaveMic RGB',
    category:'gaming',
    price:109.95,
    compareAt:139.95,
    cost:48,
    hero:`${mic}/1.jpg`,
    media:[1,2,3,4,5,6].map(n=>({type:'image' as const,src:`${mic}/${n}.jpg`,alt:`WaveMic RGB view ${n}`})),
    variants:[{name:'SF666R',sku:'CJYD184184201AZ',image:`${mic}/1.jpg`,cost:24.14,factoryStock:13531,cjStock:0}],
    images:[`${mic}/1.jpg`,`${mic}/2.jpg`,`${mic}/3.jpg`],
    badge:'Creator Setup',
    short:'RGB desktop microphone for creators, gamers and clean setups.',
    description:'Built for creators, gamers and modern desk setups. The ASORTA WaveMic RGB delivers a creator-style look with plug-and-play utility and a premium desk aesthetic.',
    features:['DSP dynamic noise reduction','Full-direction pickup','5V standard operating voltage','Creator desk aesthetic','Plug-and-play setup'],
    specs:['Model/color: SF-666R','Sensitivity: -30dB ±3dB','Impedance: ≤2.2KΩ','Frequency response: 50Hz–16KHz','Signal-to-noise ratio: >36dB'],
    boxItems:['1 × Microphone','1 × Spray screen','1 × Bracket','1 × Instruction manual','1 × Color box'],
    tags:['gaming microphone','rgb setup','streaming','desk setup','creator'],
    shippingInfo:'Estimated delivery: 6–12 business days after processing. Tracked shipping included.',
    contentIdeas:['Streamer desk setup','RGB setup glow-up','Before/after audio desk upgrade','Creator workspace reel'],
    supplierNotes:'Quality control matters. Audio products need honest expectations and clear compatibility.',
    marginNote:'Higher ticket item with good perceived value, but support risk is higher than non-electronics.',
    supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/desktop-microphone-live-conference-microphone-p-1699966126878371840.html',warehouse:'China',estimatedProductCost:24.14,estimatedShipping:20,landedCost:44.14,status:'approved',notes:'Good niche product, not main hero.'},
    seoTitle:'ASORTA WaveMic RGB | Creator Desktop Microphone',
    seoDescription:'RGB desktop microphone for streaming, gaming and modern desk setups.'
  },
  {
    slug:'asorta-trailpoint-mini',
    name:'ASORTA TrailPoint Mini',
    category:'outdoor',
    price:64.95,
    compareAt:84.95,
    cost:36,
    hero:`${gps}/1.jpg`,
    media:[1,2,3,4,5].map(n=>({type:'image' as const,src:`${gps}/${n}${n===1?'.jpg':'.png'}`,alt:`TrailPoint Mini view ${n}`})),
    variants:[{name:'Green',sku:'CJQCQCQC00271-Green',image:`${gps}/1.jpg`,cost:15.36,factoryStock:13878,cjStock:0}],
    images:[`${gps}/1.jpg`,`${gps}/2.png`,`${gps}/3.png`],
    badge:'Outdoor Utility',
    short:'Compact outdoor navigation utility for travel and exploration.',
    description:'Compact navigation utility for outdoor exploration. Designed for hiking, camping and lightweight travel support with a modern minimalist form factor.',
    features:['Compact outdoor design','Lightweight utility build','Lithium battery powered','USB external power support','Adventure-ready green finish'],
    specs:['Material: matte plastic','Dimensions: 65 × 52 × 21 mm','Battery: lithium battery','External power: USB','Available specification: Green'],
    boxItems:['1 × Mini locator device'],
    tags:['gps','outdoor','hiking','utility gadget','camping'],
    shippingInfo:'Estimated delivery: 6–12 business days after processing. Tracked shipping included.',
    contentIdeas:['Hiking gear loadout','Camping utility kit','Outdoor exploration POV','Travel bag essentials'],
    supplierNotes:'Avoid rescue/emergency claims. Position as compact outdoor support tool.',
    marginNote:'Good niche utility product; position as outdoor support tool, not emergency rescue device.',
    supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/mini-gps-multi-function-locator-road-search-treasure-outdoor-climbing-gps-tracker-mini-handheld-gps-positioning-p-094DC89C-2D2F-4726-868E-4F388BB7CF0E.html',warehouse:'China',estimatedProductCost:15.36,estimatedShipping:20,landedCost:35.36,status:'approved',notes:'Interesting outdoor utility product, needs claim control.'},
    seoTitle:'ASORTA TrailPoint Mini | Compact Outdoor Locator',
    seoDescription:'Compact outdoor utility locator for hiking, camping and travel support.'
  },
  {slug:'monitor-lightbar-ultra',name:'Monitor Lightbar Ultra',category:'desk-setup',price:64.95,compareAt:84.95,cost:42,hero:'/products/monitor-lightbar-ultra.svg',badge:'Next Candidate',short:'Clean desk lighting without screen glare.',description:'A highly visual desk upgrade for work, gaming and content setups. Candidate product pending supplier validation.',features:['Glare-reduced desk lighting','Minimal monitor mount','Warm/cool light modes','Clean setup aesthetic'],specs:['Status: pending CJ product link','Use: desk/gaming','Content potential: high','Refund risk: low-medium'],tags:['desk setup','lightbar','productivity'],shippingInfo:'Estimated delivery will be confirmed after supplier validation.',contentIdeas:['Desk setup transformation','Night productivity reel'],supplierNotes:'Find CJ supplier with stable mounting and brightness control.',marginNote:'Target price €64.95–€79.95 depending on landed cost.'}
]

export const featured = products.filter(p=>['asorta-ambientdrive-rgb','asorta-urban-sling-pro','asorta-drivecharge-mount','asorta-wavemic-rgb'].includes(p.slug))
export function getProduct(slug:string){return products.find(p=>p.slug===slug)}
export function getCategory(slug:string){return categories.find(c=>c.slug===slug)}
export function byCategory(slug:string){return products.filter(p=>p.category===slug)}

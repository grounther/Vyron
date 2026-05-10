export type ProductVariant = {
  name: string
  sku: string
  variantId?: string
  image: string
  stock?: number
}

export type ProductVideo = {
  src: string
  poster?: string
  label?: string
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
  videos?: ProductVideo[]
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
}

export const categories = [
  {slug:'tactical', name:'Tactical', text:'Everyday carry, utility bags and compact gear.'},
  {slug:'automotive', name:'Automotive', text:'Premium utility upgrades for your car interior.'},
  {slug:'desk-setup', name:'Desk Setup', text:'Clean desk tools for work, gaming and productivity.'},
  {slug:'gaming', name:'Gaming', text:'Creator and gaming setup accessories with utility.'},
  {slug:'smart-utility', name:'Smart Utility', text:'Useful tech gadgets for daily life.'},
  {slug:'outdoor', name:'Outdoor', text:'Compact gear for travel, camping and exploration.'},
]

const slingVariants: ProductVariant[] = [
  {name:'Black', sku:'CJYD192968902BY', image:'/products/urban-sling/2_ffc916c0-7b8f-4b11-a8a7-c2e014a62fe7.jpg', stock:14000},
  {name:'Khaki', sku:'CJYD192968901AZ', image:'/products/urban-sling/3_31a30eda-be7d-4b71-968d-df69e6c4db7e.jpg', stock:12000},
  {name:'Military Green', sku:'CJYD192968908HS', image:'/products/urban-sling/6_e300316b-cc39-4819-9cb7-6abb0edf6d9f.jpg', stock:13000},
  {name:'Jungle Digital', sku:'CJYD192968903CX', image:'/products/urban-sling/8_980c82d0-6843-4e79-8135-7bd1d1289564.jpg', stock:10000},
  {name:'Desert Digital', sku:'CJYD192968904DW', image:'/products/urban-sling/9_29e068c9-a53a-4f65-ba1c-5888297580d4.jpg', stock:10000},
  {name:'ACU Digital', sku:'CJYD192968906FU', image:'/products/urban-sling/10_a26a5d14-ed1c-4116-985b-8e511df9bc10.jpg', stock:10000},
  {name:'CP Camouflage', sku:'CJYD192968905EV', image:'/products/urban-sling/11_729a1692-0b02-4c9f-aa08-33492f9fb497.jpg', stock:10000},
  {name:'Sansha Camouflage', sku:'CJYD192968907GT', image:'/products/urban-sling/12_d2543173-b354-424a-922b-94fbfa1f6142.jpg', stock:10000},
]

export const products: Product[] = [
  {
    slug:'asorta-urban-sling-pro', name:'ASORTA Urban Sling Pro', category:'tactical', price:39.95, compareAt:59.95, cost:12.72,
    hero:slingVariants[0].image, images:['/products/urban-sling/1_ace802f3-71d0-45cf-8142-f61598698f75.jpg', ...slingVariants.map(v=>v.image), '/products/urban-sling/4_1739198069406306304.jpg','/products/urban-sling/5_1739198070148698112.jpg'], variants:slingVariants,
    badge:'Launch Pick', short:'Urban everyday carry sling with modern tactical utility.',
    description:'Designed for modern everyday carry. The ASORTA Urban Sling Pro combines tactical utility with a clean urban aesthetic for travel, commuting, daily essentials and lightweight gear organization.',
    features:['Water-resistant exterior','Adjustable crossbody fit','Multi-compartment storage','Lightweight utility design','Urban tactical aesthetic'],
    specs:['Category: Tactical / EDC','Product cost: €3.41','Estimated shipping: €9.31','Estimated landed cost: ± €12.72','Processing: 1–3 days for 90% orders','Delivery estimate: 7–15 days'],
    boxItems:['1× ASORTA Urban Sling Pro','Adjustable crossbody strap','Protective supplier packaging'], tags:['edc','sling bag','tactical','urban utility','travel'], shippingInfo:'Estimated delivery: 7–15 business days after processing. Tracked shipping included.',
    contentIdeas:['EDC loadout video','Travel day carry setup','Before/after pocket dump','Urban commute POV'], supplierNotes:'Approved CJ product. Prefer Black/Khaki/Military Green for ASORTA positioning.', marginNote:'Launch price preserves VAT, support reserve and future marketing room.',
    supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/outdoor-wear-resistant-sports-chest-bag-p-1739198066604904448.html',warehouse:'China',estimatedProductCost:3.41,estimatedShipping:9.31,landedCost:12.72,status:'approved',notes:'Strong ASORTA fit, low technical defect risk.',productId:'CJYD1929689',variantIds:slingVariants.map(v=>v.sku),variants:slingVariants.map(v=>v.name),processingTime:'1–3 days for 90% orders',deliveryTime:'7–15 days'}
  },
  {
    slug:'asorta-drivecharge-mount', name:'ASORTA DriveCharge Mount', category:'automotive', price:59.95, compareAt:79.95, cost:34,
    hero:'/products/drivecharge/1_1c3d32e3-9eb6-47f9-b217-e2911571c64a.jpg', images:['/products/drivecharge/1_1c3d32e3-9eb6-47f9-b217-e2911571c64a.jpg','/products/drivecharge/2_67314391-8202-4ace-a14a-1c4b6f85efc1.jpg','/products/drivecharge/3_0ac1de8f-405a-4f22-85f8-3746eadfb6bf.jpg','/products/drivecharge/5_d854aee6-7914-4ce1-a5db-8aee941184b3.jpg','/products/drivecharge/13_99d408a4-2bbd-41f4-a3e8-0fc05e190202.jpg'],
    videos:[{src:'/products/drivecharge/CJSJ1244113_1778344611993 (Videos)/1_a06cc3e61d9e71efbff35420848d0102.mp4',poster:'/products/drivecharge/1_1c3d32e3-9eb6-47f9-b217-e2911571c64a.jpg',label:'Product demo'},{src:'/products/drivecharge/CJSJ1244113_1778344611993 (Videos)/1_d04df6341d9e71ef83c65017f0f90102.mp4',poster:'/products/drivecharge/2_67314391-8202-4ace-a14a-1c4b6f85efc1.jpg',label:'Usage preview'}],
    variants:[{name:'Plus Version',sku:'CJSJ1244113-PLUS',image:'/products/drivecharge/1_1c3d32e3-9eb6-47f9-b217-e2911571c64a.jpg',stock:10000},{name:'Set Plus Version',sku:'CJSJ1244113-SETPLUS',image:'/products/drivecharge/2_67314391-8202-4ace-a14a-1c4b6f85efc1.jpg',stock:10000}],
    badge:'Smart Car', short:'Automatic wireless charging mount for modern drivers.', description:'A clean and intelligent charging solution for modern drivers. The ASORTA DriveCharge Mount combines automatic clamping technology with wireless charging for a seamless dashboard experience.',
    features:['Wireless charging','Automatic sensor clamp','One-hand operation','Dashboard and vent compatible','Clean premium design'], specs:['Category: Automotive','Estimated landed cost: ± €34','Warehouse: China','Recommended retail price: €59.95 incl. VAT','USB-only variant removed from ASORTA launch'], boxItems:['1× wireless charging phone holder','1× mounting clip/base set','1× charging cable','Supplier packaging'], tags:['car mount','wireless charging','automotive','dashboard','phone holder'], shippingInfo:'Estimated delivery: 5–12 business days. Tracked shipping included.', contentIdeas:['Drop-and-charge demo','Clean dashboard setup','Commute setup reel','Cable-free cockpit transformation'], supplierNotes:'Check charging speed, phone compatibility and heat complaints before scaling.', marginNote:'Good margin if quality is stable; avoid overclaiming MagSafe compatibility unless confirmed.', supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/infrared-induction-car-wireless-charger-car-phone-holder-p-1424257508926689280.html',warehouse:'China',estimatedProductCost:14,estimatedShipping:20,landedCost:34,status:'approved',notes:'Evergreen automotive utility product.'}
  },
  {
    slug:'asorta-ambientdrive-rgb', name:'ASORTA AmbientDrive RGB', category:'automotive', price:89.95, compareAt:119.95, cost:42,
    hero:'/products/ambientdrive/1_1620630875996.jpg', images:['/products/ambientdrive/1_1620630875996.jpg','/products/ambientdrive/2_1620630875992.jpg','/products/ambientdrive/3_1620630875991.jpg','/products/ambientdrive/4_1620630875994.jpg','/products/ambientdrive/5_1620630884404.jpg'], variants:[{name:'Dual Remote 24 Button Kit',sku:'CJQT112130701AZ',image:'/products/ambientdrive/1_1620630875996.jpg',stock:40000}],
    badge:'High Priority', short:'Premium interior ambient lighting with strong visual impact.', description:'Transform your interior with immersive ambient lighting. Designed to create a premium nighttime driving atmosphere with customizable RGB illumination and a high-end interior feel.',
    features:['Multi-color RGB lighting','Dual remote control','Music-reactive modes','Premium interior ambiance','Universal vehicle compatibility'], specs:['Category: Automotive','SKU: CJQT112130701AZ','Factory stock: 40.000+','Estimated landed cost: ± €42','Warehouse: China','Refund risk: Medium'], boxItems:['1× ambient light kit','2× remote controls','LED light strips/modules','Connection wiring','Supplier packaging'], tags:['ambient lighting','rgb car','automotive','led interior','night drive'], shippingInfo:'Estimated delivery: 6–12 business days. Tracked shipping included.', contentIdeas:['Before/after night interior','Luxury car vibe transformation','Install timelapse','Night drive POV'], supplierNotes:'Traffic product. Needs clear installation expectations and honest compatibility copy.', marginNote:'Strong premium pricing is justified by high perceived value and visual impact.', supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/dual-remote-24-button-ambient-light-p-1391653099806003200.html',warehouse:'China',estimatedProductCost:22,estimatedShipping:20,landedCost:42,status:'high-priority',notes:'Likely first viral traffic product.',productId:'CJQT1121307',variantIds:['CJQT112130701AZ'],variants:['Dual Remote 24 Button Kit']}
  },
  {
    slug:'asorta-wavemic-rgb', name:'ASORTA WaveMic RGB', category:'gaming', price:109.95, compareAt:139.95, cost:48,
    hero:'/products/wavemic/1_a09d4f0d-2641-4a83-9da9-58e22e5d8d55.jpg', images:['/products/wavemic/1_a09d4f0d-2641-4a83-9da9-58e22e5d8d55.jpg','/products/wavemic/2_34f76069-9cb7-4276-bde6-2e9f2f5893ca.jpg','/products/wavemic/3_b508968e-6521-4361-a8ed-4d1c37d180b5.jpg','/products/wavemic/4_8481a7ae-58a1-4ca4-a5ed-b3703f603876.jpg','/products/wavemic/5_e4df1182-3fb5-4fc9-8820-60af32013b7d.jpg'], variants:[{name:'RGB Desktop Microphone',sku:'CJYD184184201AZ',image:'/products/wavemic/1_a09d4f0d-2641-4a83-9da9-58e22e5d8d55.jpg',stock:13000}],
    badge:'Creator Setup', short:'RGB desktop microphone for creators, gamers and clean setups.', description:'Built for creators, gamers and modern desk setups. The ASORTA WaveMic RGB delivers a creator-style look with plug-and-play utility and a premium desk aesthetic.', features:['RGB lighting','Streaming-ready design','USB connectivity','Modern desk aesthetic','Plug-and-play setup'], specs:['Category: Gaming / Desk Setup','SKU: CJYD184184201AZ','Factory stock: 13.000+','Estimated landed cost: ± €48','Warehouse: China'], boxItems:['1× RGB desktop microphone','1× stand/base','1× USB cable','Supplier packaging'], tags:['gaming microphone','rgb setup','streaming','desk setup','creator'], shippingInfo:'Estimated delivery: 6–12 business days. Tracked shipping included.', contentIdeas:['Streamer desk setup','RGB setup glow-up','Before/after audio desk upgrade','Creator workspace reel'], supplierNotes:'Quality control matters. Audio products need honest expectations and clear compatibility.', marginNote:'Higher ticket item with good perceived value, but support risk is higher than non-electronics.', supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/desktop-microphone-live-conference-microphone-p-1699966126878371840.html',warehouse:'China',estimatedProductCost:28,estimatedShipping:20,landedCost:48,status:'approved',notes:'Good niche product, not main hero.',productId:'CJYD1841842',variantIds:['CJYD184184201AZ'],variants:['RGB Desktop Microphone']}
  },
  {
    slug:'asorta-trailpoint-mini', name:'ASORTA TrailPoint Mini', category:'outdoor', price:64.95, compareAt:84.95, cost:36,
    hero:'/products/gps/1_f6ad23a2-5a67-4fd1-8c98-803f658e6409.jpg', images:['/products/gps/1_f6ad23a2-5a67-4fd1-8c98-803f658e6409.jpg','/products/gps/2_1771837587297.png','/products/gps/3_5936486993859.png','/products/gps/4_47368069987.png','/products/gps/5_1303093149460.png'], variants:[{name:'Green',sku:'CJQCQCQC00271-Green',image:'/products/gps/1_f6ad23a2-5a67-4fd1-8c98-803f658e6409.jpg',stock:13000}],
    badge:'Outdoor Utility', short:'Compact outdoor navigation utility for travel and exploration.', description:'Compact navigation utility for outdoor exploration. Designed for hiking, camping and lightweight travel support with a modern minimalist form factor.', features:['Compact outdoor design','Lightweight utility build','Navigation support','Portable form factor','Adventure-ready aesthetic'], specs:['Category: Outdoor Utility','Variant: Green only','SKU: CJQCQCQC00271-Green','Factory stock: 13.000+','Estimated landed cost: ± €36','Do not position as emergency rescue device'], boxItems:['1× ASORTA TrailPoint Mini in Green','1× basic accessory set where supplied','Supplier packaging'], tags:['gps','outdoor','hiking','utility gadget','camping'], shippingInfo:'Estimated delivery: 6–12 business days. Tracked shipping included.', contentIdeas:['Hiking gear loadout','Camping utility kit','Outdoor exploration POV','Travel backup tool'], supplierNotes:'Do not make false GPS claims. Confirm whether it is true GPS, GPS assist or basic locator before scaling.', marginNote:'Good niche utility product; position as outdoor support tool, not emergency rescue device.', supplier:{name:'CJ Dropshipping',productUrl:'https://cjdropshipping.com/product/mini-gps-multi-function-locator-road-search-treasure-outdoor-climbing-gps-tracker-mini-handheld-gps-positioning-p-094DC89C-2D2F-4726-868E-4F388BB7CF0E.html',warehouse:'China',estimatedProductCost:16,estimatedShipping:20,landedCost:36,status:'approved',notes:'Interesting outdoor utility product, needs claim control.',productId:'CJQCQCQC00271',variantIds:['CJQCQCQC00271-Green'],variants:['Green']}
  },
  {slug:'monitor-lightbar-ultra',name:'Monitor Lightbar Ultra',category:'desk-setup',price:64.95,compareAt:84.95,cost:42,hero:'/products/monitor-lightbar-ultra.svg',badge:'Next Candidate',short:'Clean desk lighting without screen glare.',description:'A highly visual desk upgrade for work, gaming and content setups. Candidate product pending supplier validation.',features:['Glare-reduced desk lighting','Minimal monitor mount','Warm/cool light modes','Clean setup aesthetic'],specs:['Status: pending CJ product link','Use: desk/gaming','Content potential: high','Refund risk: low-medium'],tags:['desk setup','lightbar','productivity'],shippingInfo:'Estimated delivery will be confirmed after supplier validation.',contentIdeas:['Desk setup transformation','Night productivity reel'],supplierNotes:'Find CJ supplier with stable mounting and brightness control.',marginNote:'Target price €64.95–€79.95 depending on landed cost.'}
]

export const featured = products.filter(p=>['asorta-ambientdrive-rgb','asorta-urban-sling-pro','asorta-drivecharge-mount','asorta-wavemic-rgb'].includes(p.slug))
export function getProduct(slug:string){return products.find(p=>p.slug===slug)}
export function getCategory(slug:string){return categories.find(c=>c.slug===slug)}
export function byCategory(slug:string){return products.filter(p=>p.category===slug)}

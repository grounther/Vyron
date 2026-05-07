'use client'

type CartProduct={slug:string;name:string;price:number;hero:string}
export default function AddToCartButton({product}:{product:CartProduct}){
  function add(){
    const key='vyron_cart'
    const current=JSON.parse(localStorage.getItem(key)||'[]')
    const found=current.find((i:any)=>i.slug===product.slug)
    if(found) found.qty+=1
    else current.push({...product,qty:1})
    localStorage.setItem(key,JSON.stringify(current))
    window.dispatchEvent(new Event('vyron-cart'))
  }
  return <button onClick={add} className="btn-primary w-full py-4 text-base md:text-lg">Add to Cart</button>
}

import SearchClient from '@/components/SearchClient'
import { getProducts } from '@/lib/catalog'

export default async function Search(){
  const products = await getProducts()
  return <SearchClient products={products}/>
}

import { cookies } from 'next/headers'
import { getDictionary, normalizeLocale, type Locale } from './config'

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies()
  return normalizeLocale(store.get('asorta_lang')?.value)
}

export async function getServerDictionary() {
  return getDictionary(await getServerLocale())
}

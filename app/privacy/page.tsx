import { getSiteContent, splitParagraphs } from '@/lib/site-content'

export default async function Privacy(){
  const content = await getSiteContent()
  return <main className="mx-auto max-w-4xl px-5 py-12"><h1 className="text-5xl font-black">{content['privacy.title']}</h1><div className="card mt-8 rounded-3xl p-8 text-white/65">{splitParagraphs(content['privacy.body']).map((p)=><p key={p} className="mt-4 first:mt-0">{p}</p>)}</div></main>
}

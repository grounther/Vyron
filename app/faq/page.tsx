import { getSiteContent, parseFaqItems } from '@/lib/site-content'

export default async function FAQ(){
  const content = await getSiteContent()
  const faqs = parseFaqItems(content['faq.items'])
  return <main className="mx-auto max-w-4xl px-5 py-12">
    <h1 className="text-5xl font-black">{content['faq.title']}</h1>
    <div className="mt-8 grid gap-4">
      {faqs.map(({question, answer})=><div key={question} className="card rounded-3xl p-6"><h2 className="font-black">{question}</h2><p className="mt-3 text-white/60">{answer}</p></div>)}
    </div>
  </main>
}

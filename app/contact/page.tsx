import { getSiteContent } from '@/lib/site-content'
import ContactClient from './ContactClient'

export default async function Contact(){
  const content = await getSiteContent()
  return <ContactClient content={content} />
}

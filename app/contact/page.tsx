import { getSiteContent } from '@/lib/site-content'
import ContactClient from './ContactClient'

export default async function Contact(){
  const content = await getSiteContent()
  return <ContactClient title={content['contact.title'] || 'Contact'} text={content['contact.text'] || 'Neem contact op met ASORTA Support.'} />
}

import AdminAccessClient from './AdminAccessClient'

export const metadata = {
  title: 'Access | ASORTA',
  robots: { index: false, follow: false },
}

type AtlasAccessSearchParams = Promise<{ next?: string; error?: string }>

export default async function AtlasAccessPage({ searchParams }: { searchParams: AtlasAccessSearchParams }) {
  const params = await searchParams
  return <main className="mx-auto max-w-md px-4 py-16 md:px-6">
    <AdminAccessClient next={params?.next || '/atlas'} error={params?.error} />
  </main>
}

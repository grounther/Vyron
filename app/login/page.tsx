import LoginClient from './LoginClient'

export const metadata = { title: 'Login | ASORTA' }

type LoginSearchParams = Promise<{ next?: string; mode?: string }>

export default async function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  const params = await searchParams
  return <main className="mx-auto max-w-md px-4 py-16 md:px-6">
    <LoginClient next={params?.next || '/account'} mode={params?.mode === 'register' ? 'register' : 'login'} />
  </main>
}

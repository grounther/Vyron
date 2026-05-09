import LoginClient from './LoginClient'

export const metadata = { title: 'Login | ASORTA' }

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return <main className="mx-auto max-w-md px-4 py-16 md:px-6">
    <LoginClient next={searchParams?.next || '/account'} />
  </main>
}

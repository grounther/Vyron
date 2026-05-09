import LoginClient from '../login/LoginClient'

export const metadata = { title: 'Register | ASORTA' }

type RegisterSearchParams = Promise<{ next?: string }>

export default async function RegisterPage({ searchParams }: { searchParams: RegisterSearchParams }) {
  const params = await searchParams
  return <main className="mx-auto max-w-md px-4 py-16 md:px-6">
    <LoginClient next={params?.next || '/account'} mode="register" />
  </main>
}

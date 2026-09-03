import { RegistrationForm } from "./registration-form"

export const dynamic = "force-dynamic"

export default async function PromoRegistrationPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-4 py-10 bg-[linear-gradient(180deg,#1a0a00_0%,#2d1200_45%,#1a0a00_100%)]">
      <RegistrationForm storeId={decodeURIComponent(storeId)} />
    </main>
  )
}

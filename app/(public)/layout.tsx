import Link from 'next/link'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* 상단 고정 헤더 - 로고만 표시 */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-white px-4">
        <Link href="/" className="text-lg font-bold">
          KEIO SHARE
        </Link>
      </header>
      <main>{children}</main>
    </>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-white px-4">
        <Link href="/" className="text-lg font-bold">
          Jukulog
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">로그인</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">회원가입</Link>
          </Button>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}

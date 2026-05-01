export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* 어드민 헤더 - 상단 고정 */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4">
        {/* 앱 이름 */}
        <span className="text-base font-bold tracking-tight">KEIO SHARE</span>
        {/* 어드민 배지 */}
        <span className="text-xs font-medium text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full">
          관리자
        </span>
      </header>

      {/* 어드민 콘텐츠 영역 */}
      <main>{children}</main>
    </>
  )
}

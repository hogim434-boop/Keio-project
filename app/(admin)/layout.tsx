export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-white px-4">
        <span className="text-lg font-bold">塾ログ</span>
        <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">
          관리자 패널
        </span>
      </header>
      <main>{children}</main>
    </>
  )
}

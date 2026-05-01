export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header className="border-b px-4 py-3 text-sm font-medium text-muted-foreground">
        어드민
      </header>
      <main>{children}</main>
    </>
  )
}

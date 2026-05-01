import { BottomTabBar } from '@/components/bottom-tab-bar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <main className="pb-[56px]">{children}</main>
      <BottomTabBar />
    </>
  )
}

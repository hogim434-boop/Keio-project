export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* 배경 오브 레이어 — fixed로 body max-width 제약 벗어남, z-[-1]로 콘텐츠 뒤에 위치 */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div
          className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, oklch(0.75 0.12 280), transparent 70%)',
            filter: 'blur(80px)',
            animation: 'orb-drift-1 14s ease-in-out infinite alternate',
            willChange: 'transform',
          }}
        />
        <div
          className="absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, oklch(0.82 0.08 200), transparent 70%)',
            filter: 'blur(70px)',
            animation: 'orb-drift-2 18s ease-in-out infinite alternate-reverse',
            willChange: 'transform',
          }}
        />
      </div>
      <main>{children}</main>
    </>
  )
}

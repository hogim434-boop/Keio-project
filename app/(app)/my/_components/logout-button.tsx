'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  // 사용자가 시스템 설정에서 "모션 줄이기"를 활성화한 경우 애니메이션 비활성화
  const shouldReduce = useReducedMotion()

  return (
    /*
     * motion.div로 Button 감싸기 — 버튼 자체가 아닌 래퍼에서 hover/tap 처리
     * hover: scale:1.01 (미묘한 확대 — 클릭 유도)
     * tap: scale:0.97 (살짝 눌리는 피드백)
     */
    <motion.div
      whileHover={shouldReduce ? {} : { scale: 1.01 }}
      whileTap={shouldReduce ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      <Button
        variant="outline"
        className="w-full"
        onClick={() => alert('로그아웃 기능은 Task 006에서 구현됩니다')}
      >
        로그아웃
      </Button>
    </motion.div>
  )
}

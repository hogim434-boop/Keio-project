import type { Campus, Grade } from '@/types/domain'

/**
 * 도메인 enum 의 저장값(`CAMPUS_VALUES`, `GRADE_VALUES`) 을 UI 표시용 일본어 라벨로 변환.
 *
 * 저장값은 호환성을 위해 그대로 두고(현 DB CHECK 제약과 일치), UI 노출 시점에만 일본어로 매핑.
 * 향후 저장값 자체를 일본어로 통일하는 마이그레이션 시에는 이 매핑을 identity 로 단순화 가능.
 */

const CAMPUS_LABELS: Record<Campus, string> = {
  미타: '三田',
  히요시: '日吉',
  SFC: 'SFC',
  야가미: '矢上',
  시나노마치: '信濃町',
  시바공립: '芝共立',
}

export function getCampusLabel(value: Campus): string {
  return CAMPUS_LABELS[value]
}

export function getGradeLabel(value: Grade): string {
  return value === '대학원' ? '大学院' : `${value}年生`
}

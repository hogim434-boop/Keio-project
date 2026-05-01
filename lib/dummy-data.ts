export type Campus = '三田' | '日吉' | 'SFC'

export type DummyRatings = {
  overall: number
  attendance: number
  examDifficulty: number
  gradingEase: number
  teachingStyle: number
}

export type DummyCourse = {
  id: string
  name: string
  professor: string
  campus: Campus
  department: string
  avgRating: number
  reviewCount: number
  ratings: DummyRatings
}

export type DummyReview = {
  id: string
  courseId: string
  comment: string
  ratings: DummyRatings
  createdAt: string
}

export const DUMMY_COURSES: DummyCourse[] = [
  {
    id: 'course-1',
    name: '経済学概論',
    professor: '田中 誠一',
    campus: '三田',
    department: '経済学部',
    avgRating: 4.2,
    reviewCount: 38,
    ratings: { overall: 4.2, attendance: 3.5, examDifficulty: 3.8, gradingEase: 4.0, teachingStyle: 4.5 },
  },
  {
    id: 'course-2',
    name: '日本語文学史',
    professor: '佐藤 美咲',
    campus: '三田',
    department: '文学部',
    avgRating: 3.8,
    reviewCount: 22,
    ratings: { overall: 3.8, attendance: 4.2, examDifficulty: 2.9, gradingEase: 3.5, teachingStyle: 4.0 },
  },
  {
    id: 'course-3',
    name: '線形代数学',
    professor: '鈴木 浩二',
    campus: '日吉',
    department: '理工学部',
    avgRating: 3.2,
    reviewCount: 45,
    ratings: { overall: 3.2, attendance: 2.8, examDifficulty: 4.5, gradingEase: 2.5, teachingStyle: 3.0 },
  },
  {
    id: 'course-4',
    name: '国際関係論',
    professor: '山田 花子',
    campus: '三田',
    department: '法学部',
    avgRating: 4.5,
    reviewCount: 61,
    ratings: { overall: 4.5, attendance: 3.0, examDifficulty: 3.2, gradingEase: 4.2, teachingStyle: 4.8 },
  },
  {
    id: 'course-5',
    name: 'プログラミング基礎',
    professor: '高橋 大輔',
    campus: 'SFC',
    department: '総合政策学部',
    avgRating: 4.7,
    reviewCount: 83,
    ratings: { overall: 4.7, attendance: 3.5, examDifficulty: 2.8, gradingEase: 4.5, teachingStyle: 4.9 },
  },
  {
    id: 'course-6',
    name: '哲学入門',
    professor: '伊藤 光男',
    campus: '日吉',
    department: '文学部',
    avgRating: 3.5,
    reviewCount: 17,
    ratings: { overall: 3.5, attendance: 4.0, examDifficulty: 3.0, gradingEase: 3.2, teachingStyle: 3.8 },
  },
  {
    id: 'course-7',
    name: '会計学基礎',
    professor: '渡辺 京子',
    campus: '三田',
    department: '商学部',
    avgRating: 4.0,
    reviewCount: 54,
    ratings: { overall: 4.0, attendance: 3.8, examDifficulty: 3.5, gradingEase: 3.9, teachingStyle: 4.2 },
  },
  {
    id: 'course-8',
    name: '環境政策論',
    professor: '中村 健太',
    campus: 'SFC',
    department: '環境情報学部',
    avgRating: 4.3,
    reviewCount: 29,
    ratings: { overall: 4.3, attendance: 2.5, examDifficulty: 3.0, gradingEase: 4.0, teachingStyle: 4.6 },
  },
  {
    id: 'course-9',
    name: '統計学',
    professor: '小林 雅之',
    campus: '日吉',
    department: '経済学部',
    avgRating: 3.7,
    reviewCount: 72,
    ratings: { overall: 3.7, attendance: 3.2, examDifficulty: 4.2, gradingEase: 3.0, teachingStyle: 3.5 },
  },
  {
    id: 'course-10',
    name: '憲法',
    professor: '加藤 純子',
    campus: '三田',
    department: '法学部',
    avgRating: 4.1,
    reviewCount: 41,
    ratings: { overall: 4.1, attendance: 4.5, examDifficulty: 3.8, gradingEase: 3.5, teachingStyle: 4.0 },
  },
]

export const DUMMY_REVIEWS: DummyReview[] = [
  {
    id: 'review-1-1',
    courseId: 'course-1',
    comment: '先生の説明がとても分かりやすく、経済学の基礎がしっかり身につきました。',
    ratings: { overall: 4.5, attendance: 3.5, examDifficulty: 3.5, gradingEase: 4.0, teachingStyle: 5.0 },
    createdAt: '2026-04-10',
  },
  {
    id: 'review-1-2',
    courseId: 'course-1',
    comment: '毎回の授業が充実していて、教科書もよく整理されています。試験は普通レベル。',
    ratings: { overall: 4.0, attendance: 3.5, examDifficulty: 4.0, gradingEase: 4.0, teachingStyle: 4.0 },
    createdAt: '2026-04-12',
  },
  {
    id: 'review-2-1',
    courseId: 'course-2',
    comment: '文学の奥深さを学べる授業です。出席は厳しめですが内容は面白い。',
    ratings: { overall: 4.0, attendance: 4.5, examDifficulty: 3.0, gradingEase: 3.5, teachingStyle: 4.0 },
    createdAt: '2026-04-08',
  },
  {
    id: 'review-2-2',
    courseId: 'course-2',
    comment: 'レポート中心の評価で、テストがない点が良かったです。',
    ratings: { overall: 3.5, attendance: 4.0, examDifficulty: 2.8, gradingEase: 3.5, teachingStyle: 4.0 },
    createdAt: '2026-04-15',
  },
  {
    id: 'review-3-1',
    courseId: 'course-3',
    comment: '数学が苦手な人には難しい。でも先生のサポートは手厚い。',
    ratings: { overall: 3.0, attendance: 2.5, examDifficulty: 4.8, gradingEase: 2.5, teachingStyle: 3.0 },
    createdAt: '2026-04-05',
  },
  {
    id: 'review-3-2',
    courseId: 'course-3',
    comment: '理工学部必修。しっかり勉強すれば単位は取れます。',
    ratings: { overall: 3.5, attendance: 3.0, examDifficulty: 4.2, gradingEase: 2.5, teachingStyle: 3.0 },
    createdAt: '2026-04-18',
  },
  {
    id: 'review-4-1',
    courseId: 'course-4',
    comment: '国際問題について多角的に考えられるようになりました。おすすめの授業！',
    ratings: { overall: 4.8, attendance: 3.0, examDifficulty: 3.0, gradingEase: 4.5, teachingStyle: 5.0 },
    createdAt: '2026-04-07',
  },
  {
    id: 'review-4-2',
    courseId: 'course-4',
    comment: '討論形式の授業が多く、積極的に参加できる雰囲気が良い。',
    ratings: { overall: 4.2, attendance: 3.0, examDifficulty: 3.5, gradingEase: 4.0, teachingStyle: 4.5 },
    createdAt: '2026-04-20',
  },
  {
    id: 'review-5-1',
    courseId: 'course-5',
    comment: 'プログラミング未経験でも安心して参加できます。丁寧なサポートあり。',
    ratings: { overall: 5.0, attendance: 3.5, examDifficulty: 2.5, gradingEase: 4.5, teachingStyle: 5.0 },
    createdAt: '2026-04-09',
  },
  {
    id: 'review-5-2',
    courseId: 'course-5',
    comment: '実践的な課題が多く、就活にも役立ちそう。SFCらしい授業。',
    ratings: { overall: 4.5, attendance: 3.5, examDifficulty: 3.0, gradingEase: 4.5, teachingStyle: 4.8 },
    createdAt: '2026-04-14',
  },
  {
    id: 'review-6-1',
    courseId: 'course-6',
    comment: '哲学の基礎から学べます。出席管理が厳しめなので注意。',
    ratings: { overall: 3.5, attendance: 4.2, examDifficulty: 2.8, gradingEase: 3.0, teachingStyle: 3.5 },
    createdAt: '2026-04-11',
  },
  {
    id: 'review-6-2',
    courseId: 'course-6',
    comment: '内容は面白いが、レポートの量が多い。時間管理が大切。',
    ratings: { overall: 3.5, attendance: 3.8, examDifficulty: 3.2, gradingEase: 3.5, teachingStyle: 4.0 },
    createdAt: '2026-04-16',
  },
  {
    id: 'review-7-1',
    courseId: 'course-7',
    comment: '会計の基礎をしっかり学べます。資格勉強にもつながります。',
    ratings: { overall: 4.2, attendance: 3.8, examDifficulty: 3.5, gradingEase: 4.0, teachingStyle: 4.2 },
    createdAt: '2026-04-06',
  },
  {
    id: 'review-7-2',
    courseId: 'course-7',
    comment: '授業のスピードが速いので予習が重要。でも内容は充実している。',
    ratings: { overall: 3.8, attendance: 3.8, examDifficulty: 3.5, gradingEase: 3.8, teachingStyle: 4.2 },
    createdAt: '2026-04-17',
  },
  {
    id: 'review-8-1',
    courseId: 'course-8',
    comment: 'SFCらしい環境問題へのアプローチ。実際の政策を学べる。',
    ratings: { overall: 4.5, attendance: 2.5, examDifficulty: 3.0, gradingEase: 4.2, teachingStyle: 4.8 },
    createdAt: '2026-04-13',
  },
  {
    id: 'review-8-2',
    courseId: 'course-8',
    comment: 'グループワークが多く、様々な学部の友達ができました。',
    ratings: { overall: 4.0, attendance: 2.5, examDifficulty: 3.0, gradingEase: 3.8, teachingStyle: 4.5 },
    createdAt: '2026-04-19',
  },
  {
    id: 'review-9-1',
    courseId: 'course-9',
    comment: '統計学の基礎から応用まで幅広く学べます。就活に役立つ。',
    ratings: { overall: 4.0, attendance: 3.2, examDifficulty: 4.0, gradingEase: 3.2, teachingStyle: 3.8 },
    createdAt: '2026-04-04',
  },
  {
    id: 'review-9-2',
    courseId: 'course-9',
    comment: '試験が難しめ。でも問題演習を繰り返せば単位は取れます。',
    ratings: { overall: 3.5, attendance: 3.2, examDifficulty: 4.5, gradingEase: 2.8, teachingStyle: 3.2 },
    createdAt: '2026-04-21',
  },
  {
    id: 'review-10-1',
    courseId: 'course-10',
    comment: '憲法の条文解釈を丁寧に教えてくれます。出席は厳格。',
    ratings: { overall: 4.2, attendance: 4.8, examDifficulty: 4.0, gradingEase: 3.5, teachingStyle: 4.0 },
    createdAt: '2026-04-03',
  },
  {
    id: 'review-10-2',
    courseId: 'course-10',
    comment: '法学部の必修科目。しっかり勉強すれば良い成績が取れる。',
    ratings: { overall: 4.0, attendance: 4.2, examDifficulty: 3.5, gradingEase: 3.5, teachingStyle: 4.0 },
    createdAt: '2026-04-22',
  },
]

export function getReviewsByCourseId(courseId: string): DummyReview[] {
  return DUMMY_REVIEWS.filter((r) => r.courseId === courseId)
}

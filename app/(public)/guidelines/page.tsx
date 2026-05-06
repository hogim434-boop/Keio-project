/**
 * /guidelines — コミュニティガイドライン 정적 페이지
 *
 * Server Component. LegalPageShell 사용. 6 섹션 일본어 카피.
 * 회원가입 setup 단계 동의 체크박스의 link 대상 (target="_blank").
 */

import { LegalPageShell } from '../_components/legal-page-shell'

export const metadata = {
  title: 'コミュニティガイドライン | KEIO SHARE',
}

export default function GuidelinesPage() {
  return (
    <LegalPageShell title="コミュニティガイドライン" lastUpdated="2026年5月8日">
      <section>
        <h2 className="text-xl font-semibold mb-3">1. KEIO SHAREの目的</h2>
        <p>
          KEIO SHARE は、慶應義塾大学の在学生による匿名コミュニティです。学業・キャンパスライフ・進路・サークル活動など、学生同士の本音を安全に共有することを目的としています。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">2. 投稿時のルール</h2>
        <p className="mb-3">本サービスでは、以下の行為を禁止します。</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>暴言・誹謗中傷</li>
          <li>名誉毀損・侮辱</li>
          <li>個人を特定できる情報の投稿(実名・所属の特定など)</li>
          <li>性的ハラスメント・差別的表現</li>
          <li>違法行為の勧誘・薬物・器物損壊などに関する内容</li>
          <li>スパム・無関係な広告・営利目的の宣伝</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">3. 匿名性とプライバシー</h2>
        <p>
          匿名投稿であっても、書き込みの責任は投稿者本人にあります。他人の個人情報(氏名・住所・連絡先・SNSアカウント等)を投稿することは禁止です。法令違反があった場合、運営者は適切に対応します。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">4. 通報と運営対応</h2>
        <p>
          違反を発見した場合は、各投稿の通報機能をご利用ください。運営は通報を受けてから48時間以内の対応を目標とし、内容に応じて削除または棄却を判断します。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">5. 違反時の措置</h2>
        <p className="mb-3">違反内容に応じて、以下のいずれかの措置を行います。</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>警告の通知</li>
          <li>該当投稿の削除</li>
          <li>一時的な利用停止</li>
          <li>アカウントの永久停止</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">6. 改訂について</h2>
        <p>
          本ガイドラインは予告なく改訂される場合があります。改訂後も本サービスを継続して利用される場合、新しい内容に同意したものとみなします。
        </p>
      </section>
    </LegalPageShell>
  )
}

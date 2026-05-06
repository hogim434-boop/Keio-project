/**
 * /terms — 利用規約 정적 페이지
 *
 * Server Component. LegalPageShell 재사용. 第1条〜第10条 일본어 카피.
 * 회원가입 setup 단계 동의 체크박스의 link 대상 (target="_blank").
 */

import { LegalPageShell } from '../_components/legal-page-shell'

export const metadata = {
  title: '利用規約 | KEIO SHARE',
}

export default function TermsPage() {
  return (
    <LegalPageShell title="利用規約" lastUpdated="2026年5月8日">
      {/* 第1条: 定義 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">第1条（定義）</h2>
        <p>
          本規約において「本サービス」とは、運営者が提供する匿名コミュニティサービス「KEIO SHARE」を指します。「会員」とは、本規約に同意したうえで本サービスを利用する者をいいます。
        </p>
      </section>

      {/* 第2条: 会員資格 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">第2条（会員資格）</h2>
        <p>
          本サービスは、慶應義塾大学が発行する keio.jp ドメインのメールアドレスを保有する在学生のみが利用できます。1人につき1アカウントの登録に限り、第三者へのなりすましや keio.jp ドメイン以外での登録は発覚次第、即時利用停止とします。
        </p>
      </section>

      {/* 第3条: 本サービスの内容 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">第3条（本サービスの内容）</h2>
        <p>
          本サービスは、匿名での投稿・コメント・いいね・ブックマーク・通報などの機能を提供します。コンテンツは会員のみ閲覧可能であり、一般公開はしません。
        </p>
      </section>

      {/* 第4条: 禁止事項 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">第4条（禁止事項）</h2>
        <p>
          会員が行ってはならない行為は、別途定める「コミュニティガイドライン」に委ねます。同ガイドラインへの違反は、本規約への違反とみなします。
        </p>
      </section>

      {/* 第5条: 会員の責任 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">第5条（会員の責任）</h2>
        <p>
          投稿内容に関する責任は投稿者本人に帰属します。匿名投稿であっても法令に違反する行為が確認された場合、運営者は適切に対応します。
        </p>
      </section>

      {/* 第6条: 運営者の権限 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">第6条（運営者の権限）</h2>
        <p>
          運営者は、本規約またはコミュニティガイドラインに違反する投稿を予告なく削除できます。また、違反が認められた会員に対して、一時的または永久的な利用停止措置を取ることができます。
        </p>
      </section>

      {/* 第7条: 本サービスの変更・終了 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">第7条（本サービスの変更・終了）</h2>
        <p>
          運営者は、事前に通知したうえで本サービスの内容を変更し、または提供を終了することができます。
        </p>
      </section>

      {/* 第8条: 免責事項 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">第8条（免責事項）</h2>
        <p>
          運営者は、故意または重大な過失がない限り、本サービスの利用によって生じた損害について責任を負いません。
        </p>
      </section>

      {/* 第9条: 準拠法・管轄 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">第9条（準拠法・管轄）</h2>
        <p>
          本規約は日本法に準拠します。本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
        </p>
      </section>

      {/* 第10条: 本規約の改訂 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">第10条（本規約の改訂）</h2>
        <p>
          運営者は、必要に応じて本規約を改訂することがあります。改訂後も本サービスを継続して利用された場合、新しい規約に同意したものとみなします。
        </p>
      </section>
    </LegalPageShell>
  )
}

/**
 * /privacy — プライバシーポリシー 정적 페이지
 *
 * Server Component. LegalPageShell 재사용. 11섹션 일본어 카피.
 * 회원가입 setup 단계 동의 체크박스의 link 대상 (target="_blank").
 */

import { LegalPageShell } from '../_components/legal-page-shell'

export const metadata = {
  title: 'プライバシーポリシー | KEIO SHARE',
}

export default function PrivacyPage() {
  return (
    <LegalPageShell title="プライバシーポリシー" lastUpdated="2026年5月8日">
      {/* 1. 個人情報の定義 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">1. 個人情報の定義</h2>
        <p>
          本ポリシーにおける「個人情報」とは、個人情報の保護に関する法律（平成15年法律第57号）に定める個人情報を指します。
        </p>
      </section>

      {/* 2. 収集する情報 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">2. 収集する情報</h2>
        <p className="mb-3">本サービスでは、以下の情報を収集します。</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>メールアドレス（keio.jp ドメイン）</li>
          <li>キャンパス・学年・学部</li>
          <li>ニックネーム</li>
          <li>投稿・コメント・いいね・ブックマーク等の利用情報</li>
          <li>アクセスログ（IP アドレス・User-Agent・タイムスタンプ）</li>
        </ul>
      </section>

      {/* 3. 利用目的 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">3. 利用目的</h2>
        <p className="mb-3">収集した情報は、以下の目的で利用します。</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>本サービスの提供・運営</li>
          <li>慶應義塾在学者としての会員資格の確認</li>
          <li>不正利用・違反行為の調査および対応</li>
          <li>サービス改善のための統計分析（個人の特定は行いません）</li>
        </ul>
      </section>

      {/* 4. 第三者提供 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">4. 第三者提供</h2>
        <p>
          法令に基づく場合を除き、収集した個人情報を原則として第三者に提供しません。
        </p>
      </section>

      {/* 5. 業務委託先 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">5. 業務委託先</h2>
        <p className="mb-3">
          本サービスの運営にあたり、以下の事業者にデータ処理を委託しています。これらの委託先はいずれも米国に所在しており、日本国外へのデータの越境移転が発生します。
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Supabase Inc.（米国）— 認証・データベース</li>
          <li>Vercel Inc.（米国）— ホスティング</li>
        </ul>
      </section>

      {/* 6. 保管期間 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">6. 保管期間</h2>
        <p>
          個人情報は、会員資格が継続する期間、または法令に定める保管期間のいずれか長い期間、保管します。退会時は速やかに削除します。
        </p>
      </section>

      {/* 7. ユーザーの権利 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">7. ユーザーの権利</h2>
        <p className="mb-3">会員は、自身の個人情報について以下の権利を有します。</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>閲覧</li>
          <li>訂正</li>
          <li>削除</li>
          <li>利用停止</li>
          <li>退会</li>
        </ul>
        <p className="mt-3">
          これらの操作はマイページから行うことができます。
        </p>
      </section>

      {/* 8. Cookie とアクセス解析 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">8. Cookie とアクセス解析</h2>
        <p>
          本サービスは、利便性向上のために Cookie および類似技術を使用しています。ブラウザの設定により Cookie を無効化することも可能ですが、一部機能が利用できなくなる場合があります。
        </p>
      </section>

      {/* 9. 個人情報保護法の遵守 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">9. 個人情報保護法の遵守</h2>
        <p>
          運営者は、個人情報の保護に関する法律その他の関連法令を遵守し、個人情報を適切に管理します。
        </p>
      </section>

      {/* 10. 改訂について */}
      <section>
        <h2 className="text-xl font-semibold mb-3">10. 改訂について</h2>
        <p>
          本ポリシーは予告なく改訂される場合があります。改訂後も本サービスを継続して利用された場合、新しい内容に同意したものとみなします。
        </p>
      </section>

      {/* 11. お問い合わせ */}
      <section>
        <h2 className="text-xl font-semibold mb-3">11. お問い合わせ</h2>
        <p>
          個人情報の取り扱いに関するお問い合わせは、以下の窓口までご連絡ください。
        </p>
        <p className="mt-2 text-muted-foreground">
          （連絡先: 運営者により後日公表）
        </p>
      </section>
    </LegalPageShell>
  )
}

'use client';

import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';

export default function RadiancePrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        <section className="py-6 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <Breadcrumb items={[
              { label: '主頁', href: '/vibe-demo/radiance' },
              { label: '私隱政策' }
            ]} />
          </div>
        </section>

        <article className="max-w-4xl mx-auto px-6 py-16 space-y-10">
          <header className="space-y-4">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">私隱政策</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              最後更新：2025年1月1日 · Radiance Public Relations Limited
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Radiance Public Relations Limited（下稱「本公司」、「我們」）致力保護閣下的個人資料，
              並嚴格遵守香港法例第486章《個人資料（私隱）條例》（「私隱條例」）的規定。
              本政策說明我們如何收集、使用、儲存及保護閣下的個人資料。
            </p>
          </header>

          <Section title="一、收集的資料">
            <p>當閣下透過本網站與我們聯絡時，我們可能收集以下個人資料：</p>
            <ul>
              <li><strong>聯絡資料</strong>：姓名、電郵地址、電話號碼</li>
              <li><strong>公司資料</strong>：公司名稱、行業類別、公司規模</li>
              <li><strong>查詢內容</strong>：訊息內容、服務需求、預算及時間表</li>
              <li><strong>技術資料</strong>：IP 位址、瀏覽器類型、訪問頁面及時間（用於安全及防濫用目的）</li>
            </ul>
            <p>我們僅收集提供服務所需的最少資料，不會收集敏感個人資料（如身份證號碼、金融帳戶資料）。</p>
          </Section>

          <Section title="二、資料用途">
            <p>我們收集的個人資料僅用於以下目的：</p>
            <ul>
              <li>回覆閣下的查詢及提供報價</li>
              <li>安排諮詢及跟進服務事宜</li>
              <li>提供及管理已訂購的公關、活動或創意製作服務</li>
              <li>在閣下同意下，發送行業洞察及活動資訊</li>
              <li>遵守法律義務</li>
            </ul>
            <p>我們不會將閣下的個人資料用於資料收集目的以外的其他用途，亦不會在未獲明確同意的情況下用於直接促銷。</p>
          </Section>

          <Section title="三、資料安全">
            <p>
              我們採取適當的技術及組織措施保護閣下的個人資料，防止未經授權的訪問、披露、修改或刪除。
              具體措施包括：
            </p>
            <ul>
              <li>資料庫中的個人資料欄位採用 AES-256-GCM 加密儲存</li>
              <li>伺服器日誌不記錄個人識別資料</li>
              <li>所有資料傳輸均透過 HTTPS（TLS 1.2+）加密</li>
              <li>僅獲授權人員方可訪問個人資料</li>
            </ul>
          </Section>

          <Section title="四、資料保留">
            <p>
              我們按以下原則保留個人資料：
            </p>
            <ul>
              <li><strong>查詢記錄</strong>：查詢完成後保留 3 年，供日後服務跟進之用</li>
              <li><strong>客戶合約資料</strong>：按香港商業法律要求，保留至少 7 年</li>
              <li><strong>技術日誌</strong>：最長 90 天，用於安全監控</li>
            </ul>
            <p>超過保留期限後，我們將安全地刪除或匿名化相關資料。</p>
          </Section>

          <Section title="五、資料轉移及第三方">
            <p>我們不會出售、出租或轉讓閣下的個人資料給第三方。我們可能與以下服務提供商共享資料，
              這些服務商均須遵守保密協議：</p>
            <ul>
              <li><strong>電郵服務</strong>：用於接收查詢通知（資料不作他用）</li>
              <li><strong>網站託管及基礎設施</strong>：位於香港或歐盟境內</li>
            </ul>
            <p>
              若法律要求，我們可能須向監管機構或執法機關披露個人資料。
            </p>
          </Section>

          <Section title="六、閣下的權利">
            <p>根據私隱條例，閣下享有以下權利：</p>
            <ul>
              <li><strong>查閱權</strong>：要求查閱我們持有的閣下個人資料</li>
              <li><strong>更正權</strong>：要求更正不準確的個人資料</li>
              <li><strong>刪除要求</strong>：在特定情況下，要求刪除閣下的個人資料</li>
              <li><strong>拒絕促銷</strong>：隨時拒絕接收直接促銷訊息</li>
            </ul>
            <p>
              如欲行使上述權利，請以書面形式聯絡我們（見下方）。我們將於收到要求後 40 天內回覆。
              如核實身份所需，可能需要提供證明文件。
            </p>
          </Section>

          <Section title="七、Cookie 及追蹤技術">
            <p>
              本網站使用必要的 Cookie 以確保網站正常運作。我們不使用第三方廣告追蹤 Cookie。
              閣下可透過瀏覽器設定管理 Cookie 偏好，惟停用必要 Cookie 可能影響網站功能。
            </p>
          </Section>

          <Section title="八、本政策的修訂">
            <p>
              我們可能不時修訂本私隱政策，並在本頁面更新修訂日期。重大變更將透過電郵通知現有客戶。
              建議閣下定期瀏覽本頁面以了解最新政策。
            </p>
          </Section>

          <Section title="九、聯絡我們">
            <p>如對本私隱政策有任何疑問，或欲行使閣下的資料權利，請聯絡：</p>
            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-6 space-y-2 text-slate-700 dark:text-slate-300">
              <p><strong>Radiance Public Relations Limited</strong></p>
              <p>個人資料主任</p>
              <p>電郵：<a href="mailto:hello@radiancehk.com" className="text-purple-600 dark:text-purple-400 hover:underline">hello@radiancehk.com</a></p>
              <p>香港</p>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              如閣下對我們處理查詢的方式不滿，亦可向香港個人資料私隱專員公署（<a href="https://www.pcpd.org.hk" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">www.pcpd.org.hk</a>）提出投訴。
            </p>
          </Section>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-sm">
            <Link href="/vibe-demo/radiance/terms" className="text-purple-600 dark:text-purple-400 hover:underline">
              使用條款 →
            </Link>
            <Link href="/vibe-demo/radiance" className="text-slate-500 dark:text-slate-400 hover:underline">
              返回主頁
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
        {title}
      </h2>
      <div className="space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_strong]:text-slate-800 [&_strong]:dark:text-slate-200">
        {children}
      </div>
    </section>
  );
}

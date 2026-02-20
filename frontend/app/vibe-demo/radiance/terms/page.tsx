'use client';

import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';

export default function RadianceTermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        <section className="py-6 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            <Breadcrumb items={[
              { label: '主頁', href: '/vibe-demo/radiance' },
              { label: '使用條款' }
            ]} />
          </div>
        </section>

        <article className="max-w-4xl mx-auto px-6 py-16 space-y-10">
          <header className="space-y-4">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">使用條款</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              最後更新：2025年1月1日 · Radiance Public Relations Limited
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              歡迎瀏覽 Radiance Public Relations Limited（下稱「本公司」、「我們」）的網站。
              瀏覽或使用本網站即表示閣下同意遵守以下使用條款。如閣下不同意本條款，請勿繼續使用本網站。
            </p>
          </header>

          <Section title="一、接受條款">
            <p>
              本使用條款構成閣下與 Radiance Public Relations Limited 之間具法律約束力的協議，
              適用於閣下對本網站（radiancehk.com 及其所有子頁面）的所有訪問和使用。
              我們保留隨時修訂本條款的權利，修訂版本一經發布即生效。
            </p>
          </Section>

          <Section title="二、網站用途">
            <p>本網站旨在提供關於 Radiance 公關服務的資訊。閣下同意：</p>
            <ul>
              <li>僅將本網站用於合法目的</li>
              <li>不作任何可能損害本網站或本公司聲譽的行為</li>
              <li>不嘗試未經授權訪問本網站的任何部分或相關系統</li>
              <li>不發布或傳播任何虛假、具誤導性或違法的內容</li>
              <li>不進行任何可能干擾網站正常運作的行為（包括但不限於爬蟲、DDoS 攻擊）</li>
            </ul>
          </Section>

          <Section title="三、表單提交及查詢">
            <p>
              透過本網站提交查詢或諮詢申請，代表閣下確認所提供的資料真實、準確及完整。
              我們保留拒絕任何查詢或不回覆的權利，無需說明原因。
            </p>
            <p>
              提交查詢並不構成任何服務合約的訂立。正式服務協議須另行簽署書面合約方告成立。
            </p>
          </Section>

          <Section title="四、知識產權">
            <p>
              本網站所有內容，包括但不限於文字、圖像、設計、標誌、影片及概念，
              均屬 Radiance Public Relations Limited 或其合法授權人的財產，
              受香港及國際知識產權法律保護。
            </p>
            <p>閣下不得在未獲書面同意的情況下：</p>
            <ul>
              <li>複製、修改、發布或分發本網站任何內容</li>
              <li>將本網站內容用於商業目的</li>
              <li>移除任何版權或商標聲明</li>
            </ul>
          </Section>

          <Section title="五、第三方連結">
            <p>
              本網站可能包含指向第三方網站的連結。這些連結僅為方便閣下而提供，
              並不代表本公司認可或對其內容負責。閣下訪問第三方網站須自行承擔風險。
            </p>
          </Section>

          <Section title="六、免責聲明">
            <p>
              本網站的資訊按「現狀」提供，不附帶任何明示或默示的保證。
              本公司不保證本網站隨時可用、不受干擾或不含錯誤。
            </p>
            <p>
              本網站所提供的任何案例研究、成效數據或行業參考，均基於特定項目的實際情況，
              不代表對未來結果的保證。
            </p>
          </Section>

          <Section title="七、責任限制">
            <p>
              在法律允許的最大範圍內，本公司不就以下情況承擔任何責任：
            </p>
            <ul>
              <li>閣下使用或無法使用本網站所導致的直接或間接損失</li>
              <li>本網站資訊的準確性、完整性或及時性</li>
              <li>因網絡中斷、技術故障或第三方服務問題導致的服務中斷</li>
            </ul>
          </Section>

          <Section title="八、準據法及爭議解決">
            <p>
              本使用條款受香港特別行政區法律管轄並按其解釋。任何因本條款引起的爭議，
              雙方同意提交香港法院的非專屬司法管轄。
            </p>
          </Section>

          <Section title="九、聯絡我們">
            <p>如對本使用條款有任何疑問，請聯絡：</p>
            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-6 space-y-2 text-slate-700 dark:text-slate-300">
              <p><strong>Radiance Public Relations Limited</strong></p>
              <p>電郵：<a href="mailto:hello@radiancehk.com" className="text-purple-600 dark:text-purple-400 hover:underline">hello@radiancehk.com</a></p>
              <p>香港</p>
            </div>
          </Section>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-sm">
            <Link href="/vibe-demo/radiance/privacy-policy" className="text-purple-600 dark:text-purple-400 hover:underline">
              私隱政策 →
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

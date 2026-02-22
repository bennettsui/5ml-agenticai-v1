'use client';

import Link from 'next/link';
import RecruitNav from '../components/RecruitNav';

export default function RecruitTermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <RecruitNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 space-y-10">
        <header className="space-y-4">
          <p className="text-blue-400 text-sm font-medium tracking-wide uppercase">法律文件</p>
          <h1 className="text-4xl font-bold text-white">使用條款</h1>
          <p className="text-slate-400 text-sm">
            最後更新：2025年1月1日 · 5 Miles Lab Limited（RecruitAI Studio）
          </p>
          <p className="text-slate-300 leading-relaxed">
            歡迎使用 RecruitAI Studio（由 5 Miles Lab Limited 營運）。
            瀏覽或使用本平台（包括網站、AI 助理及相關服務）即表示閣下同意受以下使用條款約束。
            如閣下不同意本條款，請勿繼續使用本平台。
          </p>
        </header>

        <Section title="一、接受條款">
          <p>
            本使用條款構成閣下與 5 Miles Lab Limited（下稱「本公司」）之間的法律協議，
            適用於閣下對 RecruitAI Studio 平台（包括但不限於網站、AI 對話功能、
            諮詢預約系統及所有相關服務）的所有訪問和使用。
          </p>
          <p>
            本公司保留隨時修訂本條款的權利，修訂版本發布後即時生效。
            繼續使用本平台即視為接受修訂後的條款。
          </p>
        </Section>

        <Section title="二、服務說明">
          <p>
            RecruitAI Studio 是一個面向香港中小企業的 AI 業務自動化平台展示及諮詢服務。本平台提供：
          </p>
          <ul>
            <li>AI 自動化方案資訊及示範（增長、市場推廣、客戶服務、業務運營、業務分析）</li>
            <li>AI 顧問助理「Nora」提供初步諮詢及需求了解</li>
            <li>免費 30 分鐘 AI 評估諮詢預約</li>
            <li>行業解決方案及案例參考</li>
          </ul>
          <p>
            本平台的 AI 助理提供的資訊僅供參考，不構成專業商業、法律或財務意見。
            閣下在作出任何業務決策前，應尋求專業顧問意見。
          </p>
        </Section>

        <Section title="三、AI 服務使用規範">
          <p>使用本平台 AI 功能時，閣下同意：</p>
          <ul>
            <li>不輸入任何違法、具冒犯性、誤導性或侵害第三方權益的內容</li>
            <li>不嘗試繞過 AI 系統的安全限制或進行「越獄」（jailbreak）操作</li>
            <li>不將 AI 回覆用於欺詐、詐騙或任何非法目的</li>
            <li>了解 AI 回覆可能存在不準確或不完整的情況，不可完全依賴</li>
            <li>不嘗試對平台進行逆向工程、抓取數據或未經授權的訪問</li>
          </ul>
          <p>
            本公司保留在不作事先通知的情況下，限制或終止任何違反本條款之用戶的訪問權的權利。
          </p>
        </Section>

        <Section title="四、表單提交及諮詢預約">
          <p>
            透過本平台提交查詢或預約諮詢，代表閣下確認所提供的資料真實、準確及完整。
            提交查詢不構成任何服務合約的訂立——正式服務協議須另行簽署書面合約方告成立。
          </p>
          <p>
            本公司保留拒絕任何查詢的權利，無需說明原因。免費諮詢的安排視乎本公司的人員檔期，
            預約確認須以電郵確認為準。
          </p>
        </Section>

        <Section title="五、知識產權">
          <p>
            本平台所有內容，包括但不限於文字、圖像、設計、標誌、AI 模型配置、系統架構及概念，
            均屬 5 Miles Lab Limited 或其合法授權人的財產，受香港及國際知識產權法律保護。
          </p>
          <p>閣下不得在未獲書面同意的情況下：</p>
          <ul>
            <li>複製、修改、發布或商業使用本平台任何內容</li>
            <li>對本平台或 AI 系統進行逆向工程</li>
            <li>將本平台的 AI 對話輸出用於競爭性產品或服務的開發</li>
          </ul>
          <p>
            閣下向本平台提交的內容（如查詢訊息）的版權仍歸閣下所有，
            但閣下授予本公司使用該內容提供及改善服務的非專屬授權。
          </p>
        </Section>

        <Section title="六、AI 輸出免責聲明">
          <p>
            本平台的 AI 助理「Nora」基於大型語言模型運作，其回覆：
          </p>
          <ul>
            <li>可能包含不準確、過時或不完整的資訊</li>
            <li>不代表本公司的官方立場或承諾</li>
            <li>不構成法律、財務、醫療或其他專業意見</li>
            <li>不保證所描述的 AI 方案適合閣下的特定業務需求</li>
          </ul>
          <p>
            成效數據（如「節省 70% 時間」）均基於典型客戶案例，
            實際效果因個別業務情況而異，不構成任何保證。
          </p>
        </Section>

        <Section title="七、責任限制">
          <p>
            在法律允許的最大範圍內，本公司不就以下情況承擔任何責任：
          </p>
          <ul>
            <li>閣下依賴 AI 回覆作出業務決策所導致的任何損失</li>
            <li>本平台暫時停用、中斷或技術故障</li>
            <li>第三方 AI 服務（如 DeepSeek）的準確性或可用性</li>
            <li>閣下使用或無法使用本平台所導致的任何間接、附帶或後果性損失</li>
          </ul>
          <p>
            本公司對閣下的總責任（如有）不超過閣下在索賠前 12 個月內向本公司支付的費用金額，
            或港幣 1,000 元，以較低者為準。
          </p>
        </Section>

        <Section title="八、平台可用性">
          <p>
            本公司不保證本平台將持續、不中斷或不含錯誤地運作。我們保留在不作事先通知的情況下，
            暫停、修改或終止本平台任何部分的權利，包括 AI 功能、定價及服務範疇。
          </p>
        </Section>

        <Section title="九、準據法及爭議解決">
          <p>
            本使用條款受香港特別行政區法律管轄並按其解釋。
            任何因本條款或本平台的使用所引起的爭議，雙方應首先嘗試以協商方式解決；
            如協商未果，雙方同意提交香港法院的非專屬司法管轄。
          </p>
        </Section>

        <Section title="十、聯絡我們">
          <p>如對本使用條款有任何疑問，請聯絡：</p>
          <div className="bg-slate-800/60 rounded-xl p-6 space-y-2 text-slate-300">
            <p><strong className="text-white">5 Miles Lab Limited</strong></p>
            <p>
              電郵：
              <a href="mailto:hello@recruitaistudio.hk" className="text-blue-400 hover:underline">
                hello@recruitaistudio.hk
              </a>
            </p>
            <p>香港</p>
          </div>
        </Section>

        <div className="pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-sm">
          <Link href="/vibe-demo/recruitai/privacy-policy" className="text-blue-400 hover:underline">
            私隱政策 →
          </Link>
          <Link href="/vibe-demo/recruitai" className="text-slate-400 hover:underline">
            返回主頁
          </Link>
        </div>
      </main>

      <footer className="py-8 px-4 bg-slate-900 text-center border-t border-slate-800">
        <p className="text-slate-400 text-sm mb-2">
          © 2025 RecruitAI Studio by 5 Miles Lab · 香港中小企 AI 自動化
        </p>
        <div className="flex justify-center gap-4 text-sm">
          <Link href="/vibe-demo/recruitai/privacy-policy" className="text-blue-400 hover:text-blue-300 transition">私隱政策</Link>
          <Link href="/vibe-demo/recruitai/terms" className="text-blue-400 hover:text-blue-300 transition">使用條款</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">{title}</h2>
      <div className="space-y-3 text-slate-300 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_strong]:text-white">
        {children}
      </div>
    </section>
  );
}

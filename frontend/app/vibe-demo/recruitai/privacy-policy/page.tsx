'use client';

import Link from 'next/link';
import RecruitNav from '../components/RecruitNav';

export default function RecruitPrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <RecruitNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 space-y-10">
        <header className="space-y-4">
          <p className="text-blue-400 text-sm font-medium tracking-wide uppercase">法律文件</p>
          <h1 className="text-4xl font-bold text-white">私隱政策</h1>
          <p className="text-slate-400 text-sm">
            最後更新：2025年1月1日 · 5 Miles Lab Limited（RecruitAI Studio）
          </p>
          <p className="text-slate-300 leading-relaxed">
            5 Miles Lab Limited（下稱「本公司」、「我們」），以 RecruitAI Studio 名義經營，
            致力按照香港法例第486章《個人資料（私隱）條例》（「私隱條例」）保護閣下的個人資料。
            本政策說明我們在提供 AI 業務自動化服務期間，如何收集、使用、保護及管理閣下的個人資料。
          </p>
        </header>

        <Section title="一、收集的資料">
          <p>我們可能透過以下方式收集閣下的個人資料：</p>
          <SubSection heading="（甲）直接提交的資料">
            <ul>
              <li><strong>聯絡資料</strong>：姓名、電郵地址、電話／WhatsApp 號碼</li>
              <li><strong>公司資料</strong>：公司名稱、行業、員工人數、業務描述</li>
              <li><strong>查詢及需求</strong>：透過表單或免費諮詢提交的業務痛點及服務興趣</li>
            </ul>
          </SubSection>
          <SubSection heading="（乙）AI 對話收集的資料">
            <p>
              本網站設有 AI 助理「Nora」，當閣下於對話中主動提供聯絡方式時，
              系統會自動記錄並加密儲存相關資料以安排後續跟進。
              AI 對話記錄（不含個人識別資料）將用於改善服務質素。
            </p>
          </SubSection>
          <SubSection heading="（丙）技術資料">
            <ul>
              <li>IP 位址（用於安全監控及防濫用）</li>
              <li>瀏覽器類型及訪問頁面（用於分析網站表現）</li>
              <li>訪問來源（UTM 參數，用於了解推廣效益）</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="二、資料用途">
          <p>我們收集的個人資料用於以下目的：</p>
          <ul>
            <li>回覆查詢及安排免費 AI 評估諮詢</li>
            <li>提供及管理 RecruitAI Studio 的 AI 自動化服務</li>
            <li>發送服務相關通知及更新</li>
            <li>在閣下同意下，發送 AI 趨勢資訊及服務推廣訊息</li>
            <li>分析服務使用模式以改善平台功能</li>
            <li>遵守法律義務</li>
          </ul>
          <p>
            我們不會將個人資料用於自動化決策（Automated Decision Making），
            亦不會將閣下的個人資料出售予第三方。
          </p>
        </Section>

        <Section title="三、資料安全措施">
          <p>我們採取以下技術及組織措施保護閣下的個人資料：</p>
          <ul>
            <li><strong>加密儲存</strong>：資料庫中所有個人識別資料（姓名、電郵、電話、訊息）均採用 AES-256-GCM 加密儲存</li>
            <li><strong>傳輸加密</strong>：所有資料傳輸均透過 HTTPS（TLS 1.2+）加密</li>
            <li><strong>訪問控制</strong>：後台管理介面設有密碼保護，僅授權人員方可訪問</li>
            <li><strong>最少日誌</strong>：伺服器日誌不記錄個人識別資料，僅記錄提交 ID 及時間戳</li>
            <li><strong>資料最小化</strong>：僅收集提供服務所需的最少資料</li>
          </ul>
        </Section>

        <Section title="四、AI 服務與第三方">
          <p>本平台使用以下第三方服務，相關資料處理安排如下：</p>
          <ul>
            <li>
              <strong>AI 語言模型</strong>（DeepSeek）：對話訊息會傳送至 AI 服務進行處理。
              傳送的內容不包含閣下的個人識別資料，僅包含對話內容。
            </li>
            <li>
              <strong>電郵通知</strong>（Resend）：當閣下提交查詢時，
              我們會透過電郵服務向本公司發送通知（不會向第三方透露閣下的個人資料）。
            </li>
            <li>
              <strong>網站託管</strong>（Fly.io）：網站及資料庫位於受保護的雲端環境。
            </li>
          </ul>
          <p>
            上述服務提供商均須遵守保密協議，不得將資料用於協議以外的目的。
          </p>
        </Section>

        <Section title="五、資料保留期限">
          <ul>
            <li><strong>查詢及潛在客戶記錄</strong>：保留 2 年，供後續跟進之用</li>
            <li><strong>AI 對話記錄</strong>：保留 6 個月，用於服務質素改善</li>
            <li><strong>客戶合約資料</strong>：按香港法律要求保留至少 7 年</li>
            <li><strong>技術日誌</strong>：最長 90 天</li>
          </ul>
        </Section>

        <Section title="六、閣下的權利">
          <p>根據私隱條例，閣下享有以下權利：</p>
          <ul>
            <li><strong>查閱權</strong>：要求查閱我們持有的閣下個人資料（可收取合理行政費用）</li>
            <li><strong>更正權</strong>：要求更正不準確的個人資料</li>
            <li><strong>拒絕促銷</strong>：隨時拒絕接收直接促銷訊息</li>
            <li><strong>刪除要求</strong>：在適用情況下，要求刪除閣下的個人資料</li>
          </ul>
          <p>
            如欲行使上述權利，請以書面形式聯絡我們。我們將於收到要求後 40 天內回覆。
          </p>
        </Section>

        <Section title="七、Cookie">
          <p>
            本網站使用必要的 Session Cookie 以維持 AI 對話狀態。
            我們不使用第三方廣告追蹤 Cookie。閣下可透過瀏覽器設定管理 Cookie 偏好。
          </p>
        </Section>

        <Section title="八、私隱政策修訂">
          <p>
            本政策可能因應法律要求或服務變化而更新。重大變更將透過電郵通知現有用戶。
            建議定期瀏覽本頁面以了解最新政策。
          </p>
        </Section>

        <Section title="九、聯絡我們">
          <p>如對本私隱政策有任何疑問，或欲行使閣下的資料權利，請聯絡：</p>
          <div className="bg-slate-800/60 rounded-xl p-6 space-y-2 text-slate-300">
            <p><strong className="text-white">5 Miles Lab Limited</strong></p>
            <p>個人資料主任</p>
            <p>
              電郵：
              <a href="mailto:hello@recruitaistudio.hk" className="text-blue-400 hover:underline">
                hello@recruitaistudio.hk
              </a>
            </p>
            <p>香港</p>
          </div>
          <p className="text-sm text-slate-500">
            如對我們的處理方式不滿，閣下可向香港個人資料私隱專員公署（
            <a href="https://www.pcpd.org.hk" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              www.pcpd.org.hk
            </a>
            ）提出投訴。
          </p>
        </Section>

        <div className="pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-sm">
          <Link href="/vibe-demo/recruitai/terms" className="text-blue-400 hover:underline">
            使用條款 →
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

function SubSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-slate-200">{heading}</p>
      <div className="[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_strong]:text-white">
        {children}
      </div>
    </div>
  );
}

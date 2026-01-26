'use client';

import { DollarSign, Image, Sparkles } from 'lucide-react';

export default function PricingTable() {
  // Stable Diffusion models pricing
  const sdPricingData = [
    {
      model: 'Stable Diffusion 1.5（一般雲 API / aggregator）',
      resolution: '512–1024px',
      pricingType: '按圖收費',
      cost: '$0.015–$0.03',
      notes: '常見在多模型平台列作「budget tier」，標註 $0.015–$0.03',
      highlight: false
    },
    {
      model: 'SDXL 1.0（Stability / 多家平台）',
      resolution: '1024×1024',
      pricingType: '按圖收費',
      cost: '$0.03',
      notes: '列為 SDXL 圖像 API 標準價位',
      highlight: false
    },
    {
      model: 'Stable Image Core（基於 SD3.5 Medium）',
      resolution: '1024×1024',
      pricingType: '按圖收費',
      cost: '$0.03',
      notes: '官方定位為「平、快」高質模型',
      highlight: false
    },
    {
      model: 'Stable Image Ultra（基於 SD3.5 Large）',
      resolution: '1024×1024',
      pricingType: '按圖收費',
      cost: '$0.08',
      notes: '做 top-tier 創意／高質輸出，用 SD3.5 Large',
      highlight: false
    },
    {
      model: 'SDXL（Together.ai API）',
      resolution: '1024×1024',
      pricingType: '按圖收費',
      cost: '$0.0019',
      notes: 'Together.ai 自家標價，屬極低價 SDXL 選項',
      highlight: true
    }
  ];

  // Nano Banana (Gemini) models pricing
  const nanoBananaPricingData = [
    {
      model: 'Nano Banana（普通）',
      resolution: '約 1K',
      provider: '多家第三方',
      cost: '$0.03',
      notes: '例如 PiAPI 標價 $0.03 / 圖，可生成最多 4 圖一請求',
      highlight: false
    },
    {
      model: 'Nano Banana Pro（官方 Google API）',
      resolution: '1K / 2K',
      provider: 'Google Gemini API',
      cost: '$0.134',
      notes: '官方公價，1K、2K 同價；常見實測數字 $0.134–$0.139',
      highlight: false
    },
    {
      model: 'Nano Banana Pro（官方 Google API）',
      resolution: '4K',
      provider: 'Google Gemini API',
      cost: '$0.24',
      notes: '官方 4K 價格，作為 baseline',
      highlight: false
    },
    {
      model: 'Nano Banana Pro（官方 Batch API）',
      resolution: '1K / 2K',
      provider: 'Google Batch',
      cost: '$0.067',
      notes: '延時 12–24 小時，官方價 50% off',
      highlight: false
    },
    {
      model: 'Nano Banana Pro（官方 Batch API）',
      resolution: '4K',
      provider: 'Google Batch',
      cost: '$0.12',
      notes: '同樣 50% off、排隊處理',
      highlight: false
    },
    {
      model: 'Nano Banana Pro（第三方：laozhang.ai 等）',
      resolution: '1K–4K',
      provider: 'laozhang.ai / aifreeapi',
      cost: '$0.05',
      notes: '任意解像度同價，較官方 4K 平約 79%',
      highlight: true
    },
    {
      model: 'Nano Banana Pro（第三方：PiAPI）',
      resolution: '1K / 2K',
      provider: 'PiAPI',
      cost: '$0.105',
      notes: 'PiAPI 標示「起步價」$0.105 / 圖',
      highlight: false
    },
    {
      model: 'Nano Banana Pro（第三方：PiAPI）',
      resolution: '4K',
      provider: 'PiAPI',
      cost: '$0.18',
      notes: '4K 較官方平，但貴過 $0.05 通道',
      highlight: false
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stable Diffusion Pricing Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Image className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Stable Diffusion 系列</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              開源模型 API 定價參考
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">模型 / 供應商</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">解像度（約）</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">計價方式</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">約略成本 / 圖</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">備註</th>
              </tr>
            </thead>
            <tbody>
              {sdPricingData.map((item, index) => (
                <tr
                  key={index}
                  className={`border-b border-slate-100 dark:border-slate-700 transition-colors ${
                    item.highlight
                      ? 'bg-green-50 dark:bg-green-900/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {item.highlight && (
                        <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></span>
                      )}
                      <span className="font-medium text-slate-900 dark:text-white">
                        {item.model}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-300">
                    {item.resolution}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-300">
                    {item.pricingType}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                    {item.cost}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                    {item.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nano Banana Pricing Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nano Banana / Gemini 圖像生成</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Google Gemini 2.0 Flash 圖像生成定價參考
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">模型 / 方案</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">解像度選項</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">供應商 / 通道</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">約略成本 / 圖</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">備註</th>
              </tr>
            </thead>
            <tbody>
              {nanoBananaPricingData.map((item, index) => (
                <tr
                  key={index}
                  className={`border-b border-slate-100 dark:border-slate-700 transition-colors ${
                    item.highlight
                      ? 'bg-yellow-50 dark:bg-yellow-900/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {item.highlight && (
                        <span className="w-2 h-2 rounded-full bg-yellow-500 dark:bg-yellow-400"></span>
                      )}
                      <span className="font-medium text-slate-900 dark:text-white">
                        {item.model}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-300">
                    {item.resolution}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-300">
                    {item.provider}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                    {item.cost}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                    {item.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Legend</h3>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></span>
            <span>最低價選項（SD 系列）</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 dark:bg-yellow-400"></span>
            <span>最低價選項（Nano Banana 系列）</span>
          </li>
          <li>• 價格為約略參考，實際可能因地區、用量而異</li>
          <li>• 第三方通道價格可能隨時調整</li>
        </ul>
      </div>
    </div>
  );
}

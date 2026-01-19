'use client';

import { DollarSign } from 'lucide-react';

export default function PricingTable() {
  const pricingData = [
    {
      model: 'Claude 3 Haiku',
      inputPrice: '0.25',
      outputPrice: '1.25',
      reasoning: '中等偏高',
      notes: '最平 Anthropic 模型，200K context',
      highlight: false
    },
    {
      model: 'Claude 3.5 Haiku',
      inputPrice: '0.80',
      outputPrice: '4.00',
      reasoning: '中高',
      notes: 'price/quality sweet spot，200K context',
      highlight: false
    },
    {
      model: 'Claude 3.5 Sonnet',
      inputPrice: '3.00',
      outputPrice: '15.00',
      reasoning: '頂級',
      notes: '200K context，最強推理能力',
      highlight: true
    },
    {
      model: 'Perplexity Sonar Pro',
      inputPrice: '3.00',
      outputPrice: '15.00',
      reasoning: '中高偏上 (search-QA 特強)',
      notes: '200K context；高級 search 另外按次收費',
      highlight: true
    },
    {
      model: 'GPT-4.1',
      inputPrice: '2.00',
      outputPrice: '8.00',
      reasoning: '頂級',
      notes: '1M context',
      highlight: false
    },
    {
      model: 'Gemini 1.5 Flash',
      inputPrice: '0.10',
      outputPrice: '0.40',
      reasoning: '中等偏高',
      notes: '1M context；極快、極平',
      highlight: false
    },
    {
      model: 'Gemini 1.5 Pro',
      inputPrice: '2.20',
      outputPrice: '8.80',
      reasoning: '頂級',
      notes: '2M context',
      highlight: false
    },
    {
      model: 'Qwen (高配 Max)',
      inputPrice: '0.20-0.60',
      outputPrice: '1.6-2.0',
      reasoning: '中高',
      notes: '128K–1M context (按型號)',
      highlight: false
    },
    {
      model: 'GLM-4.5 (Reasoning)',
      inputPrice: '0.35',
      outputPrice: '1.55',
      reasoning: '中高偏上',
      notes: '~131K context',
      highlight: false
    },
    {
      model: 'DeepSeek (V3.2 / R1)',
      inputPrice: '0.03-0.30',
      outputPrice: '0.11-2.4',
      reasoning: '次頂級 (推理/coding 特強)',
      notes: 'context 一般 32K–160K 級',
      highlight: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Model Pricing Reference</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Current pricing per million tokens ($/M)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Model</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Input ($/M)</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Output ($/M)</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Reasoning Level</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Notes</th>
              </tr>
            </thead>
            <tbody>
              {pricingData.map((item, index) => (
                <tr
                  key={index}
                  className={`border-b border-slate-100 dark:border-slate-700 transition-colors ${
                    item.highlight
                      ? 'bg-blue-50 dark:bg-blue-900/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {item.highlight && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                      )}
                      <span className="font-medium text-slate-900 dark:text-white">
                        {item.model}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                    ${item.inputPrice}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                    ${item.outputPrice}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {item.reasoning}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                    {item.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Legend</h3>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></span>
              <span>Models available in sandbox (DeepSeek, Claude Sonnet, Perplexity)</span>
            </li>
            <li>• Prices are approximate and may vary by region or volume</li>
            <li>• Context window sizes shown are typical maximums</li>
            <li>• All prices in USD per million tokens</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

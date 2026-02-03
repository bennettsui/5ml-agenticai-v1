'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mic, Copy, Check, ExternalLink, Sparkles, MessageSquare, Volume2, Video } from 'lucide-react';

export default function FictionalCharacterPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const systemPrompt = `You are a dialogue rewriter that turns the user's raw intentions into the speech of a fictional character.

High-level behavior:
- The user is the *brain*; the character is the *mouth*.
- Keep the user's meaning, stance, and information 100% intact.
- Change only: wording, style, and emotional tone to match the character.
- Never add facts the user did not imply. If you need to fill gaps, keep it vague or meta (e.g. "I won't go into operational details here.").

Character profile:
- Name: 「老花生叔」
- Background: 香港本地中年大叔，做過廣告、創業，平時在 IG 上用輕鬆方式講地緣政治和國際新聞。
- Personality: 嘴賤但有禮，毒舌但不人身攻擊，偶爾自嘲，重視邏輯和證據，不煽動仇恨。
- Speaking style:
  - 語言：以廣東話書面＋口語混合，偶爾穿插少量英文關鍵字。
  - 喜歡用比喻、日常生活例子，幫觀眾理解複雜局勢。
  - 句子偏短，方便字幕和 TTS。
  - 避免太學術，不用引用論文格式。
- Boundaries:
  - 不鼓勵仇恨言論，不點名煽動暴力。
  - 可以批判政府或企業決策，但要講清楚理據。
  - 不假裝有內幕消息，強調自己只是「睇資料＋自己分析」。

Output requirements:
- Always reply in **Cantonese written style**, with occasional English terms when natural.
- Keep each message under 200 words unless the user explicitly asks for more.
- Use bullet points when在拆解分析; 用短段落 when在表達態度、感受。
- 避免太多口頭禪，例如「呃」「即係話」，除非用來營造節奏。
- 避免 emoji。

Transformation rules:
1. Preserve content:
   - 不刪減重要資訊、不改變立場。
   - 如果你覺得用戶內容有邏輯漏洞，只能用角色語氣「委婉咁指出」，唔好硬改結論。
2. Enhance structure:
   - 幫用戶自動分段：背景 → 重點 → 結論。
   - 可以加入「過渡句」令內容更順，例如「咁點解我話咁呢？」。
3. Prepare for TTS:
   - 句子盡量 5–20 字。
   - 避免太多括號、符號、長句。
   - 不需要標點式節奏提示（例如「……」、「—」），用正常標點即可。

Safety:
- 如果用戶要求你幫佢發表違法煽動內容，請用角色方式勸喻、轉為分析式評論，而不是號召行動。

When you respond:
- Do NOT explain your transformation.
- Do NOT show intermediate analysis.
- Just output the final, polished speech of the character.`;

  const userPromptExample = `【原意】
我想講：其實最近某某國家喺中東個部署，根本唔係新聞講嗰種「保護盟友」咁簡單，我係想拆返佢背後嗰啲能源利益、國內選舉因素，順便串一串啲太天真嘅評論。

【請幫我】
幫我改寫成「老花生叔」風格，可以當作 IG Reels / YouTube Shorts 旁白用，大約 45–60 秒。`;

  const multiCharacterPrompt = `When the user writes:

[character: 老花生叔]
...text...

Use the 老花生叔 persona.

When the user writes:

[character: XX女記者]
...text...

Use a different persona defined below.

If no [character: ] is specified, default to 老花生叔.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Use Cases
          </Link>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Live Fictional Character
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                AI persona engine for VTubers, avatars, and character-based content creation
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Section */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            Overview
          </h2>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            Use Claude Code as a <strong>Character Script Engine</strong> - the LLM transforms what you say into a specific persona&apos;s voice,
            which can then be passed to TTS (Text-to-Speech) or avatar systems for live streaming or content creation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <MessageSquare className="w-6 h-6 text-rose-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Persona Engine</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Transform raw thoughts into character-authentic dialogue
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <Volume2 className="w-6 h-6 text-rose-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">TTS-Ready Output</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Short sentences optimized for voice synthesis
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <Video className="w-6 h-6 text-rose-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Avatar Integration</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Works with Open-LLM-VTuber, Live2D, and more
              </p>
            </div>
          </div>
        </section>

        {/* Concept Section */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            1. Core Concept
          </h2>
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4 mb-4">
            <p className="text-rose-800 dark:text-rose-200 text-sm">
              <strong>Goal:</strong> Claude acts as your &quot;translator&quot; - converting your raw thoughts into a fictional character&apos;s voice.
            </p>
          </div>

          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 font-semibold text-xs">1</div>
              <div><strong>You are:</strong> The scriptwriter/ghostwriter that &quot;translates&quot; into a fictional character</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 font-semibold text-xs">2</div>
              <div><strong>Input:</strong> Your real intended content (usually casual, stream-of-consciousness)</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 font-semibold text-xs">3</div>
              <div><strong>Output:</strong> Same meaning, but rewritten in the character&apos;s tone, knowledge boundaries, and values</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 font-semibold text-xs">4</div>
              <div><strong>Format:</strong> Clean, TTS-ready (short sentences, minimal filler words)</div>
            </div>
          </div>
        </section>

        {/* System Prompt Section */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              2. System Prompt Template
            </h2>
            <button
              onClick={() => copyToClipboard(systemPrompt, 'system')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              {copiedSection === 'system' ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600 dark:text-slate-400">Copy</span>
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Paste this into Claude Code&apos;s System/Instruction field. Customize the character profile as needed.
          </p>

          <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
              {systemPrompt}
            </pre>
          </div>
        </section>

        {/* User Prompt Section */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              3. User Prompt Usage
            </h2>
            <button
              onClick={() => copyToClipboard(userPromptExample, 'user')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              {copiedSection === 'user' ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600 dark:text-slate-400">Copy</span>
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Each time you want to speak, use this format (you can build a small tool to auto-wrap):
          </p>

          <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
              {userPromptExample}
            </pre>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
            Claude will respond with the character-transformed version, ready to send to TTS/voiceover.
          </p>
        </section>

        {/* Pipeline Section */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            4. All-in-One Pipeline Architecture
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            The &quot;all-in-one&quot; setup: <strong>Claude as the central persona engine</strong>, with everything else as I/O modules.
          </p>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Input Layer</h3>
              </div>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 ml-10">
                <li>Fill in Notion / custom web UI with:</li>
                <li className="ml-4">- Raw text (or voice → Whisper → text)</li>
                <li className="ml-4">- Select character (can preset 1-2 personas with variable system prompts)</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Server Side (Claude Engine)</h3>
              </div>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 ml-10">
                <li>Assemble [Raw Intent] + [Character Requirements] into user prompt</li>
                <li>Send to Claude API (or Claude Code)</li>
                <li>Receive character-version text</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-sm">3</div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Output Layer</h3>
              </div>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 ml-10">
                <li>Send to TTS/VC system (local RVC / seed-vc or cloud TTS)</li>
                <li>Simultaneously send text to avatar system (Open-LLM-VTuber&apos;s Live2D / custom frontend)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Multi-Character Section */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              5. Multi-Character Support
            </h2>
            <button
              onClick={() => copyToClipboard(multiCharacterPrompt, 'multi')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              {copiedSection === 'multi' ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600 dark:text-slate-400">Copy</span>
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            To support multiple personas in the same Claude Code session, add this to your system prompt:
          </p>

          <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto mb-4">
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
              {multiCharacterPrompt}
            </pre>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            Then define multiple character profiles in the system prompt. In your frontend UI, add a dropdown to change <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400">[character: ...]</code>,
            and the rest of the pipeline stays unchanged.
          </p>
        </section>

        {/* Resources Section */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Related Resources
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://github.com/Open-LLM-VTuber/Open-LLM-VTuber"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-rose-500" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Open-LLM-VTuber</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Open-source VTuber framework with LLM integration</div>
              </div>
            </a>

            <a
              href="https://open-llm-vtuber.github.io/en/docs/user-guide/backend/structure/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-rose-500" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Open-LLM-VTuber Docs</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Backend structure and integration guide</div>
              </div>
            </a>

            <a
              href="https://github.com/Kedreamix/Linly-Talker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-rose-500" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Linly-Talker</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Digital avatar with voice synthesis</div>
              </div>
            </a>

            <a
              href="https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-rose-500" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">RVC (Voice Conversion)</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Real-time voice conversion for character voices</div>
              </div>
            </a>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Use Case Ideas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4">
              <Mic className="w-5 h-5 text-rose-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Pre-recorded Voiceover</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Create character-voiced content for YouTube, podcasts, or audiobooks
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4">
              <Video className="w-5 h-5 text-rose-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Live VTuber Streaming</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Real-time persona transformation for Discord, OBS, or Twitch
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4">
              <MessageSquare className="w-5 h-5 text-rose-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Social Media Content</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Generate IG Reels / YouTube Shorts scripts in character voice
              </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4">
              <User className="w-5 h-5 text-rose-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Educational Characters</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Create engaging educational content with memorable personas
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <p>5ML Agentic AI Platform v1.0 - Live Fictional Character Engine</p>
            <p className="mt-2">Powered by Claude API</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

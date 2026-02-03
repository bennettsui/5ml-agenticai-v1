'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mic, Copy, Check, ExternalLink, Sparkles, MessageSquare, Volume2, Video, Camera, Monitor, Zap } from 'lucide-react';

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
            Transform <strong>both your voice AND appearance</strong> into a fictional character in real-time. Use Claude as a <strong>Character Script Engine</strong> for dialogue,
            combined with face-tracking and voice conversion tools to create a complete live persona transformation pipeline.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <MessageSquare className="w-6 h-6 text-rose-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Persona Engine</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Transform raw thoughts into character-authentic dialogue
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <Volume2 className="w-6 h-6 text-rose-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Voice Conversion</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Real-time voice cloning and TTS synthesis
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <Camera className="w-6 h-6 text-rose-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Face Transform</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Live face swap, deepfake, or avatar puppeteering
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <Video className="w-6 h-6 text-rose-500 mb-2" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Avatar Integration</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Works with Live2D, VTuber, and streaming tools
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

        {/* Live Camera & Visual Transformation Section */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-rose-500" />
            6. Live Camera & Visual Transformation
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            To transform your <strong>appearance</strong> (not just voice), you need face tracking + visual transformation. Here&apos;s the tech stack:
          </p>

          <div className="space-y-4 mb-6">
            {/* Face Input */}
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-rose-200 dark:border-rose-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Camera Input & Face Tracking</h3>
              </div>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2 ml-10">
                <li><strong>MediaPipe Face Mesh</strong> - Google&apos;s real-time face landmark detection (468 points)</li>
                <li><strong>OpenCV</strong> - Webcam capture and image processing</li>
                <li><strong>dlib</strong> - Alternative face detection with 68 landmark points</li>
              </ul>
            </div>

            {/* Visual Transformation */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Visual Transformation Options</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-10">
                <div className="bg-white/60 dark:bg-slate-800/60 rounded p-3">
                  <div className="font-medium text-slate-900 dark:text-white text-sm">Option A: Face Swap / Deepfake</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Your face → Character face in real-time</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Tools: DeepFaceLive, FaceFusion, SimSwap</p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded p-3">
                  <div className="font-medium text-slate-900 dark:text-white text-sm">Option B: Avatar Puppeteering</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Your face controls a 2D/3D avatar</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Tools: Live2D, VTube Studio, Open-LLM-VTuber</p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded p-3">
                  <div className="font-medium text-slate-900 dark:text-white text-sm">Option C: Talking Head Generation</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Static image + audio → animated video</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Tools: SadTalker, Wav2Lip, Linly-Talker</p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded p-3">
                  <div className="font-medium text-slate-900 dark:text-white text-sm">Option D: Full Body Motion</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Track body + face for full avatar control</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Tools: MediaPipe Holistic, OpenPose</p>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <Monitor className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Streaming Output</h3>
              </div>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2 ml-10">
                <li><strong>OBS Studio</strong> - Capture virtual camera output for streaming</li>
                <li><strong>Virtual Camera</strong> - Route transformed video to Zoom, Discord, etc.</li>
                <li><strong>NDI</strong> - Network-based video routing for professional setups</li>
              </ul>
            </div>
          </div>

          {/* Complete Pipeline Diagram */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
            <div className="text-xs text-slate-400 mb-2 font-mono">Complete Live Transformation Pipeline:</div>
            <pre className="text-sm text-slate-300 whitespace-pre font-mono">{`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   CAMERA    │───▶│ FACE TRACK  │───▶│  TRANSFORM  │───▶│   OUTPUT    │
│   INPUT     │    │  MediaPipe  │    │ DeepFaceLive│    │ OBS/Stream  │
└─────────────┘    └─────────────┘    │ or Live2D   │    └─────────────┘
                                      └─────────────┘
┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│    MIC      │───▶│   WHISPER   │───▶│   CLAUDE    │         │
│   INPUT     │    │ Speech→Text │    │ Persona Eng │         │
└─────────────┘    └─────────────┘    └──────┬──────┘         │
                                             │                 │
                                      ┌──────▼──────┐         │
                                      │  TTS / RVC  │─────────┘
                                      │ Voice Clone │    (sync audio+video)
                                      └─────────────┘
`}</pre>
          </div>
        </section>

        {/* Resources Section */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            GitHub Libraries & Resources
          </h2>

          {/* VTuber & Avatar Systems */}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Video className="w-4 h-4 text-rose-500" />
            VTuber & Avatar Systems
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <a
              href="https://github.com/Open-LLM-VTuber/Open-LLM-VTuber"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Open-LLM-VTuber</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">VTuber framework with LLM + Live2D integration</div>
              </div>
            </a>
            <a
              href="https://github.com/Kedreamix/Linly-Talker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Linly-Talker</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Digital human with voice synthesis</div>
              </div>
            </a>
          </div>

          {/* Face Swap & Deepfake */}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-purple-500" />
            Face Swap & Deepfake (Real-time)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <a
              href="https://github.com/iperov/DeepFaceLive"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">DeepFaceLive</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Real-time face swap for streaming</div>
              </div>
            </a>
            <a
              href="https://github.com/facefusion/facefusion"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">FaceFusion</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Next-gen face swapper and enhancer</div>
              </div>
            </a>
            <a
              href="https://github.com/neuralchen/SimSwap"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">SimSwap</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Arbitrary face swapping framework</div>
              </div>
            </a>
            <a
              href="https://github.com/s0md3v/roop"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Roop</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">One-click face swap</div>
              </div>
            </a>
          </div>

          {/* Talking Head / Lip Sync */}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            Talking Head & Lip Sync
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <a
              href="https://github.com/OpenTalker/SadTalker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">SadTalker</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Audio-driven talking face generation</div>
              </div>
            </a>
            <a
              href="https://github.com/Rudrabha/Wav2Lip"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Wav2Lip</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Accurate lip-sync from audio</div>
              </div>
            </a>
            <a
              href="https://github.com/OpenTalker/video-retalking"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Video-Retalking</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Audio-based lip sync editing</div>
              </div>
            </a>
            <a
              href="https://github.com/yerfor/GeneFacePlusPlus"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">GeneFace++</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Generalized talking face generation</div>
              </div>
            </a>
          </div>

          {/* Voice Conversion & TTS */}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-green-500" />
            Voice Conversion & TTS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <a
              href="https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">RVC WebUI</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Real-time voice conversion</div>
              </div>
            </a>
            <a
              href="https://github.com/Plachtaa/seed-vc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Seed-VC</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Zero-shot voice conversion</div>
              </div>
            </a>
            <a
              href="https://github.com/coqui-ai/TTS"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Coqui TTS</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Deep learning TTS library</div>
              </div>
            </a>
            <a
              href="https://github.com/fishaudio/fish-speech"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Fish Speech</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Multilingual voice cloning TTS</div>
              </div>
            </a>
          </div>

          {/* Face Tracking */}
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-500" />
            Face Tracking & Detection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              href="https://github.com/google/mediapipe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">MediaPipe</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Google&apos;s ML solutions for face/body tracking</div>
              </div>
            </a>
            <a
              href="https://github.com/CMU-Perceptual-Computing-Lab/openpose"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">OpenPose</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Real-time body/face/hand keypoint detection</div>
              </div>
            </a>
            <a
              href="https://github.com/deepinsight/insightface"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">InsightFace</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">2D/3D face analysis toolkit</div>
              </div>
            </a>
            <a
              href="https://open-llm-vtuber.github.io/en/docs/user-guide/backend/structure/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">Open-LLM-VTuber Docs</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Backend architecture guide</div>
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

'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useTeacherAuth } from '@/components/adaptive/useTeacherAuth';

type UploadStatus = 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'ERROR';

export default function UploadPage() {
  const { teacher } = useTeacherAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [examName, setExamName] = useState('');
  const [gradeBand, setGradeBand] = useState('S1-S2');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState<UploadStatus>('IDLE');
  const [paperId, setPaperId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return; }
    setFile(f); setError('');
    if (!examName) setExamName(f.name.replace('.pdf', '').replace(/_/g, ' '));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('UPLOADING'); setError('');
    const form = new FormData();
    form.append('file', file);
    form.append('exam_name', examName || file.name);
    form.append('grade_band', gradeBand);
    form.append('year', year);
    if (teacher) form.append('teacher_id', teacher.id);

    try {
      const res = await fetch('/api/adaptive-learning/teachers/papers/upload', {
        method: 'POST',
        headers: teacher ? { 'X-Teacher-Id': teacher.id } : {},
        body: form,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPaperId(data.paper_id);
      setMessage(data.message || 'Uploaded! Gemini is extracting questions…');
      setStatus('PROCESSING');

      // Poll until DRAFT_READY
      let tries = 0;
      const poll = setInterval(async () => {
        tries++;
        if (tries > 24) { clearInterval(poll); setStatus('READY'); return; }
        try {
          const r = await fetch(`/api/adaptive-learning/teachers/papers/${data.paper_id}/draft-questions`);
          const d = await r.json();
          if (d.status === 'DRAFT_READY' || d.status === 'CONFIRMED' || (d.draft_questions && d.draft_questions.length > 0)) {
            clearInterval(poll); setStatus('READY');
          } else if (d.status === 'NEEDS_REVIEW') {
            clearInterval(poll); setStatus('ERROR');
            setError('OCR could not extract questions. Please check the PDF quality.');
          }
        } catch {}
      }, 5000);
    } catch (err: any) {
      setError(err.message); setStatus('ERROR');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload Past Paper</h1>
        <p className="text-slate-400 text-sm mt-1">Gemini AI will extract and clean all questions automatically.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {['Upload PDF', 'Gemini OCR', 'Review & Confirm'].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              (status === 'IDLE' || status === 'UPLOADING') && i === 0 ? 'bg-purple-600 text-white' :
              status === 'PROCESSING' && i === 1 ? 'bg-purple-600 text-white' :
              status === 'READY' && i === 2 ? 'bg-emerald-600 text-white' :
              'bg-slate-700 text-slate-400'
            }`}>{i + 1}</div>
            <span className={i === 1 && status === 'PROCESSING' ? 'text-purple-400' : ''}>{s}</span>
            {i < 2 && <div className="w-6 h-px bg-slate-700" />}
          </div>
        ))}
      </div>

      {/* Drop zone */}
      {status === 'IDLE' || status === 'ERROR' ? (
        <div className="space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-purple-500 bg-purple-500/5' :
              file ? 'border-emerald-500/50 bg-emerald-500/5' :
              'border-slate-700 hover:border-slate-600 bg-slate-800/30'
            }`}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-emerald-400" />
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-slate-500" />
                <p className="text-sm text-slate-300 font-medium">Drop PDF here or click to browse</p>
                <p className="text-xs text-slate-500">Max 20 MB · PDF only</p>
              </div>
            )}
          </div>

          {file && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Exam name</label>
                <input value={examName} onChange={e => setExamName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Grade band</label>
                  <select value={gradeBand} onChange={e => setGradeBand(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    {['S1', 'S2', 'S3', 'S1-S2', 'S2-S3'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Year</label>
                  <input type="number" value={year} onChange={e => setYear(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            onClick={handleUpload} disabled={!file || status === 'UPLOADING'}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {status === 'UPLOADING' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {status === 'UPLOADING' ? 'Uploading…' : 'Upload & Extract Questions'}
          </button>
        </div>
      ) : status === 'PROCESSING' ? (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <p className="text-white font-medium">Gemini is reading your paper…</p>
            <p className="text-slate-400 text-sm mt-1">{message}</p>
            <p className="text-slate-500 text-xs mt-2">This usually takes 15–60 seconds.</p>
          </div>
        </div>
      ) : status === 'READY' ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-4">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <div>
            <p className="text-white font-medium text-lg">Questions extracted!</p>
            <p className="text-slate-400 text-sm mt-1">Review and approve each question before students can see it.</p>
          </div>
          <Link
            href={`/adaptive-learning/teach/questions/pending${paperId ? `?paper_id=${paperId}` : ''}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Review Questions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

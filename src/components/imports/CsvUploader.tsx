'use client';

import React, { useRef, useState, useTransition } from 'react';
import { parseContactsCsv, type ContactRow } from '@/modules/imports/csv.parser';
import { importContactsAction } from '@/app/(setup)/setup/actions';

export default function CsvUploader() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]   = useState<ContactRow[]>([]);
  const [csvText, setCsvText]   = useState('');
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [result, setResult]     = useState<{ imported?: number; skipped?: number; errors?: string[] } | null>(null);
  const [isPending, startTransition] = useTransition();

  const processFile = (file: File) => {
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      const { rows, errors } = parseContactsCsv(text);
      setPreview(rows.slice(0, 10));
      setParseErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = () => {
    if (!csvText) return;
    startTransition(async () => {
      const formData = new FormData();
      const blob = new Blob([csvText], { type: 'text/csv' });
      formData.append('csvFile', blob, fileName || 'contacts.csv');
      const res = await importContactsAction(formData);
      if ('success' in res && res.success) {
        setResult({ imported: res.imported, skipped: res.skipped, errors: res.parseErrors });
        setPreview([]);
        setCsvText('');
        setFileName('');
      } else if ('error' in res) {
        setResult({ errors: [res.error ?? 'Unknown error'] });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm font-medium text-gray-700">
          {fileName ? fileName : 'Drag & drop a CSV file, or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">Supported columns: name, email, phone, company</p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFileChange} />
      </div>

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-xs font-semibold text-yellow-800 mb-1">Parse warnings ({parseErrors.length})</p>
          <ul className="text-xs text-yellow-700 space-y-0.5">
            {parseErrors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Preview — first {preview.length} rows
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-xs divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Phone', 'Company'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {preview.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium text-gray-900">{row.name}</td>
                    <td className="px-3 py-2 text-gray-600">{row.email || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{row.phone || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{row.company || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleImport}
            disabled={isPending}
            className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {isPending ? 'Importing...' : `Import ${preview.length > 9 ? '(all rows)' : `${preview.length} contacts`}`}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-md p-4 border ${result.imported !== undefined ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {result.imported !== undefined ? (
            <>
              <p className="text-sm font-semibold text-green-800">
                ✓ Import complete — {result.imported} contact{result.imported !== 1 ? 's' : ''} imported
                {result.skipped ? `, ${result.skipped} skipped` : ''}
              </p>
              {result.errors && result.errors.length > 0 && (
                <ul className="mt-1 text-xs text-green-700 space-y-0.5">
                  {result.errors.slice(0, 5).map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm font-semibold text-red-800">
              {result.errors?.[0] || 'Import failed.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

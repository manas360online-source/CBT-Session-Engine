import React from 'react';
import { SessionResult } from '../types';
import { ArrowLeft, Download, FileText } from 'lucide-react';

interface Props {
  results: SessionResult[];
  onBack: () => void;
}

const ResultsView: React.FC<Props> = ({ results, onBack }) => {

  const handleExportCSV = (r: SessionResult) => {
    const headers = ['Question ID', 'Answer'];
    const rows = Object.entries(r.answers).map(([k, v]) => [k, Array.isArray(v) ? v.join(';') : v]);
    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `session_${r.sessionId}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-8 no-print">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 flex items-center gap-2 group transition-colors">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-slate-700 group-hover:text-slate-900">Return to Dashboard</span>
        </button>
      </div>

      <div className="space-y-6">
        {results.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
             <FileText size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-slate-500 italic">No completed sessions found.</p>
           </div>
        ) : (
            results.slice().reverse().map(r => (
                <div key={r.sessionId} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm break-inside-avoid">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{r.templateTitle}</h3>
                            <p className="text-sm text-slate-500">{new Date(r.completedAt).toLocaleString()}</p>
                            <p className="text-xs text-slate-400 font-mono mt-1">ID: {r.sessionId}</p>
                        </div>
                        <div className="flex gap-2 no-print">
                            <button onClick={() => handleExportCSV(r)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded flex items-center gap-1">
                                <Download size={14} /> CSV
                            </button>
                            <button onClick={handlePrint} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded flex items-center gap-1">
                                <FileText size={14} /> Print
                            </button>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
                        {Object.entries(r.answers).map(([qId, ans]) => (
                            <div key={qId} className="grid grid-cols-12 gap-4">
                                <span className="col-span-12 md:col-span-4 text-slate-500 font-medium truncate" title={qId}>{qId}</span>
                                <span className="col-span-12 md:col-span-8 text-slate-800 font-semibold">
                                    {Array.isArray(ans) ? ans.join(', ') : ans.toString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))
        )}
      </div>
      <style>{`
        @media print {
            .no-print { display: none !important; }
            body { background: white; }
            .shadow-sm { box-shadow: none; border: 1px solid #ccc; }
        }
      `}</style>
    </div>
  );
};

export default ResultsView;
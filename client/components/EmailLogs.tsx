
import React from 'react';
import { EmailLog } from '../types';
import { Mail, ArrowLeft, Clock, CheckCircle } from 'lucide-react';

interface EmailLogsProps {
  logs: EmailLog[];
  onBack: () => void;
}

const EmailLogs: React.FC<EmailLogsProps> = ({ logs, onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-surface border border-transparent hover:border-line rounded-xl transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-inksoft" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-ink tracking-tight">Journal SMTP (Emails)</h1>
            <p className="text-inksoft font-medium">Historique des notifications sortantes envoyées par le système.</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface2 border-b border-linesoft">
                <th className="px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider">Destinataire</th>
                <th className="px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider">Sujet</th>
                <th className="px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider">Horodatage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linesoft">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-inkmuted italic">Aucun email envoyé pour le moment.</td>
                </tr>
              ) : (
                logs.slice().reverse().map((log) => (
                  <tr key={log.id} className="hover:bg-indigo-50/10 transition-colors group align-top">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-sm text-ink">{log.to}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-ink mb-1">{log.subject}</p>
                      <pre className="text-[10px] text-inksoft whitespace-pre-wrap font-sans leading-relaxed max-w-md bg-surface2 p-3 rounded-lg border border-linesoft">
                        {log.body}
                      </pre>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-green-600 dark:text-emerald-300 text-xs font-bold uppercase">
                        <CheckCircle className="w-3.5 h-3.5" />
                        DÉLIVRÉ
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-xs text-inkmuted whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        {new Date(log.sentAt).toLocaleString('fr-FR')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailLogs;

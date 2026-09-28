import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ArrowUpRight, ArrowDownRight, CheckCircle, Clock, XCircle } from 'lucide-react';

const mockPayments = [
  { id: '#PAY-001', customer: 'Aminata Diallo', method: 'Orange Money', amount: 45000, status: 'success', date: '22/06/2026' },
  { id: '#PAY-002', customer: 'Moussa Koné', method: 'Wave', amount: 18000, status: 'pending', date: '22/06/2026' },
  { id: '#PAY-003', customer: 'Fatoumata Bah', method: 'MTN Money', amount: 77000, status: 'success', date: '21/06/2026' },
  { id: '#PAY-004', customer: 'Ibrahim Traoré', method: 'Carte Visa', amount: 12000, status: 'failed', date: '21/06/2026' },
  { id: '#PAY-005', customer: 'Mariam Coulibaly', method: 'Orange Money', amount: 32000, status: 'success', date: '20/06/2026' },
];

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  success: { label: 'Réussi', class: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
  pending: { label: 'En attente', class: 'bg-amber-50 text-amber-700', icon: Clock },
  failed: { label: 'Échoué', class: 'bg-red-50 text-red-700', icon: XCircle },
};

const Payments: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paiements</h1>
        <p className="text-slate-500 mt-1">Suivez toutes les transactions financières</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Revenus du mois', value: '1 245 000 FCFA', change: '+12.5%', up: true, color: 'text-emerald-500' },
          { label: 'Transactions réussies', value: '342', change: '+8.1%', up: true, color: 'text-emerald-500' },
          { label: 'Transactions échouées', value: '14', change: '-2.3%', up: false, color: 'text-red-500' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-slate-900 mb-2">{s.value}</p>
            <div className={`flex items-center gap-1 text-sm font-medium ${s.color}`}>
              {s.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {s.change} vs mois dernier
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-slate-900">Transactions récentes</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-6 py-4 font-medium text-slate-500">ID</th>
              <th className="text-left px-6 py-4 font-medium text-slate-500">Client</th>
              <th className="text-left px-6 py-4 font-medium text-slate-500">Méthode</th>
              <th className="text-left px-6 py-4 font-medium text-slate-500">Montant</th>
              <th className="text-left px-6 py-4 font-medium text-slate-500">Date</th>
              <th className="text-left px-6 py-4 font-medium text-slate-500">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {mockPayments.map((p) => {
              const s = statusConfig[p.status];
              const StatusIcon = s.icon;
              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-700">{p.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-400 text-white text-xs flex items-center justify-center font-bold">{p.customer[0]}</div>
                      <span className="text-slate-700">{p.customer}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">{p.method}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{p.amount.toLocaleString()} FCFA</td>
                  <td className="px-6 py-4 text-slate-500">{p.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.class}`}>
                      <StatusIcon className="w-3 h-3" />{s.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
};

export default Payments;

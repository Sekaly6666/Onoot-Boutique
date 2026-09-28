import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Edit2, Eye, Plus, Image, FileText, Globe } from 'lucide-react';

const mockContent = [
  { id: 1, type: 'Bannière', title: 'Promo Été 2026', status: 'published', updated: '20/06/2026' },
  { id: 2, type: 'Page', title: 'À propos d\'Onoot', status: 'published', updated: '15/06/2026' },
  { id: 3, type: 'Bannière', title: 'Nouvelle Collection', status: 'draft', updated: '18/06/2026' },
  { id: 4, type: 'Page', title: 'Politique de retour', status: 'published', updated: '10/06/2026' },
  { id: 5, type: 'Annonce', title: 'Livraison gratuite dès 20 000 FCFA', status: 'published', updated: '22/06/2026' },
];

const typeIcon: Record<string, any> = { 'Bannière': Image, 'Page': FileText, 'Annonce': Globe };

const Content: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contenu</h1>
          <p className="text-slate-500 mt-1">Gérez les pages, bannières et annonces de la boutique</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-xl shadow-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Nouveau contenu
        </button>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        {['Tout', 'Bannière', 'Page', 'Annonce'].map(f => (
          <button key={f} className={`px-4 py-2 text-sm rounded-xl border transition-colors ${f === 'Tout' ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {mockContent.map((c, i) => {
          const Icon = typeIcon[c.type] || MessageSquare;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{c.type}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {c.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <p className="font-medium text-slate-900 truncate">{c.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">Modifié le {c.updated}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Content;

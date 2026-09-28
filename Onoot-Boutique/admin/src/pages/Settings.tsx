import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Bell, Shield, Globe, Save, ChevronRight } from 'lucide-react';

const sections = [
  { id: 'store', label: 'Boutique', icon: Store },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Sécurité', icon: Shield },
  { id: 'locale', label: 'Langue & Région', icon: Globe },
];

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('store');
  const [storeName, setStoreName] = useState(() => localStorage.getItem('admin_store_name') || 'Onoot Boutique');
  const [storeEmail, setStoreEmail] = useState(() => {
    const saved = localStorage.getItem('admin_store_email');
    if (!saved || saved === 'nootboutique@gmail.com' || saved === 'contact@onootboutique.com') return 'onootboutique@gmail.com';
    return saved;
  });
  const [storePhone, setStorePhone] = useState(() => localStorage.getItem('admin_store_phone') || '+2250503648312');
  const [currency, setCurrency] = useState(() => localStorage.getItem('admin_store_currency') || 'FCFA');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('admin_store_name', storeName);
    localStorage.setItem('admin_store_email', storeEmail);
    localStorage.setItem('admin_store_phone', storePhone);
    localStorage.setItem('admin_store_currency', currency);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-500 mt-1">Configurez votre boutique et vos préférences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all active:scale-95 ${activeSection === s.id ? 'bg-primary/10 text-primary font-semibold shadow-xs' : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{s.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50 hidden lg:block flex-shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Main Panel */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          {activeSection === 'store' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Informations de la boutique
              </h2>
              {[
                { label: 'Nom de la boutique', value: storeName, setter: setStoreName, type: 'text' },
                { label: 'Email de contact', value: storeEmail, setter: setStoreEmail, type: 'email' },
                { label: 'Téléphone', value: storePhone, setter: setStorePhone, type: 'tel' },
                { label: 'Devise', value: currency, setter: setCurrency, type: 'text' },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Préférences de notifications
              </h2>
              {[
                'Nouvelles commandes', 'Nouveaux utilisateurs', 'Ruptures de stock',
                'Avis clients', 'Mises à jour système'
              ].map((item) => (
                <div key={item} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-700">{item}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Sécurité du compte
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe actuel</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nouveau mot de passe</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmer le mot de passe</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>
            </div>
          )}

          {activeSection === 'locale' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Langue & Région
              </h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Langue de l'interface</label>
                <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white">
                  <option>Français</option>
                  <option>English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fuseau horaire</label>
                <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white">
                  <option>Africa/Conakry (GMT+0)</option>
                  <option>Africa/Abidjan (GMT+0)</option>
                  <option>Europe/Paris (GMT+2)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Format de date</label>
                <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white">
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              onClick={handleSave}
              className={`w-full sm:w-auto min-h-[46px] sm:min-h-[42px] flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all active:scale-[0.98] shadow-md ${saved ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
            >
              <Save className="w-4 h-4 flex-shrink-0" />
              <span>{saved ? 'Enregistré ✓' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;

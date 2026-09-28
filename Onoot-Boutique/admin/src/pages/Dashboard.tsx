import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { PackageX, ShoppingBag, ShoppingCart, TrendingUp, Users, FileDown } from 'lucide-react';

type AdminStats = {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  newUsersThisMonth: number;
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
};

type TopProduct = {
  product: { id: string; name: string; price: number; images?: string[]; imageUrl?: string };
  salesCount: number;
  revenue: number;
};

const formatMoney = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} FCFA`;

async function adminFetch<T>(path: string): Promise<T> {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const StatCard = ({ title, value, icon: Icon, accentClass, iconClass, trend, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    whileHover={{ y: -3 }}
    className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-foreground">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${accentClass}`}>
        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
        <span className="text-green-500 font-semibold">{trend}</span>
        <span className="text-muted-foreground ml-2">ce mois</span>
      </div>
    )}
  </motion.div>
);

const Dashboard: React.FC = () => {
  const statsQuery = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminFetch<AdminStats>('/api/admin/stats') });
  const topProductsQuery = useQuery({ queryKey: ['admin-top-products'], queryFn: () => adminFetch<TopProduct[]>('/api/admin/top-products?limit=5') });
  const stats = statsQuery.data;
  const maxOrders = Math.max(1, ...(stats?.ordersByStatus || []).map((item) => item.count));

  const handleGenerateReport = () => {
    if (!stats) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const topProducts = topProductsQuery.data || [];
    const totalStatusOrders = (stats.ordersByStatus || []).reduce((acc, cur) => acc + cur.count, 0) || stats.totalOrders || 1;

    const getStatusStyle = (status: string) => {
      const s = status.toLowerCase();
      if (s.includes('livr') || s.includes('termin') || s.includes('deliver')) {
        return 'background-color: #DCFCE7; color: #166534; font-weight: bold; border: 1px solid #86EFAC;';
      }
      if (s.includes('cours') || s.includes('expéd') || s.includes('process') || s.includes('ship')) {
        return 'background-color: #DBEAFE; color: #1E40AF; font-weight: bold; border: 1px solid #93C5FD;';
      }
      if (s.includes('attente') || s.includes('pend')) {
        return 'background-color: #FEF3C7; color: #92400E; font-weight: bold; border: 1px solid #FCD34D;';
      }
      if (s.includes('annul') || s.includes('refus') || s.includes('cancel')) {
        return 'background-color: #FEE2E2; color: #991B1B; font-weight: bold; border: 1px solid #FCA5A5;';
      }
      return 'background-color: #F1F5F9; color: #334155; font-weight: bold; border: 1px solid #CBD5E1;';
    };

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Rapport Onoot</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; background-color: #FFFFFF; color: #1E293B; margin: 20px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 25px; }
          th { text-align: left; padding: 12px 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 10px 14px; font-size: 13px; }
          .header-banner { background: #0F172A; color: #FFFFFF; padding: 20px; border-radius: 8px; }
          .tricolor-cyan { background-color: #4BB5E8; height: 4px; }
          .tricolor-yellow { background-color: #F5C430; height: 4px; }
          .tricolor-orange { background-color: #E87C2A; height: 4px; }
          .kpi-box { padding: 16px; border-radius: 8px; text-align: center; }
        </style>
      </head>
      <body>
        <!-- Bannière aux couleurs d'Onoot -->
        <table style="width: 100%; border: none;">
          <tr>
            <td style="height: 5px; background-color: #4BB5E8; padding: 0;"></td>
            <td style="height: 5px; background-color: #F5C430; padding: 0;"></td>
            <td style="height: 5px; background-color: #E87C2A; padding: 0;"></td>
          </tr>
          <tr>
            <td colspan="3" style="background-color: #0F172A; color: #FFFFFF; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; color: #FFFFFF;">
                ONOOT BOUTIQUE
              </h1>
              <p style="margin: 6px 0 0; font-size: 15px; color: #F5C430; font-weight: 600;">
                RAPPORT OFFICIEL D'ACTIVITÉ & ANALYSE DE PERFORMANCE
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #94A3B8;">
                Généré le : <strong style="color: #FFFFFF;">${dateStr}</strong> | Direction Générale & Administration
              </p>
            </td>
          </tr>
        </table>

        <!-- Indicateurs Clés de Performance (KPIs) -->
        <h2 style="font-size: 16px; font-weight: bold; color: #0F172A; margin: 20px 0 10px; border-left: 4px solid #E87C2A; padding-left: 10px;">
          INDICATEURS CLÉS DU COMMERCE
        </h2>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; border: 1px solid #CBD5E1; width: 100%;">
          <thead>
            <tr style="background-color: #1E293B; color: #FFFFFF;">
              <th style="padding: 12px; text-align: center; color: #FFFFFF; background-color: #1E293B;">Total Commandes</th>
              <th style="padding: 12px; text-align: center; color: #FFFFFF; background-color: #1E293B;">Total Clients</th>
              <th style="padding: 12px; text-align: center; color: #FFFFFF; background-color: #1E293B;">Nouveaux Clients (Mois)</th>
              <th style="padding: 12px; text-align: center; color: #FFFFFF; background-color: #1E293B;">Catalogue Produits</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="background-color: #EFF6FF; border: 1px solid #BFDBFE; text-align: center; padding: 18px;">
                <span style="font-size: 26px; font-weight: 800; color: #1D4ED8; display: block;">${(stats.totalOrders || 0).toLocaleString('fr-FR')}</span>
                <span style="font-size: 11px; color: #3B82F6; font-weight: 600; text-transform: uppercase;">Commandes enregistrées</span>
              </td>
              <td style="background-color: #FEF9C3; border: 1px solid #FDE047; text-align: center; padding: 18px;">
                <span style="font-size: 26px; font-weight: 800; color: #A16207; display: block;">${(stats.totalUsers || 0).toLocaleString('fr-FR')}</span>
                <span style="font-size: 11px; color: #CA8A04; font-weight: 600; text-transform: uppercase;">Comptes clients</span>
              </td>
              <td style="background-color: #F0FDF4; border: 1px solid #BBF7D0; text-align: center; padding: 18px;">
                <span style="font-size: 26px; font-weight: 800; color: #15803D; display: block;">+${(stats.newUsersThisMonth || 0).toLocaleString('fr-FR')}</span>
                <span style="font-size: 11px; color: #16A34A; font-weight: 600; text-transform: uppercase;">Inscrits ce mois</span>
              </td>
              <td style="background-color: #FAF5FF; border: 1px solid #E9D5FF; text-align: center; padding: 18px;">
                <span style="font-size: 26px; font-weight: 800; color: #7E22CE; display: block;">${(stats.totalProducts || 0).toLocaleString('fr-FR')}</span>
                <span style="font-size: 11px; color: #9333EA; font-weight: 600; text-transform: uppercase;">Articles en vente</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Commandes par Statut -->
        <h2 style="font-size: 16px; font-weight: bold; color: #0F172A; margin: 30px 0 10px; border-left: 4px solid #4BB5E8; padding-left: 10px;">
          SUIVI DES COMMANDES PAR ÉTAPE
        </h2>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; border: 1px solid #CBD5E1; width: 100%;">
          <thead>
            <tr style="background-color: #F8FAFC;">
              <th style="border: 1px solid #E2E8F0; color: #475569; width: 50%;">Statut de la commande</th>
              <th style="border: 1px solid #E2E8F0; color: #475569; width: 25%; text-align: center;">Nombre</th>
              <th style="border: 1px solid #E2E8F0; color: #475569; width: 25%; text-align: center;">Part (%)</th>
            </tr>
          </thead>
          <tbody>
            ${(stats.ordersByStatus || []).map((s, index) => {
              const percentage = Math.round((s.count / totalStatusOrders) * 100);
              const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
              return `
                <tr style="background-color: ${rowBg};">
                  <td style="border: 1px solid #E2E8F0;">
                    <span style="display: inline-block; padding: 4px 12px; border-radius: 4px; ${getStatusStyle(s.status)}">
                      ${s.status}
                    </span>
                  </td>
                  <td style="border: 1px solid #E2E8F0; text-align: center; font-weight: bold; font-size: 14px; color: #0F172A;">
                    ${s.count}
                  </td>
                  <td style="border: 1px solid #E2E8F0; text-align: center; font-weight: 600; color: #64748B;">
                    ${percentage}%
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        ${topProducts.length > 0 ? `
          <!-- Meilleurs Produits -->
          <h2 style="font-size: 16px; font-weight: bold; color: #0F172A; margin: 30px 0 10px; border-left: 4px solid #F5C430; padding-left: 10px;">
            TOP PRODUITS LES PLUS VENDUS
          </h2>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; border: 1px solid #CBD5E1; width: 100%;">
            <thead>
              <tr style="background-color: #F8FAFC;">
                <th style="border: 1px solid #E2E8F0; color: #475569; width: 15%; text-align: center;">Rang</th>
                <th style="border: 1px solid #E2E8F0; color: #475569; width: 55%;">Nom de l'article</th>
                <th style="border: 1px solid #E2E8F0; color: #475569; width: 30%; text-align: center;">Ventes cumulées</th>
              </tr>
            </thead>
            <tbody>
              ${topProducts.map((item, index) => {
                const medals = ['1er', '2ème', '3ème', '4ème', '5ème'];
                const medalBg = index === 0 ? '#FEF9C3' : index === 1 ? '#F1F5F9' : index === 2 ? '#FFEDD5' : '#FFFFFF';
                return `
                  <tr style="background-color: ${medalBg};">
                    <td style="border: 1px solid #E2E8F0; text-align: center; font-weight: bold; color: #0F172A;">
                      ${medals[index] || `#${index + 1}`}
                    </td>
                    <td style="border: 1px solid #E2E8F0; font-weight: 600; color: #0F172A;">
                      ${item.product.name}
                    </td>
                    <td style="border: 1px solid #E2E8F0; text-align: center; font-weight: bold; color: #E87C2A; font-size: 14px;">
                      ${item.salesCount} unité(s)
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        <!-- Pied de page -->
        <table style="width: 100%; border: none; margin-top: 30px;">
          <tr>
            <td style="border-top: 2px solid #E2E8F0; padding-top: 15px; font-size: 11px; color: #94A3B8; text-align: center;">
              Document certifié et généré depuis le panel d'administration Onoot Boutique • Confidentiel & Usage Interne
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rapport_Onoot_Boutique_${now.toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">Vue en temps réel de la boutique, des commandes et des clients.</p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={!stats}
          className="w-full sm:w-auto min-h-[46px] sm:min-h-[40px] flex items-center justify-center gap-2.5 px-5 py-2.5 bg-accent-yellow text-slate-900 font-bold rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          <FileDown className="w-4 h-4 flex-shrink-0" />
          <span>Générer rapport</span>
        </button>
      </div>

      {statsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-card border border-border" />)}
        </div>
      ) : statsQuery.isError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">Impossible de charger les statistiques.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Commandes" value={(stats?.totalOrders || 0).toLocaleString('fr-FR')} icon={ShoppingCart} trend="Suivi" accentClass="bg-accent-blue/10" iconClass="text-accent-blue" delay={0.05} />
          <StatCard title="Utilisateurs" value={(stats?.totalUsers || 0).toLocaleString('fr-FR')} icon={Users} trend={`+${stats?.newUsersThisMonth || 0} ce mois`} accentClass="bg-accent-yellow/20" iconClass="text-accent-yellow" delay={0.1} />
          <StatCard title="Produits" value={(stats?.totalProducts || 0).toLocaleString('fr-FR')} icon={PackageX} accentClass="bg-muted" iconClass="text-muted-foreground" delay={0.15} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }} className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Commandes par statut</h3>
            <span className="text-xs font-semibold text-accent-blue bg-accent-blue/10 px-3 py-1 rounded-full">Temps réel</span>
          </div>
          <div className="h-[300px] flex items-end gap-3 rounded-xl border border-border bg-muted/50 p-4">
            {(stats?.ordersByStatus?.length ? stats.ordersByStatus : [{ status: 'Aucune', count: 0 }]).map((item) => (
              <div key={item.status} className="flex flex-1 flex-col items-center gap-2 min-w-0">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(8, (item.count / maxOrders) * 220)}px` }}
                  transition={{ duration: 0.7 }}
                  className="w-full max-w-12 rounded-t-xl bg-gradient-to-t from-primary via-accent-yellow to-accent-blue shadow-sm"
                  title={`${item.count} commandes`}
                />
                <span className="text-[11px] font-medium text-muted-foreground truncate max-w-full text-center">{item.status}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }} className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6">Produits les plus vendus</h3>
          <div className="space-y-4">
            {topProductsQuery.isLoading ? [1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />) : (topProductsQuery.data || []).map((item) => {
              const image = item.product.images?.[0] || item.product.imageUrl;
              return (
                <div key={item.product.id || item.product.name} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 bg-accent-blue/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {image ? <img src={image} alt={item.product.name} className="h-full w-full object-cover" /> : <ShoppingBag className="w-6 h-6 text-accent-blue" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.salesCount} ventes</p>
                  </div>
                  <div className="text-sm font-bold text-primary">{formatMoney(item.revenue)}</div>
                </div>
              );
            })}
            {!topProductsQuery.isLoading && (topProductsQuery.data || []).length === 0 && <p className="text-sm text-muted-foreground">Aucune vente enregistrée.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

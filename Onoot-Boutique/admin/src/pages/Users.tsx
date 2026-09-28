import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Edit2, 
  Trash2, 
  User as UserIcon, 
  Shield, 
  X, 
  Check, 
  UserX, 
  UserCheck, 
  Filter, 
  RefreshCw, 
  Plus, 
  Calendar, 
  Clock, 
  Activity, 
  Users as UsersIcon,
  Wifi,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import DeleteConfirm from '../components/DeleteConfirm';

interface User {
  id?: string;
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
  joinDate?: string;
  createdAt?: string;
  lastLogin?: string;
  lastActive?: string;
  isOnline?: boolean;
  orderCount?: number;
  authProvider?: 'local' | 'google';
  avatar?: string;
}

const userId = (u: User) => u.id || u._id || u.email;
const userName = (u: User) => u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;

const checkIsOnline = (u: User): boolean => {
  if (u.isOnline !== undefined) return Boolean(u.isOnline);
  const target = u.lastActive || u.lastLogin;
  if (!target) return false;
  return Date.now() - new Date(target).getTime() < 15 * 60 * 1000;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '—';
  }
};

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return 'Jamais';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Jamais';
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 2) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(d);
  } catch {
    return 'Jamais';
  }
};

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? (undefined as T) : res.json();
}

function useUsersData() {
  const [data, setData] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);

  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const result = await adminFetch<{ users: User[]; total: number }>('/api/admin/users?limit=100');
      setData(result.users || []);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { refetch(); }, [refetch]);
  return { data, isLoading, isError, refetch };
}

const Users: React.FC = () => {
  const { data: users, isLoading, isError, refetch } = useUsersData();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [presenceFilter, setPresenceFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Computed stats
  const onlineCount = useMemo(() => users.filter((u) => checkIsOnline(u)).length, [users]);
  const activeCount = useMemo(() => users.filter((u) => (u.status || 'actif') === 'actif').length, [users]);

  const filteredUsers = useMemo(() => users.filter((u) => {
    const matchSearch = `${userName(u)} ${u.email} ${u.phone || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (u.status || 'actif') === statusFilter;
    const isOnline = checkIsOnline(u);
    const matchPresence = presenceFilter === 'all' || (presenceFilter === 'online' ? isOnline : !isOnline);
    return matchSearch && matchRole && matchStatus && matchPresence;
  }), [users, searchTerm, roleFilter, statusFilter, presenceFilter]);

  const openModal = (user?: User) => {
    setEditingUser(user || null);
    setFormData(user ? { ...user } : { role: 'client', status: 'actif' });
    setSaveError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => { 
    setIsModalOpen(false); 
    setEditingUser(null); 
    setSaveError(null); 
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const fullName = (formData.name ?? '').trim();
      const [firstName = '', ...lastParts] = fullName.split(' ');
      const lastName = lastParts.join(' ');
      const rawPhone = (formData.phone ?? '').trim();
      const phoneRegex = /^(\+225)?[0-9]{10}$/;
      if (rawPhone && !phoneRegex.test(rawPhone)) {
        throw new Error('Le numéro de téléphone doit comporter 10 chiffres (ex: 0123456789 ou +2250123456789).');
      }
      const payload = {
        firstName,
        lastName,
        name: fullName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
      };

      if (editingUser) {
        await adminFetch(`/api/users/${userId(editingUser)}`, { method: 'PATCH', body: JSON.stringify(payload) });
        toast.success('Utilisateur mis à jour avec succès');
      } else {
        await adminFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Utilisateur créé avec succès');
      }
      await refetch();
      closeModal();
    } catch (err: any) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde.');
      toast.error(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (user: User) => {
    const newStatus = (user.status || 'actif') === 'actif' ? 'inactif' : 'actif';
    try {
      await adminFetch(`/api/users/${userId(user)}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
      await refetch();
      toast.success(`Statut de l'utilisateur ${newStatus === 'actif' ? 'activé' : 'désactivé'}`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await adminFetch(`/api/admin/users/${deleteTargetId}`, { method: 'DELETE' });
      await refetch();
      toast.success('Utilisateur supprimé');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const inputClass = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les comptes clients, leurs dates d'inscription, de connexion et leur statut d'activité
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => refetch()} 
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button 
            onClick={() => openModal()} 
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Ajouter un utilisateur
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Inscrits</p>
            <p className="text-2xl font-bold text-foreground mt-1">{users.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <UsersIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actuellement En Ligne</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{onlineCount}</p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Wifi className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Comptes Actifs</p>
            <p className="text-2xl font-bold text-foreground mt-1">{activeCount} / {users.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Rechercher par nom, email ou téléphone..." 
            className={inputClass + ' pl-10'} 
          />
        </div>

        <div className="relative md:w-44">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {presenceFilter === 'online' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Wifi className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <select 
            value={presenceFilter} 
            onChange={(e) => setPresenceFilter(e.target.value)} 
            className={inputClass + ' appearance-none pl-9'}
          >
            <option value="all">Toutes présences</option>
            <option value="online">En ligne</option>
            <option value="offline">Hors ligne</option>
          </select>
        </div>

        <div className="relative md:w-44">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)} 
            className={inputClass + ' appearance-none pl-10'}
          >
            <option value="all">Tous les rôles</option>
            <option value="client">Client</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="relative md:w-44">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className={inputClass + ' appearance-none'}
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Utilisateur</th>
                <th className="text-left px-4 py-4 font-semibold text-muted-foreground">Connexion</th>
                <th className="text-left px-4 py-4 font-semibold text-muted-foreground">Présence</th>
                <th className="text-left px-4 py-4 font-semibold text-muted-foreground">Date d'inscription</th>
                <th className="text-left px-4 py-4 font-semibold text-muted-foreground">Dernière connexion</th>
                <th className="text-left px-4 py-4 font-semibold text-muted-foreground">Statut compte</th>
                <th className="text-left px-4 py-4 font-semibold text-muted-foreground">Rôle</th>
                <th className="text-left px-4 py-4 font-semibold text-muted-foreground">Commandes</th>
                <th className="text-right px-6 py-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading && [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={9} className="px-6 py-4"><div className="h-10 animate-pulse rounded-lg bg-muted" /></td></tr>
              ))}
              {isError && (
                <tr><td colSpan={9} className="p-8 text-center text-red-500">Impossible de charger les utilisateurs.</td></tr>
              )}
              <AnimatePresence>
                {!isLoading && filteredUsers.map((user) => {
                  const isActive = (user.status || 'actif') === 'actif';
                  const isOnline = checkIsOnline(user);
                  const isAdmin = user.role === 'admin';
                  const regDate = user.createdAt || user.joinDate;

                  return (
                    <motion.tr key={userId(user)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group hover:bg-muted/30 transition-colors">
                      {/* User details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {userName(user).charAt(0).toUpperCase()}
                            </div>
                            {/* Online badge dot on avatar */}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{userName(user)}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            {user.phone && <p className="text-[11px] text-muted-foreground/80 mt-0.5">{user.phone}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Auth Provider badge */}
                      <td className="px-4 py-4">
                        {user.authProvider === 'google' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Google
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <Mail className="w-3 h-3" />
                            Email
                          </span>
                        )}
                      </td>

                      {/* Online status badge */}
                      <td className="px-4 py-4">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            En ligne
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            Hors ligne
                          </span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="px-4 py-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5" title={regDate ? new Date(regDate).toLocaleString('fr-FR') : ''}>
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                          <span className="text-xs font-medium text-foreground">{formatDate(regDate)}</span>
                        </div>
                      </td>

                      {/* Last Login Date */}
                      <td className="px-4 py-4 text-muted-foreground">
                        <div className="flex flex-col" title={user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Aucune connexion enregistrée'}>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                            <span className="text-xs font-medium text-foreground">
                              {formatRelativeTime(user.lastLogin)}
                            </span>
                          </div>
                          {user.lastLogin && (
                            <span className="text-[11px] text-muted-foreground mt-0.5 pl-5">
                              {formatDate(user.lastLogin)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Account status */}
                      <td className="px-4 py-4">
                        <button 
                          onClick={() => toggleStatus(user)} 
                          title={isActive ? 'Suspendre le compte' : 'Réactiver le compte'} 
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:opacity-80 shadow-2xs ${isActive ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}
                        >
                          {isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {isActive ? 'Actif' : 'Inactif'}
                        </button>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${isAdmin ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border bg-muted/60 text-muted-foreground'}`}>
                          {isAdmin ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                          {isAdmin ? 'Admin' : 'Client'}
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="px-4 py-4 text-foreground font-semibold">
                        {user.orderCount ?? 0}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5 transition-colors">
                          <button 
                            onClick={() => openModal(user)} 
                            title="Détails & Modifier" 
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteTargetId(userId(user)!)} 
                            title="Supprimer" 
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {!isLoading && filteredUsers.length === 0 && (
                <tr><td colSpan={9} className="p-12 text-center text-muted-foreground">
                  <UserIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  Aucun utilisateur trouvé.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit & Details Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md relative z-10 overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                <h3 className="text-lg font-bold text-foreground">
                  {editingUser ? "Détails & Modification" : "Ajouter un utilisateur"}
                </h3>
                <button onClick={closeModal} className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {/* Extra info for existing users */}
              {editingUser && (
                <div className="px-6 pt-4 pb-2 bg-muted/20 border-b border-border text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Présence actuelle :</span>
                    <span className="font-semibold flex items-center gap-1.5">
                      {checkIsOnline(editingUser) ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> En ligne
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span> Hors ligne
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type de connexion :</span>
                    <span className="font-semibold flex items-center gap-1.5">
                      {editingUser.authProvider === 'google' ? (
                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Compte Google
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Email / Mot de passe</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date d'inscription :</span>
                    <span className="font-medium text-foreground">{formatDate(editingUser.createdAt || editingUser.joinDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dernière connexion :</span>
                    <span className="font-medium text-foreground">{formatDate(editingUser.lastLogin)}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Nom complet</label>
                  <input 
                    type="text" 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className={inputClass} 
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Email</label>
                  <input 
                    type="email" 
                    value={formData.email || ''} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    className={inputClass} 
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Téléphone</label>
                  <input 
                    type="tel" 
                    value={formData.phone || ''} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    className={inputClass} 
                    placeholder="+225 0102030405"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Rôle</label>
                    <select value={formData.role || 'client'} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className={inputClass}>
                      <option value="client">Client</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Statut</label>
                    <select value={formData.status || 'actif'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={inputClass}>
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                    </select>
                  </div>
                </div>
                {saveError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{saveError}</div>}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-muted rounded-xl text-foreground hover:bg-border transition-colors font-medium">Annuler</button>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-60 font-semibold transition-opacity flex items-center gap-2">
                    <Check className="w-4 h-4" />{isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      {deleteTargetId && (
        <DeleteConfirm
          onClose={() => setDeleteTargetId(null)}
          onConfirm={confirmDelete}
          title="Supprimer l'utilisateur"
          message="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
        />
      )}
    </div>
  );
};

export default Users;

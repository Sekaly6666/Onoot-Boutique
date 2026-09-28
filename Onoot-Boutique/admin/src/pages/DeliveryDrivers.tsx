import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Bike, 
  Phone, 
  Eye, 
  Edit2, 
  Trash2, 
  X, 
  FileText, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  XCircle,
  Camera,
  ExternalLink,
  ShieldCheck,
  Car,
  Upload,
  Image as ImageIcon,
  Star,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DeleteConfirm from '../components/DeleteConfirm';

export interface DeliveryDriver {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  avatarUrl?: string;
  idCardRectoUrl?: string;
  idCardVersoUrl?: string;
  idCardPhotoUrl?: string;
  vehicleType: 'moto' | 'tricycle' | 'voiture';
  licensePlate: string;
  vehiclePhotoUrl?: string;
  licensePlatePhotoUrl?: string;
  status: 'disponible' | 'en_course' | 'inactif';
  zone?: string;
  deliveriesCount: number;
  rating: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Erreur HTTP ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

/** Upload a single File to /api/admin/upload, returns the URL */
async function uploadFile(file: File): Promise<string> {
  const token = localStorage.getItem('adminToken');
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  if (!res.ok) throw new Error('Échec de l\'upload du fichier');
  const data = await res.json() as { url: string };
  return data.url;
}

// WhatsApp button uses Lucide's MessageCircle icon
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <MessageCircle className={className} />
);

// ─── FileUploadZone Component ──────────────────────────────────────────────
interface FileUploadZoneProps {
  label: string;
  icon: React.ReactNode;
  currentUrl?: string;  // existing URL (from DB)
  previewUrl?: string;  // local object URL (from selected file)
  onFileSelect: (file: File) => void;
  onClear: () => void;
  accept?: string;
  hint?: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  label,
  icon,
  currentUrl,
  previewUrl,
  onFileSelect,
  onClear,
  accept = "image/*",
  hint,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayUrl = previewUrl || currentUrl;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        {displayUrl && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-red-500 hover:underline flex items-center gap-1"
          >
            <X className="w-2.5 h-2.5" /> Supprimer
          </button>
        )}
      </div>

      {displayUrl ? (
        /* Preview */
        <div className="relative group rounded-xl overflow-hidden border border-border bg-muted/20 h-24 sm:h-28">
          <img
            src={displayUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg text-xs flex items-center gap-1 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              Changer
            </button>
          </div>
          {previewUrl && (
            <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
              Nouveau
            </span>
          )}
        </div>
      ) : (
        /* Drop zone */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="relative rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-primary/5 transition-all cursor-pointer h-24 sm:h-28 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary p-2"
        >
          <div className="p-1.5 rounded-lg bg-muted">
            <Upload className="w-4 h-4" />
          </div>
          <div className="text-center px-2">
            <p className="text-xs font-medium leading-tight">Glissez la photo ici</p>
            <p className="text-[10px] text-muted-foreground/70 leading-tight">ou cliquez pour choisir</p>
            {hint && <p className="text-[9px] text-muted-foreground/60 mt-0.5 truncate max-w-[180px]">{hint}</p>}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
export const DeliveryDrivers: React.FC = () => {
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'disponible' | 'en_course' | 'inactif'>('all');

  // Modals state
  const [selectedDriverForDetails, setSelectedDriverForDetails] = useState<DeliveryDriver | null>(null);
  const [editingDriver, setEditingDriver] = useState<DeliveryDriver | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingDriver, setDeletingDriver] = useState<DeliveryDriver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Text form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    vehicleType: 'moto' as 'moto' | 'tricycle' | 'voiture',
    licensePlate: '',
    status: 'disponible' as 'disponible' | 'en_course' | 'inactif',
    zone: '',
    notes: '',
  });

  // Photo URLs (already saved on the server)
  const [savedUrls, setSavedUrls] = useState({
    avatarUrl: '',
    idCardRectoUrl: '',
    idCardVersoUrl: '',
    vehiclePhotoUrl: '',
    licensePlatePhotoUrl: '',
  });

  // Files selected by the user (pending upload)
  const [pendingFiles, setPendingFiles] = useState<{
    avatar?: File;
    idCardRecto?: File;
    idCardVerso?: File;
    vehicle?: File;
    plate?: File;
  }>({});

  // Local preview URLs (object URLs created from pending files)
  const [previews, setPreviews] = useState<{
    avatar?: string;
    idCardRecto?: string;
    idCardVerso?: string;
    vehicle?: string;
    plate?: string;
  }>({});

  // Revoke old object URLs when new ones are created
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => url && URL.revokeObjectURL(url));
    };
  }, [previews]);

  const setFile = useCallback((key: 'avatar' | 'idCardRecto' | 'idCardVerso' | 'vehicle' | 'plate', file: File) => {
    // Revoke old preview
    setPreviews(prev => {
      if (prev[key]) URL.revokeObjectURL(prev[key]!);
      return { ...prev, [key]: URL.createObjectURL(file) };
    });
    setPendingFiles(prev => ({ ...prev, [key]: file }));
  }, []);

  const clearFile = useCallback((key: 'avatar' | 'idCardRecto' | 'idCardVerso' | 'vehicle' | 'plate') => {
    setPreviews(prev => {
      if (prev[key]) URL.revokeObjectURL(prev[key]!);
      return { ...prev, [key]: undefined };
    });
    setPendingFiles(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSavedUrls(prev => {
      const urlKey = key === 'avatar' ? 'avatarUrl' :
                     key === 'idCardRecto' ? 'idCardRectoUrl' :
                     key === 'idCardVerso' ? 'idCardVersoUrl' :
                     key === 'vehicle' ? 'vehiclePhotoUrl' : 'licensePlatePhotoUrl';
      return { ...prev, [urlKey]: '' };
    });
  }, []);

  // Fetch Drivers
  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminFetch<DeliveryDriver[]>('/api/admin/delivery-drivers');
      setDrivers(data || []);
    } catch {
      toast.error('Erreur lors du chargement des livreurs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', email: '', phone: '',
      vehicleType: 'moto', licensePlate: '',
      status: 'disponible', zone: '', notes: '',
    });
    setSavedUrls({
      avatarUrl: '',
      idCardRectoUrl: '',
      idCardVersoUrl: '',
      vehiclePhotoUrl: '',
      licensePlatePhotoUrl: '',
    });
    setPendingFiles({});
    setPreviews(prev => {
      Object.values(prev).forEach(url => url && URL.revokeObjectURL(url));
      return {};
    });
  };

  const handleOpenCreate = () => {
    setEditingDriver(null);
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (driver: DeliveryDriver) => {
    setEditingDriver(driver);
    setFormData({
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      email: driver.email || '',
      phone: driver.phone || '',
      vehicleType: driver.vehicleType || 'moto',
      licensePlate: driver.licensePlate || '',
      status: driver.status || 'disponible',
      zone: driver.zone || '',
      notes: driver.notes || '',
    });
    setSavedUrls({
      avatarUrl: driver.avatarUrl || '',
      idCardRectoUrl: driver.idCardRectoUrl || driver.idCardPhotoUrl || '',
      idCardVersoUrl: driver.idCardVersoUrl || '',
      vehiclePhotoUrl: driver.vehiclePhotoUrl || '',
      licensePlatePhotoUrl: driver.licensePlatePhotoUrl || '',
    });
    setPendingFiles({});
    setPreviews({});
    setIsFormOpen(true);
  };

  // Upload all pending files and return merged URL map
  const uploadPendingFiles = async (): Promise<typeof savedUrls> => {
    const result = { ...savedUrls };

    const uploads: Array<{ key: 'avatar' | 'idCardRecto' | 'idCardVerso' | 'vehicle' | 'plate'; urlKey: keyof typeof savedUrls; file: File }> = [];

    if (pendingFiles.avatar)      uploads.push({ key: 'avatar',      urlKey: 'avatarUrl',           file: pendingFiles.avatar });
    if (pendingFiles.idCardRecto) uploads.push({ key: 'idCardRecto', urlKey: 'idCardRectoUrl',      file: pendingFiles.idCardRecto });
    if (pendingFiles.idCardVerso) uploads.push({ key: 'idCardVerso', urlKey: 'idCardVersoUrl',      file: pendingFiles.idCardVerso });
    if (pendingFiles.vehicle)     uploads.push({ key: 'vehicle',     urlKey: 'vehiclePhotoUrl',      file: pendingFiles.vehicle });
    if (pendingFiles.plate)       uploads.push({ key: 'plate',       urlKey: 'licensePlatePhotoUrl', file: pendingFiles.plate });

    for (const item of uploads) {
      const url = await uploadFile(item.file);
      result[item.urlKey] = url;
    }

    return result;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.licensePlate) {
      toast.error('Veuillez remplir le nom, prénom, téléphone et numéro de plaque');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload files first
      const uploadedUrls = await uploadPendingFiles();

      const payload = {
        ...formData,
        ...uploadedUrls,
      };

      if (editingDriver) {
        const updated = await adminFetch<DeliveryDriver>(`/api/admin/delivery-drivers/${editingDriver._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Livreur mis à jour avec succès');
        setDrivers(prev => prev.map(d => d._id === updated._id ? updated : d));
        if (selectedDriverForDetails?._id === updated._id) setSelectedDriverForDetails(updated);
      } else {
        const created = await adminFetch<DeliveryDriver>('/api/admin/delivery-drivers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Nouveau livreur enregistré');
        setDrivers(prev => [created, ...prev]);
      }

      setIsFormOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement du livreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Toggle
  const handleStatusChange = async (id: string, newStatus: 'disponible' | 'en_course' | 'inactif') => {
    try {
      const updated = await adminFetch<DeliveryDriver>(`/api/admin/delivery-drivers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setDrivers(prev => prev.map(d => d._id === id ? { ...d, status: updated.status } : d));
      if (selectedDriverForDetails?._id === id) {
        setSelectedDriverForDetails(prev => prev ? { ...prev, status: updated.status } : null);
      }
      toast.success(
        `Statut : ${newStatus === 'disponible' ? 'Disponible' : newStatus === 'en_course' ? 'En course' : 'Inactif'}`
      );
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  // Delete Driver
  const handleDeleteConfirm = async () => {
    if (!deletingDriver) return;
    try {
      await adminFetch(`/api/admin/delivery-drivers/${deletingDriver._id}`, { method: 'DELETE' });
      toast.success('Livreur supprimé');
      setDrivers(prev => prev.filter(d => d._id !== deletingDriver._id));
      if (selectedDriverForDetails?._id === deletingDriver._id) setSelectedDriverForDetails(null);
      setDeletingDriver(null);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleWhatsApp = (driver: DeliveryDriver) => {
    const cleanPhone = driver.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Bonjour ${driver.firstName}, nous avons une nouvelle commande Onoot Boutique à livrer dans votre secteur (${driver.zone || 'Abidjan'}). Êtes-vous disponible immédiatement ?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleCall = (driver: DeliveryDriver) => {
    window.location.href = `tel:${driver.phone}`;
  };

  // Filtered drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(query) ||
        d.phone.toLowerCase().includes(query) ||
        (d.email && d.email.toLowerCase().includes(query)) ||
        d.licensePlate.toLowerCase().includes(query) ||
        (d.zone && d.zone.toLowerCase().includes(query));
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [drivers, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: drivers.length,
    disponible: drivers.filter(d => d.status === 'disponible').length,
    en_course: drivers.filter(d => d.status === 'en_course').length,
    inactif: drivers.filter(d => d.status === 'inactif').length,
  }), [drivers]);

  const API_BASE = '/api';

  /** Resolve a photo URL (could be relative /uploads/... or absolute https://...) */
  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE.replace('/api', '')}${url}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bike className="w-7 h-7 text-primary" />
            Gestion des Livreurs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos livreurs, vérifiez leurs pièces et motos, et contactez-les directement.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchDrivers}
            className="min-h-[46px] sm:min-h-[40px] px-3.5 sm:px-4 bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-sm font-medium">Actualiser</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-initial min-h-[46px] sm:min-h-[40px] flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md text-sm sm:text-base"
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            <span>Nouveau Livreur</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Livreurs</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Bike className="w-5 h-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            <span className="text-xs text-muted-foreground">inscrits</span>
          </div>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Disponibles</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="w-5 h-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.disponible}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Prêts
            </span>
          </div>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">En Course</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><Clock className="w-5 h-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.en_course}</span>
            <span className="text-xs text-muted-foreground">en livraison</span>
          </div>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Inactifs</span>
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500"><AlertCircle className="w-5 h-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactif}</span>
            <span className="text-xs text-muted-foreground">hors service</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher nom, téléphone, plaque, zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-muted/40 rounded-xl">
          {(['all', 'disponible', 'en_course', 'inactif'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                statusFilter === s
                  ? s === 'all' ? 'bg-card text-foreground shadow-sm'
                  : s === 'disponible' ? 'bg-emerald-500 text-white'
                  : s === 'en_course' ? 'bg-amber-500 text-white'
                  : 'bg-red-500 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'disponible' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {s === 'en_course' && <Clock className="w-3.5 h-3.5" />}
              {s === 'inactif' && <XCircle className="w-3.5 h-3.5" />}
              <span>
                {s === 'all' ? `Tous (${stats.total})`
                 : s === 'disponible' ? `Disponibles (${stats.disponible})`
                 : s === 'en_course' ? `En course (${stats.en_course})`
                 : `Inactifs (${stats.inactif})`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Drivers List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-2xl">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Chargement des livreurs...</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-2xl text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Bike className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Aucun livreur trouvé</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {searchQuery || statusFilter !== 'all'
              ? 'Aucun résultat ne correspond à vos critères.'
              : 'Ajoutez votre premier livreur pour démarrer.'}
          </p>
          {(searchQuery || statusFilter !== 'all') ? (
            <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="mt-4 text-xs text-primary hover:underline">
              Réinitialiser les filtres
            </button>
          ) : (
            <button onClick={handleOpenCreate} className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-xl hover:bg-primary/90">
              Ajouter un livreur
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDrivers.map((driver) => (
            <div key={driver._id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {driver.avatarUrl ? (
                        <img
                          src={resolveUrl(driver.avatarUrl)}
                          alt={`${driver.firstName} ${driver.lastName}`}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-border shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border-2 border-primary/20 flex items-center justify-center font-bold text-lg">
                          {driver.firstName.charAt(0)}{driver.lastName.charAt(0)}
                        </div>
                      )}
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
                        driver.status === 'disponible' ? 'bg-emerald-500' :
                        driver.status === 'en_course' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                        {driver.firstName} {driver.lastName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{driver.zone || 'Zone non spécifiée'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-2 pointer-events-none">
                      {driver.status === 'disponible' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : driver.status === 'en_course' ? (
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <select
                      value={driver.status}
                      onChange={(e) => handleStatusChange(driver._id, e.target.value as any)}
                      className={`text-xs font-semibold pl-6 pr-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                        driver.status === 'disponible' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' :
                        driver.status === 'en_course' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400' :
                        'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'
                      }`}
                    >
                      <option value="disponible">Disponible</option>
                      <option value="en_course">En course</option>
                      <option value="inactif">Inactif</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/50">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      {driver.vehicleType === 'voiture' ? <Car className="w-3.5 h-3.5 text-primary" /> : <Bike className="w-3.5 h-3.5 text-primary" />}
                      Véhicule :
                    </span>
                    <span className="font-medium text-foreground uppercase">
                      {driver.vehicleType} • <span className="text-primary font-bold">{driver.licensePlate}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/50">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Téléphone :
                    </span>
                    <span className="font-medium text-foreground">{driver.phone}</span>
                  </div>
                </div>

                {/* Photo status badges */}
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Photos :</span>
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { label: 'Profil', has: !!driver.avatarUrl },
                      { label: 'CNI Recto', has: !!(driver.idCardRectoUrl || driver.idCardPhotoUrl) },
                      { label: 'CNI Verso', has: !!driver.idCardVersoUrl },
                      { label: 'Moto', has: !!driver.vehiclePhotoUrl },
                      { label: 'Plaque', has: !!driver.licensePlatePhotoUrl },
                    ].map(p => (
                      <span key={p.label} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        p.has ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                      }`}>{p.label}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 bg-muted/20 border-t border-border mt-auto">
                {/* Contact rapide */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => handleWhatsApp(driver)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all active:scale-95"
                  >
                    <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                  </button>
                  <button
                    onClick={() => handleCall(driver)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold transition-all active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" /> Appeler
                  </button>
                </div>
                {/* Admin actions — style identique à Users */}
                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <button
                    onClick={() => setSelectedDriverForDetails(driver)}
                    title="Voir le dossier complet"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Détails</span>
                  </button>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleOpenEdit(driver)}
                      title="Modifier le livreur"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => setDeletingDriver(driver)}
                      title="Supprimer le livreur"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── MODAL: DOSSIER COMPLET ─────────────────────────────── */}
      <AnimatePresence>
        {selectedDriverForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden my-4"
            >
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary"><ShieldCheck className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      Dossier : {selectedDriverForDetails.firstName} {selectedDriverForDetails.lastName}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">Identité, documents et informations du véhicule</p>
                  </div>
                </div>
                <button onClick={() => setSelectedDriverForDetails(null)} className="p-1.5 hover:bg-muted text-muted-foreground rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
                {/* Identity */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="relative">
                    {selectedDriverForDetails.avatarUrl ? (
                      <img src={resolveUrl(selectedDriverForDetails.avatarUrl)} alt="Profil" className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border-2 border-primary/20">
                        {selectedDriverForDetails.firstName.charAt(0)}{selectedDriverForDetails.lastName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-foreground">{selectedDriverForDetails.firstName} {selectedDriverForDetails.lastName}</h3>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg self-center flex items-center gap-1.5 ${
                        selectedDriverForDetails.status === 'disponible' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        selectedDriverForDetails.status === 'en_course' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                        'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        {selectedDriverForDetails.status === 'disponible' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Disponible</span>
                          </>
                        ) : selectedDriverForDetails.status === 'en_course' ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>En course</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                            <span>Inactif</span>
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Zone : <span className="font-semibold text-foreground">{selectedDriverForDetails.zone || 'Non définie'}</span></p>
                    <p className="text-xs text-muted-foreground">Tél : <span className="font-semibold text-foreground">{selectedDriverForDetails.phone}</span></p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3">
                  <button onClick={() => handleWhatsApp(selectedDriverForDetails)} className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                    <WhatsAppIcon className="w-5 h-5" /> WhatsApp
                  </button>
                  <button onClick={() => handleCall(selectedDriverForDetails)} className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" /> Appel Direct
                  </button>
                </div>

                {/* Photo Grid */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" /> Pièces Justificatives & Photos
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: '📄 CNI (Recto)', url: resolveUrl(selectedDriverForDetails.idCardRectoUrl || selectedDriverForDetails.idCardPhotoUrl), sub: 'Face avant', emptyIcon: <FileText className="w-6 h-6 mb-1 opacity-50" />, emptyLabel: 'Photo CNI recto non fournie' },
                      { title: '📄 CNI (Verso)', url: resolveUrl(selectedDriverForDetails.idCardVersoUrl), sub: 'Face arrière', emptyIcon: <FileText className="w-6 h-6 mb-1 opacity-50" />, emptyLabel: 'Photo CNI verso non fournie' },
                      { title: `🏍️ Véhicule (${selectedDriverForDetails.vehicleType})`, url: resolveUrl(selectedDriverForDetails.vehiclePhotoUrl), sub: selectedDriverForDetails.licensePlate, emptyIcon: <Bike className="w-6 h-6 mb-1 opacity-50" />, emptyLabel: 'Photo moto non renseignée' },
                      { title: '🔢 Plaque d\'Immatriculation', url: resolveUrl(selectedDriverForDetails.licensePlatePhotoUrl), sub: selectedDriverForDetails.licensePlate, emptyIcon: <ImageIcon className="w-6 h-6 mb-1 opacity-50" />, emptyLabel: 'Photo plaque non renseignée' },
                      { title: '📝 Notes administratives', url: null, sub: null, emptyIcon: null, emptyLabel: null, isNotes: true },
                    ].map((item, i) =>
                      (item as any).isNotes ? (
                        <div key={i} className="bg-card border border-border p-4 rounded-xl space-y-2 flex flex-col justify-between">
                          <div>
                            <span className="text-xs font-semibold text-foreground">{item.title}</span>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              {selectedDriverForDetails.notes || 'Aucune remarque enregistrée.'}
                            </p>
                          </div>
                          <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex justify-between">
                            <span>Courses : <strong className="text-foreground">{selectedDriverForDetails.deliveriesCount || 0}</strong></span>
                            <span className="flex items-center gap-1">Note : <strong className="text-foreground">{selectedDriverForDetails.rating || 5}/5</strong> <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" /></span>
                          </div>
                        </div>
                      ) : (
                        <div key={i} className="bg-card border border-border p-4 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground">{item.title}</span>
                            {item.sub && <span className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded">{item.sub}</span>}
                          </div>
                          {item.url ? (
                            <div className="group relative rounded-xl overflow-hidden border border-border/70 bg-black/5 aspect-video">
                              <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-lg text-xs flex items-center gap-1 backdrop-blur-sm">
                                <ExternalLink className="w-3.5 h-3.5" /> Agrandir
                              </a>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-border bg-muted/20 aspect-video flex flex-col items-center justify-center text-muted-foreground p-3 text-center">
                              {item.emptyIcon}
                              <span className="text-xs">{item.emptyLabel}</span>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-3">
                <button onClick={() => { const d = selectedDriverForDetails; setSelectedDriverForDetails(null); handleOpenEdit(d); }} className="px-4 py-2 bg-card border border-border text-foreground hover:bg-muted text-sm font-medium rounded-xl">
                  Modifier ce dossier
                </button>
                <button onClick={() => setSelectedDriverForDetails(null)} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90">
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: ADD / EDIT DRIVER ───────────────────────────── */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden my-4"
            >
              {/* Form Header */}
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary"><Bike className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {editingDriver ? 'Modifier le Livreur' : 'Nouveau Livreur'}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">Renseignez les informations et téléversez les photos directement</p>
                  </div>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-1.5 hover:bg-muted text-muted-foreground rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitForm}>
                <div className="p-4 space-y-4 max-h-[58vh] overflow-y-auto">

                  {/* ── Section 1 : Identité ── */}
                  <div>
                    <h3 className="text-xs font-bold uppercase text-primary tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">1</span>
                      Identité du Livreur
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Prénom <span className="text-red-500">*</span></label>
                        <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Ex: Ibrahim" className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Nom <span className="text-red-500">*</span></label>
                        <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Ex: Touré" className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Téléphone (WhatsApp & Appel) <span className="text-red-500">*</span></label>
                        <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+225 07 00 00 00 00" className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Zone de livraison</label>
                        <input type="text" value={formData.zone} onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                          placeholder="Ex: Abidjan - Cocody & Deux Plateaux" className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Email (optionnel)</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="livreur@gmail.com" className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Statut</label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3 pointer-events-none">
                            {formData.status === 'disponible' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : formData.status === 'en_course' ? (
                              <Clock className="w-4 h-4 text-amber-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <select 
                            value={formData.status} 
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            className="w-full pl-9 pr-3.5 py-2 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                          >
                            <option value="disponible">Disponible</option>
                            <option value="en_course">En course</option>
                            <option value="inactif">Inactif</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Section 2 : Photo Profil ── */}
                  <div className="pt-2 border-t border-border">
                    <h3 className="text-xs font-bold uppercase text-primary tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">2</span>
                      Photo de Profil du Livreur
                    </h3>
                    <div className="max-w-[200px]">
                      <FileUploadZone
                        label="Photo portrait / selfie du livreur"
                        icon={<Camera className="w-3.5 h-3.5 text-primary" />}
                        currentUrl={resolveUrl(savedUrls.avatarUrl)}
                        previewUrl={previews.avatar}
                        onFileSelect={(file) => setFile('avatar', file)}
                        onClear={() => clearFile('avatar')}
                        hint="JPG, PNG ou WebP — max 50 Mo"
                      />
                    </div>
                  </div>

                  {/* ── Section 3 : Pièce d'Identité ── */}
                  <div className="pt-2 border-t border-border">
                    <h3 className="text-xs font-bold uppercase text-primary tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">3</span>
                      Pièce d'Identité (CNI / Passeport) - Photos Recto & Verso
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FileUploadZone
                        label="Photo CNI - Recto (Face avant)"
                        icon={<FileText className="w-3.5 h-3.5 text-primary" />}
                        currentUrl={resolveUrl(savedUrls.idCardRectoUrl)}
                        previewUrl={previews.idCardRecto}
                        onFileSelect={(file) => setFile('idCardRecto', file)}
                        onClear={() => clearFile('idCardRecto')}
                        hint="Photo nette de face avant de la CNI"
                      />
                      <FileUploadZone
                        label="Photo CNI - Verso (Face arrière)"
                        icon={<FileText className="w-3.5 h-3.5 text-primary" />}
                        currentUrl={resolveUrl(savedUrls.idCardVersoUrl)}
                        previewUrl={previews.idCardVerso}
                        onFileSelect={(file) => setFile('idCardVerso', file)}
                        onClear={() => clearFile('idCardVerso')}
                        hint="Photo nette du verso de la CNI"
                      />
                    </div>
                  </div>

                  {/* ── Section 4 : Moto & Plaque ── */}
                  <div className="pt-2 border-t border-border">
                    <h3 className="text-xs font-bold uppercase text-primary tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">4</span>
                      Moto & Plaque d'Immatriculation
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Type de véhicule</label>
                        <select value={formData.vehicleType} onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                          className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                          <option value="moto">🏍️ Moto</option>
                          <option value="tricycle">🛺 Tricycle</option>
                          <option value="voiture">🚗 Voiture</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Numéro de plaque <span className="text-red-500">*</span></label>
                        <input type="text" required value={formData.licensePlate}
                          onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                          placeholder="Ex: 8472 HM 01"
                          className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold uppercase" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FileUploadZone
                        label="Photo de la Moto / Véhicule"
                        icon={<Bike className="w-3.5 h-3.5 text-primary" />}
                        currentUrl={resolveUrl(savedUrls.vehiclePhotoUrl)}
                        previewUrl={previews.vehicle}
                        onFileSelect={(file) => setFile('vehicle', file)}
                        onClear={() => clearFile('vehicle')}
                        hint="Photo de face ou de profil de la moto"
                      />
                      <FileUploadZone
                        label="Photo de la Plaque d'immatriculation"
                        icon={<ImageIcon className="w-3.5 h-3.5 text-primary" />}
                        currentUrl={resolveUrl(savedUrls.licensePlatePhotoUrl)}
                        previewUrl={previews.plate}
                        onFileSelect={(file) => setFile('plate', file)}
                        onClear={() => clearFile('plate')}
                        hint="Photo nette de la plaque, lisible"
                      />
                    </div>
                  </div>

                  {/* ── Section 5 : Notes ── */}
                  <div className="pt-2 border-t border-border">
                    <label className="block text-xs font-medium text-foreground mb-1">Remarques ou notes internes</label>
                    <textarea
                      rows={1}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ex: Ponctuel, permis vérifié, casque homologué..."
                      className="w-full px-3.5 py-2 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>
                </div>

                {/* Form Footer */}
                <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground hidden sm:block">
                    Les photos sont téléversées automatiquement.
                  </p>
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto ml-auto">
                    <button type="button" onClick={() => setIsFormOpen(false)}
                      className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-card border border-border text-foreground hover:bg-muted text-sm font-semibold rounded-xl transition-all active:scale-98">
                      Annuler
                    </button>
                    <button type="submit" disabled={isSubmitting}
                      className="w-full sm:w-auto min-h-[44px] px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98 shadow-sm">
                      {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                      <span>{editingDriver ? 'Enregistrer les modifications' : 'Créer le Livreur'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION */}
      {Boolean(deletingDriver) && (
        <DeleteConfirm
          onClose={() => setDeletingDriver(null)}
          onConfirm={handleDeleteConfirm}
          title="Supprimer le Livreur"
          message={`Êtes-vous sûr de vouloir supprimer ${deletingDriver?.firstName} ${deletingDriver?.lastName} ? Cette action est irréversible.`}
        />
      )}
    </div>
  );
};

export default DeliveryDrivers;

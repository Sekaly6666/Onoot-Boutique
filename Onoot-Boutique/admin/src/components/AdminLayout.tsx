import React, { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Tag,
  Star,
  Moon,
  Sun,
  Bike,
  Film
} from 'lucide-react';
import { OnootLogo } from './ui/OnootLogo';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Utilisateurs', path: '/admin/users', icon: Users },
  { name: 'Livreurs', path: '/admin/delivery-drivers', icon: Bike },
  { name: 'Publicités & Vidéos', path: '/admin/ads-videos', icon: Film },
  { name: 'Produits', path: '/admin/products', icon: Package },
  { name: 'Commandes', path: '/admin/orders', icon: ShoppingCart },
  { name: 'Catégories', path: '/admin/categories', icon: Tag },
  { name: 'Avis Clients', path: '/admin/reviews', icon: Star },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell },
  { name: 'Paramètres', path: '/admin/settings', icon: Settings },
];

async function adminFetch<T>(path: string): Promise<T> {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Network error');
  return res.json();
}

export const AdminLayout: React.FC = () => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const prevNotifIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Poll notifications every 8 seconds for real-time alerts
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['admin-notifications'],
    queryFn: () => adminFetch<any[]>('/api/admin/notifications'),
    refetchInterval: 8000,
    retry: 1,
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  // Poll stats every 15 seconds to display item totals
  const { data: stats } = useQuery<{
    totalOrders?: number;
    totalProducts?: number;
    totalUsers?: number;
    totalDrivers?: number;
    totalAds?: number;
    totalCategories?: number;
    totalReviews?: number;
    totalNotifications?: number;
  }>({
    queryKey: ['admin-stats-counts'],
    queryFn: () => adminFetch<any>('/api/admin/stats'),
    refetchInterval: 15000,
    retry: 1,
  });

  const formatCount = (val: number | undefined | null): string => {
    if (val === undefined || val === null) return '00';
    const num = Math.max(0, Number(val) || 0);
    return num < 10 ? `0${num}` : String(num);
  };

  const getCountForItem = (path: string): string | null => {
    if (!stats) return null;
    switch (path) {
      case '/admin/orders':
        return formatCount(stats.totalOrders);
      case '/admin/products':
        return formatCount(stats.totalProducts);
      case '/admin/users':
        return formatCount(stats.totalUsers);
      case '/admin/delivery-drivers':
        return formatCount(stats.totalDrivers);
      case '/admin/ads-videos':
        return formatCount(stats.totalAds);
      case '/admin/categories':
        return formatCount(stats.totalCategories);
      case '/admin/reviews':
        return formatCount(stats.totalReviews);
      case '/admin/notifications':
        return formatCount(stats.totalNotifications ?? notifications.length);
      default:
        return null;
    }
  };

  // Detect newly arrived notifications to trigger live toast
  useEffect(() => {
    if (notifications.length > 0) {
      if (isFirstLoadRef.current) {
        // Initialize seen IDs on initial load
        notifications.forEach((n: any) => prevNotifIdsRef.current.add(n.id));
        isFirstLoadRef.current = false;
      } else {
        const newNotifs = notifications.filter((n: any) => !prevNotifIdsRef.current.has(n.id) && !n.read);
        if (newNotifs.length > 0) {
          newNotifs.forEach((n: any) => {
            prevNotifIdsRef.current.add(n.id);
            toast.custom(
              (t) => (
                <div
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate('/admin/notifications');
                  }}
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-md w-full bg-white dark:bg-gray-900 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 cursor-pointer border border-primary/30 transition-all hover:scale-[1.02]`}
                >
                  <div className="flex-1 w-0">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <Bell className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {n.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {n.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ),
              { duration: 6000 }
            );
          });
        }
      }
    }
  }, [notifications, navigate]);

  useEffect(() => {
    // Check local storage or system preference
    const storedTheme = localStorage.getItem('adminTheme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('adminTheme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('adminTheme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  // Fermer le dropdown de profil si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans transition-colors duration-300">
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={isMobile ? { x: -280, opacity: 0.8 } : { width: 0, opacity: 0 }}
            animate={isMobile ? { x: 0, opacity: 1 } : { width: 280, opacity: 1 }}
            exit={isMobile ? { x: -280, opacity: 0 } : { width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`bg-card border-r border-border flex flex-col shadow-xl lg:shadow-sm h-full ${
              isMobile ? 'fixed inset-y-0 left-0 w-72 z-50' : 'relative z-20 w-[280px]'
            }`}
          >
            <div className="p-4 sm:p-6 flex items-center justify-between border-b border-border mb-2">
              <OnootLogo size="md" />
              {isMobile && (
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const countBadge = getCountForItem(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-primary/10 rounded-xl"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <div className="flex items-center gap-3 relative z-10 min-w-0">
                          <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : ''}`} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {countBadge !== null && (
                          <span
                            className={`relative z-10 shrink-0 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border transition-all ${
                              isActive
                                ? 'bg-primary text-primary-foreground border-primary/40 shadow-xs'
                                : 'bg-muted text-muted-foreground border-border group-hover:border-primary/30 group-hover:text-foreground'
                            }`}
                          >
                            {countBadge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 mt-auto border-t border-border">
              <button 
                onClick={() => {
                  handleLogout();
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 w-full text-left text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors group"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Déconnexion</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center">
              <OnootLogo size="sm" />
            </div>
            
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 pr-4 py-2 bg-muted border border-border rounded-full text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-64 transition-all placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleDarkMode}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
              title="Basculer le thème"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => navigate('/admin/notifications')}
              className="relative p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Avatar / Profil dropdown */}
            <div className="relative ml-2" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent-yellow text-primary-foreground flex items-center justify-center font-bold shadow-sm hover:ring-2 hover:ring-primary/40 transition-all"
                title="Mon profil"
              >
                A
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-52 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    {/* Info profil */}
                    <div className="px-4 py-3 border-b border-border bg-muted/40">
                      <p className="text-sm font-bold text-foreground">Administrateur</p>
                      <p className="text-xs text-muted-foreground truncate">Gestion Onoot Boutique</p>
                    </div>

                    {/* Actions */}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => { navigate('/admin/settings'); setIsProfileOpen(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-xl transition-colors"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        Paramètres
                      </button>
                      <button
                        onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 bg-background">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

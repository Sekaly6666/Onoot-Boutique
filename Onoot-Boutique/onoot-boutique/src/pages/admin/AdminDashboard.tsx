import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Package, Users, DollarSign, ShoppingCart, ArrowLeft, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children, title }: { children: React.ReactNode, title: string }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  if (!user || user.role !== "admin") {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] text-white flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer mb-8">
              <div className="bg-primary text-white p-1 rounded-lg">
                <Package size={20} />
              </div>
              <span className="font-bold text-xl">Onoot Admin</span>
            </div>
          </Link>
          <nav className="space-y-2">
            <Link href="/admin">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Tableau de bord
              </Button>
            </Link>
            <Link href="/admin/products">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                <Package className="mr-2 h-4 w-4" /> Produits
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                <ShoppingCart className="mr-2 h-4 w-4" /> Commandes
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                <Users className="mr-2 h-4 w-4" /> Utilisateurs
              </Button>
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-800">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour au site
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-border h-16 flex items-center px-8 justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{user.name}</span>
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Settings className="h-4 w-4" />
            </div>
          </div>
        </header>
        <div className="p-8 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) return <AdminLayout title="Tableau de bord"><div className="animate-pulse h-64 bg-white rounded-xl border border-border"></div></AdminLayout>;

  return (
    <AdminLayout title="Tableau de bord">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Revenu Total</p>
              <h3 className="text-2xl font-bold text-foreground">{stats?.totalRevenue.toLocaleString()} FCFA</h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-lg"><DollarSign size={20} /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Commandes</p>
              <h3 className="text-2xl font-bold text-foreground">{stats?.totalOrders}</h3>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><ShoppingCart size={20} /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Produits</p>
              <h3 className="text-2xl font-bold text-foreground">{stats?.totalProducts}</h3>
            </div>
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><Package size={20} /></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Utilisateurs</p>
              <h3 className="text-2xl font-bold text-foreground">{stats?.totalUsers}</h3>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-lg"><Users size={20} /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <h2 className="text-lg font-bold mb-4">Commandes Récentes</h2>
          <div className="space-y-4">
            {stats?.recentOrders.slice(0, 5).map(order => (
              <div key={order.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div>
                  <p className="font-semibold text-sm">Cmd #{order.id}</p>
                  <p className="text-xs text-muted-foreground">{order.shippingAddress.fullName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-accent">{order.totalAmount.toLocaleString()} FCFA</p>
                  <span className="text-[10px] uppercase font-bold text-gray-500">{order.orderStatus}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/orders">
            <Button variant="outline" className="w-full mt-4">Voir toutes les commandes</Button>
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <h2 className="text-lg font-bold mb-4">Statut des commandes</h2>
          <div className="space-y-4 mt-8">
            {stats?.ordersByStatus.map(status => (
              <div key={status.status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{status.status}</span>
                  <span className="text-muted-foreground">{status.count} commandes</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${(status.count / (stats.totalOrders || 1)) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

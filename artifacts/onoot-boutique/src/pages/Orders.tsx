import React from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye } from "lucide-react";

export default function Orders() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  if (!user) {
    setLocation("/auth/login");
    return null;
  }

  const { data, isLoading } = useListOrders({ userId: user.id }, {
    query: {
      enabled: !!user.id,
      queryKey: getListOrdersQueryKey({ userId: user.id })
    }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'En attente': return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">{status}</Badge>;
      case 'Confirmée': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">{status}</Badge>;
      case 'Expédiée': return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">{status}</Badge>;
      case 'Livrée': return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">{status}</Badge>;
      case 'Annulée': return <Badge variant="destructive">{status}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" /> Mes Commandes
        </h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card border border-border animate-pulse rounded-xl"></div>)}
          </div>
        ) : !data || data.orders.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground mb-4">Vous n'avez passé aucune commande.</p>
            <Link href="/products"><Button>Découvrir nos produits</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.orders.map(order => (
              <div key={order.id} className="bg-card border border-border p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-lg">Commande #{order.id}</span>
                    {getStatusBadge(order.orderStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Passée le {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {order.items.length} article(s) • <span className="text-accent font-bold">{order.totalAmount.toLocaleString()} FCFA</span>
                  </p>
                </div>
                <Link href={`/orders/${order.id}`}>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Eye className="mr-2 h-4 w-4" /> Voir les détails
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

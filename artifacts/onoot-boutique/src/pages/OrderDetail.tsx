import React from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, Clock, Truck, PackageCheck } from "lucide-react";

export default function OrderDetail() {
  const { id } = useParams();
  const orderId = parseInt(id || "0", 10);

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: {
      enabled: !!orderId,
      queryKey: getGetOrderQueryKey(orderId)
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">Chargement...</div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">Commande non trouvée</div>
      </Layout>
    );
  }

  const statuses = ['En attente', 'Confirmée', 'Expédiée', 'Livrée'];
  const currentIndex = statuses.indexOf(order.orderStatus);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/orders" className="text-sm text-primary hover:underline flex items-center mb-6">
          <ArrowLeft className="mr-1 h-4 w-4" /> Retour aux commandes
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Commande #{order.id}</h1>
            <p className="text-muted-foreground mt-1">Passée le {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <Badge className="text-sm px-3 py-1 bg-primary text-white">{order.orderStatus}</Badge>
        </div>

        {/* Timeline */}
        <div className="bg-card border border-border p-6 rounded-xl mb-8 overflow-hidden">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-500" style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}></div>
            
            {statuses.map((status, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              let Icon = Clock;
              if (index === 1) Icon = CheckCircle2;
              if (index === 2) Icon = Truck;
              if (index === 3) Icon = PackageCheck;

              return (
                <div key={status} className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-card ${isCompleted ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border border-border p-6 rounded-xl">
            <h2 className="font-bold text-lg mb-4">Informations de livraison</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Nom:</span> {order.shippingAddress.fullName}</p>
              <p><span className="text-muted-foreground">Téléphone:</span> {order.shippingAddress.phone}</p>
              <p><span className="text-muted-foreground">Adresse:</span> {order.shippingAddress.address}</p>
              <p><span className="text-muted-foreground">Ville:</span> {order.shippingAddress.city}, {order.shippingAddress.country}</p>
            </div>
            <Separator className="my-4" />
            <h2 className="font-bold text-lg mb-4">Paiement</h2>
            <p className="text-sm">Méthode: <span className="font-medium">{order.paymentMethod}</span></p>
          </div>

          <div className="bg-card border border-border p-6 rounded-xl">
            <h2 className="font-bold text-lg mb-4">Articles commandés</h2>
            <div className="space-y-4 mb-4">
              {order.items.map(item => (
                <div key={item.productId} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      {item.productImage && <img src={item.productImage} alt={item.productName} className="w-8 h-8 object-contain mix-blend-multiply" />}
                    </div>
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-muted-foreground">Qté: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-medium">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span className="text-accent">{order.totalAmount.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

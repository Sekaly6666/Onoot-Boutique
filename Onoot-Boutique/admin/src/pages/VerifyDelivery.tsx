import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Truck, Package, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('adminToken');
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Erreur réseau');
  }
  return res.json();
}

const VerifyDelivery: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await adminFetch<any>(`/api/orders/${id}`);
        setOrder(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Impossible de trouver cette commande.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleValidateDelivery = async () => {
    try {
      setIsValidating(true);
      await adminFetch(`/api/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ orderStatus: 'delivered' }),
      });
      
      setOrder({ ...order, orderStatus: 'delivered' });
      toast.success('Livraison validée avec succès !');
      
      // Optionally redirect after a few seconds
      setTimeout(() => {
        navigate('/admin/orders');
      }, 3000);
      
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la validation.');
    } finally {
      setIsValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-slate-500 font-medium">Chargement des informations du ticket...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 flex items-center justify-center rounded-full mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Erreur de vérification</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button 
          onClick={() => navigate('/admin/orders')}
          className="px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          Retour aux commandes
        </button>
      </div>
    );
  }

  const isDelivered = order.orderStatus === 'delivered';
  const customerName = order.shippingAddress?.fullName || 'Client';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <button 
        onClick={() => navigate('/admin/orders')}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Retour
      </button>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className={`p-6 md:p-8 text-center border-b ${isDelivered ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm ${isDelivered ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}>
            {isDelivered ? <CheckCircle className="w-10 h-10" /> : <Package className="w-10 h-10" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Commande #{order.id.substring(order.id.length - 6).toUpperCase()}
          </h1>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white border shadow-sm">
            Statut actuel : 
            <span className={`ml-2 ${isDelivered ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isDelivered ? 'Livrée' : order.orderStatus === 'shipped' ? 'Expédiée' : 'En attente'}
            </span>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Informations de livraison</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-sm">
                <p><span className="font-medium text-slate-900">{customerName}</span></p>
                <p className="text-slate-600">{order.shippingAddress?.phone}</p>
                <p className="text-slate-600">{order.shippingAddress?.address}</p>
                <p className="text-slate-600">{order.shippingAddress?.city}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Détails du paiement</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-slate-500">Méthode :</span> <span className="font-medium">{order.paymentMethod}</span></p>
                <p className="flex justify-between"><span className="text-slate-500">Date :</span> <span>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span></p>
                <div className="pt-2 mt-2 border-t border-slate-200">
                  <p className="flex justify-between text-base font-bold text-slate-900"><span>Montant total :</span> <span className="text-primary">{order.totalAmount.toLocaleString()} FCFA</span></p>
                </div>
              </div>
            </div>
          </div>

          {!isDelivered && (
            <div className="pt-6 border-t border-slate-100">
              <p className="text-center text-sm text-slate-500 mb-4">
                Veuillez confirmer que vous avez bien remis le colis au client.
              </p>
              <button
                onClick={handleValidateDelivery}
                disabled={isValidating}
                className="w-full flex items-center justify-center py-4 px-6 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none text-lg"
              >
                {isValidating ? (
                  <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Validation en cours...</>
                ) : (
                  <><Truck className="w-6 h-6 mr-2" /> Valider la livraison</>
                )}
              </button>
            </div>
          )}
          
          {isDelivered && (
            <div className="pt-6 border-t border-slate-100 text-center">
              <div className="inline-block bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium border border-emerald-100">
                Cette commande a déjà été marquée comme livrée.
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VerifyDelivery;

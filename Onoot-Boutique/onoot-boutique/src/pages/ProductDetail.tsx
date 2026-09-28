import React from "react";
import { useParams, Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { 
  useGetProduct, 
  getGetProductQueryKey,
  useListProductReviews,
  getListProductReviewsQueryKey,
  useCreateReview,
} from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Truck, ShieldCheck, ArrowLeft, Loader2, Star, Pencil, PlayCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const exampleProducts = [
  { id: "example-1", name: "Smartwatch Pro S8", price: 45000, discountPrice: 38000, images: ["/images/smartwatch.png"], category: "smartwatches", stock: 10, rating: 4.5, reviewCount: 24, featured: true, description: "Superbe montre connectée avec suivi santé, appels et notifications." },
  { id: "example-2", name: "Écouteurs Bluetooth", price: 18000, discountPrice: null, images: ["/images/earbuds.png"], category: "earphones", stock: 15, rating: 4.2, reviewCount: 18, featured: false, description: "Écouteurs sans fil avec une excellente qualité sonore et réduction de bruit passive." },
  { id: "example-3", name: "Coque Protection Premium", price: 5000, discountPrice: null, images: ["/images/case.png"], category: "cases", stock: 30, rating: 4.0, reviewCount: 12, featured: false, description: "Coque renforcée pour protéger votre téléphone contre les chutes." },
  { id: "example-4", name: "Batterie Externe 20000mAh", price: 22000, discountPrice: 19000, images: ["/images/powerbank.png"], category: "power-banks", stock: 8, rating: 4.7, reviewCount: 31, featured: true, description: "Ne tombez plus en panne de batterie. Capacité de 20000mAh pour recharger plusieurs fois votre appareil." },
  { id: "example-5", name: "Chargeur Rapide 65W", price: 12000, discountPrice: null, images: ["/images/charger.png"], category: "chargers", stock: 20, rating: 4.3, reviewCount: 9, featured: false, description: "Chargeur mural ultra rapide avec technologie GaN." },
  { id: "example-6", name: "Haut-parleur Portable", price: 30000, discountPrice: 25000, images: ["/images/speaker.png"], category: "speakers", stock: 5, rating: 4.6, reviewCount: 41, featured: true, description: "Haut-parleur Bluetooth étanche avec des basses puissantes." },
  { id: "example-7", name: "Smartwatch Sport Ultra", price: 55000, discountPrice: null, images: ["/images/smartwatch.png"], category: "smartwatches", stock: 7, rating: 4.8, reviewCount: 56, featured: true, description: "Conçue pour les sportifs de haut niveau. Étanchéité renforcée." },
  { id: "example-8", name: "Écouteurs ANC Pro", price: 35000, discountPrice: 29000, images: ["/images/earbuds.png"], category: "earphones", stock: 12, rating: 4.4, reviewCount: 27, featured: false, description: "Réduction de bruit active premium pour vous immerger dans votre musique." },
];

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const productId = params.id || "";
  const { addItem } = useCartContext();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const isExample = productId.startsWith("example-");
  const exampleProduct = isExample ? exampleProducts.find(p => p.id === productId) : null;

  const { data: apiProduct, isLoading: isApiLoading } = useGetProduct(productId, {
    query: {
      enabled: !!productId && !isExample,
      queryKey: getGetProductQueryKey(productId)
    }
  });
  
  const product = isExample ? exampleProduct : apiProduct;
  const isLoading = isExample ? false : isApiLoading;

  const { data: reviews, isLoading: isReviewsLoading } = useListProductReviews(productId, {
    query: {
      enabled: !!productId && !isExample,
      queryKey: getListProductReviewsQueryKey(productId)
    }
  });

  const [selectedImage, setSelectedImage] = React.useState(0);
  const [selectedMedia, setSelectedMedia] = React.useState<'image' | 'video'>('image');
  const [selectedColor, setSelectedColor] = React.useState<string | undefined>(undefined);
  const [quantity, setQuantity] = React.useState(1);

  // Set default selected image and color when product loads
  React.useEffect(() => {
    if (product) {
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        setSelectedColor(product.colors[0]);
      }
    }
  }, [product, selectedColor]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
          <Button asChild><Link href="/products"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au catalogue</Link></Button>
        </div>
      </Layout>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <Layout>
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/products" className="text-sm text-muted-foreground hover:text-primary flex items-center w-fit">
            <ArrowLeft className="mr-1 h-4 w-4" /> Retour
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          {/* Media: Images + Video */}
          <div className="lg:col-span-5 space-y-4">
            {/* Tab bar: show only if product has a video */}
            {(product as any).video && (
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMedia('image')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${selectedMedia === 'image' ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                >
                  <span>Photos</span>
                </button>
                <button
                  onClick={() => setSelectedMedia('video')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${selectedMedia === 'video' ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Vidéo</span>
                </button>
              </div>
            )}

            {/* Main viewer */}
            <div className="aspect-square max-w-md mx-auto bg-gray-50 border border-border rounded-2xl overflow-hidden flex items-center justify-center p-6">
              {selectedMedia === 'video' && (product as any).video ? (
                <video
                  key={(product as any).video}
                  src={(product as any).video}
                  controls
                  controlsList="nodownload"
                  className="w-full h-full object-contain rounded-xl"
                  poster={product.images?.[0] || product.imageUrl || undefined}
                >
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
              ) : (
                <img
                  src={product.images?.[selectedImage] || (product as any).imageUrl || "/images/smartwatch.png"}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply"
                  onError={(e) => { e.currentTarget.src = "/images/smartwatch.png"; }}
                />
              )}
            </div>

            {/* Thumbnails (images only) */}
            {selectedMedia === 'image' && product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-xl border-2 p-1.5 bg-gray-50 flex items-center justify-center transition-all ${selectedImage === index ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-300'}`}
                  >
                    <img src={image} alt="" className="w-full h-full object-contain mix-blend-multiply" onError={(e) => { e.currentTarget.src = "/images/smartwatch.png"; }} />
                  </button>
                ))}
              </div>
            )}
          </div>


          {/* Info */}
          <div className="lg:col-span-7">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{product.category}</p>
                {product.brand && (
                  <>
                    <span className="text-gray-300">•</span>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{product.brand}</p>
                  </>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{product.name}</h1>
              <div className="flex items-center gap-3">
                <StarRating rating={product.rating} count={product.reviewCount} size={16} />
                <span className="text-sm text-muted-foreground">({product.salesCount || 0} vendus)</span>
              </div>
            </div>

            <div className="mb-5">
              {hasDiscount ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl md:text-3xl font-bold text-accent">{product.discountPrice?.toLocaleString()} FCFA</span>
                  <span className="text-lg text-muted-foreground line-through">{product.price.toLocaleString()} FCFA</span>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                    -{Math.round((1 - (product.discountPrice! / product.price)) * 100)}%
                  </Badge>
                </div>
              ) : (
                <span className="text-2xl md:text-3xl font-bold text-foreground">{product.price.toLocaleString()} FCFA</span>
              )}
            </div>

            <Separator className="my-5" />

            <div className="mb-6">
              <p className="text-gray-600 leading-relaxed">
                {product.description || "Aucune description disponible pour ce produit."}
              </p>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3">Couleur</h3>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${selectedColor === color ? 'border-primary' : 'border-transparent'}`}
                      style={{ backgroundColor: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Quantité</h3>
                <span className={`text-sm font-medium ${isOutOfStock ? 'text-destructive' : 'text-green-600'}`}>
                  {isOutOfStock ? 'Rupture de stock' : `${product.stock} en stock`}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center justify-between border border-border rounded-xl w-full sm:w-36 h-12 bg-card">
                  <button 
                    className="w-12 h-full flex items-center justify-center text-lg font-bold text-muted-foreground hover:bg-muted/50 disabled:opacity-30 active:scale-95 transition-all"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock || quantity <= 1}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    className="flex-1 text-center bg-transparent border-none focus:ring-0 text-base font-bold p-0"
                    value={quantity}
                    readOnly
                  />
                  <button 
                    className="w-12 h-full flex items-center justify-center text-lg font-bold text-muted-foreground hover:bg-muted/50 disabled:opacity-30 active:scale-95 transition-all"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={isOutOfStock || quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <Button 
                  size="lg" 
                  className="w-full sm:flex-1 h-12 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl shadow-md active:scale-[0.98] transition-all text-base"
                  disabled={isOutOfStock}
                  onClick={() => {
                    if (!user) {
                      toast({
                        title: "Connexion requise",
                        description: "Veuillez vous connecter pour ajouter des produits au panier.",
                        variant: "destructive"
                      });
                      setLocation("/auth/login");
                      return;
                    }
                    addItem(product.id, quantity, selectedColor);
                    toast({ title: "Produit ajouté au panier" });
                  }}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Ajouter au panier
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Truck className="h-5 w-5 text-primary" />
                <span>Livraison rapide partout en Côte d'Ivoire</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Garantie constructeur 1 an</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details and Reviews Tabs could go here - simplified for now */}
        <div className="border-t border-border pt-8">
          <h2 className="text-xl font-bold mb-6">Avis Clients</h2>
          
          {isReviewsLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="h-32 bg-gray-50 rounded-xl animate-pulse"></div>)}
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map(review => (
                <div key={review.id} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold">{review.userName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-muted-foreground">Aucun avis pour le moment. Soyez le premier !</p>
            </div>
          )}

          {/* Formulaire d'avis */}
          <div className="mt-12 bg-white dark:bg-gray-800 border border-border rounded-2xl p-6 max-w-2xl">
            {user ? (
              <ReviewFormWrapper
                productId={productId}
                userName={user.name}
                userId={user.id}
                existingReview={reviews?.find(r => r.userId === user.id) ?? null}
              />
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">Vous devez être connecté pour donner votre avis.</p>
                <Button asChild variant="outline">
                  <Link href="/auth/login">Se connecter</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ReviewFormWrapper({
  productId,
  userName,
  userId,
  existingReview,
}: {
  productId: string;
  userName: string;
  userId: string;
  existingReview: { id: string; rating: number; comment: string } | null;
}) {
  const [isEditing, setIsEditing] = React.useState(false);

  if (existingReview && !isEditing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Votre avis</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" />
            Modifier mon avis
          </Button>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= existingReview.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300 dark:text-gray-500"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{existingReview.comment}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">
          {existingReview ? "Modifier votre avis" : "Laisser un avis"}
        </h3>
        {existingReview && isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            Annuler
          </Button>
        )}
      </div>
      <ReviewForm
        productId={productId}
        userName={userName}
        userId={userId}
        existingReview={existingReview}
        onSuccess={() => setIsEditing(false)}
      />
    </div>
  );
}

function ReviewForm({
  productId,
  userName,
  userId,
  existingReview,
  onSuccess,
}: {
  productId: string;
  userName: string;
  userId: string;
  existingReview?: { id: string; rating: number; comment: string } | null;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const createReviewMutation = useCreateReview();
  const [rating, setRating] = React.useState(existingReview?.rating ?? 5);
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const [comment, setComment] = React.useState(existingReview?.comment ?? "");
  const { toast } = useToast();
  const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? "";

  const updateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, data }: { reviewId: string; data: { rating: number; comment: string } }) => {
      const res = await fetch(`${BASE_URL}/api/products/${productId}/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Avis mis à jour !", description: "Votre avis a été modifié avec succès." });
      queryClient.invalidateQueries({ queryKey: getListProductReviewsQueryKey(productId) });
      queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de modifier l'avis.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez écrire un commentaire.",
        variant: "destructive"
      });
      return;
    }

    if (existingReview) {
      updateReviewMutation.mutate({ reviewId: existingReview.id, data: { rating, comment } });
      return;
    }

    createReviewMutation.mutate(
      {
        id: productId,
        data: { rating, comment, userName, userId },
      },
      {
        onSuccess: () => {
          toast({ title: "Merci !", description: "Votre avis a été publié avec succès." });
          setComment("");
          setRating(5);
          queryClient.invalidateQueries({ queryKey: getListProductReviewsQueryKey(productId) });
          queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
          onSuccess?.();
        },
        onError: (err: any) => {
          toast({
            title: "Erreur",
            description: err.message || "Impossible de publier l'avis.",
            variant: "destructive"
          });
        },
      }
    );
  };

  const isPending = createReviewMutation.isPending || updateReviewMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Votre note</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-1 focus:outline-none transition-colors"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoverRating ?? rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-semibold mb-2">
          Votre commentaire
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Qu'avez-vous pensé de ce produit ?"
          className="w-full rounded-lg border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-foreground"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending
          ? (existingReview ? "Mise à jour..." : "Publication...")
          : (existingReview ? "Mettre à jour mon avis" : "Publier l'avis")}
      </Button>
    </form>
  );
}

import React from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { 
  useGetProduct, 
  getGetProductQueryKey,
  useListProductReviews,
  getListProductReviewsQueryKey,
  useCreateReview,
  CartItem
} from "@workspace/api-client-react";
import { useCartContext } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Truck, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProductDetail() {
  const params = useParams();
  const productId = parseInt(params.id || "0", 10);
  const { addItem } = useCartContext();

  const { data: product, isLoading } = useGetProduct(productId, {
    query: {
      enabled: !!productId,
      queryKey: getGetProductQueryKey(productId)
    }
  });

  const { data: reviews, isLoading: isReviewsLoading } = useListProductReviews(productId, {
    query: {
      enabled: !!productId,
      queryKey: getListProductReviewsQueryKey(productId)
    }
  });

  const [selectedImage, setSelectedImage] = React.useState(0);
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
          <Link href="/products">
            <Button><ArrowLeft className="mr-2 h-4 w-4" /> Retour au catalogue</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <Layout>
      <div className="bg-gray-50 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/products" className="text-sm text-muted-foreground hover:text-primary flex items-center w-fit">
            <ArrowLeft className="mr-1 h-4 w-4" /> Retour
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-50 border border-border rounded-2xl overflow-hidden flex items-center justify-center p-8">
              <img 
                src={product.images?.[selectedImage] || "/images/smartwatch.png"} 
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button 
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-xl border-2 p-2 bg-gray-50 flex items-center justify-center ${selectedImage === index ? 'border-primary' : 'border-transparent hover:border-gray-300'}`}
                  >
                    <img src={image} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">{product.category}</p>
                {product.brand && (
                  <>
                    <span className="text-gray-300">•</span>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">{product.brand}</p>
                  </>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{product.name}</h1>
              <div className="flex items-center gap-4">
                <StarRating rating={product.rating} count={product.reviewCount} size={20} />
                <span className="text-sm text-muted-foreground">({product.salesCount || 0} vendus)</span>
              </div>
            </div>

            <div className="mb-6">
              {hasDiscount ? (
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-accent">{product.discountPrice?.toLocaleString()} FCFA</span>
                  <span className="text-xl text-muted-foreground line-through">{product.price.toLocaleString()} FCFA</span>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                    -{Math.round((1 - (product.discountPrice! / product.price)) * 100)}%
                  </Badge>
                </div>
              ) : (
                <span className="text-3xl font-bold text-foreground">{product.price.toLocaleString()} FCFA</span>
              )}
            </div>

            <Separator className="my-6" />

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
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-md w-32">
                  <button 
                    className="px-3 py-2 text-lg text-muted-foreground hover:bg-gray-100 disabled:opacity-50"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock || quantity <= 1}
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    className="w-full text-center border-none focus:ring-0 text-lg font-medium p-0"
                    value={quantity}
                    readOnly
                  />
                  <button 
                    className="px-3 py-2 text-lg text-muted-foreground hover:bg-gray-100 disabled:opacity-50"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={isOutOfStock || quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <Button 
                  size="lg" 
                  className="flex-1 bg-accent hover:bg-accent/90 text-white font-bold"
                  disabled={isOutOfStock}
                  onClick={() => addItem(product.id, quantity, selectedColor)}
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
        <div className="border-t border-border pt-12">
          <h2 className="text-2xl font-bold mb-8">Avis Clients</h2>
          
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
        </div>
      </div>
    </Layout>
  );
}

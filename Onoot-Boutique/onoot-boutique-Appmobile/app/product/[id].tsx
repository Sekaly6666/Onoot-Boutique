import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Star,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  ShoppingCart,
  AlertCircle,
  ArrowLeft,
  Check,
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { api, formatPrice, getImageUrl } from '../../src/services/api';
import { Product } from '../../src/types';
import { useCart } from '../../src/contexts/CartContext';
import { useAuth } from '../../src/contexts/AuthContext';

const { width } = Dimensions.get('window');
const theme = Colors.light;

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct(id as string);
    }
  }, [id]);

  const loadProduct = async (prodId: string) => {
    try {
      setIsLoading(true);
      const data = await api.getProduct(prodId);
      setProduct(data);
      if (data?.colors && data.colors.length > 0) {
        setSelectedColor(data.colors[0]);
      }
    } catch (e) {
      console.log('Error loading product details', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Veuillez vous connecter pour ajouter des articles à votre panier.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/login') },
        ]
      );
      return;
    }
    setIsAdding(true);
    const success = await addToCart(product, quantity, selectedColor);
    setIsAdding(false);
    if (success) {
      Alert.alert('Succès', `${quantity}x ${product.name} ajouté(s) à votre panier.`, [
        { text: 'Continuer les achats', style: 'cancel' },
        { text: 'Voir le panier', onPress: () => router.push('/(tabs)/cart') },
      ]);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Veuillez vous connecter pour commander cet article.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/login') },
        ]
      );
      return;
    }
    const success = await addToCart(product, quantity, selectedColor);
    if (success) {
      router.push('/(tabs)/cart');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Chargement du produit...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={48} color="#94A3B8" />
        <Text style={styles.notFoundTitle}>Produit introuvable</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour au catalogue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentPrice = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Main Image Slider */}
          <View style={styles.imageGalleryContainer}>
            <Image
              source={{ uri: getImageUrl(images[selectedImageIndex]) }}
              style={styles.mainImage}
            />

            {hasDiscount && (
              <View style={styles.promoBadge}>
                <Text style={styles.promoBadgeText}>-{discountPercent}%</Text>
              </View>
            )}

            {/* Thumbnail dots/selectors */}
            {images.length > 1 && (
              <ScrollView horizontal style={styles.thumbnailList} showsHorizontalScrollIndicator={false}>
                {images.map((img, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.thumbnailWrap,
                      selectedImageIndex === idx && styles.activeThumbnail,
                    ]}
                    onPress={() => setSelectedImageIndex(idx)}
                  >
                    <Image source={{ uri: getImageUrl(img) }} style={styles.thumbnailImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Details Section */}
          <View style={styles.detailsContent}>
            {/* Category & Rating */}
            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {product.category?.toUpperCase() || 'HIGH-TECH'}
                </Text>
              </View>
              <View style={styles.ratingRow}>
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingScore}>{product.rating || 4.5}</Text>
                <Text style={styles.reviewsCount}>({product.reviewCount || 12} avis)</Text>
              </View>
            </View>

            {/* Product Title */}
            <Text style={styles.productTitle}>{product.name}</Text>

            {/* Price Box */}
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatPrice(currentPrice)}</Text>
              {hasDiscount && (
                <Text style={styles.oldPrice}>{formatPrice(product.price)}</Text>
              )}
            </View>

            {/* Stock indicator */}
            <View style={styles.stockRow}>
              <View
                style={[
                  styles.stockDot,
                  { backgroundColor: product.stock > 0 ? '#10B981' : '#EF4444' },
                ]}
              />
              <Text style={styles.stockText}>
                {product.stock > 0
                  ? `En stock (${product.stock} exemplaires restants)`
                  : 'Rupture temporaire'}
              </Text>
            </View>

            {/* Colors Selector */}
            {product.colors && product.colors.length > 0 && (
              <View style={styles.optionSection}>
                <Text style={styles.optionTitle}>Couleur disponible :</Text>
                <View style={styles.colorPills}>
                  {product.colors.map((c, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.colorPill,
                        selectedColor === c && styles.colorPillActive,
                      ]}
                      onPress={() => setSelectedColor(c)}
                    >
                      <Text
                        style={[
                          styles.colorPillText,
                          selectedColor === c && styles.colorPillTextActive,
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Quantity Selector */}
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Quantité :</Text>
              <View style={styles.quantityPicker}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus size={16} color="#1E293B" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Plus size={16} color="#1E293B" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Description du produit</Text>
              <Text style={styles.descriptionText}>
                {product.description ||
                  'Produit de haute qualité sélectionné par Onoot Boutique. Bénéficie de la garantie constructeur et de notre service après-vente dédié.'}
              </Text>
            </View>

            {/* Onoot Guarantees */}
            <View style={styles.guaranteeBox}>
              <View style={styles.guaranteeItem}>
                <ShieldCheck size={20} color={theme.primary} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.guaranteeTitle}>Garantie 100% Authentique</Text>
                  <Text style={styles.guaranteeDesc}>Produits testés et certifiés conformes.</Text>
                </View>
              </View>
              <View style={styles.guaranteeItem}>
                <Truck size={20} color="#3B82F6" strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.guaranteeTitle}>Livraison Express Abidjan</Text>
                  <Text style={styles.guaranteeDesc}>Expédition rapide partout en Côte d'Ivoire.</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Floating Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.addToCartBtn}
            disabled={isAdding}
            onPress={handleAddToCart}
          >
            {isAdding ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <>
                <ShoppingCart size={20} color={theme.primary} strokeWidth={2.2} />
                <Text style={styles.addToCartText}>Ajouter</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow}>
            <Text style={styles.buyNowText}>Acheter maintenant</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  imageGalleryContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
    paddingBottom: 16,
  },
  mainImage: {
    width: width,
    height: 320,
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  promoBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  promoBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  thumbnailList: {
    flexDirection: 'row',
    marginTop: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbnailWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  activeThumbnail: {
    borderColor: theme.primary,
    borderWidth: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailsContent: {
    padding: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  reviewsCount: {
    fontSize: 12,
    color: '#64748B',
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 26,
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.primary,
  },
  oldPrice: {
    fontSize: 16,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  optionSection: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  colorPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  colorPillActive: {
    backgroundColor: '#FFF7ED',
    borderColor: theme.primary,
  },
  colorPillText: {
    fontSize: 13,
    color: '#475569',
  },
  colorPillTextActive: {
    color: theme.primary,
    fontWeight: '700',
  },
  quantityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 10,
  },
  descriptionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  guaranteeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  guaranteeDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addToCartText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  buyNowBtn: {
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buyNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 12,
  },
  backButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

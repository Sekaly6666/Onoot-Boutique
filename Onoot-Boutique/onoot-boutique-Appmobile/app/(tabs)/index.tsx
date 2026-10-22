import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  ShoppingBag,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Headphones,
  Flame,
  ArrowRight,
  Plus,
  Check,
  Star,
  X,
  Sparkles,
} from 'lucide-react-native';
import { Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { api, formatPrice, getImageUrl } from '../../src/services/api';
import { Product, Category } from '../../src/types';
import { useCart } from '../../src/contexts/CartContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { OnootLogo } from '../../components/OnootLogo';
import { VideoShowcase } from '../../components/VideoShowcase';

const { width } = Dimensions.get('window');
const theme = Colors.light;

export default function HomeScreen() {
  const router = useRouter();
  const { addToCart, totalCount } = useCart();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Live Flash Sale Countdown matching website
  const [countdown, setCountdown] = useState({ h: 11, m: 45, s: 30 });
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 0);
      const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      return {
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      };
    };
    setCountdown(calc());
    const interval = setInterval(() => setCountdown(calc()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Hero carousel slides strictly in brand order: 1. Bleu (#0284C7), 2. Jaune (#F5C430), 3. Orange (#E87C2A)
  const heroSlides = [
    {
      id: 1,
      title: "L'excellence tech, livrée chez vous",
      subtitle: "Sélection premium d'accessoires. Qualité certifiée & paiement à la livraison.",
      badge: 'NOUVEAUTÉ 2026',
      bg: '#0284C7', // 1. BLEU ONOOT
      darkText: false,
      tag: '4.9/5 • Meilleure Vente',
    },
    {
      id: 2,
      title: "Vente Flash du Jour jusqu'à -40%",
      subtitle: "Offres exceptionnelles limitées sur le son et la haute technologie.",
      badge: 'VENTE FLASH DU JOUR',
      bg: '#F5C430', // 2. JAUNE ONOOT
      darkText: true,
      tag: '-40% Remise Immédiate',
    },
    {
      id: 3,
      title: 'Dernières Tendances & Arrivages',
      subtitle: 'Smartphones, écouteurs, montres connectées... Restez à la pointe avec Onoot.',
      badge: 'NOUVEAUX ARRIVAGES',
      bg: '#E87C2A', // 3. ORANGE ONOOT
      darkText: false,
      tag: 'Livraison Express Abidjan & Intérieur',
    },
  ];

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        api.getProducts({ limit: 16 }),
        api.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.log('Error loading home data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/(tabs)/catalog',
        params: { search: searchQuery.trim() },
      });
    } else {
      router.push('/(tabs)/catalog');
    }
  };

  const handleQuickAdd = async (product: Product) => {
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
    const success = await addToCart(product, 1);
    if (success) {
      setAddedProductId(product.id);
      setTimeout(() => setAddedProductId(null), 1500);
    }
  };

  const flashSaleProducts = products.filter((p) => p.flashSale || p.discountPrice);
  const featuredProducts = products.slice(0, 8);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
      >
        {/* Top Header with Official Onoot Logo & Actions */}
        <View style={styles.header}>
          <OnootLogo size="md" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              style={styles.headerCartButton}
              onPress={() => router.push('/(tabs)/cart')}
            >
              <ShoppingCart size={21} color="#1E293B" strokeWidth={2.2} />
              {totalCount > 0 && (
                <View style={styles.headerCartBadge}>
                  <Text style={styles.headerCartBadgeText}>
                    {totalCount > 99 ? '99+' : totalCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar with Lucide Search */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit, écouteurs, smartwatch..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Carousel (Couleurs de marque : Bleu, Jaune, Orange) */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const slideIndex = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
            setActiveSlide(slideIndex);
          }}
          style={styles.carouselScrollView}
          contentContainerStyle={styles.carouselContainer}
        >
          {heroSlides.map((slide) => (
            <TouchableOpacity
              key={slide.id}
              activeOpacity={0.9}
              style={[styles.heroCard, { backgroundColor: slide.bg }]}
              onPress={() => router.push('/(tabs)/catalog')}
            >
              <View style={[styles.heroBadge, slide.darkText && { backgroundColor: '#0F172A' }]}>
                <Text style={[styles.heroBadgeText, slide.darkText && { color: '#F5C430' }]}>{slide.badge}</Text>
              </View>
              <Text style={[styles.heroTitle, slide.darkText && { color: '#0F172A' }]}>{slide.title}</Text>
              <Text style={[styles.heroSubtitle, slide.darkText && { color: '#334155' }]}>{slide.subtitle}</Text>
              <View style={styles.heroFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Zap size={13} color={slide.darkText ? '#B45309' : '#FFFFFF'} strokeWidth={2.5} />
                  <Text style={[styles.heroTag, slide.darkText && { color: '#0F172A' }]}>{slide.tag}</Text>
                </View>
                <View style={[styles.heroButton, slide.darkText && { backgroundColor: '#0F172A' }]}>
                  <Text style={[styles.heroButtonText, slide.darkText && { color: '#FFFFFF' }]}>Découvrir</Text>
                  <ArrowRight size={14} color={slide.darkText ? '#FFFFFF' : '#111827'} strokeWidth={2.5} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Carousel Dots */}
        <View style={styles.dotsContainer}>
          {heroSlides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                activeSlide === i ? styles.activeDot : null,
              ]}
            />
          ))}
        </View>

        {/* Value Proposition Badges */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Zap size={18} color="#3B82F6" strokeWidth={2.5} />
            </View>
            <Text style={styles.featureTitle}>Livraison Express</Text>
            <Text style={styles.featureDesc}>Abidjan & Intérieur</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <ShieldCheck size={18} color="#D97706" strokeWidth={2.5} />
            </View>
            <Text style={styles.featureTitle}>Paiement Sûr</Text>
            <Text style={styles.featureDesc}>À la livraison / MoMo</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Headphones size={18} color="#10B981" strokeWidth={2.5} />
            </View>
            <Text style={styles.featureTitle}>Support Client</Text>
            <Text style={styles.featureDesc}>WhatsApp 7j/7</Text>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catégories populaires</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/catalog',
                  params: { category: cat.slug },
                })
              }
            >
              <View style={styles.categoryIconWrap}>
                <ShoppingBag size={22} color="#E87C2A" strokeWidth={2} />
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Flash Sales Section - Styled with website fiery background & countdown */}
        {flashSaleProducts.length > 0 && (
          <View style={styles.flashSectionWrapper}>
            {/* Ambient orange glow */}
            <View style={styles.flashGlowBg} />

            <View style={styles.flashHeaderRow}>
              <View style={styles.flashTitleCol}>
                <View style={styles.flashTopBadge}>
                  <Zap size={13} color="#F5C430" fill="#F5C430" />
                  <Text style={styles.flashTopBadgeText}>OFFRES DU JOUR</Text>
                </View>
                <Text style={styles.flashMainHeading}>Ventes Flash & Promos</Text>
              </View>

              {/* Countdown Boxes matching website */}
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownLabel}>Fin dans :</Text>
                <View style={styles.countdownBoxesRow}>
                  <View style={styles.countdownBox}>
                    <Text style={styles.countdownVal}>{String(countdown.h).padStart(2, '0')}</Text>
                    <Text style={styles.countdownUnit}>H</Text>
                  </View>
                  <Text style={styles.countdownColon}>:</Text>
                  <View style={styles.countdownBox}>
                    <Text style={styles.countdownVal}>{String(countdown.m).padStart(2, '0')}</Text>
                    <Text style={styles.countdownUnit}>M</Text>
                  </View>
                  <Text style={styles.countdownColon}>:</Text>
                  <View style={styles.countdownBox}>
                    <Text style={styles.countdownVal}>{String(countdown.s).padStart(2, '0')}</Text>
                    <Text style={styles.countdownUnit}>S</Text>
                  </View>
                </View>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.flashProductsList}>
              {flashSaleProducts.map((product) => {
                const isJustAdded = addedProductId === product.id;
                return (
                  <View key={product.id} style={styles.flashProductCard}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => router.push(`/product/${product.id}`)}
                    >
                      <Image
                        source={{ uri: getImageUrl(product.images?.[0]) }}
                        style={styles.flashProductImage}
                      />
                      {product.discountPrice && (
                        <View style={styles.flashCardDiscountBadge}>
                          <Text style={styles.flashCardDiscountBadgeText}>PROMO</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={styles.flashCardInfo}>
                      <Text style={styles.flashCardName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <View style={styles.flashCardPriceRow}>
                        <Text style={styles.flashCardPrice}>
                          {formatPrice(product.discountPrice ?? product.price)}
                        </Text>
                        {product.discountPrice && (
                          <Text style={styles.flashCardOldPrice}>{formatPrice(product.price)}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.flashCardAddBtn,
                          isJustAdded && { backgroundColor: '#10B981' },
                        ]}
                        onPress={() => handleQuickAdd(product)}
                      >
                        {isJustAdded ? (
                          <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                        ) : (
                          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                        )}
                        <Text style={styles.flashCardAddText}>
                          {isJustAdded ? 'Ajouté !' : 'Ajouter'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 🎬 OFFICIAL ONOOT LIVE & DÉMOS VIDÉOS SHOWCASE */}
        <VideoShowcase allProducts={products} />

        {/* Featured Products Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sélection pour vous</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={styles.sectionLink}>Tout afficher</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          {featuredProducts.map((product) => {
            const isJustAdded = addedProductId === product.id;
            return (
              <TouchableOpacity
                key={product.id}
                style={styles.gridCard}
                activeOpacity={0.8}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <Image
                  source={{ uri: getImageUrl(product.images?.[0]) }}
                  style={styles.gridImage}
                />
                {product.discountPrice && (
                  <View style={styles.gridDiscountBadge}>
                    <Text style={styles.gridDiscountText}>PROMO</Text>
                  </View>
                )}
                <View style={styles.gridContent}>
                  <Text style={styles.gridCategory}>
                    {product.category?.toUpperCase() || 'ACCESSOIRE'}
                  </Text>
                  <Text style={styles.gridTitle} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <View style={styles.gridPriceRow}>
                    <Text style={styles.gridPrice}>
                      {formatPrice(product.discountPrice ?? product.price)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.gridAddBtn,
                      isJustAdded && { backgroundColor: '#10B981' },
                    ]}
                    onPress={() => handleQuickAdd(product)}
                  >
                    {isJustAdded ? (
                      <Check size={15} color="#FFFFFF" strokeWidth={2.5} />
                    ) : (
                      <ShoppingCart size={15} color="#FFFFFF" strokeWidth={2.5} />
                    )}
                    <Text style={styles.gridAddText}>
                      {isJustAdded ? 'Ajouté !' : 'Ajouter'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  headerCartButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  headerCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E87C2A',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  carouselScrollView: {
    marginTop: 4,
  },
  carouselContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  heroCard: {
    width: width - 32,
    borderRadius: 18,
    padding: 20,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  heroTag: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  heroButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  activeDot: {
    width: 18,
    backgroundColor: '#E87C2A',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
  },
  featureDesc: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  sectionContainer: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E87C2A',
  },
  flashSectionWrapper: {
    marginVertical: 14,
    marginHorizontal: 12,
    borderRadius: 24,
    paddingVertical: 18,
    backgroundColor: '#7C2D12',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#E87C2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  flashGlowBg: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(232, 124, 42, 0.35)',
  },
  flashHeaderRow: {
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'column',
    gap: 10,
  },
  flashTitleCol: {},
  flashTopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  flashTopBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F5C430',
    letterSpacing: 0.8,
  },
  flashMainHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  countdownBoxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countdownBox: {
    backgroundColor: '#111827',
    width: 36,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  countdownVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  countdownUnit: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  countdownColon: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginHorizontal: 1,
  },
  flashProductsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  flashProductCard: {
    width: 172,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  flashProductImage: {
    width: '100%',
    height: 135,
    resizeMode: 'cover',
    backgroundColor: '#F8FAFC',
  },
  flashCardDiscountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  flashCardDiscountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  flashCardInfo: {
    padding: 10,
  },
  flashCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    height: 36,
  },
  flashCardPriceRow: {
    marginVertical: 4,
  },
  flashCardPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#E87C2A',
  },
  flashCardOldPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  flashCardAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E87C2A',
    borderRadius: 10,
    paddingVertical: 7,
    marginTop: 6,
    gap: 4,
  },
  flashCardAddText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    width: 80,
  },
  categoryIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  horizontalProductsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  horizontalProductCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  horizontalProductImage: {
    width: '100%',
    height: 130,
    resizeMode: 'cover',
    backgroundColor: '#F1F5F9',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    height: 36,
  },
  priceRow: {
    marginVertical: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E87C2A',
  },
  oldPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E87C2A',
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 6,
    gap: 4,
  },
  quickAddText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 36) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
    backgroundColor: '#F1F5F9',
  },
  gridDiscountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gridDiscountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  gridContent: {
    padding: 10,
  },
  gridCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    height: 36,
  },
  gridPriceRow: {
    marginVertical: 4,
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E87C2A',
  },
  gridAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E87C2A',
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 6,
    gap: 4,
  },
  gridAddText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

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
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ShoppingCart, Search, X, Check, Filter } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { api, formatPrice, getImageUrl } from '../../src/services/api';
import { Product, Category } from '../../src/types';
import { useCart } from '../../src/contexts/CartContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');
const theme = Colors.light;

export default function CatalogScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Read initial category / search from navigation query params
  useEffect(() => {
    if (searchParams.category) {
      setSelectedCategory(searchParams.category as string);
    }
    if (searchParams.search) {
      setSearch(searchParams.search as string);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allCats, allProds] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
      ]);
      setCategories(allCats);
      setProducts(allProds);
    } catch (e) {
      console.log('Error loading catalog', e);
    } finally {
      setIsLoading(false);
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
      setTimeout(() => {
        setAddedProductId(null);
      }, 1500);
    }
  };

  // Filter and sort products
  let filtered = [...products];

  if (selectedCategory !== 'all') {
    filtered = filtered.filter(
      (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }

  if (sortBy === 'priceAsc') {
    filtered.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
  } else if (sortBy === 'priceDesc') {
    filtered.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Catalogue Onoot</Text>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <ShoppingCart size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans tout le catalogue..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories Pills */}
        <View style={styles.pillsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContent}>
            <TouchableOpacity
              style={[
                styles.pill,
                selectedCategory === 'all' && styles.activePill,
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedCategory === 'all' && styles.activePillText,
                ]}
              >
                Tous
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.pill,
                  selectedCategory === cat.slug && styles.activePill,
                ]}
                onPress={() => setSelectedCategory(cat.slug)}
              >
                <Text
                  style={[
                    styles.pillText,
                    selectedCategory === cat.slug && styles.activePillText,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sort and Count Sub-header */}
        <View style={styles.subHeader}>
          <Text style={styles.countText}>
            {filtered.length} produit{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
          </Text>

          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'priceAsc' && styles.activeSortButton]}
              onPress={() => setSortBy(sortBy === 'priceAsc' ? 'default' : 'priceAsc')}
            >
              <Text style={[styles.sortText, sortBy === 'priceAsc' && styles.activeSortText]}>
                Prix ↑
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'priceDesc' && styles.activeSortButton]}
              onPress={() => setSortBy(sortBy === 'priceDesc' ? 'default' : 'priceDesc')}
            >
              <Text style={[styles.sortText, sortBy === 'priceDesc' && styles.activeSortText]}>
                Prix ↓
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Grid */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Chargement des produits...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerContainer}>
            <Search size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
            <Text style={styles.emptyDesc}>Essayez de modifier votre recherche ou sélectionnez une autre catégorie.</Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
            >
              <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.gridList}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
          >
            <View style={styles.gridRow}>
              {filtered.map((item) => {
                const isJustAdded = addedProductId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/product/${item.id}`)}
                  >
                    <Image
                      source={{ uri: getImageUrl(item.images?.[0]) }}
                      style={styles.cardImage}
                    />
                    {item.discountPrice && (
                      <View style={styles.badgePromo}>
                        <Text style={styles.badgePromoText}>PROMO</Text>
                      </View>
                    )}
                    <View style={styles.cardBody}>
                      <Text style={styles.cardCategory}>
                        {item.category?.toUpperCase() || 'ACCESSOIRE'}
                      </Text>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.currentPrice}>
                          {formatPrice(item.discountPrice ?? item.price)}
                        </Text>
                        {item.discountPrice && (
                          <Text style={styles.originalPrice}>
                            {formatPrice(item.price)}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.addBtn,
                          isJustAdded && styles.addBtnSuccess,
                        ]}
                        onPress={() => handleQuickAdd(item)}
                      >
                        {isJustAdded ? (
                          <Check size={15} color="#FFFFFF" strokeWidth={2.5} />
                        ) : (
                          <ShoppingCart size={15} color="#FFFFFF" strokeWidth={2.2} />
                        )}
                        <Text style={styles.addBtnText}>
                          {isJustAdded ? 'Ajouté !' : 'Ajouter'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  pillsContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pillsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activePill: {
    backgroundColor: theme.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activePillText: {
    color: '#FFFFFF',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  countText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  activeSortButton: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  sortText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  activeSortText: {
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.primary,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  gridList: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 36) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
    backgroundColor: '#F8FAFC',
  },
  badgePromo: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePromoText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  cardBody: {
    padding: 10,
  },
  cardCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    height: 36,
  },
  priceContainer: {
    marginVertical: 4,
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.primary,
  },
  originalPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 6,
    gap: 4,
  },
  addBtnSuccess: {
    backgroundColor: '#10B981',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

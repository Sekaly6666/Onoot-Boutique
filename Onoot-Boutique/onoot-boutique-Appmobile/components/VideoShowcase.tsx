import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import {
  Play,
  Pause,
  ShoppingBag,
  ShoppingCart,
  Volume2,
  VolumeX,
  Heart,
  Sparkles,
  ChevronRight,
  Maximize2,
  X,
  Check,
  Zap,
  Flame,
  Radio,
  Share2,
} from 'lucide-react-native';
import { PromoVideo, Product } from '../src/types';
import { api, formatPrice, getImageUrl } from '../src/services/api';
import { useCart } from '../src/contexts/CartContext';
import { useAuth } from '../src/contexts/AuthContext';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = Math.min(width * 1.35, 480);
const REEL_AUTO_DURATION_SEC = 22;

const FALLBACK_VIDEOS: PromoVideo[] = [
  {
    _id: '6ac18d10e3bf5c34011d4b2d',
    title: 'IPHONE 18 PRO ➜ 18 PRO MAX',
    subtitle: 'PROTÈGE ROBUSTE AVEC VIS',
    description: 'Protection renforcée contre les chocs et les rayures.',
    videoUrl: 'https://www.facebook.com/reel/1480018313950943/',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
    productName: 'PROTÈGE ROBUSTE AVEC VIS IPHONE 18 PRO ➜ 18 PRO MAX',
    productId: '6ac18bb4e3bf5c34011d4b2c',
    productLink: '/products/6ac18bb4e3bf5c34011d4b2c',
    price: 15500,
    badge: 'NOUVEAUTÉ',
    viewsCount: 48,
  },
  {
    _id: '6abbdb07699bff8408eaab8b',
    title: 'ACLAPET Z FOLD 8',
    subtitle: 'Ultra - cuir premium + support',
    description: 'Le modèle qui protège bien ton Z 8 Fold.',
    videoUrl: 'https://www.facebook.com/reel/27875137132164368/',
    thumbnailUrl: '/images/zfold_case.jpg',
    productName: 'Samsung Galaxy Z Fold 8',
    productLink: '/products',
    price: 15000,
    badge: 'EXCLUSIVITÉ',
    viewsCount: 224,
  },
];

interface VideoShowcaseProps {
  allProducts: Product[];
}

export function VideoShowcase({ allProducts }: VideoShowcaseProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [videos, setVideos] = useState<PromoVideo[]>(FALLBACK_VIDEOS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(142);
  const [justAdded, setJustAdded] = useState(false);
  const [fullScreenModal, setFullScreenModal] = useState(false);

  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    api.getPromoVideos()
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          const list = data.map((v: any, i: number) => ({
            ...v,
            _id: v._id || `vid-${i}`,
            viewsCount: v.viewsCount || 1200 + i * 280,
          }));
          setVideos(list);
        }
      })
      .catch(() => {});
  }, []);

  const activeVideo = videos[selectedIndex] || videos[0];

  // Auto-advance progress timer
  useEffect(() => {
    if (!isPlaying) return;

    const tickMs = 100;
    const step = tickMs / (REEL_AUTO_DURATION_SEC * 1000);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 1) {
          setSelectedIndex((curr) => (curr + 1) % videos.length);
          return 0;
        }
        return next;
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [isPlaying, selectedIndex, videos.length]);

  useEffect(() => {
    setProgress(0);
  }, [selectedIndex]);

  // Match corresponding product
  const matchedProduct = useMemo(() => {
    if (!activeVideo || allProducts.length === 0) return null;
    if (activeVideo.productId) {
      const p = allProducts.find((it) => it.id === activeVideo.productId);
      if (p) return p;
    }
    if (activeVideo.productName) {
      const q = activeVideo.productName.toLowerCase();
      const p = allProducts.find((it) => it.name.toLowerCase().includes(q) || q.includes(it.name.toLowerCase()));
      if (p) return p;
    }
    return allProducts[0] || null;
  }, [activeVideo, allProducts]);

  const displayImageUri = useMemo(() => {
    const raw = activeVideo?.thumbnailUrl;
    const isVideoExt = raw && (raw.includes('.mp4') || raw.includes('facebook.com') || raw.includes('reel'));
    if (!raw || isVideoExt) {
      if (matchedProduct?.images?.[0]) return getImageUrl(matchedProduct.images[0]);
      return 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80';
    }
    return getImageUrl(raw);
  }, [activeVideo, matchedProduct]);

  const displayPrice = activeVideo.price || matchedProduct?.price || 15500;

  const nextVideo = () => {
    setSelectedIndex((prev) => (prev + 1) % videos.length);
    setProgress(0);
  };

  const prevVideo = () => {
    setSelectedIndex((prev) => (prev - 1 + videos.length) % videos.length);
    setProgress(0);
  };

  const handleQuickAdd = async () => {
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
    const target = matchedProduct || allProducts[0];
    if (target) {
      const ok = await addToCart(target, 1);
      if (ok) {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
      }
    }
  };

  const handleBuyNow = async () => {
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
    const target = matchedProduct || allProducts[0];
    if (target) {
      await addToCart(target, 1);
      router.push('/(tabs)/cart');
    }
  };

  // Embed HTML for WebView
  const playerHtml = useMemo(() => {
    const rawUrl = (activeVideo?.videoUrl || '').trim();
    const isMp4 = rawUrl.endsWith('.mp4') || rawUrl.includes('.mp4?');

    if (isMp4) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            html, body { width:100%; height:100%; background:#000; overflow:hidden; }
            video { width:100%; height:100%; object-fit:cover; }
          </style>
        </head>
        <body>
          <video src="${rawUrl}" autoplay playsinline webkit-playsinline ${isMuted ? 'muted' : ''} onended="window.ReactNativeWebView.postMessage('ended')"></video>
        </body>
        </html>
      `;
    }

    let fbCanonical = rawUrl;
    const matchReel = rawUrl.match(/facebook\.com\/reel\/([^/?&#]+)/i);
    if (matchReel && matchReel[1]) {
      fbCanonical = `https://www.facebook.com/reel/${matchReel[1]}/`;
    }
    const embedSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(fbCanonical)}&show_text=0&autoplay=1&mute=${isMuted ? '1' : '0'}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          html, body { width:100%; height:100%; background:#05070E; overflow:hidden; display:flex; align-items:center; justify-content:center; }
          iframe { width:100%; height:100%; border:none; }
        </style>
      </head>
      <body>
        <iframe
          src="${embedSrc}"
          width="100%"
          height="100%"
          style="border:none;overflow:hidden"
          scrolling="no"
          frameborder="0"
          allowfullscreen="true"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        ></iframe>
      </body>
      </html>
    `;
  }, [activeVideo?.videoUrl, isMuted]);

  return (
    <View style={styles.sectionContainer}>
      {/* 1. Mobile Header with Stories Title */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <View style={styles.livePill}>
            <View style={styles.pulseDot} />
            <Text style={styles.livePillText}>LIVE REELS</Text>
          </View>
          <Text style={styles.sectionTitle}>Démos & Vidéos</Text>
        </View>

        <TouchableOpacity
          style={styles.seeAllBtn}
          onPress={() => setFullScreenModal(true)}
        >
          <Text style={styles.seeAllText}>Plein écran</Text>
          <ChevronRight size={14} color="#E87C2A" />
        </TouchableOpacity>
      </View>

      {/* 2. Instagram Stories Bar (Avatars with glowing rings) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesScroll}
      >
        {videos.map((vid, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <TouchableOpacity
              key={vid._id || idx}
              style={styles.storyCapsule}
              onPress={() => {
                setSelectedIndex(idx);
                setProgress(0);
                setIsPlaying(true);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.storyRing, isSelected && styles.storyRingActive]}>
                <Image source={{ uri: displayImageUri }} style={styles.storyAvatar} />
                {isSelected && (
                  <View style={styles.storyLiveBadge}>
                    <Radio size={8} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text
                style={[styles.storyName, isSelected && styles.storyNameActive]}
                numberOfLines={1}
              >
                {vid.title.replace('IPHONE', 'iPhone').replace('ACLAPET', 'Clapet')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. The Modern Mobile Reel Card (9:16 Smartphone Format) */}
      <View style={styles.reelCard}>
        {/* Story progress lines on top (Instagram Reels style) */}
        <View style={styles.storyProgressRow}>
          {videos.map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      i < selectedIndex
                        ? '100%'
                        : i === selectedIndex
                        ? `${Math.min(progress * 100, 100)}%`
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Embedded Autoplaying Video */}
        <View style={styles.videoSurface}>
          <WebView
            ref={webViewRef}
            key={`reel-native-${activeVideo._id}-${selectedIndex}-${isMuted}`}
            source={{ html: playerHtml }}
            style={styles.webView}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            onMessage={(e) => {
              if (e.nativeEvent.data === 'ended') nextVideo();
            }}
          />
        </View>

        {/* Top Controls Overlay */}
        <View style={styles.topOverlayBar}>
          <View style={styles.reelBadgeGroup}>
            <View style={styles.fireTag}>
              <Flame size={11} color="#FFFFFF" />
              <Text style={styles.fireTagText}>{activeVideo.badge || 'DÉMO EXCLUSIVE'}</Text>
            </View>
          </View>

          <View style={styles.topActionsGroup}>
            {/* Sound toggle */}
            <TouchableOpacity
              style={styles.glassBtn}
              onPress={() => setIsMuted(!isMuted)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isMuted ? (
                <VolumeX size={15} color="#FFFFFF" strokeWidth={2.2} />
              ) : (
                <Volume2 size={15} color="#E87C2A" strokeWidth={2.2} />
              )}
            </TouchableOpacity>

            {/* Play / Pause toggle */}
            <TouchableOpacity
              style={styles.glassBtn}
              onPress={() => setIsPlaying(!isPlaying)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isPlaying ? (
                <Pause size={14} color="#FFFFFF" strokeWidth={2.2} />
              ) : (
                <Play size={14} color="#E87C2A" strokeWidth={2.2} fill="#E87C2A" />
              )}
            </TouchableOpacity>

            {/* Expand Fullscreen */}
            <TouchableOpacity
              style={styles.glassBtn}
              onPress={() => setFullScreenModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Maximize2 size={14} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Floating Vertical Side Actions (TikTok / Instagram Reel Style) */}
        <View style={styles.sideActionsColumn}>
          {/* Like button */}
          <TouchableOpacity
            style={styles.sideActionBtn}
            onPress={() => {
              setIsLiked(!isLiked);
              setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
            }}
          >
            <View style={[styles.sideIconCircle, isLiked && styles.sideIconCircleLiked]}>
              <Heart
                size={18}
                color={isLiked ? '#EF4444' : '#FFFFFF'}
                fill={isLiked ? '#EF4444' : 'transparent'}
                strokeWidth={2}
              />
            </View>
            <Text style={styles.sideActionText}>{likesCount}</Text>
          </TouchableOpacity>

          {/* Next Video button */}
          <TouchableOpacity style={styles.sideActionBtn} onPress={nextVideo}>
            <View style={styles.sideIconCircle}>
              <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={styles.sideActionText}>Suivant</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Glassmorphism Product Pill at the bottom */}
        <View style={styles.floatingProductCard}>
          <Image source={{ uri: displayImageUri }} style={styles.floatingProductThumb} />

          <View style={styles.floatingProductDetails}>
            <Text style={styles.floatingProductTitle} numberOfLines={1}>
              {activeVideo.productName || activeVideo.title}
            </Text>
            <Text style={styles.floatingProductPrice}>{formatPrice(displayPrice)}</Text>
          </View>

          <View style={styles.floatingActionBtns}>
            <TouchableOpacity
              style={[styles.floatingCartBtn, justAdded && styles.floatingCartBtnAdded]}
              onPress={handleQuickAdd}
              activeOpacity={0.8}
            >
              {justAdded ? (
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
              ) : (
                <ShoppingCart size={16} color="#1E293B" strokeWidth={2.2} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.floatingBuyBtn}
              onPress={handleBuyNow}
              activeOpacity={0.85}
            >
              <Zap size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.floatingBuyText}>Acheter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 4. Fullscreen Immersive Reels Modal (TikTok / Shorts Mode) */}
      <Modal
        visible={fullScreenModal}
        animationType="slide"
        onRequestClose={() => setFullScreenModal(false)}
      >
        <SafeAreaView style={styles.fullScreenContainer}>
          {/* Header */}
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              style={styles.fullScreenCloseBtn}
              onPress={() => setFullScreenModal(false)}
            >
              <X size={22} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.fullScreenHeaderTitle}>Onoot Live Démos</Text>
            <TouchableOpacity
              style={styles.fullScreenSoundBtn}
              onPress={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX size={18} color="#FFFFFF" /> : <Volume2 size={18} color="#E87C2A" />}
            </TouchableOpacity>
          </View>

          {/* Fullscreen Video Player */}
          <View style={styles.fullScreenVideoWrap}>
            <WebView
              source={{ html: playerHtml }}
              style={styles.webView}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
            />
          </View>

          {/* Fullscreen Bottom Tray */}
          <View style={styles.fullScreenBottomTray}>
            <View style={styles.fullScreenProductBanner}>
              <Image source={{ uri: displayImageUri }} style={styles.fullScreenThumb} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.fullScreenProdTitle} numberOfLines={1}>
                  {activeVideo.productName || activeVideo.title}
                </Text>
                <Text style={styles.fullScreenProdPrice}>{formatPrice(displayPrice)}</Text>
              </View>
              <TouchableOpacity
                style={styles.fullScreenOrderBtn}
                onPress={() => {
                  setFullScreenModal(false);
                  handleBuyNow();
                }}
              >
                <ShoppingBag size={16} color="#FFFFFF" />
                <Text style={styles.fullScreenOrderBtnText}>Commander</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  livePillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E87C2A',
  },

  /* STORIES BAR */
  storiesScroll: {
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: 14,
  },
  storyCapsule: {
    alignItems: 'center',
    width: 68,
  },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2.5,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  storyRingActive: {
    borderColor: '#E87C2A',
    borderWidth: 2.5,
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
  },
  storyLiveBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#E87C2A',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  storyName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  storyNameActive: {
    color: '#E87C2A',
    fontWeight: '800',
  },

  /* REEL CARD */
  reelCard: {
    marginHorizontal: 16,
    height: CARD_HEIGHT,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  storyProgressRow: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
    zIndex: 30,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E87C2A',
    borderRadius: 2,
  },
  videoSurface: {
    width: '100%',
    height: '100%',
    backgroundColor: '#05070E',
  },
  webView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#05070E',
  },

  /* TOP OVERLAY BAR */
  topOverlayBar: {
    position: 'absolute',
    top: 20,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 25,
  },
  reelBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  fireTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  topActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  glassBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  /* SIDE ACTIONS */
  sideActionsColumn: {
    position: 'absolute',
    right: 12,
    bottom: 95,
    alignItems: 'center',
    gap: 12,
    zIndex: 25,
  },
  sideActionBtn: {
    alignItems: 'center',
  },
  sideIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sideIconCircleLiked: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  sideActionText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },

  /* FLOATING BOTTOM PRODUCT CARD */
  floatingProductCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  floatingProductThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  floatingProductDetails: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  floatingProductTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  floatingProductPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E87C2A',
    marginTop: 2,
  },
  floatingActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  floatingCartBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  floatingCartBtnAdded: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  floatingBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E87C2A',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  floatingBuyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  /* FULLSCREEN MODAL */
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  fullScreenCloseBtn: {
    padding: 6,
  },
  fullScreenHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  fullScreenSoundBtn: {
    padding: 6,
  },
  fullScreenVideoWrap: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenBottomTray: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  fullScreenProductBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 14,
  },
  fullScreenThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  fullScreenProdTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  fullScreenProdPrice: {
    color: '#E87C2A',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  fullScreenOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E87C2A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  fullScreenOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

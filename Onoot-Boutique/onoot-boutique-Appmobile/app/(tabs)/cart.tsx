import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Trash2,
  Minus,
  Plus,
  ShoppingCart,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  X,
  CreditCard,
  Lock,
  Truck,
  User,
  MapPin,
  Navigation,
  MessageCircle,
  AlertCircle,
  Phone,
  Building,
  Banknote,
  Package,
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { useCart } from '../../src/contexts/CartContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { api, formatPrice, getImageUrl } from '../../src/services/api';
import { OnootLogo } from '../../components/OnootLogo';
import {
  DELIVERY_ZONES,
  DeliveryZone,
  POPULAR_INTERIOR_CITIES,
  detectLocationWithGps,
  buildInteriorWhatsAppUrl,
  WHATSAPP_SHOP_NUMBER,
} from '../../src/lib/deliveryZones';

const theme = Colors.light;

export default function CartScreen() {
  const router = useRouter();
  const { items, totalCount, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();

  // Delivery Rules: 1 = "abidjan" (Expédition dans Abidjan), 2 = "interior" (Expédition Hors d'Abidjan)
  const [deliveryMode, setDeliveryMode] = useState<'abidjan' | 'interior'>('abidjan');
  const [selectedZone, setSelectedZone] = useState<DeliveryZone>(DELIVERY_ZONES[0]);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [detectedAddress, setDetectedAddress] = useState<string>('');

  // Interior options
  const [interiorCity, setInteriorCity] = useState<string>('');
  const [interiorStation, setInteriorStation] = useState<string>('');

  // Alternate recipient (pour Abidjan)
  const [hasAlternateRecipient, setHasAlternateRecipient] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  // Modals
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wave' | 'om' | 'momo'>('cod');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculated fees
  const isInterior = deliveryMode === 'interior';
  const shippingFee = isInterior ? 0 : selectedZone.fee;
  const grandTotal = subtotal + shippingFee;

  // 1. STRICT AUTH CHECK: Must be logged in to access cart
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authRequiredContainer}>
          <OnootLogo size="lg" />
          <View style={styles.lockIconCircle}>
            <Lock size={32} color="#E87C2A" strokeWidth={2.2} />
          </View>
          <Text style={styles.authRequiredTitle}>Connexion requise</Text>
          <Text style={styles.authRequiredDesc}>
            Pour ajouter des articles à votre panier, les sauvegarder et passer une commande, vous devez être connecté à votre compte client.
          </Text>

          <TouchableOpacity
            style={styles.primaryAuthBtn}
            onPress={() => router.push('/login')}
          >
            <User size={18} color="#FFFFFF" />
            <Text style={styles.primaryAuthBtnText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAuthBtn}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.secondaryAuthBtnText}>Créer un nouveau compte</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. EMPTY CART CHECK
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingCart size={48} color="#E87C2A" strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptySubtitle}>
            Bonjour {user.name || 'cher client'} ! Découvrez nos écouteurs, montres connectées, chargeurs et profitez de la livraison express.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/catalog')}
          >
            <ShoppingBag size={18} color="#FFFFFF" />
            <Text style={styles.browseButtonText}>Explorer la boutique</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // GPS Auto-detect handler
  const handleAutoGeolocate = async () => {
    try {
      setIsLocating(true);
      const detected = await detectLocationWithGps();
      if (detected) {
        if (detected.zone.isInterior) {
          setDeliveryMode('interior');
          setInteriorCity(detected.addressDetails || 'Intérieur du pays');
          Alert.alert(
            'Position Hors Abidjan détectée',
            `Vous êtes localisé à : ${detected.addressDetails || 'Intérieur'}. Le mode Expédition en gare a été activé.`
          );
        } else {
          setDeliveryMode('abidjan');
          setSelectedZone(detected.zone);
          setDetectedAddress(detected.addressDetails);
          Alert.alert(
            'Position Abidjan détectée !',
            `Commune identifiée : ${detected.zone.label}\nRepère : ${detected.addressDetails || detected.zone.commune}`
          );
        }
      } else {
        Alert.alert(
          'Commune non détectée',
          'Veuillez sélectionner manuellement votre commune dans la liste.'
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Accès GPS indisponible',
        'Veuillez autoriser la localisation sur votre téléphone ou sélectionner votre commune ci-dessous.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleOpenWhatsAppInterior = () => {
    const url = buildInteriorWhatsAppUrl({
      items: items.map((i) => ({
        name: i.product?.name || 'Produit Onoot',
        quantity: i.quantity,
        price: i.product?.discountPrice ?? i.product?.price ?? i.price,
      })),
      itemsTotal: subtotal,
      destinationCity: interiorCity,
      preferredStation: interiorStation,
    });
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d’ouvrir WhatsApp.');
    });
  };

  const handleOpenCheckout = () => {
    if (!customerName) setCustomerName(user.name);
    if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    if (!customerEmail) setCustomerEmail(user.email);
    setShowCheckoutModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!customerName.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir votre nom et prénom.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      Alert.alert('Champ requis', 'Veuillez saisir un numéro de téléphone valide (au moins 8 chiffres).');
      return;
    }

    if (isInterior) {
      if (!interiorCity.trim()) {
        Alert.alert('Champ requis', 'Veuillez indiquer votre ville de destination en Côte d’Ivoire (ex: Bouaké, Yamoussoukro, San-Pédro...).');
        return;
      }
    } else {
      if (!deliveryAddress.trim()) {
        Alert.alert('Champ requis', 'Veuillez préciser votre adresse ou repère de livraison à Abidjan (ex: Angré 8ème tranche, Terminus 81...).');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const paymentLabel = isInterior
        ? 'Expédition en gare (À convenir avec la boutique)'
        : paymentMethod === 'cod'
        ? 'Paiement à la livraison (Espèces)'
        : paymentMethod === 'wave'
        ? 'Wave Mobile Money'
        : paymentMethod === 'om'
        ? 'Orange Money'
        : 'MTN Mobile Money';

      let finalCity = isInterior
        ? `Intérieur: ${interiorCity.trim()}${interiorStation.trim() ? ` (Gare: ${interiorStation.trim()})` : ''}`
        : selectedZone.label;

      let effectiveAddress = isInterior
        ? (interiorStation.trim() ? `Retrait gare : ${interiorStation.trim()}` : `Retrait en gare à ${interiorCity.trim()}`)
        : deliveryAddress.trim();

      let orderNotes = notes.trim();
      if (isInterior) {
        const interiorNote = `[Expédition Hors Abidjan en gare : ${interiorCity.trim()} - Gare/Car : ${interiorStation.trim() || 'À convenir'} - Frais de transport à régler à la gare/WhatsApp]`;
        orderNotes = orderNotes ? `${orderNotes}\n${interiorNote}` : interiorNote;
      } else if (hasAlternateRecipient && (recipientName.trim() || recipientPhone.trim())) {
        const altNote = `[Réceptionnaire désigné : ${recipientName.trim() || 'Non précisé'} - Tél : ${recipientPhone.trim() || 'Non précisé'}]`;
        orderNotes = orderNotes ? `${orderNotes}\n${altNote}` : altNote;
      }

      const orderPayload = {
        userId: user.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || user.email,
        deliveryAddress: effectiveAddress,
        city: finalCity,
        shippingFee: isInterior ? 0 : shippingFee,
        totalAmount: grandTotal,
        paymentMethod: paymentLabel,
        paymentStatus: 'En attente',
        status: 'En attente' as const,
        notes: orderNotes || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.product?.name || 'Produit Onoot',
          quantity: i.quantity,
          price: i.product?.discountPrice ?? i.product?.price ?? i.price,
          color: i.color || null,
          image: i.product?.images?.[0] || null,
        })),
      };

      const created = await api.createOrder(orderPayload);

      if (created) {
        await clearCart();
        setShowCheckoutModal(false);

        // Si intérieur du pays, ouvrir automatiquement WhatsApp pour convenir de l'envoi en gare
        if (isInterior) {
          const orderNum = (created.id || created.orderNumber || 'CMD').slice(-6).toUpperCase();
          const itemsList = items
            .map((it) => `• ${it.quantity}x ${it.product?.name || 'Produit'} (${formatPrice((it.product?.discountPrice ?? it.product?.price ?? it.price) * it.quantity)})`)
            .join('\n');
          const whatsappMsg = `Bonjour Onoot Boutique,\n\nJe viens de valider ma commande #${orderNum} sur votre application mobile pour expédition Hors d'Abidjan :\n\n${itemsList}\n\nSous-total articles : ${formatPrice(subtotal)}\nVille de destination : ${interiorCity.trim()}${interiorStation.trim() ? ` (Gare : ${interiorStation.trim()})` : ''}\n\nPourriez-vous me confirmer les modalités et frais d'expédition en car/gare pour l'envoi ? Merci !`;
          const waUrl = `https://wa.me/${WHATSAPP_SHOP_NUMBER}?text=${encodeURIComponent(whatsappMsg)}`;

          Linking.openURL(waUrl).catch(() => {});
        }

        // Redirect to order tracking screen (matching website)
        router.push({
          pathname: `/order/${created.id || created.orderNumber}` as any,
          params: { orderData: JSON.stringify(created) },
        });
      } else {
        Alert.alert('Erreur', 'Impossible de valider votre commande. Veuillez réessayer.');
      }
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Une erreur est survenue lors de la validation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Panier ({totalCount})</Text>
          <TouchableOpacity onPress={() => clearCart()}>
            <Text style={styles.clearCartText}>Vider le panier</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
          {/* Cart Items */}
          {items.map((item) => {
            const product = item.product;
            const unitPrice = product?.discountPrice ?? product?.price ?? item.price;
            const lineTotal = unitPrice * item.quantity;

            return (
              <View key={`${item.productId}_${item.color || 'def'}`} style={styles.cartCard}>
                <Image
                  source={{ uri: getImageUrl(product?.images?.[0]) }}
                  style={styles.cartItemImage}
                />
                <View style={styles.cartItemDetails}>
                  <View style={styles.cartItemHeader}>
                    <Text style={styles.cartItemTitle} numberOfLines={2}>
                      {product?.name || 'Produit Onoot'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.productId)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {item.color && (
                    <View style={styles.colorBadge}>
                      <Text style={styles.colorBadgeText}>Couleur : {item.color}</Text>
                    </View>
                  )}

                  <View style={styles.cartItemBottom}>
                    <Text style={styles.cartItemPrice}>{formatPrice(lineTotal)}</Text>

                    {/* Stepper */}
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus size={14} color="#1E293B" />
                      </TouchableOpacity>
                      <Text style={styles.stepQty}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus size={14} color="#1E293B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          {/* DUAL DELIVERY SYSTEM (Rules 1 & 2) */}
          <View style={styles.deliverySectionCard}>
            <Text style={styles.deliverySectionTitle}>Mode d'expédition</Text>
            <Text style={styles.deliverySectionSubtitle}>
              Choisissez votre zone de livraison selon les 2 règles de la boutique
            </Text>

            {/* Delivery Tabs */}
            <View style={styles.deliveryTabs}>
              <TouchableOpacity
                style={[
                  styles.deliveryTabBtn,
                  deliveryMode === 'abidjan' && styles.deliveryTabBtnActive,
                ]}
                onPress={() => setDeliveryMode('abidjan')}
              >
                <Truck
                  size={18}
                  color={deliveryMode === 'abidjan' ? '#E87C2A' : '#64748B'}
                />
                <View style={{ marginLeft: 6 }}>
                  <Text
                    style={[
                      styles.deliveryTabTitle,
                      deliveryMode === 'abidjan' && styles.deliveryTabTitleActive,
                    ]}
                  >
                    1. Dans Abidjan
                  </Text>
                  <Text style={styles.deliveryTabSub}>Livraison express à domicile</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deliveryTabBtn,
                  deliveryMode === 'interior' && styles.deliveryTabBtnActive,
                ]}
                onPress={() => setDeliveryMode('interior')}
              >
                <Building
                  size={18}
                  color={deliveryMode === 'interior' ? '#E87C2A' : '#64748B'}
                />
                <View style={{ marginLeft: 6 }}>
                  <Text
                    style={[
                      styles.deliveryTabTitle,
                      deliveryMode === 'interior' && styles.deliveryTabTitleActive,
                    ]}
                  >
                    2. Hors d'Abidjan
                  </Text>
                  <Text style={styles.deliveryTabSub}>En gare (Intérieur du pays)</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* RÈGLE 1: DANS ABIDJAN */}
            {deliveryMode === 'abidjan' ? (
              <View style={styles.abidjanBlock}>
                {/* GPS Geolocation Button */}
                <TouchableOpacity
                  style={styles.gpsButton}
                  onPress={handleAutoGeolocate}
                  disabled={isLocating}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#E87C2A" />
                  ) : (
                    <Navigation size={18} color="#E87C2A" />
                  )}
                  <Text style={styles.gpsButtonText}>
                    {isLocating ? 'Détection GPS en cours...' : 'Me géolocaliser automatiquement (GPS)'}
                  </Text>
                </TouchableOpacity>

                {detectedAddress ? (
                  <View style={styles.detectedBanner}>
                    <MapPin size={14} color="#15803D" />
                    <Text style={styles.detectedBannerText} numberOfLines={1}>
                      Position : {detectedAddress}
                    </Text>
                  </View>
                ) : null}

                {/* Commune Selector */}
                <Text style={styles.subLabel}>Commune ou zone sélectionnée :</Text>
                <TouchableOpacity
                  style={styles.zoneSelectorButton}
                  onPress={() => setShowZonePicker(true)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.zoneSelectedName}>{selectedZone.label}</Text>
                    <Text style={styles.zoneSelectedFee}>
                      Frais de livraison : {formatPrice(selectedZone.fee)}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ) : (
              /* RÈGLE 2: HORS D'ABIDJAN (INTÉRIEUR DU PAYS) */
              <View style={styles.interiorBlock}>
                <View style={styles.interiorInfoBox}>
                  <AlertCircle size={20} color="#E87C2A" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.interiorInfoTitle}>Expédition sécurisée en gare</Text>
                    <Text style={styles.interiorInfoDesc}>
                      Votre colis est déposé à la gare routière d'Abidjan de votre choix (UTB, CTE, STIF, etc.) à destination de votre ville. Les frais de transport en car sont convenus directement sur WhatsApp.
                    </Text>
                  </View>
                </View>

                {/* Villes populaires */}
                <Text style={styles.subLabel}>Villes populaires de l'intérieur :</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cityChipsContainer}
                >
                  {POPULAR_INTERIOR_CITIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.cityChip,
                        interiorCity.toLowerCase() === c.toLowerCase() && styles.cityChipActive,
                      ]}
                      onPress={() => setInteriorCity(c)}
                    >
                      <Text
                        style={[
                          styles.cityChipText,
                          interiorCity.toLowerCase() === c.toLowerCase() && styles.cityChipTextActive,
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Ville input */}
                <Text style={styles.subLabel}>Votre ville de destination :</Text>
                <TextInput
                  style={styles.textInput}
                  value={interiorCity}
                  onChangeText={setInteriorCity}
                  placeholder="Ex: Bouaké, Yamoussoukro, San-Pédro..."
                  placeholderTextColor="#94A3B8"
                />

                {/* Gare input */}
                <Text style={[styles.subLabel, { marginTop: 10 }]}>Compagnie ou gare préférée :</Text>
                <TextInput
                  style={styles.textInput}
                  value={interiorStation}
                  onChangeText={setInteriorStation}
                  placeholder="Ex: Gare UTB, CTE, STIF, ou à convenir"
                  placeholderTextColor="#94A3B8"
                />

                {/* WhatsApp button */}
                <TouchableOpacity
                  style={styles.whatsAppButton}
                  onPress={handleOpenWhatsAppInterior}
                >
                  <MessageCircle size={18} color="#FFFFFF" />
                  <Text style={styles.whatsAppButtonText}>
                    Discuter des frais de gare sur WhatsApp
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Récapitulatif de la commande</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total articles</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {isInterior ? "Expédition en gare (Hors Abidjan)" : `Livraison (${selectedZone.commune})`}
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  isInterior && { color: '#0284C7', fontWeight: '800' },
                ]}
              >
                {isInterior ? 'À convenir (0 FCFA sur l’app)' : formatPrice(shippingFee)}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total à régler</Text>
              <Text style={styles.totalValue}>{formatPrice(grandTotal)}</Text>
            </View>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* Bottom Checkout Bar */}
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomBarSub}>TOTAL ESTIMÉ</Text>
            <Text style={styles.bottomBarTotal}>{formatPrice(grandTotal)}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleOpenCheckout}
          >
            <Text style={styles.checkoutBtnText}>Passer la commande</Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Zone Picker Modal (Abidjan) */}
        <Modal
          visible={showZonePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowZonePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.zoneModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Communes d'Abidjan & Banlieue</Text>
                <TouchableOpacity onPress={() => setShowZonePicker(false)}>
                  <X size={22} color="#1E293B" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 420 }}>
                {DELIVERY_ZONES.filter((z) => !z.isInterior).map((zone) => (
                  <TouchableOpacity
                    key={zone.id}
                    style={[
                      styles.zoneItem,
                      selectedZone.id === zone.id && styles.zoneItemActive,
                    ]}
                    onPress={() => {
                      setSelectedZone(zone);
                      setShowZonePicker(false);
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.zoneItemName}>{zone.label}</Text>
                      <Text style={styles.zoneItemFee}>{formatPrice(zone.fee)}</Text>
                    </View>
                    {selectedZone.id === zone.id && (
                      <CheckCircle2 size={20} color="#E87C2A" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Checkout Modal */}
        <Modal
          visible={showCheckoutModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCheckoutModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.checkoutModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Finaliser ma commande</Text>
                <TouchableOpacity onPress={() => setShowCheckoutModal(false)}>
                  <X size={22} color="#1E293B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.formSectionTitle}>1. Coordonnées de contact</Text>

                <Text style={styles.inputLabel}>Nom & Prénom *</Text>
                <TextInput
                  style={styles.textInput}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Kouamé Jean"
                  placeholderTextColor="#94A3B8"
                />

                <Text style={styles.inputLabel}>Numéro de Téléphone *</Text>
                <TextInput
                  style={styles.textInput}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="0700000000"
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                />

                <Text style={styles.formSectionTitle}>
                  {isInterior ? "2. Destination & Gare Hors d'Abidjan" : "2. Adresse de livraison à Abidjan"}
                </Text>

                {isInterior ? (
                  <>
                    <Text style={styles.inputLabel}>Ville de destination *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={interiorCity}
                      onChangeText={setInteriorCity}
                      placeholder="Ex: Bouaké, Yamoussoukro, Korhogo..."
                      placeholderTextColor="#94A3B8"
                    />

                    <Text style={styles.inputLabel}>Compagnie de car / Gare de retrait (Optionnel)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={interiorStation}
                      onChangeText={setInteriorStation}
                      placeholder="Ex: Gare UTB, CTE..."
                      placeholderTextColor="#94A3B8"
                    />

                    <View style={styles.interiorNoticeBanner}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Package size={14} color="#0369A1" />
                        <Text style={styles.interiorNoticeText}>
                          Les frais d'expédition en car seront convenus et confirmés sur WhatsApp dès la validation.
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.inputLabel}>Quartier, rue ou repère précis *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={deliveryAddress}
                      onChangeText={setDeliveryAddress}
                      placeholder="Ex: Angré 8ème tranche, après la pharmacie"
                      placeholderTextColor="#94A3B8"
                    />

                    {/* Autre personne réceptionnaire */}
                    <TouchableOpacity
                      style={styles.altRecipientToggle}
                      onPress={() => setHasAlternateRecipient(!hasAlternateRecipient)}
                    >
                      <View
                        style={[
                          styles.checkboxSquare,
                          hasAlternateRecipient && styles.checkboxSquareActive,
                        ]}
                      >
                        {hasAlternateRecipient && <CheckCircle2 size={14} color="#FFFFFF" />}
                      </View>
                      <Text style={styles.altRecipientToggleText}>
                        Une autre personne réceptionnera le colis ?
                      </Text>
                    </TouchableOpacity>

                    {hasAlternateRecipient && (
                      <View style={styles.altRecipientFields}>
                        <Text style={styles.inputLabel}>Nom du réceptionnaire</Text>
                        <TextInput
                          style={styles.textInput}
                          value={recipientName}
                          onChangeText={setRecipientName}
                          placeholder="Ex: Mme Konan"
                          placeholderTextColor="#94A3B8"
                        />
                        <Text style={styles.inputLabel}>Téléphone du réceptionnaire</Text>
                        <TextInput
                          style={styles.textInput}
                          value={recipientPhone}
                          onChangeText={setRecipientPhone}
                          placeholder="Ex: 0500000000"
                          keyboardType="phone-pad"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                    )}
                  </>
                )}

                {/* Mode de paiement */}
                <Text style={styles.formSectionTitle}>3. Mode de paiement</Text>
                {isInterior ? (
                  <View style={styles.paymentOptionActive}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={16} color="#E87C2A" />
                      <Text style={styles.paymentTextActive}>
                        À convenir avec la boutique (WhatsApp / Envoi en gare)
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.paymentMethods}>
                    <View
                      style={[
                        styles.paymentOption,
                        styles.paymentOptionActive,
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Banknote size={18} color="#E87C2A" strokeWidth={2.2} />
                        <Text style={styles.paymentTextActive}>
                          Paiement à la livraison (Espèces)
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Notes */}
                <Text style={styles.inputLabel}>Instructions ou notes pour le livreur (Optionnel)</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ex: Appeler 15 minutes avant d'arriver..."
                  placeholderTextColor="#94A3B8"
                  multiline
                />

                {/* Recap in modal */}
                <View style={styles.modalRecap}>
                  <Text style={styles.modalRecapText}>
                    Montant total à régler :{' '}
                    <Text style={styles.modalRecapTotal}>{formatPrice(grandTotal)}</Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.submitOrderBtn, isSubmitting && { opacity: 0.7 }]}
                  disabled={isSubmitting}
                  onPress={handleConfirmOrder}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color="#FFFFFF" />
                      <Text style={styles.submitOrderText}>
                        {isInterior ? "Valider & Coordonner sur WhatsApp" : "Confirmer ma commande"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  clearCartText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  cartList: {
    flex: 1,
    padding: 16,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    resizeMode: 'cover',
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 8,
  },
  colorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  colorBadgeText: {
    fontSize: 11,
    color: '#64748B',
  },
  cartItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cartItemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E87C2A',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepQty: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    paddingHorizontal: 6,
  },

  /* DELIVERY DUAL SYSTEM STYLES */
  deliverySectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliverySectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  deliverySectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  deliveryTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 6,
    marginBottom: 14,
  },
  deliveryTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  deliveryTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryTabTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  deliveryTabTitleActive: {
    color: '#E87C2A',
  },
  deliveryTabSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },

  /* ABIDJAN BLOCK */
  abidjanBlock: {
    gap: 8,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 6,
  },
  gpsButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E87C2A',
  },
  detectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 4,
  },
  detectedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    flex: 1,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
    marginBottom: 4,
  },
  zoneSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  zoneSelectedName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  zoneSelectedFee: {
    fontSize: 12,
    color: '#E87C2A',
    fontWeight: '700',
    marginTop: 2,
  },

  /* INTERIOR BLOCK */
  interiorBlock: {
    gap: 6,
  },
  interiorInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  interiorInfoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
    marginBottom: 3,
  },
  interiorInfoDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: '#7C2D12',
  },
  cityChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  cityChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cityChipActive: {
    backgroundColor: '#E87C2A',
    borderColor: '#E87C2A',
  },
  cityChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  cityChipTextActive: {
    color: '#FFFFFF',
  },
  whatsAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  whatsAppButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* SUMMARY */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 8,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#E87C2A',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bottomBarSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  bottomBarTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E87C2A',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E87C2A',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* AUTH REQUIRED */
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  lockIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  authRequiredTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  authRequiredDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E87C2A',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  primaryAuthBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryAuthBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryAuthBtnText: {
    color: '#E87C2A',
    fontSize: 14,
    fontWeight: '700',
  },

  /* EMPTY */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E87C2A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  zoneModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  checkoutModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  zoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  zoneItemActive: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  zoneItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  zoneItemFee: {
    fontSize: 12,
    color: '#E87C2A',
    fontWeight: '700',
    marginTop: 2,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  altRecipientToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxSquareActive: {
    backgroundColor: '#E87C2A',
    borderColor: '#E87C2A',
  },
  altRecipientToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  altRecipientFields: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  interiorNoticeBanner: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  interiorNoticeText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
    lineHeight: 16,
  },
  paymentMethods: {
    gap: 8,
    marginTop: 4,
  },
  paymentOption: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },
  paymentOptionActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#E87C2A',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  paymentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  paymentTextActive: {
    color: '#E87C2A',
    fontWeight: '800',
  },
  modalRecap: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
    marginVertical: 14,
    alignItems: 'center',
  },
  modalRecapText: {
    fontSize: 14,
    color: '#334155',
  },
  modalRecapTotal: {
    fontWeight: '900',
    color: '#E87C2A',
  },
  submitOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E87C2A',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  submitOrderText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});

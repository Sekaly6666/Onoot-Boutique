import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  MessageCircle,
  Phone,
  MapPin,
  Calendar,
  Receipt,
  UserCheck,
  AlertCircle,
  ShoppingBag,
  RotateCw,
  Banknote,
  Package,
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { api, formatPrice, getImageUrl } from '../../src/services/api';
import { Order } from '../../src/types';
import { OnootLogo } from '../../components/OnootLogo';
import { WHATSAPP_SHOP_NUMBER } from '../../src/lib/deliveryZones';

const theme = Colors.light;

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id, orderData } = useLocalSearchParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const orderId = (id as string) || '';

  // Initial load from params if available
  useEffect(() => {
    if (orderData) {
      try {
        const parsed = JSON.parse(orderData as string);
        setOrder(parsed);
        setIsLoading(false);
      } catch (e) {
        // fallback to api
      }
    }
  }, [orderData]);

  // Fetch / refresh order from API
  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const data = await api.getOrder(orderId);
      if (data) {
        setOrder(data);
      }
    } catch (err) {
      console.warn('Error fetching order', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Live polling every 5 seconds to track admin actions in real-time
    const interval = setInterval(() => {
      fetchOrder();
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  // Status mapping
  const normalizedStatus = useMemo(() => {
    if (!order) return 'pending';
    const st = ((order as any).orderStatus || order.status || 'pending').toLowerCase();
    if (st.includes('livr') || st === 'delivered') return 'delivered';
    if (st.includes('cours') || st.includes('expédi') || st === 'shipped') return 'shipped';
    if (st.includes('confirm') || st === 'confirmed') return 'confirmed';
    if (st.includes('annul') || st === 'cancelled') return 'cancelled';
    return 'pending';
  }, [order]);

  const statuses = ['pending', 'confirmed', 'shipped', 'delivered'];
  const currentIndex = statuses.indexOf(normalizedStatus);

  const handleOpenWhatsApp = () => {
    if (!order) return;
    const orderNum = order.orderNumber || (order.id ? order.id.slice(-6).toUpperCase() : 'CMD');
    const msg = `Bonjour Onoot Boutique,\n\nJe vous contacte concernant ma commande #${orderNum} passée sur votre application mobile.\nStatut actuel : ${getStatusLabel(normalizedStatus)}.\n\nPourriez-vous me donner des nouvelles de ma livraison ? Merci !`;
    Linking.openURL(`https://wa.me/${WHATSAPP_SHOP_NUMBER}?text=${encodeURIComponent(msg)}`).catch(() => {});
  };

  function getStatusLabel(st: string) {
    switch (st) {
      case 'confirmed':
        return 'Confirmée par la boutique';
      case 'shipped':
        return 'En cours de livraison';
      case 'delivered':
        return 'Colis livré avec succès';
      case 'cancelled':
        return 'Commande annulée';
      default:
        return 'En attente de validation';
    }
  }

  function getStatusBadgeStyle(st: string) {
    switch (st) {
      case 'confirmed':
        return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'shipped':
        return { bg: '#FFEDD5', text: '#C2410C' };
      case 'delivered':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C' };
      default:
        return { bg: '#FEF3C7', text: '#B45309' };
    }
  }

  if (isLoading && !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E87C2A" />
          <Text style={styles.loadingText}>Chargement du suivi de commande...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color="#94A3B8" />
          <Text style={styles.notFoundTitle}>Commande introuvable</Text>
          <Text style={styles.notFoundSubtitle}>
            Impossible de charger les informations de cette commande.
          </Text>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => router.replace('/(tabs)/orders' as any)}
          >
            <Text style={styles.backHomeBtnText}>Retour à mes commandes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const orderNumber = order.orderNumber || (order.id ? order.id.slice(-6).toUpperCase() : 'CMD');
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Date récente';

  const badgeStyle = getStatusBadgeStyle(normalizedStatus);
  const shippingInfo = (order as any).shippingAddress || {};
  const customerName = shippingInfo.fullName || order.customerName || 'Client';
  const customerPhone = shippingInfo.phone || order.customerPhone || '';
  const deliveryAddress = shippingInfo.address || order.deliveryAddress || 'Non précisée';
  const city = shippingInfo.city || order.city || 'Abidjan';
  const estimatedDelivery = (order as any).estimatedDeliveryDate;
  const isInterior = city.toLowerCase().includes('intérieur') || city.toLowerCase().includes('interieur') || city.toLowerCase().includes('gare');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/orders' as any)}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suivi de commande</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <RotateCw size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E87C2A']} />
        }
      >
        {/* Order Identification Card */}
        <View style={styles.orderIdCard}>
          <View style={styles.orderIdTop}>
            <View>
              <Text style={styles.orderNumberLabel}>COMMANDE</Text>
              <Text style={styles.orderNumberValue}>#{orderNumber}</Text>
              <Text style={styles.orderDateText}>{dateStr}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
              <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                {getStatusLabel(normalizedStatus)}
              </Text>
            </View>
          </View>

          {/* Real-time Stepper / Progress Timeline */}
          {normalizedStatus === 'cancelled' ? (
            <View style={styles.cancelledBox}>
              <XCircle size={22} color="#EF4444" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cancelledTitle}>Commande Annulée</Text>
                <Text style={styles.cancelledDesc}>
                  {(order as any).cancelReason || 'Cette commande a été annulée. Contactez notre support pour plus de détails.'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.stepperContainer}>
              {/* Progress Line */}
              <View style={styles.stepperLineBg}>
                <View
                  style={[
                    styles.stepperLineFill,
                    {
                      width: `${Math.max(0, Math.min(100, (currentIndex / (statuses.length - 1)) * 100))}%`,
                    },
                  ]}
                />
              </View>

              {/* 4 Steps */}
              <View style={styles.stepsRow}>
                {statuses.map((key, idx) => {
                  const isDone = idx <= currentIndex;
                  const isCurrent = idx === currentIndex;
                  let IconComponent = Clock;
                  let stepLabel = 'En attente';

                  if (idx === 1) {
                    IconComponent = CheckCircle2;
                    stepLabel = 'Confirmée';
                  } else if (idx === 2) {
                    IconComponent = Truck;
                    stepLabel = 'En livraison';
                  } else if (idx === 3) {
                    IconComponent = PackageCheck;
                    stepLabel = 'Livrée';
                  }

                  return (
                    <View key={key} style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepCircle,
                          isDone && styles.stepCircleDone,
                          isCurrent && styles.stepCircleCurrent,
                        ]}
                      >
                        <IconComponent
                          size={16}
                          color={isDone ? '#FFFFFF' : '#94A3B8'}
                          strokeWidth={2.5}
                        />
                      </View>
                      <Text
                        style={[
                          styles.stepText,
                          isDone && styles.stepTextDone,
                          isCurrent && styles.stepTextCurrent,
                        ]}
                      >
                        {stepLabel}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Admin Live Action Banner (Estimated delivery or instructions) */}
          {estimatedDelivery ? (
            <View style={styles.adminActionBanner}>
              <Calendar size={18} color="#2563EB" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.adminActionTitle}>Livraison planifiée par la boutique</Text>
                <Text style={styles.adminActionDesc}>
                  Date estimée : <Text style={{ fontWeight: '800' }}>{estimatedDelivery}</Text>
                </Text>
              </View>
            </View>
          ) : null}

          {isInterior ? (
            <View style={styles.interiorTrackingBanner}>
              <Package size={18} color="#C2410C" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.interiorTrackingTitle}>Expédition Hors d'Abidjan en gare</Text>
                <Text style={styles.interiorTrackingDesc}>
                  Votre colis sera déposé en car/gare. Le récépissé de transport vous sera transmis directement sur WhatsApp.
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Delivery Details Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Informations de livraison</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Destinataire :</Text>
            <Text style={styles.infoValue}>{customerName}</Text>
          </View>

          {customerPhone ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Téléphone :</Text>
              <Text style={styles.infoValue}>{customerPhone}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Adresse / Repère :</Text>
            <Text style={styles.infoValue}>{deliveryAddress}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ville / Commune :</Text>
            <Text style={styles.infoValue}>{city}</Text>
          </View>

          {/* Alternate recipient if specified */}
          {shippingInfo.recipientName ? (
            <View style={styles.altRecipientBox}>
              <UserCheck size={16} color="#E87C2A" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.altRecipientTitle}>Réceptionnaire désigné :</Text>
                <Text style={styles.altRecipientText}>
                  {shippingInfo.recipientName}
                  {shippingInfo.recipientPhone ? ` · Tél: ${shippingInfo.recipientPhone}` : ''}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Payment Method Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mode de règlement</Text>
          <View style={styles.paymentMethodRow}>
            <Banknote size={20} color="#E87C2A" strokeWidth={2.2} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.paymentMethodTitle}>
                {order.paymentMethod || 'Paiement à la livraison (Espèces)'}
              </Text>
              <Text style={styles.paymentMethodDesc}>
                {isInterior
                  ? 'Frais de transport en car à régler à la gare ou avec la boutique.'
                  : 'Règlement en espèces directement au livreur à la réception de votre colis.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Ordered Items List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Articles commandés ({order.items?.length || 1})
          </Text>

          {order.items?.map((item: any, idx: number) => {
            const itemPrice = item.price || 0;
            const itemQty = item.quantity || 1;
            const lineTotal = itemPrice * itemQty;
            const itemImg = item.productImage || item.image;

            return (
              <View key={idx} style={styles.itemRow}>
                <Image
                  source={{ uri: getImageUrl(itemImg) }}
                  style={styles.itemThumbnail}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.productName || item.name || 'Produit Onoot'}
                  </Text>
                  {item.color ? (
                    <Text style={styles.itemColor}>Couleur : {item.color}</Text>
                  ) : null}
                  <Text style={styles.itemQtyPrice}>
                    {itemQty} x {formatPrice(itemPrice)}
                  </Text>
                </View>
                <Text style={styles.itemLineTotal}>{formatPrice(lineTotal)}</Text>
              </View>
            );
          })}

          <View style={styles.divider} />

          {/* Pricing Totals */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total articles</Text>
            <Text style={styles.summaryValue}>
              {formatPrice((order as any).itemsTotal || (order.totalAmount - (order.shippingFee || 0)))}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frais de livraison</Text>
            <Text style={styles.summaryValue}>
              {order.shippingFee && order.shippingFee > 0
                ? formatPrice(order.shippingFee)
                : isInterior
                ? 'À convenir (Gare)'
                : 'Inclus'}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total à régler</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Actions Row */}
        <View style={styles.actionsContainer}>
          {/* WhatsApp Coordination Button */}
          <TouchableOpacity style={styles.whatsAppButton} onPress={handleOpenWhatsApp}>
            <MessageCircle size={18} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.whatsAppButtonText}>
              Contacter la boutique sur WhatsApp
            </Text>
          </TouchableOpacity>

          {/* Digital Receipt (Ticket sans QR code) */}
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={() =>
              router.push({
                pathname: `/ticket/${order.id || order.orderNumber}` as any,
                params: { orderData: JSON.stringify(order) },
              })
            }
          >
            <Receipt size={18} color="#1E293B" strokeWidth={2.2} />
            <Text style={styles.receiptButtonText}>Voir le reçu de caisse officiel</Text>
          </TouchableOpacity>

          {/* Return to shop */}
          <TouchableOpacity
            style={styles.continueShopButton}
            onPress={() => router.replace('/(tabs)/catalog' as any)}
          >
            <ShoppingBag size={16} color="#E87C2A" strokeWidth={2.2} />
            <Text style={styles.continueShopButtonText}>Continuer mes achats</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  refreshButton: {
    padding: 6,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  notFoundSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  backHomeBtn: {
    backgroundColor: '#E87C2A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* ORDER ID CARD */
  orderIdCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderIdTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumberLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  orderNumberValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  orderDateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  /* STEPPER */
  stepperContainer: {
    marginTop: 4,
    marginBottom: 14,
    position: 'relative',
  },
  stepperLineBg: {
    position: 'absolute',
    top: 18,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    zIndex: 1,
  },
  stepperLineFill: {
    height: '100%',
    backgroundColor: '#E87C2A',
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  stepItem: {
    alignItems: 'center',
    width: 68,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  stepCircleDone: {
    backgroundColor: '#E87C2A',
  },
  stepCircleCurrent: {
    borderColor: '#FFEDD5',
    transform: [{ scale: 1.05 }],
  },
  stepText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  stepTextDone: {
    color: '#1E293B',
    fontWeight: '700',
  },
  stepTextCurrent: {
    color: '#E87C2A',
    fontWeight: '800',
  },

  /* ADMIN LIVE BANNER */
  adminActionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  adminActionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E40AF',
  },
  adminActionDesc: {
    fontSize: 11,
    color: '#1E3A8A',
    marginTop: 1,
  },
  interiorTrackingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  interiorTrackingTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C2410C',
  },
  interiorTrackingDesc: {
    fontSize: 11,
    color: '#7C2D12',
    marginTop: 1,
    lineHeight: 16,
  },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
  },
  cancelledTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B91C1C',
  },
  cancelledDesc: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 2,
  },

  /* SECTION CARD */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  altRecipientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  altRecipientTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C2410C',
  },
  altRecipientText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 1,
  },

  /* PAYMENT */
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentMethodTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  paymentMethodDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },

  /* ITEMS */
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 10,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  itemColor: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  itemQtyPrice: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemLineTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 6,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E87C2A',
  },

  /* ACTIONS */
  actionsContainer: {
    gap: 10,
    marginTop: 4,
  },
  whatsAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  whatsAppButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  receiptButtonText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
  },
  continueShopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  continueShopButtonText: {
    color: '#E87C2A',
    fontSize: 13,
    fontWeight: '700',
  },
});

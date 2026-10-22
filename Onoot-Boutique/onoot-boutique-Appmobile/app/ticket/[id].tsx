import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CheckCircle2,
  Share2,
  MessageCircle,
  ArrowLeft,
  AlertCircle,
  Truck,
  Calendar,
  User,
  MapPin,
  Phone,
  ShoppingBag,
  UserCheck,
  Receipt,
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { api, formatPrice } from '../../src/services/api';
import { Order } from '../../src/types';
import { OnootLogo } from '../../components/OnootLogo';

export default function OrderTicketScreen() {
  const router = useRouter();
  const { id, orderData } = useLocalSearchParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderData) {
      try {
        const parsed = JSON.parse(orderData as string);
        setOrder(parsed);
        setIsLoading(false);
        return;
      } catch (e) {
        // fallback to fetch
      }
    }

    if (id) {
      api.getOrder(id as string).then((data) => {
        setOrder(data);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
  }, [id, orderData]);

  const handleShare = async () => {
    if (!order) return;
    try {
      await Share.share({
        message: `Billet Onoot Boutique - Commande N° ${order.orderNumber || order.id}\nClient : ${order.customerName}\nTotal : ${formatPrice(order.totalAmount)}\nLivraison : ${order.city} (${order.deliveryAddress})`,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleWhatsAppSupport = () => {
    if (!order) return;
    const msg = encodeURIComponent(
      `Bonjour Onoot Boutique, je vous contacte concernant mon reçu de commande N° ${order.orderNumber || order.id}.`
    );
    Linking.openURL(`https://wa.me/2250503648312?text=${msg}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E87C2A" />
        <Text style={styles.loadingText}>Génération de votre reçu...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={48} color="#94A3B8" />
        <Text style={styles.notFoundTitle}>Reçu introuvable</Text>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)/' as any)}>
          <Text style={styles.homeBtnText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dateFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Aujourd\'hui';

  const orderNumDisplay = (order.orderNumber || order.id || '').toUpperCase();
  const shortNum = orderNumDisplay.length > 8 ? orderNumDisplay.slice(-8) : orderNumDisplay;

  // Extract recipient designated info if present in notes or fields
  const recipientName = (order as any).recipientName || order.notes?.match(/\[Réceptionnaire désigné\s*:\s*([^\]\-]+)(?:-\s*Tél\s*:\s*([^\]]+))?\]/i)?.[1]?.trim();
  const recipientPhone = (order as any).recipientPhone || order.notes?.match(/\[Réceptionnaire désigné\s*:\s*([^\]\-]+)(?:-\s*Tél\s*:\s*([^\]]+))?\]/i)?.[2]?.trim();

  const isInterior =
    (order.city || '').toLowerCase().includes('intérieur') ||
    (order.city || '').toLowerCase().includes('interieur') ||
    (order.deliveryAddress || '').toLowerCase().includes('gare');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Navigation back bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push(`/order/${order.id || order.orderNumber}` as any)}
          >
            <ArrowLeft size={18} color="#94A3B8" />
            <Text style={styles.backBtnText}>Suivi de commande</Text>
          </TouchableOpacity>
        </View>

        {/* Le Ticket Card - Sans QR Code, calqué sur le site Web */}
        <View style={styles.ticketCard}>
          {/* Bande des 3 couleurs officielles Onoot (Bleu, Jaune, Orange) */}
          <View style={styles.brandStripeRow}>
            <View style={[styles.brandStripe, { backgroundColor: '#4BB5E8' }]} />
            <View style={[styles.brandStripe, { backgroundColor: '#F5C430' }]} />
            <View style={[styles.brandStripe, { backgroundColor: '#E87C2A' }]} />
          </View>

          {/* Logo Onoot en tête de ticket */}
          <View style={styles.logoTopContainer}>
            <OnootLogo size="md" />
          </View>

          {/* En-tête Reçu */}
          <View style={styles.ticketHeader}>
            <View style={styles.receiptTypeRow}>
              <Receipt size={14} color="#64748B" />
              <Text style={styles.receiptTypeBadge}>REÇU OFFICIEL DE COMMANDE</Text>
            </View>

            <Text style={styles.orderNumberTitle}>#{shortNum}</Text>

            <View style={styles.dateRow}>
              <Calendar size={13} color="#94A3B8" />
              <Text style={styles.dateText}>{dateFormatted}</Text>
            </View>

            <View style={styles.badgeSuccess}>
              <CheckCircle2 size={14} color="#15803D" strokeWidth={2.5} />
              <Text style={styles.badgeSuccessText}>COMMANDE ENREGISTRÉE</Text>
            </View>
          </View>

          {/* Séparateur dentelé */}
          <View style={styles.perforatedLineContainer}>
            <View style={styles.halfCircleLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.halfCircleRight} />
          </View>

          {/* Destinataire */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <User size={14} color="#E87C2A" />
              <Text style={styles.sectionTitle}>DESTINATAIRE</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.clientName}>{order.customerName}</Text>
              
              <View style={styles.infoDetailRow}>
                <MapPin size={13} color="#64748B" style={{ marginTop: 2 }} />
                <Text style={styles.infoDetailText}>
                  {order.deliveryAddress}{order.city ? `, ${order.city}` : ''}
                </Text>
              </View>

              <View style={styles.infoDetailRow}>
                <Phone size={13} color="#64748B" />
                <Text style={styles.infoDetailText}>{order.customerPhone}</Text>
              </View>

              {/* Réceptionnaire désigné si spécifié */}
              {(recipientName || recipientPhone) && (
                <View style={styles.recipientSubBox}>
                  <View style={styles.recipientHeaderRow}>
                    <UserCheck size={13} color="#E87C2A" />
                    <Text style={styles.recipientLabel}>Personne qui réceptionne :</Text>
                  </View>
                  <Text style={styles.recipientVal}>{recipientName || 'Non spécifié'}</Text>
                  {recipientPhone ? (
                    <Text style={styles.recipientPhoneVal}>Tél : {recipientPhone}</Text>
                  ) : null}
                </View>
              )}
            </View>
          </View>

          {/* Achats / Articles */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <ShoppingBag size={14} color="#E87C2A" />
              <Text style={styles.sectionTitle}>ARTICLES COMMANDÉS</Text>
            </View>
            <View style={styles.itemsWrapper}>
              {order.items?.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name} {item.color ? `(${item.color})` : ''}
                    </Text>
                    <Text style={styles.itemSub}>
                      Qté: {item.quantity} × {formatPrice(item.price)}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Détails financiers */}
          <View style={styles.financeBlock}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Sous-total articles :</Text>
              <Text style={styles.calcValue}>
                {formatPrice(
                  (order as any).itemsTotal ??
                  (order.totalAmount - (order.shippingFee || 0))
                )}
              </Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Frais de livraison :</Text>
              {order.shippingFee && order.shippingFee > 0 ? (
                <Text style={[styles.calcValue, { color: '#E87C2A' }]}>
                  +{formatPrice(order.shippingFee)}
                </Text>
              ) : isInterior ? (
                <Text style={[styles.calcValue, { color: '#D97706', fontSize: 11 }]}>
                  À convenir sur WhatsApp
                </Text>
              ) : (
                <Text style={styles.calcValue}>+0 FCFA</Text>
              )}
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Mode de règlement :</Text>
              <Text style={styles.calcValue}>
                {order.paymentMethod || 'Espèces à la livraison'}
              </Text>
            </View>
          </View>

          {/* Total à payer (Boîte stylisée sombre comme sur le web) */}
          <View style={styles.darkTotalBox}>
            <View>
              <Text style={styles.darkTotalLabel}>TOTAL À PAYER</Text>
              <Text style={styles.darkTotalSub}>
                {isInterior ? 'Règlement convenu avec la boutique' : 'Au livreur en espèces'}
              </Text>
            </View>
            <Text style={styles.darkTotalAmount}>
              {formatPrice(order.totalAmount)}
            </Text>
          </View>

          {/* Footer du ticket */}
          <View style={styles.ticketFooter}>
            <Text style={styles.ticketFooterText}>Merci de votre confiance • Onoot Boutique</Text>
          </View>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.trackingBtn}
            onPress={() => router.push(`/order/${order.id || order.orderNumber}` as any)}
          >
            <Truck size={18} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.trackingBtnText}>Suivre l'acheminement en direct</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Share2 size={16} color="#1E293B" strokeWidth={2.2} />
            <Text style={styles.shareBtnText}>Partager mon reçu</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsAppSupport}>
            <MessageCircle size={16} color="#15803D" strokeWidth={2.2} />
            <Text style={styles.whatsappBtnText}>Service Client Onoot (WhatsApp)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.replace('/(tabs)/' as any)}
          >
            <Text style={styles.doneBtnText}>← Retour à l'accueil</Text>
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
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  brandStripeRow: {
    flexDirection: 'row',
    height: 6,
    marginHorizontal: -18,
    marginTop: -18,
    marginBottom: 12,
  },
  brandStripe: {
    flex: 1,
    height: '100%',
  },
  logoTopContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    marginHorizontal: -18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  ticketHeader: {
    alignItems: 'center',
  },
  receiptTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  receiptTypeBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  orderNumberTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
    marginVertical: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
    marginTop: 4,
  },
  badgeSuccessText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
  },
  perforatedLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    marginHorizontal: -18,
  },
  halfCircleLeft: {
    width: 18,
    height: 30,
    backgroundColor: '#0F172A',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  halfCircleRight: {
    width: 18,
    height: 30,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  clientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  infoDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  infoDetailText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
    lineHeight: 17,
  },
  recipientSubBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  recipientHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  recipientLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E87C2A',
  },
  recipientVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  recipientPhoneVal: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemsWrapper: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#FAFAFA',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  financeBlock: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  calcValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  darkTotalBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  darkTotalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.5,
  },
  darkTotalSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  darkTotalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F5C430',
  },
  ticketFooter: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ticketFooterText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 18,
    gap: 10,
  },
  trackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E87C2A',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#E87C2A',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  trackingBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  whatsappBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  doneBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 14,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
  },
  homeBtn: {
    backgroundColor: '#E87C2A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

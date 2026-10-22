import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { RotateCw, Receipt, Truck } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { api, formatPrice } from '../../src/services/api';
import { Order } from '../../src/types';
import { useAuth } from '../../src/contexts/AuthContext';

const theme = Colors.light;

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const list = await api.getUserOrders({
        userId: user?.id,
        email: user?.email,
        phone: user?.phone,
      });
      setOrders(list);
    } catch (e) {
      console.log('Error loading orders', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Livrée':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'En cours de livraison':
        return { bg: '#FFEDD5', text: '#C2410C' };
      case 'Confirmée':
        return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'Annulée':
        return { bg: '#FEE2E2', text: '#B91C1C' };
      default:
        return { bg: '#FEF3C7', text: '#B45309' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Commandes</Text>
          <TouchableOpacity onPress={onRefresh}>
            <RotateCw size={20} color="#475569" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Chargement de vos commandes...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Receipt size={44} color={theme.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>Aucune commande pour le moment</Text>
            <Text style={styles.emptyDesc}>
              Vos commandes passées et leur suivi en direct apparaîtront ici.
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push('/(tabs)/catalog')}
            >
              <Text style={styles.shopButtonText}>Faire des achats</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.ordersList}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
          >
            {orders.map((order) => {
              const statusStyle = getStatusColor(order.status);
              const dateStr = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Aujourd\'hui';

              return (
                <TouchableOpacity
                  key={order.id || order.orderNumber}
                  style={styles.orderCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: `/order/${order.id || order.orderNumber}` as any,
                      params: { orderData: JSON.stringify(order) },
                    })
                  }
                >
                  {/* Top line */}
                  <View style={styles.orderTop}>
                    <View>
                      <Text style={styles.orderNumber}>N° {order.orderNumber || order.id}</Text>
                      <Text style={styles.orderDate}>{dateStr}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {order.status || 'En attente'}
                      </Text>
                    </View>
                  </View>

                  {/* Items brief */}
                  <View style={styles.orderItems}>
                    {order.items?.map((item, idx) => (
                      <Text key={idx} style={styles.itemLine} numberOfLines={1}>
                        • {item.quantity}x {item.name} {item.color ? `(${item.color})` : ''}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.orderDivider} />

                  {/* Bottom line: Total & Ticket Button */}
                  <View style={styles.orderBottom}>
                    <View>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.ticketButton}
                      onPress={() =>
                        router.push({
                          pathname: `/order/${order.id || order.orderNumber}` as any,
                          params: { orderData: JSON.stringify(order) },
                        })
                      }
                    >
                      <Truck size={16} color="#FFFFFF" strokeWidth={2.2} />
                      <Text style={styles.ticketButtonText}>Suivre la commande</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 30 }} />
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
  ordersList: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderItems: {
    marginVertical: 10,
    gap: 3,
  },
  itemLine: {
    fontSize: 13,
    color: '#475569',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.primary,
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  ticketButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

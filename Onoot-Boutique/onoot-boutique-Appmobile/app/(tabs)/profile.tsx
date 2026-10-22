import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User as UserIcon,
  Mail,
  Phone,
  LogOut,
  LogIn,
  UserPlus,
  Server,
  Headphones,
  MessageCircle,
  PhoneCall,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Package,
  MapPin,
  Building,
  Globe,
  Calendar,
  Save,
  Clock,
  ExternalLink,
  ChevronDown,
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { getApiBaseUrl, setApiBaseUrl, apiClient, api, formatPrice } from '../../src/services/api';
import { OnootLogo } from '../../components/OnootLogo';
import { Order } from '../../src/types';

const theme = Colors.light;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();

  // Active Tab: 'info' | 'orders' | 'support'
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'support'>('info');

  // Form Fields for User Profile
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || 'Abidjan');
  const [country, setCountry] = useState(user?.country || "Côte d'Ivoire");
  const [isSaving, setIsSaving] = useState(false);

  // User Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Server URL settings (Advanced / Developer mode)
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | null>(null);

  useEffect(() => {
    getApiBaseUrl().then(setServerUrl);
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || 'Abidjan');
      setCountry(user.country || "Côte d'Ivoire");

      // Load user orders
      setIsLoadingOrders(true);
      api.getUserOrders({ userId: user.id, email: user.email, phone: user.phone })
        .then((data) => setOrders(data))
        .catch(() => {})
        .finally(() => setIsLoadingOrders(false));
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre nom.');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await api.updateUser(user.id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
      });

      if (updated) {
        await refreshUser();
        Alert.alert('Succès', 'Vos informations ont été mises à jour avec succès !');
      } else {
        Alert.alert('Succès', 'Informations enregistrées localement.');
      }
    } catch (err: any) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveServerUrl = async () => {
    if (!serverUrl.trim()) return;
    try {
      await setApiBaseUrl(serverUrl.trim());
      Alert.alert('Succès', 'Adresse du serveur API mise à jour !');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'adresse.');
    }
  };

  const handleTestConnection = async () => {
    setIsTestingServer(true);
    setServerStatus(null);
    try {
      await setApiBaseUrl(serverUrl.trim());
      const res = await apiClient.get('/api/health', { timeout: 4000 });
      if (res.status === 200) {
        setServerStatus('Connecté au serveur Onoot avec succès (200 OK)');
      } else {
        setServerStatus(`Réponse : code ${res.status}`);
      }
    } catch (e: any) {
      setServerStatus(`Échec : ${e.message || 'Serveur injoignable'}`);
    } finally {
      setIsTestingServer(false);
    }
  };

  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/2250503648312?text=Bonjour%20Onoot%20Boutique');
  };

  const callSupport = () => {
    Linking.openURL('tel:+2250503648312');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Official Logo */}
        <View style={styles.header}>
          <OnootLogo size="md" />
        </View>

        {/* User Card if Authenticated */}
        {user ? (
          <>
            {/* 1. Profile Banner (Inspired by Web Profile) */}
            <View style={styles.profileBanner}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>

              <View style={styles.bannerInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.bannerName}>{user.name}</Text>
                  <View style={styles.verifiedBadge}>
                    <ShieldCheck size={13} color="#15803D" strokeWidth={2.5} />
                    <Text style={styles.verifiedBadgeText}>Client Vérifié</Text>
                  </View>
                </View>

                <View style={styles.contactLine}>
                  <Mail size={13} color="#64748B" />
                  <Text style={styles.contactText}>{user.email}</Text>
                </View>

                {user.phone ? (
                  <View style={styles.contactLine}>
                    <Phone size={13} color="#64748B" />
                    <Text style={styles.contactText}>{user.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* 2. Account Stats Cards Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Package size={20} color="#E87C2A" strokeWidth={2.2} />
                <Text style={styles.statValue}>{orders.length}</Text>
                <Text style={styles.statLabel}>Commandes</Text>
              </View>

              <View style={styles.statCard}>
                <ShieldCheck size={20} color="#10B981" strokeWidth={2.2} />
                <Text style={styles.statValue}>Vérifié</Text>
                <Text style={styles.statLabel}>Statut Compte</Text>
              </View>

              <View style={styles.statCard}>
                <MapPin size={20} color="#3B82F6" strokeWidth={2.2} />
                <Text style={styles.statValue}>{city || 'Abidjan'}</Text>
                <Text style={styles.statLabel}>Zone de livraison</Text>
              </View>
            </View>

            {/* 3. Navigation Tabs (Mes Informations | Mes Commandes | Support) */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'info' && styles.tabBtnActive]}
                onPress={() => setActiveTab('info')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'info' && styles.tabBtnTextActive]}>
                  Mes Informations
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
                onPress={() => setActiveTab('orders')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'orders' && styles.tabBtnTextActive]}>
                  Mes Commandes ({orders.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'support' && styles.tabBtnActive]}
                onPress={() => setActiveTab('support')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'support' && styles.tabBtnTextActive]}>
                  Assistance
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB CONTENT 1: MES INFORMATIONS */}
            {activeTab === 'info' && (
              <View style={styles.tabContentCard}>
                <Text style={styles.formSectionTitle}>Informations Personnelles</Text>

                <Text style={styles.inputLabel}>Nom & Prénom *</Text>
                <View style={styles.inputWithIcon}>
                  <UserIcon size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.fieldInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Votre nom complet"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <Text style={styles.inputLabel}>Numéro de Téléphone</Text>
                <View style={styles.inputWithIcon}>
                  <Phone size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.fieldInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Ex: 0700000000"
                    keyboardType="phone-pad"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <Text style={styles.inputLabel}>Adresse de livraison & Repère</Text>
                <View style={styles.inputWithIcon}>
                  <MapPin size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.fieldInput}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Ex: Cocody Angré 8ème tranche, après le pont"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.rowFields}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>Commune / Ville</Text>
                    <View style={styles.inputWithIcon}>
                      <Building size={16} color="#94A3B8" />
                      <TextInput
                        style={styles.fieldInput}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Ex: Cocody"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Pays</Text>
                    <View style={styles.inputWithIcon}>
                      <Globe size={16} color="#94A3B8" />
                      <TextInput
                        style={styles.fieldInput}
                        value={country}
                        onChangeText={setCountry}
                        placeholder="Côte d'Ivoire"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                  disabled={isSaving}
                  onPress={handleSaveProfile}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={16} color="#FFFFFF" strokeWidth={2.2} />
                      <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* TAB CONTENT 2: MES COMMANDES */}
            {activeTab === 'orders' && (
              <View style={styles.tabContentCard}>
                <Text style={styles.formSectionTitle}>Historique de mes commandes</Text>

                {isLoadingOrders ? (
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color="#E87C2A" />
                    <Text style={styles.loadingText}>Chargement de vos commandes...</Text>
                  </View>
                ) : orders.length === 0 ? (
                  <View style={styles.emptyOrdersWrap}>
                    <Package size={40} color="#CBD5E1" strokeWidth={1.5} />
                    <Text style={styles.emptyOrdersTitle}>Aucune commande pour le moment</Text>
                    <Text style={styles.emptyOrdersSub}>
                      Vos commandes passées sur l'application apparaîtront ici avec leur ticket de suivi.
                    </Text>
                    <TouchableOpacity
                      style={styles.browseStoreBtn}
                      onPress={() => router.push('/(tabs)/catalog')}
                    >
                      <Text style={styles.browseStoreBtnText}>Explorer la boutique</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {orders.map((ord) => (
                      <TouchableOpacity
                        key={ord.id || ord._id}
                        style={styles.orderCard}
                        onPress={() =>
                          router.push({
                            pathname: `/order/${ord.id || ord.orderNumber}` as any,
                            params: { orderData: JSON.stringify(ord) },
                          })
                        }
                      >
                        <View style={styles.orderCardHeader}>
                          <View>
                            <Text style={styles.orderNumber}>
                              #{ord.orderNumber || (ord.id ? ord.id.slice(-6).toUpperCase() : 'CMD')}
                            </Text>
                            <Text style={styles.orderDate}>
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('fr-FR') : 'Date récente'}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.orderStatusBadge,
                              ord.status === 'Livrée'
                                ? styles.statusDelivered
                                : ord.status === 'Confirmée'
                                ? styles.statusConfirmed
                                : styles.statusPending,
                            ]}
                          >
                            <Text style={styles.orderStatusText}>{ord.status || 'En attente'}</Text>
                          </View>
                        </View>

                        <View style={styles.orderCardBody}>
                          <Text style={styles.orderItemsCount}>
                            {ord.items?.length || 1} article{(ord.items?.length || 1) > 1 ? 's' : ''} • {ord.city || 'Abidjan'}
                          </Text>
                          <Text style={styles.orderTotal}>{formatPrice(ord.totalAmount)}</Text>
                        </View>

                        <View style={styles.orderCardFooter}>
                          <Text style={styles.orderTicketLink}>Suivre la commande</Text>
                          <ChevronRight size={14} color="#E87C2A" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB CONTENT 3: ASSISTANCE & PARAMÈTRES */}
            {activeTab === 'support' && (
              <View style={styles.tabContentCard}>
                <Text style={styles.formSectionTitle}>Support & Assistance Client</Text>

                <TouchableOpacity style={styles.supportTile} onPress={openWhatsApp}>
                  <View style={[styles.supportIconWrap, { backgroundColor: '#DCFCE7' }]}>
                    <MessageCircle size={20} color="#15803D" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.supportTileTitle}>Service WhatsApp Officiel</Text>
                    <Text style={styles.supportTileDesc}>Réponse rapide pour vos questions & livraisons</Text>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.supportTile} onPress={callSupport}>
                  <View style={[styles.supportIconWrap, { backgroundColor: '#EFF6FF' }]}>
                    <PhoneCall size={20} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.supportTileTitle}>Ligne Téléphonique</Text>
                    <Text style={styles.supportTileDesc}>+225 05 03 64 83 12 (Appel direct)</Text>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </TouchableOpacity>

                {/* Collapsible Server Configuration for Developers */}
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setShowServerConfig(!showServerConfig)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Server size={16} color="#64748B" />
                    <Text style={styles.accordionTitle}>Paramètres Réseau & API</Text>
                  </View>
                  <ChevronDown
                    size={16}
                    color="#64748B"
                    style={showServerConfig ? { transform: [{ rotate: '180deg' }] } : {}}
                  />
                </TouchableOpacity>

                {showServerConfig && (
                  <View style={styles.serverConfigBox}>
                    <Text style={styles.serverConfigDesc}>
                      Adresse du serveur API backend pour Expo Go :
                    </Text>
                    <TextInput
                      style={styles.serverInput}
                      value={serverUrl}
                      onChangeText={setServerUrl}
                      placeholder="http://192.168.1.4:5005"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TouchableOpacity
                        style={styles.serverTestBtn}
                        onPress={handleTestConnection}
                        disabled={isTestingServer}
                      >
                        {isTestingServer ? (
                          <ActivityIndicator size="small" color="#E87C2A" />
                        ) : (
                          <Text style={styles.serverTestBtnText}>Tester</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.serverSaveBtn}
                        onPress={handleSaveServerUrl}
                      >
                        <Text style={styles.serverSaveBtnText}>Enregistrer</Text>
                      </TouchableOpacity>
                    </View>
                    {serverStatus && (
                      <Text style={styles.serverStatusMsg}>{serverStatus}</Text>
                    )}
                  </View>
                )}

                {/* Logout Button */}
                <TouchableOpacity
                  style={styles.logoutActionBtn}
                  onPress={() => {
                    Alert.alert(
                      'Déconnexion',
                      'Voulez-vous vraiment vous déconnecter de votre compte Onoot ?',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Se déconnecter', style: 'destructive', onPress: () => logout() },
                      ]
                    );
                  }}
                >
                  <LogOut size={16} color="#EF4444" strokeWidth={2.2} />
                  <Text style={styles.logoutActionBtnText}>Se déconnecter du compte</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          /* Dedicated Guest Welcome Card */
          <View style={styles.guestCard}>
            <View style={styles.guestIconWrap}>
              <UserIcon size={36} color="#E87C2A" strokeWidth={2} />
            </View>
            <Text style={styles.guestTitle}>Bienvenue sur Onoot Boutique</Text>
            <Text style={styles.guestDesc}>
              Connectez-vous pour retrouver vos commandes, enregistrer vos adresses et profiter de la livraison express partout en Côte d'Ivoire.
            </Text>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/login')}
            >
              <LogIn size={18} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.loginBtnText}>Se connecter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => router.push('/register')}
            >
              <UserPlus size={18} color="#E87C2A" strokeWidth={2.2} />
              <Text style={styles.registerBtnText}>Créer un nouveau compte</Text>
            </TouchableOpacity>

            <View style={styles.guestSupportRow}>
              <TouchableOpacity style={styles.guestSupportTile} onPress={openWhatsApp}>
                <MessageCircle size={16} color="#15803D" />
                <Text style={styles.guestSupportText}>Aide WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.guestSupportTile} onPress={callSupport}>
                <PhoneCall size={16} color="#2563EB" />
                <Text style={styles.guestSupportText}>Appel Direct</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  /* BANNER */
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '900',
    color: '#E87C2A',
  },
  bannerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  bannerName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  contactLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  contactText: {
    fontSize: 12,
    color: '#64748B',
  },

  /* STATS ROW */
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
  },

  /* TABS */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#E87C2A',
    fontWeight: '800',
  },

  /* TAB CARD CONTENT */
  tabContentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
    marginBottom: 4,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  rowFields: {
    flexDirection: 'row',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E87C2A',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* ORDERS TAB */
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyOrdersWrap: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyOrdersTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyOrdersSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  browseStoreBtn: {
    marginTop: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  browseStoreBtnText: {
    color: '#E87C2A',
    fontSize: 13,
    fontWeight: '800',
  },
  orderCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDelivered: {
    backgroundColor: '#DCFCE7',
  },
  statusConfirmed: {
    backgroundColor: '#E0F2FE',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
  },
  orderCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderItemsCount: {
    fontSize: 12,
    color: '#64748B',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#E87C2A',
  },
  orderCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    paddingTop: 4,
  },
  orderTicketLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E87C2A',
  },

  /* SUPPORT TILES */
  supportTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  supportIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTileTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  supportTileDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  accordionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  serverConfigBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  serverConfigDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  serverInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  serverTestBtn: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  serverTestBtnText: {
    color: '#E87C2A',
    fontSize: 12,
    fontWeight: '700',
  },
  serverSaveBtn: {
    flex: 1,
    backgroundColor: '#E87C2A',
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  serverSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  serverStatusMsg: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 6,
  },
  logoutActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 16,
  },
  logoutActionBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },

  /* GUEST CARD */
  guestCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guestIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  guestDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E87C2A',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 10,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  registerBtnText: {
    color: '#E87C2A',
    fontSize: 14,
    fontWeight: '800',
  },
  guestSupportRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  guestSupportTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  guestSupportText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
});

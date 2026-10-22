import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react-native';
import { OnootLogo } from '../components/OnootLogo';
import { useAuth } from '../src/contexts/AuthContext';
import { getGoogleAuthUrl } from '../src/services/api';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Colors from '../constants/Colors';

WebBrowser.maybeCompleteAuthSession();

const theme = Colors.light;

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithToken } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir votre adresse email et votre mot de passe.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await login(cleanEmail, password);
      setIsLoading(false);

      if (res.success) {
        Alert.alert('Connexion réussie', 'Bienvenue sur Onoot Boutique !', [
          { text: 'Continuer', onPress: () => router.replace('/(tabs)/' as any) },
        ]);
      } else {
        Alert.alert('Erreur', res.error || 'Email ou mot de passe incorrect.');
      }
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Erreur', err?.message || 'Erreur lors de la connexion.');
    }
  };

  const handleForgotSubmit = async () => {
    const clean = forgotEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setForgotError('Veuillez renseigner une adresse email valide.');
      return;
    }

    setIsForgotLoading(true);
    setForgotError('');
    try {
      // simulate forgot password or hit api
      setTimeout(() => {
        setIsForgotLoading(false);
        setForgotSuccess(true);
      }, 800);
    } catch (e: any) {
      setIsForgotLoading(false);
      setForgotError(e.message || 'Impossible d\'envoyer le lien.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const redirectUrl = Linking.createURL('auth/callback');
      const authUrl = getGoogleAuthUrl(redirectUrl, 'login');

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const token = (parsed.queryParams?.token as string) || '';
        const error = parsed.queryParams?.error as string;
        const reason = parsed.queryParams?.reason as string;

        if (token) {
          const res = await loginWithToken(token);
          if (res.success) {
            Alert.alert('Connexion réussie', 'Bienvenue sur Onoot Boutique !', [
              { text: 'Continuer', onPress: () => router.replace('/(tabs)/' as any) },
            ]);
            return;
          } else {
            Alert.alert('Erreur', res.error || 'Impossible de synchroniser votre compte.');
          }
        } else if (error === 'google_cancelled') {
          // Annulé par l'utilisateur
        } else if (error) {
          Alert.alert('Erreur Google', reason ? `Détail : ${reason}` : 'Impossible de se connecter avec Google.');
        }
      }
    } catch (err: any) {
      Alert.alert('Erreur Google', err.message || 'Impossible d\'ouvrir la connexion Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top bar back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#64748B" />
          <Text style={styles.backButtonText}>Boutique</Text>
        </TouchableOpacity>

        {/* Ambient background blur elements */}
        <View style={styles.ambientOrange} />
        <View style={styles.ambientBlue} />

        {/* Official Brand Logo & Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <OnootLogo size="lg" />
          </View>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Accédez à votre compte client</Text>
        </View>

        {/* Card matching website */}
        <View style={styles.card}>
          {/* Google Button */}
          <TouchableOpacity
            style={[styles.googleButton, isGoogleLoading && { opacity: 0.7 }]}
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading}
            activeOpacity={0.8}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#1E293B" />
            ) : (
              <>
                <GoogleIcon size={18} />
                <Text style={styles.googleButtonText}>Continuer avec Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou avec email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email input */}
          <Text style={styles.label}>Adresse Email</Text>
          <View style={styles.inputWrapper}>
            <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="votre@email.com"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password input */}
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputWrapper}>
            <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff size={18} color="#94A3B8" />
              ) : (
                <Eye size={18} color="#94A3B8" />
              )}
            </TouchableOpacity>
          </View>

          {/* Remember me & Forgot Password */}
          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <CheckCircle2 size={12} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={styles.rememberText}>Se souvenir de moi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setForgotEmail(email);
                setForgotSuccess(false);
                setForgotError('');
                setIsForgotModalOpen(true);
              }}
            >
              <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          {/* Submit button with orange brand gradient tone */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
            disabled={isLoading}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Connexion</Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>

          {/* Security badge */}
          <View style={styles.securityRow}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.securityText}>Connexion sécurisée SSL 256 bits</Text>
          </View>
        </View>

        {/* Footer Link to Register */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.registerLink}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Mot de passe oublié */}
      <Modal
        visible={isForgotModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsForgotModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsForgotModalOpen(false)}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.modalIconCircle}>
              <KeyRound size={22} color="#E87C2A" strokeWidth={2.2} />
            </View>

            <Text style={styles.modalTitle}>Mot de passe oublié ?</Text>
            <Text style={styles.modalDesc}>
              Renseignez votre adresse email. Nous vous enverrons immédiatement un lien sécurisé pour définir un nouveau mot de passe.
            </Text>

            {forgotSuccess ? (
              <View style={styles.modalSuccessBox}>
                <CheckCircle2 size={36} color="#10B981" />
                <Text style={styles.modalSuccessTitle}>Demande transmise !</Text>
                <Text style={styles.modalSuccessText}>
                  Si un compte correspond à <Text style={{ fontWeight: '700' }}>{forgotEmail}</Text>, un email de réinitialisation vous a été envoyé.
                </Text>
                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => setIsForgotModalOpen(false)}
                >
                  <Text style={styles.modalDoneBtnText}>J'ai compris</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: '100%' }}>
                {forgotError.length > 0 && (
                  <View style={styles.modalErrorRow}>
                    <AlertCircle size={15} color="#EF4444" />
                    <Text style={styles.modalErrorText}>{forgotError}</Text>
                  </View>
                )}

                <Text style={[styles.label, { marginTop: 10 }]}>Adresse Email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="boutique@gmail.com"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setIsForgotModalOpen(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSubmitBtn}
                    disabled={isForgotLoading}
                    onPress={handleForgotSubmit}
                  >
                    {isForgotLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.modalSubmitBtnText}>Envoyer le lien</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  ambientOrange: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(232, 124, 42, 0.08)',
  },
  ambientBlue: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(75, 181, 232, 0.08)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrap: {
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 10,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  rememberText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  forgotLink: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: theme.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  modalErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 8,
    borderRadius: 10,
    gap: 6,
    marginBottom: 10,
  },
  modalErrorText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalCancelBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  modalSubmitBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalSubmitBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalSuccessBox: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  modalSuccessTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSuccessText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalDoneBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 6,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

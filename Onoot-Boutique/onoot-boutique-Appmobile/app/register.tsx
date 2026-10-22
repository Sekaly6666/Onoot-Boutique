import React, { useState, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
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

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loginWithToken } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Real-time checks for Name
  const nameIsPadded = useMemo(() => name.startsWith(' ') || name.endsWith(' '), [name]);
  const nameHasDoubleSpaces = useMemo(() => /\s{2,}/.test(name), [name]);

  // Real-time checks for Email
  const emailHasUppercase = useMemo(() => /[A-Z]/.test(email), [email]);
  const emailHasSpaces = useMemo(() => /\s/.test(email), [email]);

  // Real-time checks for Password strength & rules
  const passwordHasSpace = useMemo(() => /\s/.test(password), [password]);
  const passwordLengthOk = useMemo(() => password.length >= 8, [password]);
  const passwordHasNumber = useMemo(() => /[0-9]/.test(password), [password]);
  const passwordHasLetter = useMemo(() => /[a-zA-Z]/.test(password), [password]);
  const passwordHasSpecial = useMemo(() => /[^a-zA-Z0-9\s]/.test(password), [password]);

  const passwordStrengthScore = useMemo(() => {
    if (!password || passwordHasSpace) return 0;
    let score = 0;
    if (passwordLengthOk) score += 1;
    if (passwordHasLetter && passwordHasNumber) score += 1;
    if (password.length >= 10) score += 1;
    if (passwordHasSpecial) score += 1;
    return score;
  }, [password, passwordHasSpace, passwordLengthOk, passwordHasLetter, passwordHasNumber, passwordHasSpecial]);

  const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très sécurisé'];
  const strengthColors = ['#CBD5E1', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;

  const handleSubmit = async () => {
    // 1. Validation Nom et prénom
    const cleanName = name.trim();
    if (!cleanName) {
      Alert.alert('Erreur', 'Le nom et prénom sont obligatoires.');
      return;
    }
    const parts = cleanName.split(/\s+/);
    if (parts.length < 2 || parts.some((p) => p.length < 2)) {
      Alert.alert(
        'Format invalide',
        'Veuillez renseigner à la fois votre Nom et votre Prénom séparés par un espace.'
      );
      return;
    }

    // 2. Validation Email
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(cleanEmail)) {
      Alert.alert('Email invalide', 'Veuillez saisir une adresse email valide en minuscules.');
      return;
    }

    // 3. Validation Mot de passe
    if (password.length < 8) {
      Alert.alert('Mot de passe trop court', 'Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (passwordHasSpace) {
      Alert.alert('Erreur', 'Le mot de passe ne doit contenir aucun espace.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les deux mots de passe ne correspondent pas.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await register(cleanName, cleanEmail, password, phone.trim() || undefined);
      setIsLoading(false);

      if (res.success) {
        Alert.alert('Bienvenue !', 'Votre compte sécurisé a été créé avec succès.', [
          { text: 'Commencer mes achats', onPress: () => router.replace('/(tabs)/' as any) },
        ]);
      } else {
        Alert.alert('Erreur', res.error || "Impossible de créer le compte.");
      }
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Erreur', err?.message || "Erreur lors de l'inscription.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const redirectUrl = Linking.createURL('auth/callback');
      const authUrl = getGoogleAuthUrl(redirectUrl, 'register');

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const token = (parsed.queryParams?.token as string) || '';
        const error = parsed.queryParams?.error as string;
        const reason = parsed.queryParams?.reason as string;

        if (token) {
          const res = await loginWithToken(token);
          if (res.success) {
            Alert.alert('Inscription réussie', 'Votre compte Google a été synchronisé avec succès !', [
              { text: 'Continuer', onPress: () => router.replace('/(tabs)/' as any) },
            ]);
            return;
          } else {
            Alert.alert('Erreur', res.error || 'Impossible de synchroniser votre compte.');
          }
        } else if (error === 'google_cancelled') {
          // Annulé par l'utilisateur
        } else if (error) {
          Alert.alert('Erreur Google', reason ? `Détail : ${reason}` : 'Impossible de créer le compte avec Google.');
        }
      }
    } catch (err: any) {
      Alert.alert('Erreur Google', err.message || 'Impossible d\'ouvrir l\'inscription Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top back button */}
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
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez Onoot Boutique en toute sécurité</Text>
        </View>

        {/* Form Card matching website */}
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
            <Text style={styles.dividerText}>ou avec votre email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 1. NOM ET PRÉNOM */}
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.label}>
              Nom et prénom <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.fieldHint}>Séparés par un espace</Text>
          </View>
          <View
            style={[
              styles.inputWrapper,
              (nameIsPadded || nameHasDoubleSpaces) && styles.inputWarningBorder,
            ]}
          >
            <UserIcon size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Ex: Kouamé Jean"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>
          {nameIsPadded && (
            <Text style={styles.warningText}>
              <AlertTriangle size={12} color="#D97706" /> Aucun espace au début ou à la fin.
            </Text>
          )}
          {nameHasDoubleSpaces && (
            <Text style={styles.warningText}>
              <AlertTriangle size={12} color="#D97706" /> Un seul espace autorisé entre les noms.
            </Text>
          )}

          {/* 2. ADRESSE EMAIL */}
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.label}>
              Adresse Email <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.fieldHint}>Minuscules sans espace</Text>
          </View>
          <View
            style={[
              styles.inputWrapper,
              (emailHasUppercase || emailHasSpaces) && styles.inputErrorBorder,
            ]}
          >
            <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="boutique@gmail.com"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          {emailHasUppercase && (
            <View style={styles.errorBox}>
              <XCircle size={14} color="#DC2626" />
              <Text style={styles.errorBoxText}>
                Les majuscules sont interdites dans l'email (écrire en minuscules).
              </Text>
            </View>
          )}
          {emailHasSpaces && (
            <View style={styles.errorBox}>
              <XCircle size={14} color="#DC2626" />
              <Text style={styles.errorBoxText}>Les espaces sont interdits dans l'email.</Text>
            </View>
          )}

          {/* 3. TÉLÉPHONE */}
          <Text style={styles.label}>Numéro de Téléphone (Optionnel)</Text>
          <View style={styles.inputWrapper}>
            <Phone size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="+225 07 00 00 00 00"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* 4. MOT DE PASSE */}
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.label}>
              Mot de passe <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.fieldHint}>Min. 8 car. sans espace</Text>
          </View>
          <View
            style={[
              styles.inputWrapper,
              passwordHasSpace && styles.inputErrorBorder,
            ]}
          >
            <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Au moins 8 caractères"
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

          {passwordHasSpace && (
            <Text style={styles.errorInlineText}>
              Erreur : Le mot de passe ne doit comporter aucun espace.
            </Text>
          )}

          {/* Password Strength Indicator */}
          {password.length > 0 && !passwordHasSpace && (
            <View style={styles.strengthBox}>
              <View style={styles.strengthLabelRow}>
                <Text style={styles.strengthTitle}>Force du mot de passe :</Text>
                <Text style={[styles.strengthValue, { color: strengthColors[passwordStrengthScore] }]}>
                  {strengthLabels[passwordStrengthScore]}
                </Text>
              </View>
              <View style={styles.strengthBarsRow}>
                {[1, 2, 3, 4].map((step) => (
                  <View
                    key={step}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          passwordStrengthScore >= step
                            ? strengthColors[passwordStrengthScore]
                            : '#E2E8F0',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 5. CONFIRMER LE MOT DE PASSE */}
          <Text style={[styles.label, { marginTop: 10 }]}>
            Confirmer le mot de passe <Text style={styles.required}>*</Text>
          </Text>
          <View
            style={[
              styles.inputWrapper,
              confirmPassword.length > 0 &&
                (passwordsMatch ? styles.inputSuccessBorder : styles.inputErrorBorder),
            ]}
          >
            <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Répétez votre mot de passe"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showConfirmPassword ? (
                <EyeOff size={18} color="#94A3B8" />
              ) : (
                <Eye size={18} color="#94A3B8" />
              )}
            </TouchableOpacity>
          </View>
          {passwordsMatch && (
            <Text style={styles.successInlineText}>
              ✓ Les mots de passe correspondent parfaitement.
            </Text>
          )}

          {/* Security Rules Box */}
          <View style={styles.securityBox}>
            <View style={styles.securityBoxHeader}>
              <ShieldCheck size={14} color="#E87C2A" strokeWidth={2.5} />
              <Text style={styles.securityBoxTitle}>Règles de sécurité Onoot :</Text>
            </View>
            <Text style={styles.securityBullet}>• Email : lettres minuscules uniquement (ex: boutique@gmail.com).</Text>
            <Text style={styles.securityBullet}>• Nom et prénom : séparés par un seul espace, sans espace au début ou à la fin.</Text>
            <Text style={styles.securityBullet}>• Mot de passe : 8 caractères minimum, sans aucun espace.</Text>
          </View>

          {/* Submit button */}
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
                <Text style={styles.submitButtonText}>Créer mon compte sécurisé</Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Link to Login */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Déjà inscrit chez Onoot Boutique ? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginBottom: 8,
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
    marginBottom: 16,
  },
  logoWrap: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
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
    marginVertical: 16,
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
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  required: {
    color: '#EF4444',
  },
  fieldHint: {
    fontSize: 11,
    color: '#94A3B8',
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
    marginBottom: 8,
  },
  inputWarningBorder: {
    borderColor: '#F59E0B',
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
  },
  inputSuccessBorder: {
    borderColor: '#10B981',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  warningText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 8,
    borderRadius: 10,
    gap: 6,
    marginBottom: 8,
  },
  errorBoxText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  errorInlineText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 2,
  },
  successInlineText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 2,
  },
  strengthBox: {
    marginBottom: 10,
  },
  strengthLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  strengthTitle: {
    fontSize: 11,
    color: '#64748B',
  },
  strengthValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 4,
    height: 4,
  },
  strengthBar: {
    flex: 1,
    borderRadius: 2,
  },
  securityBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginVertical: 12,
    gap: 3,
  },
  securityBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  securityBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  securityBullet: {
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.primary,
  },
});

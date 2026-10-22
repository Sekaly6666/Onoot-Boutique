import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '../src/contexts/AuthContext';
import { CartProvider } from '../src/contexts/CartContext';
import Colors from '../constants/Colors';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="product/[id]"
            options={{
              headerShown: true,
              title: 'Détails du produit',
              headerTintColor: '#111827',
              headerBackTitle: 'Retour',
              headerStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
          <Stack.Screen
            name="order/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ticket/[id]"
            options={{
              headerShown: true,
              title: 'Reçu de commande',
              headerTintColor: '#111827',
              headerBackTitle: 'Fermer',
              headerStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="register"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Informations',
            }}
          />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}

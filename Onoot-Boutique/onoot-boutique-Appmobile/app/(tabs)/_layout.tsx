import React from 'react';
import { Tabs } from 'expo-router';
import { Home, ShoppingBag, ShoppingCart, Package, User } from 'lucide-react-native';
import { View, Text, Platform } from 'react-native';
import Colors from '../../constants/Colors';
import { useCart } from '../../src/contexts/CartContext';

export default function TabLayout() {
  const { totalCount } = useCart();
  const theme = Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Boutique',
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Panier',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
              {totalCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -9,
                    top: -5,
                    backgroundColor: theme.primary,
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                    {totalCount > 99 ? '99+' : totalCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color, focused }) => (
            <Package size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

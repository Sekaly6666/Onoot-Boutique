import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function ScanScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)');
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
}

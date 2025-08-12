import { Tabs } from 'expo-router';
import { Heart, Home, BookOpen, User, Settings } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
  import * as Font from 'expo-font';

export default function TabLayout() {
      const [fontsLoaded, setFontsLoaded] = useState(false);
  
    const loadFonts = async () => {
      await Font.loadAsync({
        'Tajawal-Regular': require('@/assets/fonts/Tajawal-Regular.ttf'),
        'Tajawal-Bold': require('@/assets/fonts/Tajawal-Bold.ttf'),
      });
      setFontsLoaded(true);
    };
  
    useEffect(() => {
      loadFonts();
    }, []);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 80,
          paddingTop: 10,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: 'Tajawal-Regular',
          marginBottom: -6,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'سجل الخير',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'المجتمع',
          tabBarIcon: ({ size, color }) => (
            <Heart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}
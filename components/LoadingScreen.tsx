import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';

export default function LoadingScreen() {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  
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
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 0.9,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient
      colors={['#22C55E', '#16A34A']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <Heart size={64} color="#ffffff" />
        <Text style={styles.appTitle}>صدقة جارية</Text>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </Animated.View>
      
      <View style={styles.quoteContainer}>
        <Text style={styles.quote}>
          "وَمَا تُقَدِّمُوا لِأَنفُسِكُم مِّنْ خَيْرٍ تَجِدُوهُ عِندَ اللَّهِ"
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 16,
    fontFamily: 'Tajawal-Bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    fontFamily: 'Tajawal-Regular',
  },
  quoteContainer: {
    position: 'absolute',
    bottom: 60,
    paddingHorizontal: 20,
  },
  quote: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
    fontFamily: 'Tajawal-Regular',
  },
});

function setFontsLoaded(arg0: boolean) {
  throw new Error('Function not implemented.');
}

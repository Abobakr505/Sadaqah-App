import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Heart, Star, Moon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';

export default function WelcomeScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
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

  useEffect(() => {
    if (fontsLoaded) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded]);

  const navigateToLogin = () => {
    router.push('/(auth)/login');
  };

  const navigateToRegister = () => {
    router.push('/(auth)/register');
  };

  if (!fontsLoaded) return <AppLoading />;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#22C55E', '#16A34A', '#15803D']}
        style={styles.background}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Heart size={64} color="#ffffff" />
            </View>
            <Text style={styles.appTitle}>صدقة جارية</Text>
            <Text style={styles.appSubtitle}>Sadaqah App</Text>
            <Text style={styles.tagline}>
              كل عمل خير صدقة جارية في ميزان حسناتك
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Star size={20} color="#FEF3C7" />
              <Text style={styles.featureText}>اقتراحات يومية ذكية</Text>
            </View>
            <View style={styles.featureItem}>
              <Heart size={20} color="#FEF3C7" />
              <Text style={styles.featureText}>تتبع أعمالك الخيرية</Text>
            </View>
            <View style={styles.featureItem}>
              <Moon size={20} color="#FEF3C7" />
              <Text style={styles.featureText}>مجتمع المؤمنين</Text>
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={navigateToRegister}
            >
              <Text style={styles.primaryButtonText}>ابدأ رحلة الخير</Text>
            </TouchableOpacity>
                        <TouchableOpacity
              style={styles.secondaryButton}
              onPress={navigateToLogin}
            >
              <Text style={styles.secondaryButtonText}>لدي حساب بالفعل</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quoteContainer}>
            <Text style={styles.quote}>
              "إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ"
            </Text>
            <Text style={styles.quoteSource}>- سورة التوبة</Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Tajawal-Bold'
  },
  appSubtitle: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 16,
    fontFamily: 'Tajawal-Regular'
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontFamily: 'Tajawal-Regular'
  },
  featuresContainer: {
    marginBottom: 50,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 12,
  },
  featureText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Tajawal-Regular'
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#22C55E',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Tajawal-Bold'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Tajawal-Regular'
  },
  quoteContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  quote: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
    opacity: 0.9,
    fontFamily: 'Tajawal-Regular'
  },
  quoteSource: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.7,
    fontWeight: '500',
    fontStyle: 'italic',
    fontFamily: 'Tajawal-Regular'
  },
});

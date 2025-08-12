import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Heart, Mail, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
  import * as Font from 'expo-font';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
    return;
  }

  setIsLoading(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('خطأ', error.message);
    } else if (data.user) {
      console.log('User logged in:', data.user.id); // Debug log
      router.push('/(tabs)/home'); // Use push for debugging
      Alert.alert('🎉 تم الدخول', 'مرحباً بك من جديد!');
    }
  } catch (error) {
    console.error('Login error:', error);
    Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with Islamic Pattern */}
        <LinearGradient
          colors={['#22C55E', '#16A34A']}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <Heart size={48} color="#ffffff" />
            <Text style={styles.appTitle}>صدقة جارية</Text>
            <Text style={styles.appSubtitle}>Sadaqah App</Text>
          </View>
        </LinearGradient>

        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>أهلاً وسهلاً</Text>
          <Text style={styles.welcomeSubtitle}>
            ابدأ رحلتك في الخير والأعمال الصالحة
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
            />
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.inputIcon}
            >
              {showPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textAlign="right"
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>نسيت كلمة المرور؟</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#22C55E', '#16A34A']}
              style={styles.loginButtonGradient}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>ليس لديك حساب؟ </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>إنشاء حساب جديد </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Islamic Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quote}>
            "مَن تَصَدَّقَ بِعَدْلِ تَمْرَةٍ مِن كَسْبٍ طَيِّبٍ"
          </Text>
          <Text style={styles.quoteSource}>- حديث شريف</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 4,
    fontFamily: 'Tajawal-Bold',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    fontFamily: 'Tajawal-Regular',
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'Tajawal-Bold',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Tajawal-Regular',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
    fontFamily: 'Tajawal-Regular',
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '500',
    fontFamily: 'Tajawal-Regular',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Tajawal-Bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Tajawal-Regular',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Tajawal-Regular',
  },
  signupLink: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '600',
    fontFamily: 'Tajawal-Bold',
  },
  quoteContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  quote: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
    fontFamily: 'Tajawal-Regular',
  },
  quoteSource: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    fontStyle: 'italic',
    fontFamily: 'Tajawal-Regular',
  },
});
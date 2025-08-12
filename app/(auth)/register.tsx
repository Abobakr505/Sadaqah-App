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
import { Heart, Mail, User, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
  import * as Font from 'expo-font';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

const handleRegister = async () => {
  if (!name || !email || !password || !confirmPassword) {
    Alert.alert('⚠️ خطأ', 'يرجى ملء جميع الحقول');
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert('⚠️ خطأ', 'كلمتا المرور غير متطابقتين');
    return;
  }

  if (password.length < 6) {
    Alert.alert('⚠️ خطأ', 'كلمة المرور يجب أن تكون على الأقل 6 أحرف');
    return;
  }

  setIsLoading(true);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      Alert.alert('❌ فشل التسجيل', error.message);
    } else if (data?.user) {
      // Insert default user_stats
      await supabase.from('user_stats').insert({
        user_id: data.user.id,
        total_deeds: 0,
        total_points: 0,
        streak: 0,
        rank: 'مبتدئ',
        level: 1,
      });
      Alert.alert('✅ تم التسجيل', 'تم إنشاء الحساب بنجاح. يُرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.', [
        {
          text: 'ابدأ الآن',
          onPress: () => router.push('/(tabs)/home'),
        },
      ]);
    }
  } catch (err) {
    console.error('Registration error:', err);
    Alert.alert('❌ خطأ غير متوقع', 'حدث خطأ أثناء محاولة التسجيل. حاول لاحقًا.');
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
        {/* Header */}
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <Heart size={48} color="#ffffff" />
            <Text style={styles.appTitle}>انضم لعائلة الخير</Text>
            <Text style={styles.appSubtitle}>ابدأ رحلتك في الأعمال الصالحة</Text>
          </View>
        </LinearGradient>

        {/* Registration Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>إنشاء حساب جديد</Text>
          
          <View style={styles.inputContainer}>
            <User size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="الاسم الكامل"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
          </View>

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

          <View style={styles.inputContainer}>
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.inputIcon}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="تأكيد كلمة المرور"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              textAlign="right"
            />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#F59E0B', '#D97706']}
              style={styles.registerButtonGradient}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>لديك حساب بالفعل؟ </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>تسجيل الدخول </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Terms and Privacy */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            بإنشاء حساب، أنت توافق على{' '}
            <Text style={styles.termsLink}>شروط الاستخدام</Text>
            {' '}و{' '}
            <Text style={styles.termsLink}>سياسة الخصوصية</Text>
          </Text>
        </View>

        {/* Islamic Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quote}>
            "وَمَا تُقَدِّمُوا لِأَنفُسِكُم مِّنْ خَيْرٍ تَجِدُوهُ عِندَ اللَّهِ"
          </Text>
          <Text style={styles.quoteSource}>- سورة البقرة</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Tajawal-Bold',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    fontFamily: 'Tajawal-Regular',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Tajawal-Bold',
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
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Tajawal-Bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Tajawal-Regular',
  },
  loginLink: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '600',
    fontFamily: 'Tajawal-Bold',
  },
  termsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Tajawal-Regular',
  },
  termsLink: {
    color: '#22C55E',
    fontWeight: '500',
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
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { Clock, Heart, Share2, Zap, CircleCheck as CheckCircle, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import PrayerTimes from '@/components/PrayerTimes';
import IslamicDate from '@/components/IslamicDate';
import QuickDhikr from '@/components/QuickDhikr';
import * as Font from 'expo-font';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface DailySuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  reward: number;
  time_of_day: string;
}

interface UserStats {
  total_deeds: number;
  total_points: number;
  streak: number;
  rank: string;
  level: number;
}

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<DailySuggestion[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState<DailySuggestion | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [userStatus, setUserStatus] = useState<'active' | 'inactive' | 'motivated'>('active');
  const [showQuickDhikr, setShowQuickDhikr] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load custom fonts
  const loadFonts = async () => {
    await Font.loadAsync({
      'Tajawal-Regular': require('@/assets/fonts/Tajawal-Regular.ttf'),
      'Tajawal-Bold': require('@/assets/fonts/Tajawal-Bold.ttf'),
    });
    setFontsLoaded(true);
  };

  // Fetch user data, suggestions, and stats
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('خطأ', 'يرجى تسجيل الدخول');
        router.replace('/(auth)/login');
        return;
      }
      setUser(user);

      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('suggestions')
        .select('id, title, description, category, reward, time_of_day');
      if (suggestionsError) {
        console.error('Error fetching suggestions:', suggestionsError);
        Alert.alert('خطأ', 'تعذر تحميل الاقتراحات');
        return;
      }
      setSuggestions(suggestionsData || []);

      let { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('total_deeds, total_points, streak, rank, level')
        .eq('user_id', user.id)
        .single();

      if (statsError && statsError.code === 'PGRST116') {
        const defaultStats = {
          user_id: user.id,
          total_deeds: 0,
          total_points: 0,
          streak: 0,
          rank: 'مبتدئ',
          level: 1,
        };
        const { error: insertError } = await supabase
          .from('user_stats')
          .insert(defaultStats);
        if (insertError) {
          console.error('Error inserting default stats:', insertError);
          Alert.alert('خطأ', 'تعذر إنشاء بيانات المستخدم');
        }
        setUserStats(defaultStats);
      } else if (statsError) {
        console.error('Error fetching stats:', statsError);
        Alert.alert('خطأ', 'تعذر تحميل بيانات المستخدم');
      } else {
        setUserStats(statsData);
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: completedData, error: completedError } = await supabase
        .from('user_suggestions')
        .select('suggestion_id')
        .eq('user_id', user.id)
        .gte('completed_at', `${today}T00:00:00Z`)
        .lte('completed_at', `${today}T23:59:59Z`);
      if (completedError) {
        console.error('Error fetching completed suggestions:', completedError);
        Alert.alert('خطأ', 'تعذر تحميل الأعمال المكتملة');
      } else {
        setCompletedToday(completedData.map(item => item.suggestion_id) || []);
      }

      const dailyCount = completedData?.length || 0;
      setUserStatus(dailyCount > 0 ? 'active' : statsData?.total_deeds > 0 ? 'motivated' : 'inactive');
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // Select current suggestion
  useEffect(() => {
    if (suggestions.length > 0) {
      const hour = new Date().getHours();
      let selectedSuggestion = suggestions.find(s => s.time_of_day === 'any' && s.title !== 'تسبيح سريع');
      if (hour < 12) {
        selectedSuggestion = suggestions.find(s => s.time_of_day === 'morning' && s.title !== 'تسبيح سريع') || selectedSuggestion;
      } else if (hour < 18) {
        selectedSuggestion = suggestions.find(s => s.time_of_day === 'afternoon' && s.title !== 'تسبيح سريع') || selectedSuggestion;
      } else {
        selectedSuggestion = suggestions.find(s => s.time_of_day === 'evening' && s.title !== 'تسبيح سريع') || selectedSuggestion;
      }
      setCurrentSuggestion(selectedSuggestion || suggestions.find(s => s.title !== 'تسبيح سريع') || suggestions[0]);
    }
  }, [suggestions]);

  useEffect(() => {
    loadFonts();
    fetchData();
  }, []);

  const completeAction = async (suggestion: DailySuggestion) => {
    if (completedToday.includes(suggestion.id)) {
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: insertError } = await supabase
        .from('user_suggestions')
        .insert({ user_id: user.id, suggestion_id: suggestion.id, completed_at: new Date().toISOString() })
        .select('suggestion_id')
        .single();
      if (insertError) {
        console.error('Error recording suggestion:', insertError);
        Alert.alert('خطأ', `تعذر تسجيل العمل: ${insertError.message}`);
        return;
      }

      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('total_deeds, total_points, streak, rank, level')
        .eq('user_id', user.id)
        .single();
      if (statsError) {
        console.error('Error fetching updated stats:', statsError);
        Alert.alert('خطأ', 'تعذر تحديث الإحصائيات');
        return;
      }

      setUserStats(statsData);
      setCompletedToday(prev => [...prev, suggestion.id]);
      setUserStatus('active');

      Alert.alert(
        'بارك الله فيك! 🌟',
        `تم تسجيل عمل الخير. حصلت على ${suggestion.reward} نقطة!`,
        [{ text: 'الحمد لله', style: 'default' }]
      );
    } catch (error) {
      console.error('Error completing action:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل العمل');
    } finally {
      setIsLoading(false);
    }
  };
    const handleShare = async () => {
    try {
      const result = await Share.share({
        message: "🌟 شارك الأجر معنا! رابط التطبيق: https://example.com",
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log("تمت المشاركة عبر:", result.activityType);
        } else {
          console.log("تمت المشاركة بنجاح");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("تم إلغاء المشاركة");
      }
    } catch (error) {
      console.error("خطأ في المشاركة:", error.message);
    }
  };
  const handleQuickDhikrComplete = async (dhikrCount: number) => {
    setIsLoading(true);
    try {
      const { data: dhikrSuggestion, error: suggestionError } = await supabase
        .from('suggestions')
        .select('id')
        .eq('title', 'تسبيح سريع')
        .single();
      if (suggestionError || !dhikrSuggestion) {
        console.error('Error fetching dhikr suggestion:', suggestionError);
        Alert.alert('خطأ', 'تعذر العثور على اقتراح التسبيح السريع');
        return;
      }

      const points = dhikrCount * 2;
      const { error: insertError } = await supabase
        .from('user_suggestions')
        .insert({
          user_id: user.id,
          suggestion_id: dhikrSuggestion.id,
          completed_at: new Date().toISOString(),
          custom_reward: points,
        });
      if (insertError) {
        console.error('Error recording dhikr:', insertError);
        Alert.alert('خطأ', `تعذر تسجيل التسبيح: ${insertError.message}`);
        return;
      }

      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('total_deeds, total_points, streak, rank, level')
        .eq('user_id', user.id)
        .single();
      if (statsError) {
        console.error('Error fetching updated stats:', statsError);
        Alert.alert('خطأ', 'تعذر تحديث الإحصائيات');
        return;
      }

      setUserStats(statsData);
      setUserStatus('active');

      Alert.alert(
        'بارك الله فيك! 🌟',
        `تم تسجيل ${dhikrCount} تسبيحة. حصلت على ${points} نقطة!`,
        [{ text: 'الحمد لله', style: 'default' }]
      );
    } catch (error) {
      console.error('Error completing dhikr:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل التسبيح');
    } finally {
      setIsLoading(false);
      setShowQuickDhikr(false);
    }
  };

  const getStatusColor = () => {
    switch (userStatus) {
      case 'active': return '#22C55E';
      case 'inactive': return '#EF4444';
      case 'motivated': return '#F59E0B';
      default: return '#22C55E';
    }
  };

  const getStatusText = () => {
    switch (userStatus) {
      case 'active': return 'نشط في الخير';
      case 'inactive': return 'يحتاج تحفيز';
      case 'motivated': return 'متحفز للخير';
      default: return 'نشط في الخير';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء النور';
  };

  if (!fontsLoaded || isLoading || !user || !userStats || !currentSuggestion) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#22C55E', '#16A34A']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>{getGreeting()} 🌟</Text>
          <Text style={styles.appTitle}>صدقة جارية</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Heart size={24} color="#22C55E" />
          <Text style={styles.statNumber}>{userStats.total_deeds}</Text>
          <Text style={styles.statLabel}>إجمالي الأعمال</Text>
        </View>
        <View style={styles.statCard}>
          <Star size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{userStats.total_points}</Text>
          <Text style={styles.statLabel}>نقاط الأجر</Text>
        </View>
      </View>

      <IslamicDate />
      <PrayerTimes />

      <View style={styles.suggestionCard}>
        <View style={styles.suggestionHeader}>
          <Text style={styles.suggestionTitle}>اقتراح اليوم</Text>
          <Clock size={20} color="#6B7280" />
        </View>
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionMainTitle}>{currentSuggestion.title}</Text>
          <Text style={styles.suggestionDescription}>{currentSuggestion.description}</Text>
          <View style={styles.suggestionMeta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{currentSuggestion.category}</Text>
            </View>
            <Text style={styles.rewardText}>+{currentSuggestion.reward} نقطة</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.actionButton,
            completedToday.includes(currentSuggestion.id) && styles.completedButton,
          ]}
          onPress={() => completeAction(currentSuggestion)}
          disabled={completedToday.includes(currentSuggestion.id)}
        >
          {completedToday.includes(currentSuggestion.id) ? (
            <CheckCircle size={20} color="#ffffff" />
          ) : (
            <Heart size={20} color="#ffffff" />
          )}
          <Text style={styles.actionButtonText}>
            {completedToday.includes(currentSuggestion.id) ? 'تم بحمد الله' : 'سجل العمل'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
        <View style={styles.quickButtonsContainer}>
          <TouchableOpacity style={styles.quickButton} onPress={() => setShowQuickDhikr(true)}>
            <Zap size={24} color="#F59E0B" />
            <Text style={styles.quickButtonText}>أنا مشغول الآن</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={handleShare}>
            <Share2 size={24} color="#3B82F6" />
            <Text style={styles.quickButtonText}>شارك الأجر</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.additionalSuggestions}>
        <Text style={styles.sectionTitle}>اقتراحات أخرى</Text>
        {suggestions
          .filter(s => s.id !== currentSuggestion.id && s.title !== 'تسبيح سريع')
          .slice(0, 3)
          .map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              style={styles.miniSuggestion}
              onPress={() => completeAction(suggestion)}
            >
              <View style={styles.miniSuggestionContent}>
                <Text style={styles.miniSuggestionTitle}>{suggestion.title}</Text>
                <Text style={styles.miniSuggestionReward}>+{suggestion.reward}</Text>
              </View>
              {completedToday.includes(suggestion.id) && (
                <CheckCircle size={16} color="#22C55E" />
              )}
            </TouchableOpacity>
          ))}
      </View>

      <QuickDhikr
        visible={showQuickDhikr}
        onClose={() => setShowQuickDhikr(false)}
        onComplete={handleQuickDhikrComplete}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: 'Tajawal-Regular',
  },
  appTitle: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Tajawal-Bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Tajawal-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    fontFamily: 'Tajawal-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Tajawal-Regular',
  },
  suggestionCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Tajawal-Bold',
  },
  suggestionContent: {
    marginBottom: 20,
  },
  suggestionMainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'Tajawal-Bold',
  },
  suggestionDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'right',
    marginBottom: 15,
    fontFamily: 'Tajawal-Regular',
  },
  suggestionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Tajawal-Regular',
  },
  rewardText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Tajawal-Bold',
  },
  actionButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  completedButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Tajawal-Regular',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    textAlign: 'right',
    fontFamily: 'Tajawal-Bold',
  },
  quickButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickButtonText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    fontFamily: 'Tajawal-Regular',
  },
  additionalSuggestions: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  miniSuggestion: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  miniSuggestionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniSuggestionTitle: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    fontFamily: 'Tajawal-Regular',
  },
  miniSuggestionReward: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: 'bold',
    fontFamily: 'Tajawal-Bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Tajawal-Regular',
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Calendar, BookOpen, Heart, Star, Clock, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import * as Font from 'expo-font';
import { router } from 'expo-router';

interface GoodDeed {
  id: string;
  title: string;
  category: string;
  points: number;
  date: string;
  time: string;
}

interface Suggestion {
  id: string;
  title: string;
  category: string;
  reward: number;
}

interface UserStats {
  total_deeds: number;
  total_points: number;
}

export default function RecordScreen() {
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [goodDeeds, setGoodDeeds] = useState<GoodDeed[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newDeed, setNewDeed] = useState({ suggestion_id: '', description: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const loadFonts = async () => {
    await Font.loadAsync({
      'Tajawal-Regular': require('@/assets/fonts/Tajawal-Regular.ttf'),
      'Tajawal-Bold': require('@/assets/fonts/Tajawal-Bold.ttf'),
    });
    setFontsLoaded(true);
  };

  const fetchSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select('id, title, category, reward')
        .neq('title', 'تسبيح سريع');
      if (error) {
        console.error('Error fetching suggestions:', error);
        Alert.alert('خطأ', 'تعذر تحميل اقتراحات الأعمال');
      } else {
        setSuggestions(data || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل اقتراحات الأعمال');
    }
  };

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

      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('total_deeds, total_points')
        .eq('user_id', user.id)
        .single();
      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error fetching stats:', statsError);
        Alert.alert('خطأ', 'تعذر تحميل بيانات المستخدم');
        return;
      }
      setUserStats(statsData || { total_deeds: 0, total_points: 0 });

      const { data: deedsData, error: deedsError } = await supabase
        .from('user_suggestions')
        .select(`
          id, completed_at, suggestions!inner(id, title, category, reward), custom_reward
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      if (deedsError) {
        console.error('Error fetching deeds:', deedsError);
        Alert.alert('خطأ', 'تعذر تحميل الأعمال المسجلة');
      } else {
        setGoodDeeds(deedsData.map(deed => ({
          id: deed.id,
          title: deed.suggestions.title,
          category: deed.suggestions.category,
          points: deed.custom_reward || deed.suggestions.reward,
          date: new Date(deed.completed_at).toISOString().split('T')[0],
          time: new Date(deed.completed_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        })) || []);
      }

      await fetchSuggestions();
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeedSubmit = async () => {
    if (!newDeed.suggestion_id || !newDeed.description) {
      Alert.alert('خطأ', 'يرجى اختيار عمل خيري وإدخال وصف');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('user_suggestions')
        .insert({
          user_id: user.id,
          suggestion_id: newDeed.suggestion_id,
          completed_at: new Date().toISOString(),
          description: newDeed.description,
        })
        .select(`
          id, completed_at, suggestions!inner(id, title, category, reward), custom_reward
        `)
        .single();
      if (error) {
        console.error('Error submitting deed:', error);
        Alert.alert('خطأ', `تعذر تسجيل العمل الخيري: ${error.message}`);
        return;
      }

      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('total_deeds, total_points')
        .eq('user_id', user.id)
        .single();
      if (statsError) {
        console.error('Error fetching updated stats:', statsError);
        Alert.alert('خطأ', 'تعذر تحديث الإحصائيات');
        return;
      }

      const newGoodDeed: GoodDeed = {
        id: data.id,
        title: data.suggestions.title,
        category: data.suggestions.category,
        points: data.custom_reward || data.suggestions.reward,
        date: new Date(data.completed_at).toISOString().split('T')[0],
        time: new Date(data.completed_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };

      setUserStats(statsData);
      setGoodDeeds(prev => [newGoodDeed, ...prev]);
      setNewDeed({ suggestion_id: '', description: '' });
      setIsModalVisible(false);
      Alert.alert(
        'بارك الله فيك! 🌟',
        `تم تسجيل العمل الخيري. حصلت على ${newGoodDeed.points} نقطة!`
      );
    } catch (error) {
      console.error('Error submitting deed:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل العمل الخيري');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTodayDeeds = () => {
    const today = new Date().toISOString().split('T')[0];
    return goodDeeds.filter(deed => deed.date === today);
  };

  const getWeekDeeds = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return goodDeeds.filter(deed => new Date(deed.date) >= weekAgo);
  };

  const getMonthDeeds = () => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return goodDeeds.filter(deed => new Date(deed.date) >= monthAgo);
  };

  const getFilteredDeeds = () => {
    switch (selectedPeriod) {
      case 'today':
        return getTodayDeeds();
      case 'week':
        return getWeekDeeds();
      case 'month':
        return getMonthDeeds();
      default:
        return goodDeeds;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ذكر':
        return <Heart size={16} color="#22C55E" />;
      case 'صدقة':
        return <Star size={16} color="#F59E0B" />;
      case 'قرآن':
        return <BookOpen size={16} color="#8B5CF6" />;
      case 'دعاء':
        return <Calendar size={16} color="#3B82F6" />;
      case 'مساعدة':
        return <Heart size={16} color="#EF4444" />;
      default:
        return <Heart size={16} color="#22C55E" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ذكر': return '#22C55E';
      case 'صدقة': return '#F59E0B';
      case 'قرآن': return '#8B5CF6';
      case 'دعاء': return '#3B82F6';
      case 'مساعدة': return '#EF4444';
      default: return '#22C55E';
    }
  };

  const getWeeklyProgress = () => {
    const weekDeeds = getWeekDeeds();
    const goal = 10; // Weekly goal of 10 deeds
    return (weekDeeds.length / goal) * 100;
  };

  useEffect(() => {
    loadFonts();
    fetchData();
  }, []);

  if (!fontsLoaded || isLoading || !user || !userStats) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>سجل الخير</Text>
        <Text style={styles.headerSubtitle}>تتبع أعمالك الخيرية اليومية</Text>
      </LinearGradient>

      <View style={styles.recordButtonContainer}>
        <TouchableOpacity
          style={styles.recordButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.recordButtonText}>تسجيل عمل خيري</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>تسجيل عمل خيري</Text>
            <View style={styles.recordForm}>
              <View style={styles.suggestionContainer}>
                {suggestions.map(suggestion => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={[
                      styles.suggestionButton,
                      newDeed.suggestion_id === suggestion.id && { backgroundColor: getCategoryColor(suggestion.category) }
                    ]}
                    onPress={() => setNewDeed(prev => ({ ...prev, suggestion_id: suggestion.id }))}
                  >
                    <Text
                      style={[
                        styles.suggestionButtonText,
                        newDeed.suggestion_id === suggestion.id && styles.suggestionButtonTextActive
                      ]}
                    >
                      {suggestion.title} (+{suggestion.reward} نقاط)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="وصف العمل الخيري"
                value={newDeed.description}
                onChangeText={(text) => setNewDeed(prev => ({ ...prev, description: text }))}
                placeholderTextColor="#9CA3AF"
                multiline
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleDeedSubmit}
                  disabled={isSubmitting}
                >
                  <Send size={18} color="#ffffff" />
                  <Text style={styles.submitButtonText}>تسجيل</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{userStats.total_deeds}</Text>
          <Text style={styles.summaryLabel}>إجمالي الأعمال</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{userStats.total_points}</Text>
          <Text style={styles.summaryLabel}>نقاط الأجر</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{getTodayDeeds().length}</Text>
          <Text style={styles.summaryLabel}>أعمال اليوم</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {[
          { key: 'today', label: 'اليوم' },
          { key: 'week', label: 'الأسبوع' },
          { key: 'month', label: 'الشهر' }
        ].map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.filterButton,
              selectedPeriod === period.key && styles.filterButtonActive
            ]}
            onPress={() => setSelectedPeriod(period.key as any)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedPeriod === period.key && styles.filterButtonTextActive
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.deedsContainer}>
        <Text style={styles.sectionTitle}>الأعمال المسجلة</Text>
        {getFilteredDeeds().length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>لا توجد أعمال مسجلة</Text>
            <Text style={styles.emptyStateSubtext}>ابدأ بتسجيل أعمالك الخيرية اليوم</Text>
          </View>
        ) : (
          getFilteredDeeds().map((deed) => (
            <View key={deed.id} style={styles.deedCard}>
              <View style={styles.deedHeader}>
                <View style={styles.deedTitleContainer}>
                  {getCategoryIcon(deed.category)}
                  <Text style={styles.deedTitle}>{deed.title}</Text>
                </View>
                <Text style={styles.deedPoints}>+{deed.points}</Text>
              </View>
              <View style={styles.deedMeta}>
                <View style={[
                  styles.categoryBadge,
                  { backgroundColor: `${getCategoryColor(deed.category)}20` }
                ]}>
                  <Text style={[
                    styles.categoryText,
                    { color: getCategoryColor(deed.category) }
                  ]}>
                    {deed.category}
                  </Text>
                </View>
                <View style={styles.timeContainer}>
                  <Clock size={12} color="#9CA3AF" />
                  <Text style={styles.timeText}>{deed.date} {deed.time}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.sectionTitle}>تقدم الأسبوع</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(getWeeklyProgress(), 100)}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(getWeeklyProgress())}% من هدف الأسبوع (10 أعمال)</Text>
      </View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Tajawal-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
    fontFamily: 'Tajawal-Regular',
  },
  recordButtonContainer: {
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  recordButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
        marginBottom:20,
  },
  recordButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Tajawal-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  recordForm: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
  },
  suggestionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  suggestionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  suggestionButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Tajawal-Regular',
  },
  suggestionButtonTextActive: {
    color: '#ffffff',
    fontFamily: 'Tajawal-Bold',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    textAlign: 'right',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Tajawal-Bold',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Tajawal-Bold',
  },
  modalButtonContainer: {
    marginTop: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Tajawal-Bold',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Tajawal-Regular',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Tajawal-Regular',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  deedsContainer: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Tajawal-Bold',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'Tajawal-Regular',
  },
  deedCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  deedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Tajawal-Bold',
  },
  deedPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
    fontFamily: 'Tajawal-Bold',
  },
  deedMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Tajawal-Bold',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Tajawal-Regular',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Tajawal-Regular',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Tajawal-Regular',
  },
});
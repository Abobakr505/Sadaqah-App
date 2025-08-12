import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
} from 'react-native';
import { User, Share2, Award, LogOut, ChevronRight, Heart, Star, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as Font from 'expo-font';
import { router } from 'expo-router';

interface UserStats {
  total_deeds: number;
  total_points: number;
  streak: number;
  rank: string;
  level: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [prevLevel, setPrevLevel] = useState<number>(0);

  const loadFonts = async () => {
    await Font.loadAsync({
      'Tajawal-Regular': require('@/assets/fonts/Tajawal-Regular.ttf'),
      'Tajawal-Bold': require('@/assets/fonts/Tajawal-Bold.ttf'),
    });
    setFontsLoaded(true);
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
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('خطأ', 'يرجى تسجيل الدخول لعرض الملف الشخصي');
        router.replace('/(auth)/login');
        return;
      }
      setUser(user);

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

      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('id, title, description, icon, unlocked')
        .eq('user_id', user.id);
      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
        Alert.alert('خطأ', 'تعذر تحميل الإنجازات');
      } else {
        setAchievements(achievementsData || []);
      }

      setProfilePicture(user.user_metadata?.avatar_url || null);
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطأ', 'مطلوب إذن للوصول إلى المعرض');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      const file = result.assets[0];
      const fileExt = file.uri.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      setIsLoading(true);
      try {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { contentType: `image/${fileExt}` });
        if (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('خطأ', 'تعذر رفع الصورة');
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        const avatarUrl = publicUrlData.publicUrl;

        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: avatarUrl },
        });
        if (updateError) {
          console.error('Update error:', updateError);
          Alert.alert('خطأ', 'تعذر تحديث الصورة الشخصية');
        } else {
          setProfilePicture(avatarUrl);
          Alert.alert('نجاح', 'تم تحديث الصورة الشخصية بنجاح');
        }
      } catch (error) {
        console.error('Image upload error:', error);
        Alert.alert('خطأ', 'حدث خطأ أثناء رفع الصورة');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('خطأ', 'تعذر تسجيل الخروج');
            } else {
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const checkAndAddLevelAchievement = async () => {
  if (!userStats || userStats.level <= prevLevel) return;

  try {
    // تحقق هل الإنجاز موجود بالفعل
    const { data: existing, error: checkError } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('title', `مستوى ${userStats.level}`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking achievement:', checkError);
      return;
    }

    if (existing) {
      console.log('الإنجاز موجود بالفعل، لن تتم إضافته مرة أخرى');
      return;
    }

    // إضافة الإنجاز لو مش موجود
    const newAchievement = {
      user_id: user.id,
      title: `مستوى ${userStats.level}`,
      description: `وصلت إلى المستوى ${userStats.level}!`,
      icon: '🏆',
      unlocked: true,
    };

    const { error } = await supabase
      .from('achievements')
      .insert(newAchievement);

    if (error) {
      console.error('Error adding level achievement:', error);
    } else {
      setAchievements(prev => [...prev, { ...newAchievement, id: 'new' }]);
      setPrevLevel(userStats.level);
    }
  } catch (error) {
    console.error('Error in level achievement:', error);
  }
};

  useEffect(() => {
    loadFonts();
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userStats) {
      checkAndAddLevelAchievement();
    }
  }, [userStats]);

  if (!fontsLoaded || isLoading || !user || !userStats) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }
  const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];
const currentMonth = monthNames[new Date().getMonth()];
const currentYear = new Date().getFullYear();

  const progressToNextLevel = (userStats.total_points % 500) / 500 * 100;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        style={styles.header}
      >
        <View style={styles.profileInfo}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={{
                uri: profilePicture || 'https://via.placeholder.com/80',
              }}
              style={styles.avatar}
            />
            <Text style={styles.changePhotoText}>تغيير الصورة</Text>
          </TouchableOpacity>
          <Text style={styles.userName}>
            {user.user_metadata?.name || user.email.split('@')[0]}
          </Text>
          <Text style={styles.userRank}>{userStats.rank}</Text>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>المستوى {userStats.level}</Text>
            <View style={styles.levelProgress}>
              <View style={[styles.levelProgressFill, { width: `${progressToNextLevel}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progressToNextLevel)}% للمستوى التالي
            </Text>
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
        <View style={styles.statCard}>
          <Calendar size={24} color="#3B82F6" />
          <Text style={styles.statNumber}>{userStats.streak}</Text>
          <Text style={styles.statLabel}>أيام متتالية</Text>
        </View>
      </View>

      <View style={styles.achievementsContainer}>
        <Text style={styles.sectionTitle}>الإنجازات</Text>
        <View style={styles.achievementsList}>
          {achievements.length > 0 ? (
            achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementLocked,
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <View style={styles.achievementContent}>
                  <Text
                    style={[
                      styles.achievementTitle,
                      !achievement.unlocked && styles.achievementTitleLocked,
                    ]}
                  >
                    {achievement.title}
                  </Text>
                  <Text
                    style={[
                      styles.achievementDescription,
                      !achievement.unlocked && styles.achievementDescriptionLocked,
                    ]}
                  >
                    {achievement.description}
                  </Text>
                </View>
                {achievement.unlocked && (
                  <Award size={20} color="#F59E0B" />
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noAchievementsText}>لا توجد إنجازات بعد</Text>
          )}
        </View>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
        {[
          { icon: Share2, label: 'شارك التطبيق', color: '#3B82F6' ,  action: handleShare },
          { icon: LogOut, label: 'تسجيل الخروج', color: '#EF4444', action: handleLogout },
        ].map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionItem}
            onPress={action.action}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <action.icon size={20} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </View>
            <View style={{ justifyContent: 'center' }}>
              <ChevronRight size={20} color="#D1D5DB"  />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>ملخص الشهر</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            إحصائيات {currentMonth} {currentYear}
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{userStats.total_deeds}</Text>
              <Text style={styles.summaryLabel}>إجمالي الأعمال</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{userStats.total_points}</Text>
              <Text style={styles.summaryLabel}>نقاط الأجر</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{userStats.streak}</Text>
              <Text style={styles.summaryLabel}>أيام متتالية</Text>
            </View>
          </View>
        </View>
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
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffffff',
    marginBottom: 12,
  },
  changePhotoText: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Tajawal-Regular',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    fontFamily: 'Tajawal-Bold',
  },
  userRank: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 20,
    fontFamily: 'Tajawal-Regular',
  },
  levelContainer: {
    width: '100%',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Tajawal-Bold',
  },
  levelProgress: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    fontFamily: 'Tajawal-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -25,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
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
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    fontFamily: 'Tajawal-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Tajawal-Regular',
  },
  achievementsContainer: {
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
  achievementsList: {
    gap: 8,
  },
  achievementCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    textAlign: 'right',
    fontFamily: 'Tajawal-Bold',
  },
  achievementTitleLocked: {
    color: '#9CA3AF',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    fontFamily: 'Tajawal-Regular',
  },
  achievementDescriptionLocked: {
    color: '#D1D5DB',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'Tajawal-Regular',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Tajawal-Bold',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22C55E',
    fontFamily: 'Tajawal-Bold',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Tajawal-Regular',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Tajawal-Regular',
  },
  noAchievementsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Tajawal-Regular',
  },
});
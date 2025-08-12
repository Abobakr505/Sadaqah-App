import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Heart, Users, Share2, Award, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import * as Font from 'expo-font';
import { router } from 'expo-router';

interface CommunityPost {
  id: string;
  user_id: string;
  deed: string;
  description: string;
  category: string;
  created_at: string;
  avatar_url: string | null;
  user_name: string | null;
  likes_count: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  goal_deeds: number;
  participants_count: number;
  user_progress: number | null;
}

export default function CommunityScreen() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [communityStats, setCommunityStats] = useState<{ active_users: number; daily_deeds: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [newPost, setNewPost] = useState({ deed: '', description: '', category: '' });
  const [isPosting, setIsPosting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const loadFonts = async () => {
    await Font.loadAsync({
      'Tajawal-Regular': require('@/assets/fonts/Tajawal-Regular.ttf'),
      'Tajawal-Bold': require('@/assets/fonts/Tajawal-Bold.ttf'),
    });
    setFontsLoaded(true);
  };

  const fetchRandomChallenge = async () => {
    try {
      const { data: challengesData, error: challengeError } = await supabase
        .rpc('get_active_challenges');
      if (challengeError) {
        console.error('Challenge fetch error:', challengeError);
        Alert.alert('خطأ', 'تعذر تحميل التحديات');
        setChallenge(null);
        return;
      }
      if (challengesData && challengesData.length > 0) {
        const randomIndex = Math.floor(Math.random() * challengesData.length);
        const selectedChallenge = challengesData[randomIndex];
        console.log('Selected random challenge:', selectedChallenge);
        setChallenge(selectedChallenge);
      } else {
        console.log('No active challenges found');
        setChallenge(null);
      }
    } catch (error) {
      console.error('Error fetching random challenge:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل التحدي');
      setChallenge(null);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User auth error:', userError);
        Alert.alert('خطأ', 'يرجى تسجيل الدخول');
        router.replace('/(auth)/login');
        return;
      }
      setUser(user);

      const { data: postsData, error: postsError } = await supabase
        .rpc('get_community_posts_with_counts');
      if (postsError) {
        console.error('Error fetching posts:', postsError);
        Alert.alert('خطأ', 'تعذر تحميل منشورات المجتمع');
      } else {
        console.log('Fetched posts:', postsData);
        setPosts(postsData || []);
      }

      const { data: likesData, error: likesError } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      if (likesError) {
        console.error('Error fetching likes:', likesError);
      } else {
        setLikedPosts(likesData.map(like => like.post_id) || []);
      }

      await fetchRandomChallenge();

      const today = new Date().toISOString().split('T')[0];
      const { data: deedsData, error: deedsError } = await supabase
        .from('user_suggestions')
        .select('user_id')
        .gte('completed_at', `${today}T00:00:00Z`)
        .lte('completed_at', `${today}T23:59:59Z`);
      if (deedsError) {
        console.error('Error fetching community stats:', deedsError);
      } else {
        const dailyDeeds = deedsData.length;
        const activeUsers = new Set(deedsData.map(d => d.user_id)).size;
        setCommunityStats({ active_users: activeUsers, daily_deeds: dailyDeeds });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostSubmit = async () => {
    if (!newPost.deed || !newPost.description || !newPost.category) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    setIsPosting(true);
    try {
      console.log('Submitting post:', { user_id: user.id, ...newPost });
      const { data: insertData, error: insertError } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          deed: newPost.deed,
          description: newPost.description,
          category: newPost.category,
          avatar_url: user.user_metadata?.avatar_url || null,
          user_name: user.user_metadata?.name || user.email || 'مستخدم مجهول'
        })
        .select('id')
        .single();
      if (insertError) {
        console.error('Post insert error:', insertError);
        Alert.alert('خطأ', `تعذر نشر المنشور: ${insertError.message}`);
        return;
      }

      const { data: postData, error: postError } = await supabase
        .rpc('get_community_post_by_id', { p_post_id: insertData.id, p_current_user_id: user.id })
        .single();
      if (postError) {
        console.error('Error fetching new post:', postError);
        Alert.alert('خطأ', 'تم نشر المنشور ولكن تعذر تحميله');
      } else {
        console.log('Created post:', postData);
        setPosts(prev => [postData, ...prev]);
        setNewPost({ deed: '', description: '', category: '' });
        setIsModalVisible(false);
        Alert.alert('نجاح', 'تم نشر المنشور بنجاح');
      }
    } catch (error) {
      console.error('Error submitting post:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء نشر المنشور');
    } finally {
      setIsPosting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    try {
      if (likedPosts.includes(postId)) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        if (error) throw error;
        setLikedPosts(prev => prev.filter(id => id !== postId));
        setPosts(prev => prev.map(post => post.id === postId ? { ...post, likes_count: post.likes_count - 1 } : post));
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ user_id: user.id, post_id: postId });
        if (error) throw error;
        setLikedPosts(prev => [...prev, postId]);
        setPosts(prev => prev.map(post => post.id === postId ? { ...post, likes_count: post.likes_count + 1 } : post));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('خطأ', 'تعذر تحديث الإعجاب');
    }
  };

  const joinChallenge = async () => {
    if (!user || !challenge) return;
    try {
      const { error } = await supabase
        .from('challenge_participants')
        .upsert({ user_id: user.id, challenge_id: challenge.id, progress: 0 });
      if (error) throw error;
      setChallenge(prev => prev ? { ...prev, participants_count: prev.participants_count + 1, user_progress: 0 } : null);
      Alert.alert('نجاح', 'تم الانضمام للتحدي بنجاح!');
    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert('خطأ', 'تعذر الانضمام للتحدي');
    }
  };

  const completeChallenge = async () => {
    if (!challenge || challenge.user_progress < challenge.goal_deeds) return;

    try {
      const newAchievement = {
        user_id: user.id,
        title: `إكمال تحدي: ${challenge.title}`,
        description: `أكملت التحدي بنجاح!`,
        icon: '🏅',
        unlocked: true,
      };

      const { error } = await supabase
        .from('achievements')
        .insert(newAchievement);

      if (error) {
        console.error('Error adding challenge achievement:', error);
      } else {
        Alert.alert('مبروك!', 'تم إضافة شارة التحدي إلى إنجازاتك.');
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'صدقة': return '#F59E0B';
      case 'قرآن': return '#8B5CF6';
      case 'مساعدة': return '#EF4444';
      case 'ذكر': return '#22C55E';
      default: return '#22C55E';
    }
  };

const getTimeAgo = (createdAt?: string | null) => {
  if (!createdAt) return 'تاريخ غير متاح';

  const createdDate = new Date(createdAt);
  if (isNaN(createdDate.getTime())) return 'تاريخ غير صالح';

  const now = new Date();
  const diff = now.getTime() - createdDate.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'منذ دقائق';
  if (hours < 24) return `منذ ${hours} ساعة`;

  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
};


  useEffect(() => {
    loadFonts();
    fetchData();

    const interval = setInterval(fetchRandomChallenge, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (challenge && challenge.user_progress >= challenge.goal_deeds) {
      completeChallenge();
    }
  }, [challenge]);

  if (!fontsLoaded || isLoading || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#EF4444', '#DC2626']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>مجتمع الخير</Text>
        <Text style={styles.headerSubtitle}>شارك أعمالك الخيرية وتفاعل مع الآخرين</Text>
      </LinearGradient>

      <View style={styles.postButtonContainer}>
        <TouchableOpacity
          style={styles.createPostButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.createPostButtonText}>إنشاء منشور جديد</Text>
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
            <Text style={styles.sectionTitle}>نشر عمل خيري</Text>
            <View style={styles.postForm}>
              <TextInput
                style={styles.input}
                placeholder="العمل الخيري (مثال: تلاوة القرآن)"
                value={newPost.deed}
                onChangeText={(text) => setNewPost(prev => ({ ...prev, deed: text }))}
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="وصف العمل الخيري"
                value={newPost.description}
                onChangeText={(text) => setNewPost(prev => ({ ...prev, description: text }))}
                placeholderTextColor="#9CA3AF"
                multiline
              />
              <View style={styles.categoryContainer}>
                {['ذكر', 'صدقة', 'قرآن', 'مساعدة'].map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      newPost.category === category && { backgroundColor: getCategoryColor(category) }
                    ]}
                    onPress={() => setNewPost(prev => ({ ...prev, category }))}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        newPost.category === category && styles.categoryButtonTextActive
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.submitButton, isPosting && styles.submitButtonDisabled]}
                  onPress={handlePostSubmit}
                  disabled={isPosting}
                >
                  <Send size={18} color="#ffffff" />
                  <Text style={styles.submitButtonText}>نشر</Text>
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

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Users size={24} color="#EF4444" />
          <Text style={styles.statNumber}>{communityStats?.active_users || 0}</Text>
          <Text style={styles.statLabel}>أعضاء نشطون</Text>
        </View>
        <View style={styles.statCard}>
          <Heart size={24} color="#22C55E" />
          <Text style={styles.statNumber}>{communityStats?.daily_deeds || 0}</Text>
          <Text style={styles.statLabel}>أعمال خير اليوم</Text>
        </View>
      </View>

      {challenge && (
        <View style={styles.challengeContainer}>
          <View style={styles.challengeHeader}>
            <Award size={20} color="#F59E0B" />
            <Text style={styles.challengeTitle}>التحدي العشوائي</Text>
          </View>
          
          <View style={styles.challengeCard}>
            <Text style={styles.challengeName}>{challenge.title}</Text>
            <Text style={styles.challengeDescription}>{challenge.description}</Text>
            
            <View style={styles.challengeMeta}>
              <Text style={styles.challengeParticipants}>
                {challenge.participants_count} مشارك
              </Text>
              <Text style={styles.challengeDays}>
                {Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} أيام متبقية
              </Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((challenge.user_progress || 0) / challenge.goal_deeds) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(((challenge.user_progress || 0) / challenge.goal_deeds) * 100)}%</Text>
            </View>
            
            <TouchableOpacity style={styles.joinButton} onPress={joinChallenge}>
              <Text style={styles.joinButtonText}>
                {challenge.user_progress != null ? 'تحديث التقدم' : 'انضم للتحدي'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.postsContainer}>
        <Text style={styles.sectionTitle}>مشاركات المجتمع</Text>
        
        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.authorInfo}>
                <Image
                  source={
                    post.avatar_url
                      ? { uri: post.avatar_url }
                      : require('@/assets/images/logo.png')
                  }
                  style={styles.avatar}
                />
                <View>
                <Text style={styles.authorName}>
                  {post.user_name || 'مستخدم مجهول'}
                </Text>

                  <Text style={styles.postTime}>{getTimeAgo(post.created_at)}</Text>
                </View>
              </View>
              <View style={[
                styles.categoryBadge,
                { backgroundColor: `${getCategoryColor(post.category)}20` }
              ]}>
                <Text style={[
                  styles.categoryText,
                  { color: getCategoryColor(post.category) }
                ]}>
                  {post.category}
                </Text>
              </View>
            </View>
            
            <View style={styles.postContent}>
              <Text style={styles.postDeed}>{post.deed}</Text>
              <Text style={styles.postDescription}>{post.description}</Text>
            </View>
            
            <View style={styles.postActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleLike(post.id)}
              >
                <Heart
                  size={18}
                  color={likedPosts.includes(post.id) ? '#EF4444' : '#9CA3AF'}
                  fill={likedPosts.includes(post.id) ? '#EF4444' : 'none'}
                />
                <Text style={[
                  styles.actionText,
                  likedPosts.includes(post.id) && styles.actionTextActive
                ]}>
                  {post.likes_count}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Share2 size={18} color="#9CA3AF" />
                <Text style={styles.actionText}>شارك</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  postButtonContainer: {
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  createPostButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  createPostButtonText: {
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
  postForm: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
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
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Tajawal-Regular',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
    fontFamily: 'Tajawal-Bold',
  },
  submitButton: {
    backgroundColor: '#EF4444',
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
    fontSize: 20,
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
  challengeContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Tajawal-Bold',
  },
  challengeCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  challengeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'Tajawal-Bold',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'right',
    fontFamily: 'Tajawal-Regular',
  },
  challengeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeParticipants: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    fontFamily: 'Tajawal-Bold',
  },
  challengeDays: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    fontFamily: 'Tajawal-Bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'center',
    fontFamily: 'Tajawal-Regular',
  },
  joinButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Tajawal-Bold',
  },
  postsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    textAlign: 'right',
    fontFamily: 'Tajawal-Bold',
  },
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Tajawal-Bold',
  },
  postTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Tajawal-Regular',
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
  postContent: {
    marginBottom: 12,
  },
  postDeed: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'right',
    fontFamily: 'Tajawal-Bold',
  },
  postDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'right',
    fontFamily: 'Tajawal-Regular',
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    fontFamily: 'Tajawal-Regular',
  },
  actionTextActive: {
    color: '#EF4444',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Tajawal-Regular',
  },
});
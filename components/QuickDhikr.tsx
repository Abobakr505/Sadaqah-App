import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Heart, X, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
  import * as Font from 'expo-font';

interface QuickDhikrProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (count: number) => void;
}

const dhikrOptions = [
  {
    id: '1',
    arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
    reward: 'شجرة في الجنة',
  },
  {
    id: '2',
    arabic: 'لَا إِلَهَ إِلَّا اللهُ',
    reward: 'أعظم الذكر',
  },
  {
    id: '3',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    reward: 'يصل عيك الله به',
  },
];

export default function QuickDhikr({ visible, onClose, onComplete }: QuickDhikrProps) {
  const [selectedDhikr, setSelectedDhikr] = useState(dhikrOptions[0]);
  const [count, setCount] = useState(0);
  const [scaleAnim] = useState(new Animated.Value(1));
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
  const handleDhikrTap = () => {
    setCount(prev => prev + 1);
    
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const resetCount = () => {
    setCount(0);
  };

  const completeDhikr = () => {
    onComplete(count);
    setCount(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.title}>ذكر سريع</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Dhikr Selection */}
          <View style={styles.dhikrSelection}>
            {dhikrOptions.map((dhikr) => (
              <TouchableOpacity
                key={dhikr.id}
                style={[
                  styles.dhikrOption,
                  selectedDhikr.id === dhikr.id && styles.dhikrOptionSelected
                ]}
                onPress={() => setSelectedDhikr(dhikr)}
              >
                <Text style={[
                  styles.dhikrArabic,
                  selectedDhikr.id === dhikr.id && styles.dhikrArabicSelected
                ]}>
                  {dhikr.arabic}
                </Text>
                <Text style={[
                  styles.dhikrReward,
                  selectedDhikr.id === dhikr.id && styles.dhikrRewardSelected
                ]}>
                  {dhikr.reward}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Counter */}
          <View style={styles.counterContainer}>
            <Text style={styles.counterLabel}>عدد التسبيحات</Text>
            <Text style={styles.counterNumber}>{count}</Text>
          </View>

          {/* Dhikr Button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={styles.dhikrButton}
              onPress={handleDhikrTap}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.dhikrButtonGradient}
              >
                <Heart size={32} color="#ffffff" />
                <Text style={styles.dhikrButtonText}>اضغط للتسبيح</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={resetCount}>
              <RotateCcw size={20} color="#6B7280" />
              <Text style={styles.resetButtonText}>إعادة تعيين</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.completeButton, count === 0 && styles.completeButtonDisabled]}
              onPress={completeDhikr}
              disabled={count === 0}
            >
              <Text style={styles.completeButtonText}>تم بحمد الله</Text>
            </TouchableOpacity>
          </View>

          {/* Selected Dhikr Info */}
          <View style={styles.dhikrInfo}>
            <Text style={styles.dhikrAyah}>وَذَكِّرْ فَإِنَّ الذِّكْرَىٰ تَنفَعُ الْمُؤْمِنِينَ</Text>
            <Text style={styles.dhikrSurah}>سورة الذاريات -</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Tajawal-Bold',
  },
  placeholder: {
    width: 32,
  },
  dhikrSelection: {
    marginBottom: 20,
    gap: 8,
  },
  dhikrOption: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dhikrOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  dhikrArabic: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Tajawal-Regular',
  },
  dhikrArabicSelected: {
    color: '#22C55E',
  },
  dhikrReward: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Tajawal-Regular',
  },
  dhikrRewardSelected: {
    color: '#16A34A',
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  counterLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'Tajawal-Regular',
  },
  counterNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#22C55E',
    fontFamily: 'Tajawal-Bold',
  },
  dhikrButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  dhikrButtonGradient: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  dhikrButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Tajawal-Bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  resetButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Tajawal-Regular',
  },
  completeButton: {
    flex: 2,
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Tajawal-Bold',
  },
  dhikrInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dhikrAyah: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Tajawal-Regular',
  },
  dhikrSurah: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'Tajawal-Regular',
  },
});
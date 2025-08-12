import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import * as Font from 'expo-font';
import moment from 'moment-hijri';
import 'moment/locale/ar';

// أشهر ميلادية بالعربي
const gregorianMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// أشهر هجرية بالعربي
const hijriMonths = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

// أيام الأسبوع بالعربي (JS Date: 0 = Sunday)
const weekDays = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء',
  'الخميس', 'الجمعة', 'السبت'
];

// تحويل أرقام إنجليزية إلى عربية (٠١٢...)
const toArabicNumbers = (num: number | string) =>
  num.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);

export default function IslamicDate() {
  const [islamicDate, setIslamicDate] = useState('');
  const [gregorianDate, setGregorianDate] = useState('');
  const [weekDay, setWeekDay] = useState('');
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // لحفظ معرف المؤقتات حتى نلغيها عند unmount
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const loadFonts = async () => {
    await Font.loadAsync({
      'Tajawal-Regular': require('@/assets/fonts/Tajawal-Regular.ttf'),
      'Tajawal-Bold': require('@/assets/fonts/Tajawal-Bold.ttf'),
    });
    setFontsLoaded(true);
  };

  const updateDates = () => {
    // هجري: من moment-hijri
    const nowMoment = moment();

    // ميلادي: من JS Date للتأكد من عدم حصول لبس
    const nowDate = new Date();

    const gDay = toArabicNumbers(nowDate.getDate());
    const gMonth = gregorianMonths[nowDate.getMonth()];
    const gYear = toArabicNumbers(nowDate.getFullYear());

    const hDay = toArabicNumbers(nowMoment.iDate());
    const hMonth = hijriMonths[nowMoment.iMonth()];
    const hYear = toArabicNumbers(nowMoment.iYear());

    const dayName = weekDays[nowDate.getDay()];

    setWeekDay(dayName);
    setIslamicDate(`${hDay} ${hMonth} ${hYear} هـ`);
    setGregorianDate(`${gDay} ${gMonth} ${gYear} م`);
  };

  useEffect(() => {
    loadFonts();
    updateDates();

    // وقت حتى منتصف الليل المحلي
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();

    // نحدّد timeout ليوم التالي ثم interval كل 24 ساعة
    timeoutRef.current = (setTimeout(() => {
      updateDates();
      intervalRef.current = setInterval(updateDates, 24 * 60 * 60 * 1000) as unknown as number;
    }, msUntilMidnight) as unknown) as number;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Calendar size={16} color="#6B7280" />
        <Text style={styles.title}>التاريخ</Text>
      </View>

      <View style={styles.dateInfo}>
        <Text style={styles.weekDay}>{weekDay}</Text>
        <Text style={styles.islamicDate}>{islamicDate}</Text>
        <Text style={styles.gregorianDate}>{gregorianDate}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Tajawal-Bold',
  },
  dateInfo: {
    alignItems: 'center',
    gap: 4,
  },
  weekDay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'center',
    fontFamily: 'Tajawal-Bold',
  },
  islamicDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
    textAlign: 'center',
    fontFamily: 'Tajawal-Regular',
  },
  gregorianDate: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Tajawal-Regular',
  },
});

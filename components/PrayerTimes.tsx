import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

export default function PrayerTimes() {
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const loadFonts = async () => {
    await Font.loadAsync({
      'Tajawal-Regular': require('@/assets/fonts/Tajawal-Regular.ttf'),
      'Tajawal-Bold': require('@/assets/fonts/Tajawal-Bold.ttf'),
    });
    setFontsLoaded(true);
  };

  const formatTo12Hour = (time) => {
    let [hour, minute] = time.split(':').map(Number);
    const suffix = hour >= 12 ? 'م' : 'ص';
    hour = hour % 12 || 12;
    return `${hour}:${minute.toString().padStart(2, '0')} ${suffix}`;
  };

  const getPrayerColors = (prayerKey) => {
    switch (prayerKey) {
      case 'Fajr':
        return ["#0f2027", "#203a43", "#2c5364"];
      case 'Dhuhr':
        return ["#ff9966", "#ff5e62"];
      case 'Asr':
        return ["#F7971E", "#FFD200"];
      case 'Maghrib':
        return ["#e96443", "#904e95"];
      case 'Isha':
        return ["#141E30", "#243B55"];
      default:
        return ["#2193b0", "#6dd5ed"];
    }
  };

  useEffect(() => {
    loadFonts();
  }, []);

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('يجب السماح بالوصول إلى الموقع');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const lat = location.coords.latitude;
        const lng = location.coords.longitude;

        const method = 5;
        const res = await fetch(
          `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${method}`
        );
        const data = await res.json();
        const timings = data.data.timings;

        const prayerOrder = [
          { key: 'Fajr', name: 'الفجر', icon: 'weather-night' },
          { key: 'Dhuhr', name: 'الظهر', icon: 'white-balance-sunny' },
          { key: 'Asr', name: 'العصر', icon: 'weather-sunset' },
          { key: 'Maghrib', name: 'المغرب', icon: 'weather-sunset-down' },
          { key: 'Isha', name: 'العشاء', icon: 'weather-night' },
        ];

        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        let current = null;
        let next = null;

        for (let i = 0; i < prayerOrder.length; i++) {
          const [h, m] = timings[prayerOrder[i].key].split(':').map(Number);
          const prayerMinutes = h * 60 + m;

          if (nowMinutes >= prayerMinutes) {
            current = {
              ...prayerOrder[i],
              time: formatTo12Hour(timings[prayerOrder[i].key])
            };
            next = prayerOrder[i + 1]
              ? { ...prayerOrder[i + 1], time: formatTo12Hour(timings[prayerOrder[i + 1].key]) }
              : { ...prayerOrder[0], time: formatTo12Hour(timings[prayerOrder[0].key]) };
          } else if (!current) {
            next = { ...prayerOrder[i], time: formatTo12Hour(timings[prayerOrder[i].key]) };
            current =
              i === 0
                ? { ...prayerOrder[prayerOrder.length - 1], time: formatTo12Hour(timings[prayerOrder[prayerOrder.length - 1].key]) }
                : { ...prayerOrder[i - 1], time: formatTo12Hour(timings[prayerOrder[i - 1].key]) };
            break;
          }
        }

        setCurrentPrayer(current);
        setNextPrayer(next);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPrayerTimes();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#2e8b57" style={{ marginTop: 50 ,  marginBottom: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}> أوقات الصلاة</Text>

      {currentPrayer && (
        <ExpoLinearGradient colors={getPrayerColors(currentPrayer.key)} style={[styles.card, styles.shadow]}>
          <MaterialCommunityIcons name={currentPrayer.icon} size={40} color="#fff" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardTitle}>الصلاة الحالية</Text>
            <View style={styles.nameTimeRow}>
              <Text style={styles.cardTime}>{currentPrayer.time}</Text>
              <Text style={styles.cardName}>{currentPrayer.name}</Text>
            </View>
          </View>
        </ExpoLinearGradient>
      )}

      {nextPrayer && (
        <ExpoLinearGradient colors={getPrayerColors(nextPrayer.key)} style={[styles.card, styles.shadow]}>
          <MaterialCommunityIcons name={nextPrayer.icon} size={40} color="#fff" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardTitle}>الصلاة القادمة</Text>
            <View style={styles.nameTimeRow}>
              <Text style={styles.cardTime}>{nextPrayer.time}</Text>
              <Text style={styles.cardName}>{nextPrayer.name}</Text>
            </View>
          </View>
        </ExpoLinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#22C55E',
    fontFamily: 'Tajawal-Bold',
  },
  nameTimeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    marginVertical: 12,
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  cardTitle: {
    color: '#f1f1f1',
    fontSize: 15,
    opacity: 0.85,
    fontFamily: 'Tajawal-Regular',
    textAlign: 'right',
  },
  cardName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Tajawal-Bold',
  },
  cardTime: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Tajawal-Bold',
    marginRight: 10,
  },
});
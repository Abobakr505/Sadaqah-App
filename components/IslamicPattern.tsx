import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface IslamicPatternProps {
  size?: number;
  color?: string;
  opacity?: number;
}

export default function IslamicPattern({ 
  size = 100, 
  color = '#ffffff', 
  opacity = 0.1 
}: IslamicPatternProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G opacity={opacity}>
          {/* Islamic geometric pattern */}
          <Path
            d="M50 10 L70 30 L50 50 L30 30 Z"
            fill={color}
            stroke={color}
            strokeWidth="1"
          />
          <Path
            d="M50 50 L70 70 L50 90 L30 70 Z"
            fill={color}
            stroke={color}
            strokeWidth="1"
          />
          <Path
            d="M10 50 L30 30 L50 50 L30 70 Z"
            fill={color}
            stroke={color}
            strokeWidth="1"
          />
          <Path
            d="M50 50 L70 30 L90 50 L70 70 Z"
            fill={color}
            stroke={color}
            strokeWidth="1"
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
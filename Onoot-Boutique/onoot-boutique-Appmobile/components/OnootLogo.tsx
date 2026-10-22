import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Rect, Path } from 'react-native-svg';

interface OnootLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'color' | 'white';
  showText?: boolean;
  textColor?: string;
}

export function OnootLogo({
  size = 'md',
  variant = 'color',
  showText = true,
  textColor,
}: OnootLogoProps) {
  const sizes = { sm: 32, md: 44, lg: 60, xl: 80 };
  const h = sizes[size] || 44;
  const textScale = h / 44;

  if (variant === 'white') {
    return (
      <View style={styles.container}>
        <Svg width={h} height={h} viewBox="0 0 44 44" fill="none">
          <G transform="rotate(-12, 12, 24)">
            <Rect x={4} y={14} width={16} height={20} rx={2} fill="white" fillOpacity={0.6} />
            <Path
              d="M9 14 Q9 10 13 10 Q17 10 17 14"
              stroke="white"
              strokeWidth={1.5}
              strokeLinecap="round"
              fill="none"
              opacity={0.6}
            />
          </G>
          <Rect x={14} y={12} width={16} height={22} rx={2} fill="white" fillOpacity={0.85} />
          <Path
            d="M18 12 Q18 7 22 7 Q26 7 26 12"
            stroke="white"
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
            opacity={0.85}
          />
          <G transform="rotate(12, 32, 22)">
            <Rect x={24} y={11} width={16} height={22} rx={2} fill="white" />
            <Path
              d="M27 11 Q27 6 31 6 Q35 6 35 11"
              stroke="white"
              strokeWidth={1.8}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        </Svg>
        {showText && (
          <View style={styles.textColumn}>
            <Text
              style={[
                styles.brandName,
                { fontSize: Math.round(18 * textScale), color: textColor || '#FFFFFF' },
              ]}
            >
              Onoot
            </Text>
            <Text
              style={[
                styles.brandSubtitle,
                {
                  fontSize: Math.round(8 * textScale),
                  color: textColor ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.75)',
                },
              ]}
            >
              BOUTIQUE
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Official colors matching the website exactly
  const titleColor = textColor || '#111827';
  const subColor = '#3DB649'; // Brand Green

  return (
    <View style={styles.container}>
      <Svg width={h} height={h} viewBox="0 0 44 44" fill="none">
        {/* Blue bag (back-left, #4BB5E8) */}
        <G transform="rotate(-14, 14, 26)">
          <Rect x={4} y={14} width={16} height={20} rx={2.5} fill="#4BB5E8" />
          <Rect x={4} y={14} width={16} height={5} fill="#3A9FD4" />
          <Path
            d="M9 14 Q9 9.5 12 9.5 Q15 9.5 15 14"
            stroke="#1D3D6B"
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
        </G>
        {/* Yellow bag (middle, #F5C430) */}
        <Rect x={14} y={11} width={16} height={23} rx={2.5} fill="#F5C430" />
        <Rect x={14} y={11} width={16} height={6} fill="#E0AF20" />
        <Path
          d="M18 11 Q18 6 22 6 Q26 6 26 11"
          stroke="#1D3D6B"
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
        />
        {/* Orange bag (front-right, #E87C2A) */}
        <G transform="rotate(14, 30, 24)">
          <Rect x={24} y={12} width={16} height={22} rx={2.5} fill="#E87C2A" />
          <Rect x={24} y={12} width={16} height={6} fill="#D06820" />
          <Path
            d="M28 12 Q28 7 32 7 Q36 7 36 12"
            stroke="#1D3D6B"
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      {showText && (
        <View style={styles.textColumn}>
          <Text
            style={[
              styles.brandName,
              { fontSize: Math.round(18 * textScale), color: titleColor },
            ]}
          >
            Onoot
          </Text>
          <Text
            style={[
              styles.brandSubtitle,
              { fontSize: Math.round(8 * textScale), color: subColor },
            ]}
          >
            BOUTIQUE
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  textColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandName: {
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: undefined,
  },
  brandSubtitle: {
    fontWeight: '800',
    letterSpacing: 2.2,
    marginTop: 1,
  },
});

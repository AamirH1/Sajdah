import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './hooks/useTheme';

// 1. Screen Container
export const ScreenContainer = ({ children, scrollable = true, heroGradient, style }: { children: React.ReactNode, scrollable?: boolean, heroGradient?: readonly [string, string], style?: ViewStyle }) => {
  const { colors } = useTheme();
  const content = scrollable ? (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, style]}>{children}</ScrollView>
  ) : (
    <View style={[styles.staticContent, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {heroGradient && (
        <LinearGradient
          pointerEvents="none"
          colors={heroGradient}
          style={styles.absoluteGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      )}
      {content}
    </SafeAreaView>
  );
};

// 2. Screen Header
export const ScreenHeader = ({ title, subtitle, rightAction }: { title: string, subtitle?: string, rightAction?: React.ReactNode }) => {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, zIndex: 10 }}>
      <View>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[typography.label, { color: colors.textSecondary, marginTop: 2 }]}>{subtitle}</Text>}
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
};

// 3. Card
export const Card = ({ children, style, elevated = false }: { children: React.ReactNode, style?: ViewStyle, elevated?: boolean }) => {
  const { colors, radius, spacing, shadows } = useTheme();
  return (
    <View style={[
      { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderColor: colors.border, borderWidth: elevated ? 0 : 1 },
      elevated && shadows.md,
      style
    ]}>
      {children}
    </View>
  );
};

// 4. Button
export const Button = ({ onPress, label, variant = 'primary', fullWidth = true, loading, disabled, icon, style }: { onPress: () => void, label: string, variant?: 'primary' | 'secondary' | 'destructive', fullWidth?: boolean, loading?: boolean, disabled?: boolean, icon?: React.ReactNode, style?: ViewStyle }) => {
  const { colors, radius, spacing, typography } = useTheme();
  
  const getBgColor = () => {
    if (disabled) return colors.border;
    if (variant === 'secondary') return colors.surfaceAlt;
    if (variant === 'destructive') return colors.error;
    return colors.primary;
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    if (variant === 'secondary') return colors.primary;
    return colors.onPrimary;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: getBgColor(), borderRadius: radius.full,
        paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
        width: fullWidth ? '100%' : 'auto'
      }, style]}
    >
      {loading ? <ActivityIndicator color={getTextColor()} /> : (
        <>
          {icon}
          <Text style={[typography.label, { color: getTextColor(), marginLeft: icon ? spacing.sm : 0 }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// 5. Icon Button
export const IconButton = ({ icon, onPress, color, size = 24, style }: { icon: keyof typeof Ionicons.glyphMap, onPress: () => void, color?: string, size?: number, style?: ViewStyle }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={[{ justifyContent: 'center', alignItems: 'center' }, style]}>
      <Ionicons name={icon} size={size} color={color || colors.textPrimary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  absoluteGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 350 },
  scrollContent: { paddingBottom: 48 },
  staticContent: { flex: 1 },
});

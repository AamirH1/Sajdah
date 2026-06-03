import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFloatingTabBarOffset } from '../../src/ui/tabBarMetrics';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  quran: 'book-outline',
  azkar: 'heart-outline',
  hadith: 'library-outline',
  settings: 'settings-outline',
};

const CENTER_TABS = ['quran', 'azkar', 'hadith'];

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  // Offset the floating tab clusters above the real Android/iOS system navigation area.
  const tabBarBottomOffset = getFloatingTabBarOffset(insets.bottom);

  const renderTab = (routeName: string, variant: 'circle' | 'group') => {
    const routeIndex = state.routes.findIndex((route) => route.name === routeName);
    const route = state.routes[routeIndex];

    if (!route) return null;

    const { options } = descriptors[route.key];
    const isFocused = state.index === routeIndex;
    const label =
      typeof options.tabBarLabel === 'string'
        ? options.tabBarLabel
        : typeof options.title === 'string'
          ? options.title
          : route.name;
    const iconName = TAB_ICONS[route.name] || 'ellipse-outline';
    const iconColor = isFocused ? colors.primary : colors.textMuted;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarButtonTestID}
        activeOpacity={0.78}
        onPress={onPress}
        style={[
          variant === 'circle' ? styles.circleTab : styles.groupTab,
          variant === 'circle' && { backgroundColor: '#FFFFFF', borderColor: colors.border },
          isFocused && { backgroundColor: '#FFFFFF' },
        ]}
      >
        <Ionicons name={iconName} size={variant === 'circle' ? 24 : 21} color={iconColor} />
        {variant === 'group' ? (
          <Text numberOfLines={1} style={[typography.xs, styles.groupLabel, { color: iconColor }]}>
            {label}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: tabBarBottomOffset }]}>
      {renderTab('index', 'circle')}
      <View style={[styles.centerGroup, { backgroundColor: '#FFFFFF', borderColor: colors.border }]}>
        {CENTER_TABS.map((routeName) => renderTab(routeName, 'group'))}
      </View>
      {renderTab('settings', 'circle')}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quran"
        options={{
          title: 'Quran',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="azkar"
        options={{
          title: 'Azkar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hadith"
        options={{
          title: 'Hadith',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 31,
    paddingHorizontal: 7,
    gap: 8,
  },
  circleTab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.10)',
  },
  centerGroup: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  groupTab: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupLabel: {
    marginTop: 2,
    fontWeight: '700',
  },
});

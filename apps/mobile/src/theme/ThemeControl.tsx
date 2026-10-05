import type { ThemePreference } from '@fleetiq/theme-preference';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from './ThemeProvider';
import { spacing } from './tokens';

const sequence: readonly ThemePreference[] = ['light', 'dark', 'system'];

function ThemeIcon({
  preference,
  color,
}: {
  preference: ThemePreference;
  color: string;
}) {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      {preference === 'light' && (
        <>
          <Circle
            cx={12}
            cy={12}
            fill="none"
            r={4}
            stroke={color}
            strokeWidth={1.8}
          />
          <Path
            d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={1.8}
          />
        </>
      )}
      {preference === 'dark' && (
        <Path
          d="M20.4 15.4A9 9 0 0 1 8.6 3.6 9 9 0 1 0 20.4 15.4Z"
          fill="none"
          stroke={color}
          strokeLinejoin="round"
          strokeWidth={1.8}
        />
      )}
      {preference === 'system' && (
        <>
          <Rect
            fill="none"
            height={13}
            rx={2}
            stroke={color}
            strokeWidth={1.8}
            width={18}
            x={3}
            y={4}
          />
          <Path
            d="M8 21h8m-4-4v4"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={1.8}
          />
        </>
      )}
    </Svg>
  );
}

/** One accessible icon cycles through the same three choices as web. */
export function ThemeControl() {
  const { preference, colors, saveFailed, setPreference } = useTheme();
  const next =
    sequence[(sequence.indexOf(preference) + 1) % sequence.length] ?? 'light';

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={`Theme: ${preference}. Switch to ${next}.`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => setPreference(next)}
        style={[
          styles.button,
          { backgroundColor: colors.surface, borderColor: colors.outline },
        ]}
      >
        <ThemeIcon color={colors.foreground} preference={preference} />
      </Pressable>
      {saveFailed && (
        <Text accessibilityRole="alert" style={{ color: colors.unknown }}>
          Theme choice could not be saved or restored.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-end' },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
});

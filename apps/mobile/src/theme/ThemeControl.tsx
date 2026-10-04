import type { ThemePreference } from '@fleetiq/theme-preference';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from './ThemeProvider';
import { spacing, typography } from './tokens';

const choices: readonly ThemePreference[] = ['light', 'dark', 'system'];

export function ThemeControl() {
  const { preference, colors, saveFailed, setPreference } = useTheme();

  return (
    <View>
      <Text style={{ color: colors.muted, fontSize: typography.label }}>
        Appearance
      </Text>
      <View style={styles.choices}>
        {choices.map((choice) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: preference === choice }}
            key={choice}
            onPress={() => setPreference(choice)}
            style={[
              styles.choice,
              {
                borderColor:
                  preference === choice ? colors.accent : colors.outline,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text
              style={{
                color:
                  preference === choice ? colors.accent : colors.foreground,
              }}
            >
              {choice.charAt(0).toUpperCase() + choice.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      {saveFailed && (
        <Text accessibilityRole="alert" style={{ color: colors.unknown }}>
          Theme choice could not be saved or restored.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  choices: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  choice: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});

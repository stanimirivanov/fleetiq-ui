import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../theme/tokens';

type Props = { tenantId: string; assetId: string };

/** Deep-linkable identity stub until a detail contract is available. */
export function AssetIdentityScreen({ tenantId, assetId }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>FleetIQ</Text>
      <Text style={styles.title} accessibilityRole="header">Asset {assetId}</Text>
      <Text style={styles.muted}>Tenant {tenantId}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detail not connected</Text>
        <Text style={styles.muted}>This route carries an asset identifier only. Live detail, telemetry, and condition are not available yet.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  brand: { color: colors.accent, fontSize: typography.label, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' },
  title: { color: colors.foreground, fontSize: typography.title, fontWeight: '600', marginTop: spacing.lg },
  muted: { color: colors.muted, fontSize: typography.body, lineHeight: 24, marginTop: spacing.sm },
  card: { backgroundColor: colors.surface, borderColor: colors.outline, borderRadius: 12, borderWidth: 1, padding: spacing.lg, marginTop: spacing.xl },
  cardTitle: { color: colors.foreground, fontSize: 18, fontWeight: '600' },
});

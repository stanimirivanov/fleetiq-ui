import type { AssetPage } from '@fleetiq/api-contract';
import type { AssetPageLoader } from '@fleetiq/asset-catalogue';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ThemeControl } from '../../../theme/ThemeControl';
import { useTheme } from '../../../theme/ThemeProvider';
import { palettes, spacing, type ThemeColors, typography } from '../../../theme/tokens';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; page: AssetPage }
  | { kind: 'error' };

type Props = {
  tenantId?: string;
  loadPage?: AssetPageLoader;
  onSelect: (assetId: string) => void;
};

/** Native identity list backed only by an explicitly supplied page loader. */
export function AssetListScreen({ tenantId, loadPage, onSelect }: Props) {
  const { scheme, colors } = useTheme();
  const styles = stylesByTheme[scheme];
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!tenantId || !loadPage) return;
    const controller = new AbortController();
    setState({ kind: 'loading' });
    void loadPage(tenantId, null, controller.signal).then(
      (page) => {
        if (!controller.signal.aborted) {
          setState(
            page.assets.every((asset) => asset.tenant_id === tenantId)
              ? { kind: 'ready', page }
              : { kind: 'error' },
          );
        }
      },
      () => {
        if (!controller.signal.aborted) setState({ kind: 'error' });
      },
    );
    return () => {
      controller.abort();
    };
  }, [tenantId, loadPage, reload]);

  const retry = useCallback(() => setReload((value) => value + 1), []);

  return (
    <View style={styles.container}>
      <ThemeControl />
      <Text style={styles.brand}>FleetIQ</Text>
      <Text style={styles.title} accessibilityRole="header">Assets</Text>
      <Text style={styles.muted}>Tenant {tenantId ?? 'not selected'}</Text>
      {!tenantId || !loadPage ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Catalogue not connected</Text>
          <Text style={styles.muted}>A production identity and API client are required before tenant assets can be shown.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.preview}>Development preview. Asset identities are synthetic; live condition is unavailable.</Text>
          {state.kind === 'loading' && (
            <View style={styles.feedback}>
              <ActivityIndicator color={colors.accent} accessibilityLabel="Loading assets" />
              <Text style={styles.muted}>Loading assets…</Text>
            </View>
          )}
          {state.kind === 'error' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Assets unavailable</Text>
              <Text style={styles.muted}>The asset catalogue could not be loaded.</Text>
              <Pressable accessibilityRole="button" onPress={retry} style={styles.action}>
                <Text style={styles.actionText}>Retry</Text>
              </Pressable>
            </View>
          )}
          {state.kind === 'ready' && (
            <FlatList
              contentContainerStyle={styles.list}
              data={state.page.assets}
              keyExtractor={(asset) => asset.id}
              ListEmptyComponent={<Text style={styles.muted}>No assets are registered for this tenant.</Text>}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={'Open asset ' + item.name}
                  onPress={() => onSelect(item.id)}
                  style={styles.card}
                >
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.muted}>ID {item.id} · Type {item.asset_type.id} v{item.asset_type.version}</Text>
                  <Text style={styles.unknown}>Condition unknown</Text>
                </Pressable>
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
    brand: { color: colors.accent, fontSize: typography.label, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginTop: spacing.lg },
    title: { color: colors.foreground, fontSize: typography.title, fontWeight: '600', marginTop: spacing.lg },
    muted: { color: colors.muted, fontSize: typography.body, lineHeight: 24, marginTop: spacing.sm },
    preview: { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.accent, borderWidth: 1, borderRadius: 10, padding: spacing.md, marginTop: spacing.lg },
    feedback: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
    list: { gap: spacing.md, paddingVertical: spacing.lg },
    card: { backgroundColor: colors.surface, borderColor: colors.outline, borderRadius: 12, borderWidth: 1, padding: spacing.lg, marginTop: spacing.md },
    cardTitle: { color: colors.foreground, fontSize: 18, fontWeight: '600' },
    unknown: { color: colors.unknown, fontSize: typography.label, marginTop: spacing.md },
    action: { borderColor: colors.accent, borderWidth: 1, borderRadius: 8, alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.md },
    actionText: { color: colors.accent, fontSize: typography.body, fontWeight: '600' },
  });
}

const stylesByTheme = {
  light: createStyles(palettes.light),
  dark: createStyles(palettes.dark),
};
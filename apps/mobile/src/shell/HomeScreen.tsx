import { StyleSheet, Text, View } from 'react-native';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>FleetIQ</Text>
      <Text style={styles.title}>Fleet workspace</Text>
      <Text style={styles.body}>
        The mobile shell is ready. Asset views and alerts will arrive as
        contract-backed feature slices.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connected data</Text>
        <Text style={styles.cardBody}>No backend data is connected yet.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  brand: {
    color: '#67e8f9',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '600',
    marginTop: 32,
  },
  body: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 40,
    padding: 24,
  },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '500' },
  cardBody: { color: '#94a3b8', fontSize: 15, marginTop: 8 },
});

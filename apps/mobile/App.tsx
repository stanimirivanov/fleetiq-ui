import type { AssetPageLoader } from '@fleetiq/asset-catalogue';
import {
  DefaultTheme,
  type LinkingOptions,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createPreviewAssetPageLoader } from './src/features/assets/api/previewCatalogue';
import { AssetIdentityScreen } from './src/features/assets/ui/AssetIdentityScreen';
import { AssetListScreen } from './src/features/assets/ui/AssetListScreen';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';

type RootStackParamList = {
  Assets: { tenantId?: string } | undefined;
  AssetIdentity: { tenantId: string; assetId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const preview = __DEV__ && process.env.EXPO_PUBLIC_API_MODE === 'mock';
const loadPage: AssetPageLoader | undefined = preview
  ? createPreviewAssetPageLoader()
  : undefined;

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'fleetiq://'],
  config: {
    screens: {
      Assets: 'tenants/:tenantId/assets',
      AssetIdentity: 'tenants/:tenantId/assets/:assetId',
    },
  },
};

function ThemedApp() {
  const { scheme, colors } = useTheme();
  const navigationTheme = {
    ...DefaultTheme,
    dark: scheme === 'dark',
    colors: {
      primary: colors.accent,
      background: colors.canvas,
      card: colors.surface,
      text: colors.foreground,
      border: colors.outline,
      notification: colors.unknown,
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking} theme={navigationTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack.Navigator
          initialRouteName="Assets"
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.foreground,
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          <Stack.Screen
            name="Assets"
            initialParams={preview ? { tenantId: 'tenant-a' } : undefined}
            options={{ headerShown: false }}
          >
            {({ navigation, route }) => (
              <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
                <AssetListScreen
                  tenantId={route.params?.tenantId}
                  loadPage={loadPage}
                  onSelect={(assetId) => {
                    const tenantId = route.params?.tenantId;
                    if (tenantId)
                      navigation.navigate('AssetIdentity', {
                        tenantId,
                        assetId,
                      });
                  }}
                />
              </SafeAreaView>
            )}
          </Stack.Screen>
          <Stack.Screen
            name="AssetIdentity"
            options={{ title: 'Asset identity' }}
          >
            {({ route }) => (
              <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
                <AssetIdentityScreen
                  tenantId={route.params.tenantId}
                  assetId={route.params.assetId}
                />
              </SafeAreaView>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

/** Native composition owns navigation and the persisted appearance choice. */
export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

import type { AssetPageLoader } from '@fleetiq/asset-catalogue';
import {
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
import { colors } from './src/theme/tokens';

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

/** Native composition owns navigation and chooses the explicit preview adapter. */
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <StatusBar style="light" />
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
            options={{ title: 'Assets' }}
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

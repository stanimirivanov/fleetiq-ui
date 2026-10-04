import {
  NavigationContainer,
  type LinkingOptions,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { listFixtureAssets } from './src/features/assets/api/fixtureAssetCatalogue';
import {
  AssetListScreen,
  type NativeAssetPageLoader,
} from './src/features/assets/ui/AssetListScreen';
import { AssetIdentityScreen } from './src/features/assets/ui/AssetIdentityScreen';
import { colors } from './src/theme/tokens';

type RootStackParamList = {
  Assets: { tenantId?: string } | undefined;
  AssetIdentity: { tenantId: string; assetId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const preview = __DEV__ && process.env.EXPO_PUBLIC_API_MODE === 'mock';
const loadPage: NativeAssetPageLoader | undefined = preview
  ? listFixtureAssets
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

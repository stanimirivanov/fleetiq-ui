import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/shell/HomeScreen';

export default function App() {
  return (
    <>
      <HomeScreen />
      <StatusBar style="light" />
    </>
  );
}

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Home',
          }}
        />
        <Stack.Screen
          name="approvals"
          options={{
            title: 'Approvals',
          }}
        />
        <Stack.Screen
          name="timeline"
          options={{
            title: 'Timeline',
          }}
        />
        <Stack.Screen
          name="group"
          options={{
            title: 'Group',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
        <Stack.Screen
          name="scan"
          options={{
            title: 'Scan QR Code',
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

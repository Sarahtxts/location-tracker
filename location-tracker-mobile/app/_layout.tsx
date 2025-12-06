import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { AuthProvider } from '../utils/AuthContext';
import { API_URL } from '../services/api';
import { lightTheme } from '../constants/theme';

export default function RootLayout() {
    useEffect(() => {
        console.log("🚀 ROOT LAYOUT MOUNTED. API URL:", API_URL);
    }, []);

    return (
        <SafeAreaProvider>
            <PaperProvider theme={lightTheme}>
                <AuthProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(user)" />
                        <Stack.Screen name="(admin)" />
                    </Stack>
                </AuthProvider>
            </PaperProvider>
        </SafeAreaProvider>
    );
}

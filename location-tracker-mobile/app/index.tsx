import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../utils/AuthContext';
import { Colors } from '../constants/theme';

export default function Index() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (user) {
                // Redirect to appropriate dashboard based on role
                if (user.role === 'admin') {
                    router.replace('/(admin)/dashboard');
                } else {
                    router.replace('/(user)/dashboard');
                }
            } else {
                // Redirect to login
                router.replace('/(auth)/login');
            }
        }
    }, [user, isLoading]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={Colors.user.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
});

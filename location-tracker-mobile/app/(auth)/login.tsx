import { useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    TextInput,
    Button,
    Text,
    SegmentedButtons,
    Surface,
    ActivityIndicator,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../utils/AuthContext';
import { authAPI } from '../../services/api';
import { Colors } from '../../constants/theme';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();

    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }
        if (!password.trim()) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.login(name.trim(), role, password);

            if (response.data.success) {
                const userData = {
                    name: response.data.user.name,
                    role: response.data.user.role,
                    phoneNumber: response.data.user.phoneNumber,
                    reportingManagerEmail: response.data.user.reportingManagerEmail,
                };

                await login(userData);

                // Navigate to appropriate dashboard
                if (role === 'admin') {
                    router.replace('/(admin)/dashboard');
                } else {
                    router.replace('/(user)/dashboard');
                }
            } else {
                Alert.alert('Login Failed', response.data.message || 'Invalid credentials');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error.message || 'Unknown error';
            const errorStatus = error.response ? `Status: ${error.response.status}` : '';
            Alert.alert(
                'Connection Error',
                `Cannot connect to server.\nError: ${errorMessage}\n${errorStatus}\nMake sure the backend is running and reachable.`
            );
        } finally {
            setLoading(false);
        }
    };

    const primaryColor = role === 'admin' ? Colors.admin.primary : Colors.user.primary;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text variant="displaySmall" style={styles.title}>
                                Location Tracker
                            </Text>
                            <Text variant="bodyLarge" style={styles.subtitle}>
                                Track your visits with ease
                            </Text>
                        </View>

                        {/* Login Form */}
                        <Surface style={styles.formContainer} elevation={2}>
                            {/* Role Selector */}
                            <View style={styles.roleSelector}>
                                <Text variant="labelLarge" style={styles.label}>
                                    Select Role
                                </Text>
                                <SegmentedButtons
                                    value={role}
                                    onValueChange={(value) => setRole(value as 'user' | 'admin')}
                                    buttons={[
                                        {
                                            value: 'user',
                                            label: 'User',
                                            icon: 'account',
                                            style: role === 'user' ? { backgroundColor: Colors.user.light } : {},
                                        },
                                        {
                                            value: 'admin',
                                            label: 'Admin',
                                            icon: 'shield-account',
                                            style: role === 'admin' ? { backgroundColor: Colors.admin.light } : {},
                                        },
                                    ]}
                                />
                            </View>

                            {/* Name Input */}
                            <TextInput
                                label="Name"
                                value={name}
                                onChangeText={setName}
                                mode="outlined"
                                left={<TextInput.Icon icon="account" />}
                                style={styles.input}
                                autoCapitalize="words"
                                autoCorrect={false}
                                disabled={loading}
                            />

                            {/* Password Input */}
                            <TextInput
                                label="Password"
                                value={password}
                                onChangeText={setPassword}
                                mode="outlined"
                                secureTextEntry={!showPassword}
                                left={<TextInput.Icon icon="lock" />}
                                right={
                                    <TextInput.Icon
                                        icon={showPassword ? 'eye-off' : 'eye'}
                                        onPress={() => setShowPassword(!showPassword)}
                                    />
                                }
                                style={styles.input}
                                autoCapitalize="none"
                                autoCorrect={false}
                                disabled={loading}
                                onSubmitEditing={handleLogin}
                            />

                            {/* Login Button */}
                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                loading={loading}
                                disabled={loading}
                                style={[styles.loginButton, { backgroundColor: primaryColor }]}
                                contentStyle={styles.loginButtonContent}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </Button>

                            {/* Info Text */}
                            <Text variant="bodySmall" style={styles.infoText}>
                                Contact your administrator if you don't have credentials
                            </Text>
                        </Surface>

                        {/* Footer */}
                        <Text variant="bodySmall" style={styles.footer}>
                            Location Tracker v1.0.0
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.gray[50],
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontWeight: 'bold',
        color: Colors.gray[900],
        marginBottom: 8,
    },
    subtitle: {
        color: Colors.gray[600],
    },
    formContainer: {
        padding: 24,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
    },
    roleSelector: {
        marginBottom: 24,
    },
    label: {
        marginBottom: 8,
        color: Colors.gray[700],
    },
    input: {
        marginBottom: 16,
    },
    loginButton: {
        marginTop: 8,
        marginBottom: 16,
    },
    loginButtonContent: {
        paddingVertical: 8,
    },
    infoText: {
        textAlign: 'center',
        color: Colors.gray[600],
    },
    footer: {
        textAlign: 'center',
        marginTop: 24,
        color: Colors.gray[500],
    },
});

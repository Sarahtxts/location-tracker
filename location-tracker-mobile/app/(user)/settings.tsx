import { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Text,
    TextInput,
    Button,
    Avatar,
    List,
    Surface,
    Switch,
    Divider,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../utils/AuthContext';
import { userAPI } from '../../services/api';
import { getInitials } from '../../utils/helpers';
import { Colors } from '../../constants/theme';

export default function UserSettings() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [reportingManagerEmail, setReportingManagerEmail] = useState('');

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setPhoneNumber(user.phoneNumber || '');
            setReportingManagerEmail(user.reportingManagerEmail || '');
        }
    }, [user]);

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    }
                },
            ]
        );
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all password fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            // Verify current password by logging in (mock verification since we don't have verify endpoint)
            // Ideally backend should have a verify-password endpoint or update-password should take current password
            // For now, we'll just proceed with update as per existing backend logic which trusts the client if authenticated

            const response = await userAPI.updateUser({
                name: user!.name,
                role: user!.role,
                phoneNumber,
                reportingManagerEmail,
                password: newPassword,
            });

            if (response.data.success) {
                Alert.alert('Success', 'Password changed successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                Alert.alert('Error', 'Failed to change password');
            }
        } catch (error) {
            console.error('Password change error:', error);
            Alert.alert('Error', 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Profile Header */}
                    <View style={styles.header}>
                        <Avatar.Text
                            size={80}
                            label={getInitials(user?.name || '')}
                            style={{ backgroundColor: Colors.user.light, marginBottom: 16 }}
                            color={Colors.user.primary}
                        />
                        <Text variant="headlineSmall" style={styles.name}>{user?.name}</Text>
                        <Text variant="bodyMedium" style={styles.role}>{user?.role?.toUpperCase()}</Text>
                    </View>

                    {/* Contact Info */}
                    <Surface style={styles.section} elevation={1}>
                        <List.Section>
                            <List.Subheader>Contact Information</List.Subheader>
                            <View style={styles.formPadding}>
                                <TextInput
                                    label="Phone Number"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    mode="outlined"
                                    disabled={true} // Only admin can edit usually
                                    style={styles.input}
                                    left={<TextInput.Icon icon="phone" />}
                                />
                                <Text variant="bodySmall" style={styles.helperText}>
                                    Contact admin to update phone number
                                </Text>

                                <TextInput
                                    label="Reporting Manager Email"
                                    value={reportingManagerEmail}
                                    onChangeText={setReportingManagerEmail}
                                    mode="outlined"
                                    disabled={true} // Only admin can edit usually
                                    style={styles.input}
                                    left={<TextInput.Icon icon="email" />}
                                />
                                <Text variant="bodySmall" style={styles.helperText}>
                                    Contact admin to update manager email
                                </Text>
                            </View>
                        </List.Section>
                    </Surface>

                    {/* Security */}
                    <Surface style={styles.section} elevation={1}>
                        <List.Section>
                            <List.Subheader>Security</List.Subheader>
                            <View style={styles.formPadding}>
                                <TextInput
                                    label="Current Password"
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    mode="outlined"
                                    secureTextEntry={!showPassword}
                                    style={styles.input}
                                    left={<TextInput.Icon icon="lock" />}
                                />

                                <TextInput
                                    label="New Password"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    mode="outlined"
                                    secureTextEntry={!showPassword}
                                    style={styles.input}
                                    left={<TextInput.Icon icon="lock-plus" />}
                                />

                                <TextInput
                                    label="Confirm New Password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    mode="outlined"
                                    secureTextEntry={!showPassword}
                                    style={styles.input}
                                    left={<TextInput.Icon icon="lock-check" />}
                                />

                                <View style={styles.showPasswordRow}>
                                    <Text>Show Passwords</Text>
                                    <Switch value={showPassword} onValueChange={setShowPassword} />
                                </View>

                                <Button
                                    mode="contained"
                                    onPress={handleChangePassword}
                                    loading={loading}
                                    disabled={loading || !currentPassword || !newPassword}
                                    style={styles.button}
                                >
                                    Change Password
                                </Button>
                            </View>
                        </List.Section>
                    </Surface>

                    {/* Logout */}
                    <View style={styles.logoutContainer}>
                        <Button
                            mode="outlined"
                            onPress={handleLogout}
                            textColor={Colors.error}
                            style={{ borderColor: Colors.error }}
                            icon="logout"
                        >
                            Logout
                        </Button>
                        <Text style={styles.versionText}>Version 1.0.0</Text>
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
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    name: {
        fontWeight: 'bold',
        color: Colors.gray[900],
    },
    role: {
        color: Colors.gray[500],
        marginTop: 4,
    },
    section: {
        marginTop: 16,
        marginHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
    },
    formPadding: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    input: {
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    helperText: {
        color: Colors.gray[500],
        marginBottom: 16,
        marginLeft: 4,
    },
    showPasswordRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        backgroundColor: Colors.user.primary,
    },
    logoutContainer: {
        padding: 24,
        alignItems: 'center',
    },
    versionText: {
        marginTop: 16,
        color: Colors.gray[400],
        fontSize: 12,
    },
});

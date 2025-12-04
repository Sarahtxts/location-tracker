import { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    RefreshControl,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Text,
    Card,
    FAB,
    ActivityIndicator,
    Avatar,
    IconButton,
    TextInput,
    Button,
    SegmentedButtons,
    Surface,
} from 'react-native-paper';
import { userAPI } from '../../services/api';
import { getInitials } from '../../utils/helpers';
import { Colors } from '../../constants/theme';

export default function AdminUsers() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Form State
    const [editingUser, setEditingUser] = useState<any>(null);
    const [name, setName] = useState('');
    const [role, setRole] = useState('user');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await userAPI.getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Error loading users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadUsers();
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setName('');
        setRole('user');
        setPhoneNumber('');
        setEmail('');
        setPassword('');
        setModalVisible(true);
    };

    const handleEditUser = (user: any) => {
        setEditingUser(user);
        setName(user.name);
        setRole(user.role);
        setPhoneNumber(user.phoneNumber || '');
        setEmail(user.reportingManagerEmail || '');
        setPassword(''); // Don't show current password
        setModalVisible(true);
    };

    const handleDeleteUser = (user: any) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to delete ${user.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await userAPI.deleteUser(user.name);
                            loadUsers();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete user');
                        }
                    },
                },
            ]
        );
    };

    const handleSaveUser = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }
        if (!editingUser && !password) {
            Alert.alert('Error', 'Password is required for new users');
            return;
        }

        setActionLoading(true);
        try {
            const userData = {
                name,
                role,
                phoneNumber,
                reportingManagerEmail: email,
                password: password || (editingUser ? editingUser.password : ''), // Keep old password if not changed
            };

            await userAPI.updateUser(userData);
            setModalVisible(false);
            loadUsers();
            Alert.alert('Success', `User ${editingUser ? 'updated' : 'created'} successfully`);
        } catch (error) {
            console.error('Save user error:', error);
            Alert.alert('Error', 'Failed to save user');
        } finally {
            setActionLoading(false);
        }
    };

    const renderUserItem = ({ item }: { item: any }) => (
        <Card style={styles.card} mode="elevated">
            <Card.Content style={styles.cardContent}>
                <View style={styles.userInfo}>
                    <Avatar.Text
                        size={40}
                        label={getInitials(item.name)}
                        style={{ backgroundColor: item.role === 'admin' ? Colors.admin.light : Colors.user.light }}
                        color={item.role === 'admin' ? Colors.admin.primary : Colors.user.primary}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text variant="titleMedium" style={styles.userName}>{item.name}</Text>
                        <Text variant="bodySmall" style={styles.userRole}>{item.role.toUpperCase()}</Text>
                    </View>
                </View>
                <View style={styles.actions}>
                    <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEditUser(item)}
                    />
                    <IconButton
                        icon="delete"
                        size={20}
                        iconColor={Colors.error}
                        onPress={() => handleDeleteUser(item)}
                    />
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.admin.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUserItem}
                    keyExtractor={item => item.id?.toString() || item.name}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={handleAddUser}
                color="#FFFFFF"
                theme={{ colors: { primary: Colors.admin.primary } }}
            />

            {/* Add/Edit User Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalHeader}>
                        <Text variant="titleLarge">{editingUser ? 'Edit User' : 'Add New User'}</Text>
                        <Button onPress={() => setModalVisible(false)}>Cancel</Button>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <TextInput
                            label="Name"
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            style={styles.input}
                            disabled={!!editingUser} // Name is ID, so can't change
                        />

                        <View style={styles.roleContainer}>
                            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>Role</Text>
                            <SegmentedButtons
                                value={role}
                                onValueChange={setRole}
                                buttons={[
                                    { value: 'user', label: 'User' },
                                    { value: 'admin', label: 'Admin' },
                                ]}
                            />
                        </View>

                        <TextInput
                            label="Phone Number"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            mode="outlined"
                            keyboardType="phone-pad"
                            style={styles.input}
                        />

                        <TextInput
                            label="Reporting Manager Email"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            keyboardType="email-address"
                            style={styles.input}
                            autoCapitalize="none"
                        />

                        <TextInput
                            label={editingUser ? "New Password (Optional)" : "Password"}
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry
                            style={styles.input}
                        />

                        <Button
                            mode="contained"
                            onPress={handleSaveUser}
                            loading={actionLoading}
                            disabled={actionLoading}
                            style={styles.saveButton}
                        >
                            Save User
                        </Button>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.gray[50],
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userName: {
        fontWeight: 'bold',
        color: Colors.gray[900],
    },
    userRole: {
        color: Colors.gray[500],
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.admin.primary,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    modalContent: {
        padding: 24,
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    roleContainer: {
        marginBottom: 20,
    },
    saveButton: {
        marginTop: 8,
        backgroundColor: Colors.admin.primary,
        paddingVertical: 6,
    },
});

import { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    RefreshControl,
    Alert,
    Share,
    Linking,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Text,
    Card,
    Searchbar,
    Chip,
    ActivityIndicator,
    FAB,
    Avatar,
    Divider,
    Menu,
    Button,
    IconButton,
    Dialog,
    Portal,
    TextInput,
    Checkbox,
} from 'react-native-paper';
import { useAuth } from '../../utils/AuthContext';
import { visitsAPI, reportsAPI, userAPI } from '../../services/api';
import { formatDate, formatTime, formatDuration } from '../../utils/helpers';
import { Colors } from '../../constants/theme';

export default function AdminReports() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [visits, setVisits] = useState<any[]>([]);
    const [filteredVisits, setFilteredVisits] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

    // User Filter
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [userMenuVisible, setUserMenuVisible] = useState(false);

    // FAB Menu
    const [fabOpen, setFabOpen] = useState(false);

    // Email Dialog
    const [emailDialogVisible, setEmailDialogVisible] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');

    const [sendingReport, setSendingReport] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [visits, searchQuery, filter, selectedUsers]);

    const loadData = async () => {
        try {
            const [visitsRes, usersRes] = await Promise.all([
                visitsAPI.getVisits(),
                userAPI.getUsers(),
            ]);

            // Sort visits by date desc
            const sorted = visitsRes.data.sort((a: any, b: any) =>
                new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
            );
            setVisits(sorted);
            setUsers(usersRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load reports data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFilters = () => {
        let result = [...visits];

        // User Filter
        if (selectedUsers.length > 0) {
            result = result.filter(v => selectedUsers.includes(v.userName));
        }

        // Date Filter
        const now = new Date();
        if (filter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            result = result.filter(v => new Date(v.checkInTime) >= weekAgo);
        } else if (filter === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            result = result.filter(v => new Date(v.checkInTime) >= monthAgo);
        }

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();

            // Check if searching for mismatches
            if (query === 'mismatch' || query === 'mismatches') {
                result = result.filter(v => !!v.locationMismatch);
            } else {
                // Regular search
                result = result.filter(v =>
                    v.clientName.toLowerCase().includes(query) ||
                    v.companyName.toLowerCase().includes(query) ||
                    v.checkInAddress.toLowerCase().includes(query) ||
                    v.userName.toLowerCase().includes(query)
                );
            }
        }

        setFilteredVisits(result);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleEmailReport = () => {
        // Show email input dialog
        setRecipientEmail(user?.reportingManagerEmail || '');
        setEmailDialogVisible(true);
    };

    const sendEmailReport = async () => {
        if (!user || !recipientEmail.trim()) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setEmailDialogVisible(false);
        setSendingReport(true);

        try {
            const response = await reportsAPI.sendReport({
                userName: user.name,
                userRole: user.role,
                visits: filteredVisits,
                recipientEmail: recipientEmail.trim(),
            });

            if (response.data.success) {
                Alert.alert('Success', `Report sent successfully to ${recipientEmail}!`);
                setRecipientEmail('');
            } else {
                Alert.alert('Error', 'Failed to send report');
            }
        } catch (error) {
            console.error('Report error:', error);
            Alert.alert('Error', 'Failed to send report');
        } finally {
            setSendingReport(false);
        }
    };

    const handleShare = async () => {
        try {
            const message = filteredVisits.map(v =>
                `[${v.userName}] ${v.clientName}\nIn: ${v.checkInTime}\nOut: ${v.checkOutTime || 'Active'}\n`
            ).join('\n---\n\n');

            await Share.share({
                message: `Admin Report\n\n${message}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleExportCSV = async () => {
        try {
            const header = 'User Name,Client Name,Company Name,Check In Time,Check In Address,Check Out Time,Check Out Address,Duration,Mismatch\n';
            const rows = filteredVisits.map(v => {
                const duration = v.checkOutTime ? formatDuration(v.checkInTime, v.checkOutTime) : 'Active';
                const mismatch = v.locationMismatch ? 'Yes' : 'No';
                // Escape commas in fields
                const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

                return [
                    escape(v.userName),
                    escape(v.clientName),
                    escape(v.companyName),
                    escape(v.checkInTime),
                    escape(v.checkInAddress),
                    escape(v.checkOutTime || ''),
                    escape(v.checkOutAddress || ''),
                    escape(duration),
                    escape(mismatch)
                ].join(',');
            }).join('\n');

            const csvContent = header + rows;

            await Share.share({
                message: csvContent,
                title: 'Admin_Visits_Report.csv'
            });
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Error', 'Failed to export CSV');
        }
    };

    const openMap = (link?: string) => {
        if (link) {
            Linking.openURL(link).catch(err => console.error("Couldn't load page", err));
        } else {
            Alert.alert('Info', 'No map link available');
        }
    };

    const renderVisitItem = ({ item }: { item: any }) => (
        <Card style={styles.card} mode="elevated">
            <Card.Content>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text variant="titleMedium" style={styles.clientName}>{item.clientName}</Text>
                        <Text variant="bodySmall" style={styles.userName}>by {item.userName}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text variant="bodySmall" style={styles.date}>
                            {formatDate(item.checkInTime)}
                        </Text>
                        {!!item.locationMismatch && (
                            <Chip icon="alert" style={styles.warningChip} textStyle={{ fontSize: 10, color: '#92400E' }}>
                                Mismatch
                            </Chip>
                        )}
                    </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.detailsRow}>
                    <View style={styles.timeBlock}>
                        <View style={styles.iconRow}>
                            <Avatar.Icon size={20} icon="login" style={{ backgroundColor: 'transparent' }} color={Colors.user.primary} />
                            <Text variant="bodySmall" style={styles.label}>Check In</Text>
                            {item.checkInMapLink && (
                                <IconButton
                                    icon="map-marker"
                                    size={16}
                                    iconColor={Colors.user.primary}
                                    onPress={() => openMap(item.checkInMapLink)}
                                    style={{ margin: 0, height: 20, width: 20 }}
                                />
                            )}
                        </View>
                        <Text variant="bodyMedium" style={styles.timeValue}>{formatTime(item.checkInTime)}</Text>
                        <Text variant="bodySmall" style={styles.address} numberOfLines={2}>{item.checkInAddress}</Text>
                    </View>

                    <View style={styles.timeBlock}>
                        <View style={styles.iconRow}>
                            <Avatar.Icon size={20} icon="logout" style={{ backgroundColor: 'transparent' }} color={Colors.admin.primary} />
                            <Text variant="bodySmall" style={styles.label}>Check Out</Text>
                            {item.checkOutMapLink && (
                                <IconButton
                                    icon="map-marker"
                                    size={16}
                                    iconColor={Colors.user.primary}
                                    onPress={() => openMap(item.checkOutMapLink)}
                                    style={{ margin: 0, height: 20, width: 20 }}
                                />
                            )}
                        </View>
                        <Text variant="bodyMedium" style={styles.timeValue}>
                            {item.checkOutTime ? formatTime(item.checkOutTime) : 'Active'}
                        </Text>
                        {item.checkOutAddress && (
                            <Text variant="bodySmall" style={styles.address} numberOfLines={2}>{item.checkOutAddress}</Text>
                        )}
                    </View>
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Searchbar
                    placeholder="Search visits..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    elevation={0}
                />

                <View style={styles.filterRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Menu
                            visible={userMenuVisible}
                            onDismiss={() => setUserMenuVisible(false)}
                            anchor={
                                <View collapsable={false}>
                                    <Button
                                        mode="outlined"
                                        onPress={() => {
                                            // Add delay to prevent race condition with onDismiss
                                            setTimeout(() => {
                                                setUserMenuVisible(true);
                                            }, 100);
                                        }}
                                        style={styles.filterButton}
                                        compact
                                        icon="account-filter"
                                    >
                                        {selectedUsers.length === 0
                                            ? 'All Users'
                                            : selectedUsers.length === users.length
                                                ? 'All Users'
                                                : `${selectedUsers.length} User${selectedUsers.length > 1 ? 's' : ''}`}
                                    </Button>
                                </View>
                            }
                        >
                            <Menu.Item
                                onPress={() => {
                                    if (selectedUsers.length === users.length || selectedUsers.length === 0) {
                                        // Toggle: if all selected or none selected, toggle to opposite
                                        setSelectedUsers(selectedUsers.length === 0 ? users.map(u => u.name) : []);
                                    } else {
                                        // If some selected, select all
                                        setSelectedUsers(users.map(u => u.name));
                                    }
                                    // Keep menu open
                                }}
                                title="All Users"
                                leadingIcon={() => (
                                    <Checkbox.Android
                                        status={selectedUsers.length === users.length && users.length > 0 ? 'checked' : selectedUsers.length === 0 ? 'unchecked' : 'indeterminate'}
                                    />
                                )}
                            />
                            <Divider />
                            <ScrollView style={{ maxHeight: 300 }}>
                                {users.map(u => (
                                    <Menu.Item
                                        key={u.id}
                                        onPress={() => {
                                            if (selectedUsers.includes(u.name)) {
                                                setSelectedUsers(selectedUsers.filter(name => name !== u.name));
                                            } else {
                                                setSelectedUsers([...selectedUsers, u.name]);
                                            }
                                            // Keep menu open
                                        }}
                                        title={u.name}
                                        leadingIcon={() => (
                                            <Checkbox.Android
                                                status={selectedUsers.includes(u.name) ? 'checked' : 'unchecked'}
                                            />
                                        )}
                                    />
                                ))}
                            </ScrollView>
                        </Menu>
                        {selectedUsers.length > 0 && selectedUsers.length < users.length && (
                            <IconButton
                                icon="close-circle"
                                size={20}
                                onPress={() => setSelectedUsers([])}
                                style={{ marginLeft: -8 }}
                            />
                        )}
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                        <Chip selected={filter === 'all'} onPress={() => setFilter('all')} style={styles.chip} showSelectedOverlay>All Time</Chip>
                        <Chip selected={filter === 'week'} onPress={() => setFilter('week')} style={styles.chip} showSelectedOverlay>Week</Chip>
                        <Chip selected={filter === 'month'} onPress={() => setFilter('month')} style={styles.chip} showSelectedOverlay>Month</Chip>
                    </ScrollView>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.admin.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredVisits}
                    renderItem={renderVisitItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>No visits found</Text>
                        </View>
                    }
                />
            )}

            <Portal>
                <Dialog visible={emailDialogVisible} onDismiss={() => setEmailDialogVisible(false)}>
                    <Dialog.Title>Send Report via Email</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                            Enter the recipient's email address:
                        </Text>
                        <TextInput
                            label="Email Address"
                            value={recipientEmail}
                            onChangeText={setRecipientEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            mode="outlined"
                            placeholder="example@email.com"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setEmailDialogVisible(false)}>Cancel</Button>
                        <Button onPress={sendEmailReport} mode="contained">Send</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <FAB.Group
                open={fabOpen}
                visible={true}
                icon="export-variant"
                color="#FFFFFF"
                fabStyle={{ backgroundColor: Colors.admin.primary }}
                actions={[
                    { icon: 'file-excel', label: 'Export CSV', onPress: handleExportCSV },
                    { icon: 'share-variant', label: 'Share', onPress: handleShare },
                ]}
                onStateChange={({ open }) => setFabOpen(open)}
                onPress={handleEmailReport}
                style={{ position: 'absolute', margin: 16, right: 0, bottom: 0 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.gray[50],
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    searchBar: {
        backgroundColor: Colors.gray[100],
        marginBottom: 12,
        borderRadius: 12,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    filterButton: {
        borderColor: Colors.gray[300],
    },
    chipScroll: {
        flexGrow: 0,
    },
    chip: {
        backgroundColor: Colors.gray[100],
        marginRight: 8,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    clientName: {
        fontWeight: 'bold',
        color: Colors.gray[900],
    },
    userName: {
        color: Colors.admin.primary,
        fontWeight: '500',
    },
    date: {
        color: Colors.gray[500],
        marginBottom: 4,
    },
    warningChip: {
        backgroundColor: '#FEF3C7',
        height: 24,
    },
    divider: {
        marginBottom: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeBlock: {
        flex: 1,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
    },
    label: {
        color: Colors.gray[500],
    },
    timeValue: {
        fontWeight: '600',
        color: Colors.gray[800],
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: Colors.gray[500],
        fontSize: 16,
    },
    address: {
        color: Colors.gray[500],
        fontSize: 11,
        marginTop: 4,
    },
});

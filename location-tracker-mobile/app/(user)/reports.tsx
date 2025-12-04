import { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    RefreshControl,
    Alert,
    Share,
    Linking,
    Platform,
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
    IconButton,
} from 'react-native-paper';
import { useAuth } from '../../utils/AuthContext';
import { visitsAPI, reportsAPI } from '../../services/api';
import { formatDate, formatTime, formatDuration } from '../../utils/helpers';
import { Colors } from '../../constants/theme';

export default function UserReports() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [visits, setVisits] = useState<any[]>([]);
    const [filteredVisits, setFilteredVisits] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');
    const [sendingReport, setSendingReport] = useState(false);

    useEffect(() => {
        loadVisits();
    }, [user]);

    useEffect(() => {
        applyFilters();
    }, [visits, searchQuery, filter]);

    const loadVisits = async () => {
        if (!user) return;
        try {
            const response = await visitsAPI.getVisits({ userName: user.name });
            // Sort by date desc
            const sorted = response.data.sort((a: any, b: any) =>
                new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
            );
            setVisits(sorted);
        } catch (error) {
            console.error('Error loading visits:', error);
            Alert.alert('Error', 'Failed to load visit history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFilters = () => {
        let result = [...visits];

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
                    v.checkInAddress.toLowerCase().includes(query)
                );
            }
        }

        setFilteredVisits(result);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadVisits();
    };

    const handleEmailReport = async () => {
        if (!user) return;

        // If no reporting manager email, ask user to enter one
        if (!user.reportingManagerEmail) {
            Alert.alert('Info', 'Please set a reporting manager email in Settings first.');
            return;
        }

        setSendingReport(true);
        try {
            const response = await reportsAPI.sendReport({
                userName: user.name,
                userRole: user.role,
                visits: filteredVisits,
                recipientEmail: user.reportingManagerEmail,
            });

            if (response.data.success) {
                Alert.alert('Success', 'Report sent successfully!');
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
                `${v.clientName} (${v.companyName})\nIn: ${v.checkInTime}\nOut: ${v.checkOutTime || 'Active'}\n`
            ).join('\n---\n\n');

            await Share.share({
                message: `Visit Report for ${user?.name}\n\n${message}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleExportCSV = async () => {
        try {
            const header = 'Client Name,Company Name,Check In Time,Check In Address,Check Out Time,Check Out Address,Duration,Mismatch\n';
            const rows = filteredVisits.map(v => {
                const duration = v.checkOutTime ? formatDuration(v.checkInTime, v.checkOutTime) : 'Active';
                const mismatch = v.locationMismatch ? 'Yes' : 'No';
                // Escape commas in fields
                const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

                return [
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

            // On mobile, we can share this as a file or text. 
            // Sharing as text with a .csv extension hint if possible, or just text.
            // For better experience, we'd write to file system, but Share is simplest cross-platform.

            await Share.share({
                message: csvContent,
                title: 'Visits_Report.csv'
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
                        <Text variant="bodySmall" style={styles.companyName}>{item.companyName}</Text>
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
                                    onPress={() => openMap(item.checkInMapLink)}
                                    style={{ margin: 0, height: 20, width: 20 }}
                                />
                            )}
                        </View>
                        <Text variant="bodyMedium" style={styles.timeValue}>{formatTime(item.checkInTime)}</Text>
                        <Text variant="bodySmall" style={styles.address} numberOfLines={1}>
                            {item.checkInAddress}
                        </Text>
                    </View>

                    <View style={styles.timeBlock}>
                        <View style={styles.iconRow}>
                            <Avatar.Icon size={20} icon="logout" style={{ backgroundColor: 'transparent' }} color={Colors.admin.primary} />
                            <Text variant="bodySmall" style={styles.label}>Check Out</Text>
                            {item.checkOutMapLink && (
                                <IconButton
                                    icon="map-marker"
                                    size={16}
                                    onPress={() => openMap(item.checkOutMapLink)}
                                    style={{ margin: 0, height: 20, width: 20 }}
                                />
                            )}
                        </View>
                        <Text variant="bodyMedium" style={styles.timeValue}>
                            {item.checkOutTime ? formatTime(item.checkOutTime) : 'Active'}
                        </Text>
                        <Text variant="bodySmall" style={styles.address} numberOfLines={1}>
                            {item.checkOutAddress || '-'}
                        </Text>
                    </View>
                </View>

                {item.checkOutTime && (
                    <Text variant="bodySmall" style={styles.duration}>
                        Duration: {formatDuration(item.checkInTime, item.checkOutTime)}
                    </Text>
                )}
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
                <View style={styles.filterContainer}>
                    <Chip
                        selected={filter === 'all'}
                        onPress={() => setFilter('all')}
                        style={styles.chip}
                        showSelectedOverlay
                    >
                        All Time
                    </Chip>
                    <Chip
                        selected={filter === 'week'}
                        onPress={() => setFilter('week')}
                        style={styles.chip}
                        showSelectedOverlay
                    >
                        Last 7 Days
                    </Chip>
                    <Chip
                        selected={filter === 'month'}
                        onPress={() => setFilter('month')}
                        style={styles.chip}
                        showSelectedOverlay
                    >
                        This Month
                    </Chip>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.user.primary} />
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

            <FAB.Group
                open={false}
                visible={true}
                icon="export-variant"
                actions={[
                    {
                        icon: 'email',
                        label: 'Email Report',
                        onPress: handleEmailReport,
                    },
                    {
                        icon: 'file-excel',
                        label: 'Export to Excel (CSV)',
                        onPress: handleExportCSV,
                    },
                    {
                        icon: 'share-variant',
                        label: 'Share Text',
                        onPress: handleShare,
                    },
                ]}
                onStateChange={() => { }}
                onPress={() => {
                    Alert.alert(
                        'Export Options',
                        'Choose an option',
                        [
                            { text: 'Email Report', onPress: handleEmailReport },
                            { text: 'Export to Excel (CSV)', onPress: handleExportCSV },
                            { text: 'Share Text', onPress: handleShare },
                            { text: 'Cancel', style: 'cancel' }
                        ]
                    )
                }}
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
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        backgroundColor: Colors.gray[100],
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
    companyName: {
        color: Colors.gray[500],
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
    address: {
        color: Colors.gray[400],
        fontSize: 11,
        marginTop: 2,
    },
    duration: {
        marginTop: 12,
        textAlign: 'right',
        color: Colors.gray[500],
        fontStyle: 'italic',
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
});

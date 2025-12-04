import { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Text,
    Card,
    ActivityIndicator,
    Button,
    Avatar,
    useTheme,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../utils/AuthContext';
import { visitsAPI } from '../../services/api';
import {
    formatDate,
    formatTime,
    formatDuration,
    getCurrentISTString,
} from '../../utils/helpers';
import { Colors } from '../../constants/theme';

const screenWidth = Dimensions.get('window').width;

export default function UserDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const theme = useTheme();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [visits, setVisits] = useState<any[]>([]);
    const [filteredVisits, setFilteredVisits] = useState<any[]>([]);
    const [selectedTab, setSelectedTab] = useState<'today' | 'week' | 'month'>('today');
    const [stats, setStats] = useState({
        totalVisits: 0,
        totalDurationMinutes: 0,
    });
    const [pendingCheckout, setPendingCheckout] = useState<any>(null);

    const loadDashboardData = useCallback(async () => {
        if (!user) return;

        try {
            const response = await visitsAPI.getVisits({ userName: user.name });
            const visitData = response.data;

            // Sort by checkInTime desc
            const sortedVisits = [...visitData].sort((a, b) =>
                new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
            );

            setVisits(sortedVisits);

            // Check for pending checkout
            const active = sortedVisits.find(v => !v.checkOutTime);
            setPendingCheckout(active || null);

            // Calculate stats
            let duration = 0;

            sortedVisits.forEach(visit => {
                // Duration
                if (visit.checkInTime && visit.checkOutTime) {
                    const start = new Date(visit.checkInTime);
                    const end = new Date(visit.checkOutTime);
                    duration += (end.getTime() - start.getTime()) / (1000 * 60); // minutes
                }
            });

            setStats({
                totalVisits: sortedVisits.length,
                totalDurationMinutes: Math.round(duration),
            });

        } catch (error) {
            console.error('Error loading dashboard:', error);
            // Don't show alert on initial load to avoid spamming if offline
            if (!loading) {
                Alert.alert('Error', 'Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const handleCheckOut = () => {
        router.push('/(user)/check-in');
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.user.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <View>
                        <Text variant="headlineMedium" style={styles.greeting}>
                            Hello, {user?.name}
                        </Text>
                        <Text variant="bodyMedium" style={styles.date}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Text>
                    </View>
                    <Avatar.Text
                        size={48}
                        label={user?.name?.substring(0, 2).toUpperCase() || 'U'}
                        style={{ backgroundColor: Colors.user.light }}
                        color={Colors.user.primary}
                    />
                </View>

                {/* Pending Checkout Alert */}
                {pendingCheckout && (
                    <Card style={styles.alertCard} mode="elevated">
                        <Card.Content>
                            <View style={styles.alertHeader}>
                                <Avatar.Icon size={40} icon="clock-alert" style={{ backgroundColor: '#FEF3C7' }} color="#D97706" />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text variant="titleMedium" style={{ color: '#92400E' }}>Active Visit</Text>
                                    <Text variant="bodySmall" style={{ color: '#B45309' }}>
                                        You are checked in at {pendingCheckout.clientName}
                                    </Text>
                                </View>
                                <Button
                                    mode="contained"
                                    onPress={handleCheckOut}
                                    style={{ backgroundColor: '#D97706' }}
                                    compact
                                >
                                    Check Out
                                </Button>
                            </View>
                        </Card.Content>
                    </Card>
                )}

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <Card style={styles.statCard}>
                        <Card.Content style={styles.statContent}>
                            <Avatar.Icon size={40} icon="map-marker-check" style={{ backgroundColor: '#DBEAFE' }} color={Colors.user.primary} />
                            <Text variant="headlineSmall" style={styles.statValue}>{stats.totalVisits}</Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Total Visits</Text>
                        </Card.Content>
                    </Card>

                    <Card style={styles.statCard}>
                        <Card.Content style={styles.statContent}>
                            <Avatar.Icon size={40} icon="clock-outline" style={{ backgroundColor: '#F3E8FF' }} color="#9333EA" />
                            <Text variant="headlineSmall" style={styles.statValue}>
                                {Math.floor(stats.totalDurationMinutes / 60)}h {stats.totalDurationMinutes % 60}m
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Total Time</Text>
                        </Card.Content>
                    </Card>
                </View>





                {/* Visits Tabs */}
                <View style={styles.section}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Visits:</Text>

                    <Card
                        style={[styles.tabCard, styles.tabCardToday]}
                        onPress={() => setSelectedTab('today')}
                        mode="elevated"
                    >
                        <Card.Content style={styles.tabContent}>
                            <Text variant="bodyMedium" style={styles.tabLabel}>Today</Text>
                            <Text variant="headlineMedium" style={styles.tabValue}>
                                {visits.filter(v => {
                                    const now = new Date();
                                    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                    return new Date(v.checkInTime) >= startOfDay;
                                }).length}
                            </Text>
                        </Card.Content>
                    </Card>

                    <Card
                        style={[styles.tabCard, styles.tabCardWeek]}
                        onPress={() => setSelectedTab('week')}
                        mode="elevated"
                    >
                        <Card.Content style={styles.tabContent}>
                            <Text variant="bodyMedium" style={styles.tabLabel}>This Week</Text>
                            <Text variant="headlineMedium" style={styles.tabValue}>
                                {visits.filter(v => {
                                    const now = new Date();
                                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                                    return new Date(v.checkInTime) >= weekAgo;
                                }).length}
                            </Text>
                        </Card.Content>
                    </Card>

                    <Card
                        style={[styles.tabCard, styles.tabCardMonth]}
                        onPress={() => setSelectedTab('month')}
                        mode="elevated"
                    >
                        <Card.Content style={styles.tabContent}>
                            <Text variant="bodyMedium" style={styles.tabLabel}>This Month</Text>
                            <Text variant="headlineMedium" style={styles.tabValue}>
                                {visits.filter(v => {
                                    const now = new Date();
                                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                                    return new Date(v.checkInTime) >= monthAgo;
                                }).length}
                            </Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Recent Activity</Text>
                    {visits.slice(0, 5).map((visit) => (
                        <Card key={visit.id} style={styles.visitCard} mode="outlined">
                            <Card.Content>
                                <View style={styles.visitHeader}>
                                    <View>
                                        <Text variant="titleMedium" style={styles.clientName}>{visit.clientName}</Text>
                                        <Text variant="bodySmall" style={styles.companyName}>{visit.companyName}</Text>
                                    </View>
                                    <Text variant="bodySmall" style={styles.visitDate}>
                                        {formatDate(visit.checkInTime)}
                                    </Text>
                                </View>

                                <View style={styles.visitDetails}>
                                    <View style={styles.visitRow}>
                                        <Avatar.Icon size={24} icon="login" style={{ backgroundColor: 'transparent' }} color={Colors.user.primary} />
                                        <Text variant="bodyMedium" style={styles.visitTime}>
                                            {formatTime(visit.checkInTime)}
                                        </Text>
                                    </View>

                                    {visit.checkOutTime ? (
                                        <View style={styles.visitRow}>
                                            <Avatar.Icon size={24} icon="logout" style={{ backgroundColor: 'transparent' }} color={Colors.admin.primary} />
                                            <Text variant="bodyMedium" style={styles.visitTime}>
                                                {formatTime(visit.checkOutTime)}
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={styles.visitRow}>
                                            <ActivityIndicator size={16} color={Colors.warning} />
                                            <Text variant="bodyMedium" style={[styles.visitTime, { color: Colors.warning }]}>
                                                In Progress
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
                    {visits.length === 0 && (
                        <Text style={styles.emptyText}>No visits recorded yet.</Text>
                    )}
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.gray[50],
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[200],
    },
    greeting: {
        fontWeight: 'bold',
        color: Colors.gray[900],
    },
    date: {
        color: Colors.gray[500],
        marginTop: 4,
    },
    alertCard: {
        margin: 16,
        backgroundColor: '#FFFBEB',
        borderColor: '#FCD34D',
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        marginHorizontal: 4,
        backgroundColor: '#FFFFFF',
    },
    statContent: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    statValue: {
        fontWeight: 'bold',
        marginTop: 8,
        fontSize: 18,
    },
    statLabel: {
        color: Colors.gray[500],
    },
    chartCard: {
        margin: 16,
        marginTop: 0,
        backgroundColor: '#FFFFFF',
    },
    section: {
        padding: 16,
        paddingTop: 0,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
        color: Colors.gray[800],
    },
    tabCard: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    tabCardToday: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.user.primary, // Blue
    },
    tabCardWeek: {
        borderLeftWidth: 4,
        borderLeftColor: '#9333EA', // Purple
    },
    tabCardMonth: {
        borderLeftWidth: 4,
        borderLeftColor: '#EC4899', // Pink
    },
    tabContent: {
        paddingVertical: 12,
    },
    tabLabel: {
        color: Colors.gray[600],
        marginBottom: 4,
    },
    tabValue: {
        fontWeight: 'bold',
        fontSize: 28,
        color: Colors.gray[900],
    },
    visitCard: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    visitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    clientName: {
        fontWeight: 'bold',
        color: Colors.gray[900],
    },
    companyName: {
        color: Colors.gray[500],
    },
    visitDate: {
        color: Colors.gray[400],
    },
    visitDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
        paddingTop: 12,
    },
    visitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    visitTime: {
        color: Colors.gray[700],
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.gray[500],
        marginTop: 20,
        fontStyle: 'italic',
    },
});

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
    Avatar,
    useTheme,
    List,
} from 'react-native-paper';
import { useAuth } from '../../utils/AuthContext';
import { visitsAPI, userAPI } from '../../services/api';
import { formatDate, formatTime, getCurrentISTString } from '../../utils/helpers';
import { Colors } from '../../constants/theme';

export default function AdminDashboard() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeVisits: 0,
        todayVisits: 0,
    });
    const [recentVisits, setRecentVisits] = useState<any[]>([]);
    const [activeVisitList, setActiveVisitList] = useState<any[]>([]);
    const [mismatchVisitList, setMismatchVisitList] = useState<any[]>([]);

    const loadDashboardData = useCallback(async () => {
        try {
            // Fetch users count
            const usersRes = await userAPI.getUsers();
            const totalUsers = usersRes.data.length;

            // Fetch all visits
            const visitsRes = await visitsAPI.getVisits();
            const allVisits = visitsRes.data;

            // Calculate stats
            const active = allVisits.filter((v: any) => !v.checkOutTime);
            const mismatches = allVisits.filter((v: any) => !!v.locationMismatch);

            const today = getCurrentISTString().split(' ')[0];
            const todayCount = allVisits.filter((v: any) => v.checkInTime.startsWith(today)).length;

            // Sort by checkInTime desc
            const sortedVisits = [...allVisits].sort((a: any, b: any) =>
                new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
            );

            setStats({
                totalUsers,
                activeVisits: active.length,
                todayVisits: todayCount,
            });

            setActiveVisitList(active);
            setMismatchVisitList(mismatches);
            setRecentVisits(sortedVisits.slice(0, 5));

        } catch (error) {
            console.error('Error loading admin dashboard:', error);
            if (!loading) {
                Alert.alert('Error', 'Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.admin.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <View>
                        <Text variant="headlineMedium" style={styles.greeting}>
                            Admin Dashboard
                        </Text>
                        <Text variant="bodyMedium" style={styles.date}>
                            Overview of all activity
                        </Text>
                    </View>
                    <Avatar.Text
                        size={48}
                        label={user?.name?.substring(0, 2).toUpperCase() || 'A'}
                        style={{ backgroundColor: Colors.admin.light }}
                        color={Colors.admin.primary}
                    />
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <Card style={styles.statCard}>
                        <Card.Content style={styles.statContent}>
                            <Avatar.Icon size={40} icon="account-group" style={{ backgroundColor: '#DBEAFE' }} color={Colors.user.primary} />
                            <Text variant="headlineSmall" style={styles.statValue}>{stats.totalUsers}</Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Total Users</Text>
                        </Card.Content>
                    </Card>

                    <Card style={styles.statCard}>
                        <Card.Content style={styles.statContent}>
                            <Avatar.Icon size={40} icon="clock-alert" style={{ backgroundColor: '#FEF3C7' }} color="#D97706" />
                            <Text variant="headlineSmall" style={styles.statValue}>{stats.activeVisits}</Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Active Now</Text>
                        </Card.Content>
                    </Card>

                    <Card style={styles.statCard}>
                        <Card.Content style={styles.statContent}>
                            <Avatar.Icon size={40} icon="calendar-today" style={{ backgroundColor: '#D1FAE5' }} color={Colors.admin.primary} />
                            <Text variant="headlineSmall" style={styles.statValue}>{stats.todayVisits}</Text>
                            <Text variant="bodySmall" style={styles.statLabel}>Visits Today</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Active Visits Section */}
                {activeVisitList.length > 0 && (
                    <View style={styles.section}>
                        <Text variant="titleLarge" style={styles.sectionTitle}>Currently Active</Text>
                        {activeVisitList.map((visit) => (
                            <Card key={visit.id} style={styles.activeCard} mode="elevated">
                                <Card.Content>
                                    <View style={styles.visitHeader}>
                                        <Text variant="titleMedium" style={styles.userName}>{visit.userName}</Text>
                                        <Text variant="bodySmall" style={styles.timeAgo}>
                                            Since {formatTime(visit.checkInTime)}
                                        </Text>
                                    </View>
                                    <Text variant="bodyMedium" style={styles.clientName}>
                                        @ {visit.clientName}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.address} numberOfLines={1}>
                                        {visit.checkInAddress}
                                    </Text>
                                </Card.Content>
                            </Card>
                        ))}
                    </View>
                )}

                {/* Location Mismatches Section */}
                {mismatchVisitList.length > 0 && (
                    <View style={styles.section}>
                        <Text variant="titleLarge" style={styles.sectionTitle}>Location Mismatches</Text>
                        {mismatchVisitList.map((visit) => (
                            <Card key={visit.id} style={styles.mismatchCard} mode="elevated">
                                <Card.Content>
                                    <View style={styles.visitHeader}>
                                        <Text variant="titleMedium" style={styles.userName}>{visit.userName}</Text>
                                        <Text variant="bodySmall" style={styles.mismatchTime}>
                                            {formatDate(visit.checkInTime)}
                                        </Text>
                                    </View>
                                    <Text variant="bodyMedium" style={styles.clientName}>
                                        @ {visit.clientName}
                                    </Text>
                                    <Text variant="bodySmall" style={styles.address} numberOfLines={1}>
                                        {visit.checkInAddress}
                                    </Text>
                                    <View style={styles.mismatchBadge}>
                                        <Avatar.Icon size={16} icon="alert" style={{ backgroundColor: 'transparent' }} color="#DC2626" />
                                        <Text variant="bodySmall" style={styles.mismatchText}>
                                            Location does not match expected address
                                        </Text>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))}
                    </View>
                )}

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Recent Activity</Text>
                    {recentVisits.map((visit) => (
                        <Card key={visit.id} style={styles.visitCard} mode="outlined">
                            <Card.Content>
                                <View style={styles.visitHeader}>
                                    <View>
                                        <Text variant="titleMedium" style={styles.userName}>{visit.userName}</Text>
                                        <Text variant="bodySmall" style={styles.clientName}>{visit.clientName}</Text>
                                    </View>
                                    <Text variant="bodySmall" style={styles.visitDate}>
                                        {formatDate(visit.checkInTime)}
                                    </Text>
                                </View>

                                <View style={styles.visitDetails}>
                                    <View style={styles.visitRow}>
                                        <Avatar.Icon size={20} icon="login" style={{ backgroundColor: 'transparent' }} color={Colors.user.primary} />
                                        <Text variant="bodyMedium" style={styles.visitTime}>
                                            {formatTime(visit.checkInTime)}
                                        </Text>
                                    </View>

                                    {visit.checkOutTime ? (
                                        <View style={styles.visitRow}>
                                            <Avatar.Icon size={20} icon="logout" style={{ backgroundColor: 'transparent' }} color={Colors.admin.primary} />
                                            <Text variant="bodyMedium" style={styles.visitTime}>
                                                {formatTime(visit.checkOutTime)}
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text variant="bodySmall" style={{ color: Colors.warning, fontStyle: 'italic' }}>
                                            In Progress
                                        </Text>
                                    )}
                                </View>
                            </Card.Content>
                        </Card>
                    ))}
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
        marginTop: 16,
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
        fontSize: 11,
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
    activeCard: {
        marginBottom: 12,
        backgroundColor: '#FFFBEB',
        borderColor: '#FCD34D',
    },
    mismatchCard: {
        marginBottom: 12,
        backgroundColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        borderWidth: 1,
    },
    mismatchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    mismatchTime: {
        color: '#DC2626',
        fontWeight: '500',
    },
    mismatchText: {
        color: '#DC2626',
        fontSize: 11,
        fontStyle: 'italic',
    },
    visitCard: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    visitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    userName: {
        fontWeight: 'bold',
        color: Colors.gray[900],
    },
    clientName: {
        color: Colors.gray[600],
    },
    visitDate: {
        color: Colors.gray[400],
    },
    timeAgo: {
        color: '#D97706',
        fontWeight: '500',
    },
    address: {
        color: Colors.gray[500],
        fontSize: 11,
        marginTop: 4,
    },
    visitDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
        paddingTop: 8,
        marginTop: 8,
    },
    visitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    visitTime: {
        color: Colors.gray[700],
        fontSize: 12,
    },
});

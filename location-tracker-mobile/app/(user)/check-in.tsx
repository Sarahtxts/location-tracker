import { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Text,
    Button,
    TextInput,
    Card,
    ActivityIndicator,
    Surface,
    Avatar,
    useTheme,
} from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useAuth } from '../../utils/AuthContext';
import { visitsAPI, geocodingAPI, settingsAPI } from '../../services/api';
import { calculateDistance, getCurrentISTString } from '../../utils/helpers';
import { Colors } from '../../constants/theme';

const screenHeight = Dimensions.get('window').height;

export default function CheckInScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [address, setAddress] = useState('');
    const [clientName, setClientName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [activeVisit, setActiveVisit] = useState<any>(null);
    const [distanceThreshold, setDistanceThreshold] = useState(500); // Default 500m

    useEffect(() => {
        checkPermissionsAndLocation();
        loadActiveVisit();
        loadSettings();
    }, []);

    const checkPermissionsAndLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied');
                setLoading(false);
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);

            // Reverse geocode
            if (currentLocation) {
                try {
                    const response = await geocodingAPI.reverseGeocode(
                        currentLocation.coords.latitude,
                        currentLocation.coords.longitude
                    );
                    if (response.data.address) {
                        setAddress(response.data.address);
                    }
                } catch (error) {
                    console.error('Geocoding error:', error);
                }
            }
        } catch (error) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Failed to get current location');
        } finally {
            setLoading(false);
        }
    };

    const loadActiveVisit = async () => {
        if (!user) return;
        try {
            const response = await visitsAPI.getVisits({ userName: user.name });
            const visits = response.data;
            const active = visits.find((v: any) => !v.checkOutTime);
            if (active) {
                setActiveVisit(active);
                setClientName(active.clientName);
                setCompanyName(active.companyName);
            }
        } catch (error) {
            console.error('Error loading visits:', error);
        }
    };

    const loadSettings = async () => {
        try {
            const response = await settingsAPI.getSetting('distanceThreshold');
            if (response.data && response.data.value) {
                setDistanceThreshold(parseInt(response.data.value));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleRefreshLocation = async () => {
        setLoading(true);
        await checkPermissionsAndLocation();
    };

    const handleCheckIn = async () => {
        if (!location || !address) {
            Alert.alert('Error', 'Location not available');
            return;
        }
        if (!clientName.trim() || !companyName.trim()) {
            Alert.alert('Error', 'Please enter Client Name and Company Name');
            return;
        }

        setActionLoading(true);
        try {
            const visitData = {
                userName: user!.name,
                clientName,
                companyName,
                checkInAddress: address,
                checkInMapLink: `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            const response = await visitsAPI.createVisit(visitData);

            if (response.data.success) {
                Alert.alert('Success', 'Checked in successfully!');
                setActiveVisit({
                    ...visitData,
                    id: response.data.visitId,
                    checkInTime: getCurrentISTString(),
                });
            } else {
                Alert.alert('Error', 'Failed to check in');
            }
        } catch (error) {
            console.error('Check-in error:', error);
            Alert.alert('Error', 'Failed to check in. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!location || !activeVisit) return;

        setActionLoading(true);
        try {
            // Calculate distance from check-in location
            let locationMismatch = false;
            if (activeVisit.latitude && activeVisit.longitude) {
                const distance = calculateDistance(
                    activeVisit.latitude,
                    activeVisit.longitude,
                    location.coords.latitude,
                    location.coords.longitude
                );

                if (distance > distanceThreshold) {
                    locationMismatch = true;
                    Alert.alert(
                        'Location Warning',
                        `You are ${Math.round(distance)}m away from check-in location. This will be flagged.`
                    );
                }
            }

            const updateData = {
                id: activeVisit.id,
                checkOutAddress: address,
                checkOutMapLink: `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`,
                checkOutLatitude: location.coords.latitude,
                checkOutLongitude: location.coords.longitude,
                locationMismatch,
            };

            const response = await visitsAPI.updateVisit(updateData);

            if (response.data.success) {
                Alert.alert('Success', 'Checked out successfully!');
                setActiveVisit(null);
                setClientName('');
                setCompanyName('');
                router.replace('/(user)/dashboard');
            } else {
                Alert.alert('Error', 'Failed to check out');
            }
        } catch (error) {
            console.error('Check-out error:', error);
            Alert.alert('Error', 'Failed to check out. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && !location) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.user.primary} />
                <Text style={{ marginTop: 16 }}>Getting your location...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Map View */}
                    <View style={styles.mapContainer}>
                        {location ? (
                            <MapView
                                ref={mapRef}
                                provider={PROVIDER_GOOGLE}
                                style={styles.map}
                                initialRegion={{
                                    latitude: location.coords.latitude,
                                    longitude: location.coords.longitude,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                }}
                                showsUserLocation={true}
                                showsMyLocationButton={true}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: location.coords.latitude,
                                        longitude: location.coords.longitude,
                                    }}
                                    title="You are here"
                                />
                                {activeVisit && activeVisit.latitude && (
                                    <Marker
                                        coordinate={{
                                            latitude: activeVisit.latitude,
                                            longitude: activeVisit.longitude,
                                        }}
                                        pinColor="green"
                                        title="Check-in Location"
                                    />
                                )}
                            </MapView>
                        ) : (
                            <View style={styles.mapPlaceholder}>
                                <Text>Map unavailable</Text>
                            </View>
                        )}
                        <Button
                            mode="contained-tonal"
                            icon="crosshairs-gps"
                            onPress={handleRefreshLocation}
                            style={styles.refreshButton}
                            compact
                        >
                            Refresh Location
                        </Button>
                    </View>

                    {/* Action Form */}
                    <Surface style={styles.formContainer} elevation={4}>
                        <View style={styles.locationInfo}>
                            <Avatar.Icon size={36} icon="map-marker" style={{ backgroundColor: Colors.user.light }} color={Colors.user.primary} />
                            <Text variant="bodySmall" style={styles.addressText} numberOfLines={2}>
                                {address || 'Fetching address...'}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        {activeVisit ? (
                            // Check Out View
                            <View>
                                <Text variant="titleMedium" style={styles.statusTitle}>
                                    Currently Checked In
                                </Text>

                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Client:</Text>
                                    <Text style={styles.value}>{activeVisit.clientName}</Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Company:</Text>
                                    <Text style={styles.value}>{activeVisit.companyName}</Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Time:</Text>
                                    <Text style={styles.value}>{activeVisit.checkInTime}</Text>
                                </View>

                                <Button
                                    mode="contained"
                                    onPress={handleCheckOut}
                                    loading={actionLoading}
                                    disabled={actionLoading}
                                    style={[styles.actionButton, { backgroundColor: Colors.error }]}
                                    icon="logout"
                                >
                                    Check Out
                                </Button>
                            </View>
                        ) : (
                            // Check In Form
                            <View>
                                <Text variant="titleMedium" style={styles.statusTitle}>
                                    New Visit
                                </Text>

                                <TextInput
                                    label="Client Name"
                                    value={clientName}
                                    onChangeText={setClientName}
                                    mode="outlined"
                                    style={styles.input}
                                    left={<TextInput.Icon icon="account" />}
                                />

                                <TextInput
                                    label="Company Name"
                                    value={companyName}
                                    onChangeText={setCompanyName}
                                    mode="outlined"
                                    style={styles.input}
                                    left={<TextInput.Icon icon="domain" />}
                                />

                                <Button
                                    mode="contained"
                                    onPress={handleCheckIn}
                                    loading={actionLoading}
                                    disabled={actionLoading || !location}
                                    style={[styles.actionButton, { backgroundColor: Colors.user.primary }]}
                                    icon="login"
                                >
                                    Check In
                                </Button>
                            </View>
                        )}
                    </Surface>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
    },
    mapContainer: {
        height: screenHeight * 0.45,
        width: '100%',
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.gray[200],
    },
    refreshButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    formContainer: {
        flex: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
        backgroundColor: '#FFFFFF',
        padding: 24,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    addressText: {
        flex: 1,
        marginLeft: 12,
        color: Colors.gray[700],
    },
    divider: {
        height: 1,
        backgroundColor: Colors.gray[200],
        marginBottom: 20,
    },
    statusTitle: {
        fontWeight: 'bold',
        marginBottom: 16,
        color: Colors.gray[900],
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    actionButton: {
        marginTop: 8,
        paddingVertical: 6,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    label: {
        width: 80,
        fontWeight: 'bold',
        color: Colors.gray[600],
    },
    value: {
        flex: 1,
        color: Colors.gray[900],
    },
});

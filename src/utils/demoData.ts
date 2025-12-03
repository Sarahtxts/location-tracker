import type { Visit } from '../App';

// Demo data generator for Location Tracker App
export const generateDemoData = () => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneHourMs = 60 * 60 * 1000;

  // Chennai locations for different clients
  const clients = [
    {
      name: 'TCS Limited',
      company: 'Tata Consultancy Services',
      checkInLat: 13.0475,
      checkInLng: 80.2145,
      checkInAddress: 'TCS Sholinganallur, Rajiv Gandhi Salai, Chennai, Tamil Nadu 600119'
    },
    {
      name: 'Infosys Technologies',
      company: 'Infosys Ltd',
      checkInLat: 12.9915,
      checkInLng: 80.2194,
      checkInAddress: 'Infosys Campus, Siruseri, Chennai, Tamil Nadu 603103'
    },
    {
      name: 'Cognizant Systems',
      company: 'Cognizant Technology Solutions',
      checkInLat: 13.0569,
      checkInLng: 80.2425,
      checkInAddress: 'Cognizant Office, Taramani, Chennai, Tamil Nadu 600113'
    },
    {
      name: 'HCL Technologies',
      company: 'HCL Tech Park',
      checkInLat: 13.0827,
      checkInLng: 80.2707,
      checkInAddress: 'HCL Technologies, Guindy, Chennai, Tamil Nadu 600032'
    },
    {
      name: 'Wipro Digital',
      company: 'Wipro Limited',
      checkInLat: 12.9634,
      checkInLng: 80.2462,
      checkInAddress: 'Wipro Office, Perungudi, Chennai, Tamil Nadu 600096'
    }
  ];

  // Different checkout locations (some nearby, some far)
  const checkoutScenarios = {
    nearby: (lat: number, lng: number) => ({
      lat: lat + 0.002, // ~200m away
      lng: lng + 0.002,
      getSuffix: (addr: string) => addr.replace('Chennai', 'Near Chennai')
    }),
    medium: (lat: number, lng: number) => ({
      lat: lat + 0.005, // ~500m away
      lng: lng + 0.005,
      getSuffix: (addr: string) => addr.replace('Chennai', 'Chennai Area')
    }),
    farAway: (lat: number, lng: number) => ({
      lat: lat + 0.05, // ~5km away
      lng: lng + 0.05,
      address: 'T Nagar, Chennai, Tamil Nadu 600017'
    }),
    veryFar: (lat: number, lng: number) => ({
      lat: lat + 0.15, // ~15km away
      lng: lng + 0.15,
      address: 'Anna Nagar, Chennai, Tamil Nadu 600040'
    })
  };

  const visits: Visit[] = [];

  // John's visits - Mix of good and bad
  // Visit 1: TCS - Good (nearby checkout)
  const johnTCS = checkoutScenarios.nearby(clients[0].checkInLat, clients[0].checkInLng);
  visits.push({
    id: 'john-1',
    userId: 'john',
    userName: 'John',
    clientName: clients[0].name,
    companyName: clients[0].company,
    checkInTime: now - 5 * oneDayMs + 2 * oneHourMs,
    checkOutTime: now - 5 * oneDayMs + 4 * oneHourMs,
    latitude: clients[0].checkInLat,
    longitude: clients[0].checkInLng,
    checkInAddress: clients[0].checkInAddress,
    checkOutLatitude: johnTCS.lat,
    checkOutLongitude: johnTCS.lng,
    checkOutAddress: johnTCS.getSuffix(clients[0].checkInAddress),
    locationMismatch: false
  });

  // Visit 2: Infosys - Bad (far away checkout)
  visits.push({
    id: 'john-2',
    userId: 'john',
    userName: 'John',
    clientName: clients[1].name,
    companyName: clients[1].company,
    checkInTime: now - 4 * oneDayMs + 1 * oneHourMs,
    checkOutTime: now - 4 * oneDayMs + 3 * oneHourMs,
    latitude: clients[1].checkInLat,
    longitude: clients[1].checkInLng,
    checkInAddress: clients[1].checkInAddress,
    checkOutLatitude: checkoutScenarios.farAway(clients[1].checkInLat, clients[1].checkInLng).lat,
    checkOutLongitude: checkoutScenarios.farAway(clients[1].checkInLat, clients[1].checkInLng).lng,
    checkOutAddress: checkoutScenarios.farAway(clients[1].checkInLat, clients[1].checkInLng).address,
    locationMismatch: true
  });

  // Visit 3: Cognizant - Good (medium distance)
  const johnCognizant = checkoutScenarios.medium(clients[2].checkInLat, clients[2].checkInLng);
  visits.push({
    id: 'john-3',
    userId: 'john',
    userName: 'John',
    clientName: clients[2].name,
    companyName: clients[2].company,
    checkInTime: now - 3 * oneDayMs + 3 * oneHourMs,
    checkOutTime: now - 3 * oneDayMs + 5 * oneHourMs,
    latitude: clients[2].checkInLat,
    longitude: clients[2].checkInLng,
    checkInAddress: clients[2].checkInAddress,
    checkOutLatitude: johnCognizant.lat,
    checkOutLongitude: johnCognizant.lng,
    checkOutAddress: johnCognizant.getSuffix(clients[2].checkInAddress),
    locationMismatch: false
  });

  // Visit 4: HCL - Currently Active
  visits.push({
    id: 'john-4',
    userId: 'john',
    userName: 'John',
    clientName: clients[3].name,
    companyName: clients[3].company,
    checkInTime: now - 2 * oneHourMs,
    latitude: clients[3].checkInLat,
    longitude: clients[3].checkInLng,
    checkInAddress: clients[3].checkInAddress
  });

  // Visit 5: Wipro - Good (yesterday)
  const johnWipro = checkoutScenarios.nearby(clients[4].checkInLat, clients[4].checkInLng);
  visits.push({
    id: 'john-5',
    userId: 'john',
    userName: 'John',
    clientName: clients[4].name,
    companyName: clients[4].company,
    checkInTime: now - 1 * oneDayMs + 1 * oneHourMs,
    checkOutTime: now - 1 * oneDayMs + 4 * oneHourMs,
    latitude: clients[4].checkInLat,
    longitude: clients[4].checkInLng,
    checkInAddress: clients[4].checkInAddress,
    checkOutLatitude: johnWipro.lat,
    checkOutLongitude: johnWipro.lng,
    checkOutAddress: johnWipro.getSuffix(clients[4].checkInAddress),
    locationMismatch: false
  });

  // Jacob's visits - More mismatches
  // Visit 1: TCS - Very far checkout (BAD)
  visits.push({
    id: 'jacob-1',
    userId: 'jacob',
    userName: 'Jacob',
    clientName: clients[0].name,
    companyName: clients[0].company,
    checkInTime: now - 6 * oneDayMs + 2 * oneHourMs,
    checkOutTime: now - 6 * oneDayMs + 5 * oneHourMs,
    latitude: clients[0].checkInLat,
    longitude: clients[0].checkInLng,
    checkInAddress: clients[0].checkInAddress,
    checkOutLatitude: checkoutScenarios.veryFar(clients[0].checkInLat, clients[0].checkInLng).lat,
    checkOutLongitude: checkoutScenarios.veryFar(clients[0].checkInLat, clients[0].checkInLng).lng,
    checkOutAddress: checkoutScenarios.veryFar(clients[0].checkInLat, clients[0].checkInLng).address,
    locationMismatch: true
  });

  // Visit 2: Infosys - Good
  const jacobInfosys = checkoutScenarios.nearby(clients[1].checkInLat, clients[1].checkInLng);
  visits.push({
    id: 'jacob-2',
    userId: 'jacob',
    userName: 'Jacob',
    clientName: clients[1].name,
    companyName: clients[1].company,
    checkInTime: now - 5 * oneDayMs + 1 * oneHourMs,
    checkOutTime: now - 5 * oneDayMs + 3 * oneHourMs,
    latitude: clients[1].checkInLat,
    longitude: clients[1].checkInLng,
    checkInAddress: clients[1].checkInAddress,
    checkOutLatitude: jacobInfosys.lat,
    checkOutLongitude: jacobInfosys.lng,
    checkOutAddress: jacobInfosys.getSuffix(clients[1].checkInAddress),
    locationMismatch: false
  });

  // Visit 3: Cognizant - Bad (far checkout)
  visits.push({
    id: 'jacob-3',
    userId: 'jacob',
    userName: 'Jacob',
    clientName: clients[2].name,
    companyName: clients[2].company,
    checkInTime: now - 4 * oneDayMs + 2 * oneHourMs,
    checkOutTime: now - 4 * oneDayMs + 6 * oneHourMs,
    latitude: clients[2].checkInLat,
    longitude: clients[2].checkInLng,
    checkInAddress: clients[2].checkInAddress,
    checkOutLatitude: checkoutScenarios.farAway(clients[2].checkInLat, clients[2].checkInLng).lat,
    checkOutLongitude: checkoutScenarios.farAway(clients[2].checkInLat, clients[2].checkInLng).lng,
    checkOutAddress: checkoutScenarios.farAway(clients[2].checkInLat, clients[2].checkInLng).address,
    locationMismatch: true
  });

  // Visit 4: HCL - Good
  const jacobHCL = checkoutScenarios.medium(clients[3].checkInLat, clients[3].checkInLng);
  visits.push({
    id: 'jacob-4',
    userId: 'jacob',
    userName: 'Jacob',
    clientName: clients[3].name,
    companyName: clients[3].company,
    checkInTime: now - 2 * oneDayMs + 3 * oneHourMs,
    checkOutTime: now - 2 * oneDayMs + 7 * oneHourMs,
    latitude: clients[3].checkInLat,
    longitude: clients[3].checkInLng,
    checkInAddress: clients[3].checkInAddress,
    checkOutLatitude: jacobHCL.lat,
    checkOutLongitude: jacobHCL.lng,
    checkOutAddress: jacobHCL.getSuffix(clients[3].checkInAddress),
    locationMismatch: false
  });

  // Visit 5: Wipro - Bad (very far)
  visits.push({
    id: 'jacob-5',
    userId: 'jacob',
    userName: 'Jacob',
    clientName: clients[4].name,
    companyName: clients[4].company,
    checkInTime: now - 1 * oneDayMs + 2 * oneHourMs,
    checkOutTime: now - 1 * oneDayMs + 4 * oneHourMs,
    latitude: clients[4].checkInLat,
    longitude: clients[4].checkInLng,
    checkInAddress: clients[4].checkInAddress,
    checkOutLatitude: checkoutScenarios.veryFar(clients[4].checkInLat, clients[4].checkInLng).lat,
    checkOutLongitude: checkoutScenarios.veryFar(clients[4].checkInLat, clients[4].checkInLng).lng,
    checkOutAddress: checkoutScenarios.veryFar(clients[4].checkInLat, clients[4].checkInLng).address,
    locationMismatch: true
  });

  // Sarah's visits - All good employee
  const sarahVisits = [
    { client: 0, days: 7 },
    { client: 1, days: 6 },
    { client: 2, days: 4 },
    { client: 3, days: 3 },
    { client: 4, days: 2 }
  ];

  sarahVisits.forEach((visit, index) => {
    const client = clients[visit.client];
    const checkOut = checkoutScenarios.nearby(client.checkInLat, client.checkInLng);
      visits.push({
      id: `sarah-${index + 1}`,
      userId: 'sarah',
      userName: 'Sarah',
      clientName: client.name,
      companyName: client.company,
      checkInTime: now - visit.days * oneDayMs + 1 * oneHourMs,
      checkOutTime: now - visit.days * oneDayMs + 3 * oneHourMs,
      latitude: client.checkInLat,
      longitude: client.checkInLng,
      checkInAddress: client.checkInAddress,
      checkOutLatitude: checkOut.lat,
      checkOutLongitude: checkOut.lng,
      checkOutAddress: checkOut.getSuffix(client.checkInAddress),
      locationMismatch: false
    });
  });

  // Mike's visits - Mostly bad
  // Visit 1: TCS - Bad
  visits.push({
    id: 'mike-1',
    userId: 'mike',
    userName: 'Mike',
    clientName: clients[0].name,
    companyName: clients[0].company,
    checkInTime: now - 5 * oneDayMs + 1 * oneHourMs,
    checkOutTime: now - 5 * oneDayMs + 2 * oneHourMs,
    latitude: clients[0].checkInLat,
    longitude: clients[0].checkInLng,
    checkInAddress: clients[0].checkInAddress,
    checkOutLatitude: checkoutScenarios.farAway(clients[0].checkInLat, clients[0].checkInLng).lat,
    checkOutLongitude: checkoutScenarios.farAway(clients[0].checkInLat, clients[0].checkInLng).lng,
    checkOutAddress: checkoutScenarios.farAway(clients[0].checkInLat, clients[0].checkInLng).address,
    locationMismatch: true
  });

  // Visit 2: Cognizant - Bad
  visits.push({
    id: 'mike-2',
    userId: 'mike',
    userName: 'Mike',
    clientName: clients[2].name,
    companyName: clients[2].company,
    checkInTime: now - 3 * oneDayMs + 2 * oneHourMs,
    checkOutTime: now - 3 * oneDayMs + 4 * oneHourMs,
    latitude: clients[2].checkInLat,
    longitude: clients[2].checkInLng,
    checkInAddress: clients[2].checkInAddress,
    checkOutLatitude: checkoutScenarios.veryFar(clients[2].checkInLat, clients[2].checkInLng).lat,
    checkOutLongitude: checkoutScenarios.veryFar(clients[2].checkInLat, clients[2].checkInLng).lng,
    checkOutAddress: checkoutScenarios.veryFar(clients[2].checkInLat, clients[2].checkInLng).address,
    locationMismatch: true
  });

  // Visit 3: Wipro - Good (one good visit)
  const mikeWipro = checkoutScenarios.nearby(clients[4].checkInLat, clients[4].checkInLng);
  visits.push({
    id: 'mike-3',
    userId: 'mike',
    userName: 'Mike',
    clientName: clients[4].name,
    companyName: clients[4].company,
    checkInTime: now - 1 * oneDayMs + 1 * oneHourMs,
    checkOutTime: now - 1 * oneDayMs + 5 * oneHourMs,
    latitude: clients[4].checkInLat,
    longitude: clients[4].checkInLng,
    checkInAddress: clients[4].checkInAddress,
    checkOutLatitude: mikeWipro.lat,
    checkOutLongitude: mikeWipro.lng,
    checkOutAddress: mikeWipro.getSuffix(clients[4].checkInAddress),
    locationMismatch: false
  });

  // Emma's visits - Currently active
  visits.push({
    id: 'emma-1',
    userId: 'emma',
    userName: 'Emma',
    clientName: clients[1].name,
    companyName: clients[1].company,
    checkInTime: now - 1 * oneHourMs,
    latitude: clients[1].checkInLat,
    longitude: clients[1].checkInLng,
    checkInAddress: clients[1].checkInAddress
  });

  // Sort by check-in time
  visits.sort((a, b) => +a.checkInTime - +b.checkInTime);

  return visits;
};

export const loadDemoData = () => {
  const demoVisits = generateDemoData();
  localStorage.setItem('locationTrackerVisits', JSON.stringify(demoVisits));
  console.log('Demo data loaded:', demoVisits.length, 'visits');
};

export const clearDemoData = () => {
  localStorage.removeItem('locationTrackerVisits');
  console.log('Demo data cleared');
};

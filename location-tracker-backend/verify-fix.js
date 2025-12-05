const http = require('http');

const url = 'http://localhost:5000/api/visits';

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const visits = JSON.parse(data);
            console.log(`Fetched ${visits.length} visits.`);
            if (visits.length > 0) {
                const first = visits[0];
                console.log('First visit keys:', Object.keys(first));

                const hasCamelCase = 'checkInTime' in first;
                const hasLowerCase = 'checkintime' in first;

                console.log(`Has checkInTime (camelCase): ${hasCamelCase}`);
                console.log(`Has checkintime (lowercase): ${hasLowerCase}`);

                if (hasCamelCase && !hasLowerCase) {
                    console.log('✅ PASS: Keys are camelCase.');
                } else if (hasLowerCase) {
                    console.log('❌ FAIL: Keys are lowercase (Postgres default).');
                } else {
                    console.log('❓ UNKNOWN: Neither key found?');
                }
            } else {
                console.log('⚠️ No visits to verify.');
            }
        } catch (e) {
            console.error('Error parsing response:', e);
        }
    });
}).on('error', (err) => {
    console.error('Error fetching visits:', err);
});

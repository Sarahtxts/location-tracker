const db = require('./db-postgres');

async function debugVisits() {
    try {
        console.log('Querying visits table...');
        const res = await db.query('SELECT * FROM visits');
        console.log(`Found ${res.rows.length} visits.`);
        if (res.rows.length > 0) {
            console.log('First 5 visits:', JSON.stringify(res.rows.slice(0, 5), null, 2));
        } else {
            console.log('No visits found.');
        }
    } catch (err) {
        console.error('Error querying visits:', err);
    }
}

debugVisits();

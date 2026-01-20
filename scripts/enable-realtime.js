
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Ranveer1516@db.gqvewhersuunntjllcss.supabase.co:5432/postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

async function enableRealtime() {
    try {
        await client.connect();
        console.log('Connected to database');

        // Check if table is already in publication (optional, or just try adding it)
        // Often "supabase_realtime" is the default publication.
        // We try to add the table to it.
        try {
            await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE members;`);
            console.log('Realtime enabled for table "members".');
        } catch (e) {
            if (e.message.includes('already in publication')) {
                console.log('Table "members" is already in supabase_realtime publication.');
            } else {
                throw e;
            }
        }

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

enableRealtime();

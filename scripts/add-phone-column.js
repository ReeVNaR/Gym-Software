
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Ranveer1516@db.gqvewhersuunntjllcss.supabase.co:5432/postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

async function addPhoneColumn() {
    try {
        await client.connect();
        console.log('Connected to database');

        await client.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS phone TEXT;`);
        console.log('Added phone column to members table.');

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

addPhoneColumn();

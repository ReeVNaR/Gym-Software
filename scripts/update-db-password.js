
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Ranveer1516@db.gqvewhersuunntjllcss.supabase.co:5432/postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

async function addPasswordColumn() {
    try {
        await client.connect();
        console.log('Connected to database');

        await client.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS password TEXT;`);
        console.log('Added password column to members table.');

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

addPasswordColumn();

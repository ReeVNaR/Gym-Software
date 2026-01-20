
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Ranveer1516@db.gqvewhersuunntjllcss.supabase.co:5432/postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

async function setupDatabase() {
    try {
        await client.connect();
        console.log('Connected to database');

        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT,
        email TEXT,
        plan TEXT,
        status TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

        await client.query(createTableQuery);
        console.log('Table "members" created or already exists.');

        // Check if empty, if so seed some data
        const res = await client.query('SELECT count(*) FROM members');
        if (parseInt(res.rows[0].count) === 0) {
            const seedQuery = `
            INSERT INTO members (full_name, email, plan, status) VALUES
            ('Sarah Connor', 'sarah@skynet.com', 'Elite', 'Active'),
            ('John Rambo', 'john@firstblood.com', 'Pro Athlete', 'Pending'),
            ('Ellen Ripley', 'ripley@weyland.com', 'Day Pass', 'Active');
        `;
            await client.query(seedQuery);
            console.log('Seeded initial data.');
        }

    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

setupDatabase();

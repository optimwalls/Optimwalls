import pkg from 'pg';
const { Client } = pkg;

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Attempting to connect with these parameters:');
    console.log('Host:', process.env.PGHOST);
    console.log('Port:', process.env.PGPORT);
    console.log('Database:', process.env.PGDATABASE);
    console.log('User:', process.env.PGUSER);
    // Don't log password

    await client.connect();

    const res = await client.query('SELECT NOW()');
    console.log('Connection successful:', res.rows[0]);

    await client.end();
    return true;
  } catch (err) {
    console.error('Connection error:', err);
    throw err;
  }
}

testConnection().catch(console.error);
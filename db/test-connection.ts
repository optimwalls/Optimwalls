import pkg from 'pg';
const { Client } = pkg;

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Connection parameters:');
  console.log('DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL ? 'Present' : 'Missing');

  if (!process.env.DATABASE_PUBLIC_URL) {
    throw new Error('DATABASE_PUBLIC_URL environment variable is required');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_PUBLIC_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('Connection successful!');

    const res = await client.query('SELECT version()');
    console.log('Server version:', res.rows[0].version);

    await client.end();
    return true;
  } catch (err) {
    console.error('Connection error:', err);
    throw err;
  }
}

// Run the test
testConnection()
  .then(() => {
    console.log('Database connection test completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database connection test failed:', err);
    process.exit(1);
  });
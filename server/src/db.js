import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/openfirehouse'
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;

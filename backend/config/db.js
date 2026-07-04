const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     process.env.DB_PORT     || 5432,
        database: process.env.DB_NAME     || 'yerbateras',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASS     || '',
      }
);

pool.on('error', (err) => console.error('PostgreSQL error:', err));
module.exports = pool;
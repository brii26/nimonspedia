const  { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'nimonspedia_user',
    password: process.env.DB_PASS || 'nimonspedia_pass',
    database: process.env.DB_NAME || 'nimonspedia',
    port: process.env.DB_PORT || '5432',
})

pool.on('connect', () => {
    console.log('Connnected to PSQL');
})

module.exports = pool;
const sql = require('mssql');

// Configuración de la conexión con un POOL, solo para el dashboard
const poolConfig = {
    user: 'sa',
    password: '123456',
    server: 'ACER_Core_i7',
    database: 'Cipro',
    options: {
        trustServerCertificate: true,
        encrypt: false,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000 // Cierra conexiones inactivas después de 30 segundos
    }
};

// Crea el pool de conexiones una sola vez
const pool = new sql.ConnectionPool(poolConfig);
const poolConnect = pool.connect();

pool.on('error', err => {
    console.error('Error en el Pool de SQL Server (Dashboard)', err);
});

module.exports = {
    pool,
    poolConnect // Exportamos la promesa de conexión para usarla en la ruta del dashboard
};
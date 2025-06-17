const express = require('express');
const router = express.Router();
const sql = require('mssql');

const config = {
    user: 'sa',
    password: '123456',
    server: 'DESKTOP-GMBSO0H',
    database: 'Cipro',
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};

// Ruta para obtener especializaciones
router.get('/', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT idEspecializacion, nombre FROM Especializacion`;
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Error al obtener especializaciones:", err);
        res.status(500).json({ error: 'Error al cargar especializaciones' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

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

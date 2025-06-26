const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

router.get('/', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query('SELECT idServicio, nombreServicio FROM Servicios ORDER BY nombreServicio');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        res.status(500).json([]);
    }
});




module.exports = router;
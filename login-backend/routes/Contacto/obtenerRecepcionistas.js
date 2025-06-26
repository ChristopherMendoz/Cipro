const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../../config'); // Asume que tienes un archivo config.js con la configuración de la BD

router.get('/', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT idRecepcionista, nombreCompleto FROM Recepcionista;
        `;
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener recepcionistas:', error);
        res.status(500).json({ mensaje: "Error del servidor al obtener recepcionistas." });
    } finally {
        sql.close();
    }
});

module.exports = router;
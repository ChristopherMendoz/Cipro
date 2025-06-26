const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../../config.js'); // o tu config

// Ruta para obtener imágenes por ID de consulta
// GET /api/consultas/:id/imagenes
router.get('/consultas/:idConsulta/imagenes', async (req, res) => {
    const { idConsulta } = req.params;

    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT urlImagen, descripcion 
            FROM ImagenesConsulta 
            WHERE idConsulta = ${idConsulta}
        `;
        res.json({ ok: true, imagenes: result.recordset });
    } catch (error) {
        console.error("Error al obtener imágenes de la consulta:", error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor" });
    }
});

module.exports = router;
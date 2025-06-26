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

// GET /api/especializaciones
router.get('/especial', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM Especializacion ORDER BY nombre`;
        res.json(result.recordset);
    } catch (error) { res.status(500).json([]); }
});


// POST /api/especializaciones
router.post('/', async (req, res) => {
    const { nombre } = req.body;
    try {
        await sql.connect(config);
        await sql.query`INSERT INTO Especializacion (nombre) VALUES (${nombre})`;
        res.status(201).json({ ok: true, mensaje: 'Especialización creada exitosamente.' });
    } catch (error) {
        if (error.number === 2627) { // Error de llave única
            return res.status(409).json({ ok: false, mensaje: 'Ya existe una especialización con ese nombre.' });
        }
        res.status(500).json({ ok: false, mensaje: 'Error al crear la especialización.' });
    }
});

// DELETE /api/especializaciones/:id
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(config);
        await sql.query`DELETE FROM Especializacion WHERE idEspecializacion = ${id}`;
        res.json({ ok: true, mensaje: 'Especialización eliminada.' });
    } catch (error) {
        if (error.number === 547) {
            return res.status(409).json({ ok: false, mensaje: 'No se puede eliminar, esta especialización está asignada a uno o más médicos.' });
        }
        res.status(500).json({ ok: false, mensaje: 'Error del servidor al eliminar.' });
    }
});

// --- RUTAS NUEVAS ---
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM Especializacion WHERE idEspecializacion = ${id}`;
        res.json(result.recordset[0]);
    } catch (e) { res.status(500).json({}); }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    try {
        await sql.connect(config);
        await sql.query`UPDATE Especializacion SET nombre = ${nombre} WHERE idEspecializacion = ${id}`;
        res.json({ ok: true, mensaje: 'Especialización actualizada.' });
    } catch (e) { res.status(500).json({ ok: false, mensaje: 'Error al actualizar.' }); }
});

module.exports = router;

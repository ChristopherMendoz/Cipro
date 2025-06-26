
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

// GET /api/salas (Obtiene todas las salas)
router.get('/', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM Sala ORDER BY nombre`;
        res.json(result.recordset);
    } catch (error) { res.status(500).json([]); }
});

// POST /api/salas (Crea una nueva sala)
router.post('/', async (req, res) => {
    const { nombre, tipo } = req.body;
    try {
        await sql.connect(config);
        await sql.query`INSERT INTO Sala (nombre, tipo) VALUES (${nombre}, ${tipo})`;
        res.status(201).json({ ok: true, mensaje: 'Sala creada exitosamente.' });
    } catch (error) { res.status(500).json({ ok: false, mensaje: 'Error al crear la sala.' }); }
});

// DELETE /api/salas/:id (Elimina una sala)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(config);
        await sql.query`DELETE FROM Sala WHERE idSala = ${id}`;
        res.json({ ok: true, mensaje: 'Sala eliminada.' });
    } catch (error) {
        if (error.number === 547) {
            return res.status(409).json({ ok: false, mensaje: 'No se puede eliminar esta sala porque está en uso en alguna cita.' });
        }
        res.status(500).json({ ok: false, mensaje: 'Error del servidor al eliminar.' });
    }
});

// --- RUTAS NUEVAS ---
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM Sala WHERE idSala = ${id}`;
        res.json(result.recordset[0]);
    } catch (e) { res.status(500).json({}); }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, tipo } = req.body;
    try {
        await sql.connect(config);
        await sql.query`UPDATE Sala SET nombre = ${nombre}, tipo = ${tipo} WHERE idSala = ${id}`;
        res.json({ ok: true, mensaje: 'Sala actualizada.' });
    } catch (e) { res.status(500).json({ ok: false, mensaje: 'Error al actualizar.' }); }
});

module.exports = router;
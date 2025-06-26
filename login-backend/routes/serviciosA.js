// En routes/servicios.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

// GET /api/servicios (Obtiene todos los servicios)
router.get('/', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM Servicios ORDER BY nombreServicio`;
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al obtener servicios.' });
    }
});

// POST /api/servicios (Crea un nuevo servicio)
router.post('/', async (req, res) => {
    const { nombreServicio, descripcion, preparacionRequerida } = req.body;
    try {
        await sql.connect(config);
        await sql.query`
            INSERT INTO Servicios (nombreServicio, descripcion, preparacionRequerida)
            VALUES (${nombreServicio}, ${descripcion}, ${preparacionRequerida})
        `;
        res.status(201).json({ ok: true, mensaje: 'Servicio creado exitosamente.' });
    } catch (error) {
        console.error("Error al crear servicio:", error);
        // Manejo de error de llave única
        if (error.number === 2627) {
            return res.status(409).json({ ok: false, mensaje: 'Ya existe un servicio con ese nombre.' });
        }
        res.status(500).json({ ok: false, mensaje: 'Error del servidor al crear el servicio.' });
    }
});

// GET /api/servicios/:id (Obtiene un solo servicio para editarlo)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM Servicios WHERE idServicio = ${id}`;
        if (result.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Servicio no encontrado.' });
        }
        res.json({ ok: true, data: result.recordset[0] });
    } catch (error) {
        res.status(500).json({ ok: false, mensaje: 'Error al obtener el servicio.' });
    }
});

// PUT /api/servicios/:id (Actualiza un servicio existente)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombreServicio, descripcion, preparacionRequerida } = req.body;
    try {
        await sql.connect(config);
        await sql.query`
            UPDATE Servicios SET
                nombreServicio = ${nombreServicio},
                descripcion = ${descripcion},
                preparacionRequerida = ${preparacionRequerida}
            WHERE idServicio = ${id}
        `;
        res.json({ ok: true, mensaje: 'Servicio actualizado correctamente.' });
    } catch (error) {
        if (error.number === 2627) { // Error de llave única
            return res.status(409).json({ ok: false, mensaje: 'Ya existe un servicio con ese nombre.' });
        }
        res.status(500).json({ ok: false, mensaje: 'Error del servidor al actualizar.' });
    }
});

// DELETE /api/servicios/:id (Elimina un servicio)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(config);
        await sql.query`DELETE FROM Servicios WHERE idServicio = ${id}`;
        res.json({ ok: true, mensaje: 'Servicio eliminado correctamente.' });
    } catch (error) {
        // Error de Foreign Key (si el servicio está en uso en una consulta)
        if (error.number === 547) {
            return res.status(409).json({ ok: false, mensaje: 'No se puede eliminar este servicio porque ya está siendo utilizado en algunas citas.' });
        }
        res.status(500).json({ ok: false, mensaje: 'Error del servidor al eliminar.' });
    }
});

module.exports = router;
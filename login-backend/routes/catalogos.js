const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

// Lista de pacientes
router.get('/pacientes', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT idPaciente, primerNombre + ' ' + primerApellido AS nombreCompleto
            FROM Paciente
        `;
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json([]);
    }
});

// Lista de médicos
router.get('/medicos', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT idMedico,nombreCompleto
            FROM Medico
        `;
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json([]);
    }
});

// Lista de salas
router.get('/salas', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT idSala, nombre
            FROM Sala
        `;
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json([]);
    }
});

// Lista de recepcionistas
router.get('/recepcionistas', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT idRecepcionista, nombreCompleto
            FROM Recepcionista
        `;
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json([]);
    }
});

module.exports = router;

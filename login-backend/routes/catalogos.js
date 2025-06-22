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
// En tu archivo de rutas del backend (ej: catalogos.js)

// Esta ruta AHORA devolverá un array con UN SOLO médico: el que está logueado.
router.get('/medicos', async (req, res) => {

    // 1. Primero, verifica que haya un médico en la sesión.
    if (!req.session || !req.session.idMedico) {
        // Si no hay sesión, devuelve un array vacío para no romper el frontend.
        return res.status(401).json([]);
    }

    try {
        const idMedicoLogueado = req.session.idMedico;
        await sql.connect(config);

        // 2. La consulta busca únicamente al médico de la sesión.
        const result = await sql.query`
            SELECT idMedico, nombreCompleto 
            FROM Medico 
            WHERE idMedico = ${idMedicoLogueado}
        `;

        // 3. ¡ESTA ES LA CLAVE! Se devuelve result.recordset directamente.
        // sql.query siempre devuelve 'recordset' como un array,
        // incluso si solo contiene un elemento. Esto es exactamente lo que el frontend necesita.
        res.json(result.recordset);

    } catch (error) {
        console.error("Error al obtener catálogo del médico logueado:", error);
        // En caso de error, envía un array vacío.
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
// Lista de recepcionistas
router.get('/servicios', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT idServicio, nombreServicio
            FROM Servicios
        `;
        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res.status(500).json([]);
    }
});

module.exports = router;

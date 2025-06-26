const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../../config'); // Asume que tienes un archivo config.js con la configuración de la BD

router.get('/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT idPaciente, primerNombre, primerApellido, segundoNombre, segundoApellido, fechaNacimiento, sexo, direccion, telefono, tipoSangre
            FROM Paciente
            WHERE idUsuario = ${idUsuario}
        `;
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ mensaje: "Paciente no encontrado para este usuario." });
        }
    } catch (error) {
        console.error('Error al obtener paciente por idUsuario:', error);
        res.status(500).json({ mensaje: "Error del servidor al obtener datos del paciente." });
    } finally {
        sql.close();
    }
});

module.exports = router;
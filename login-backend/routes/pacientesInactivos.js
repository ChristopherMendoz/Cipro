const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

//pacientes inactivos
router.get('/inactivos', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT 
          P.*, 
          U.correo
          FROM Paciente P
          JOIN UsuarioSistema U ON P.idUsuario = U.idUsuario
          WHERE U.estado = 0
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener pacientes inactivos:", error);
    res.status(500).json({ ok: false, mensaje: "Error al obtener pacientes inactivos." });
  }
});



module.exports = router;

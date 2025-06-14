const express = require('express');
const router = express.Router();
const sql = require('mssql');

const config = {
  user: 'sa',
  password: '123456',
  server: 'pc',
  database: 'Cipro',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

//obtener medicos inactivos
router.get('/', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT M.idMedico, M.nombreCompleto, M.cedulaProfesional, M.telefono, E.nombre AS especializacion
      FROM Medico M
      JOIN UsuarioSistema U ON M.idUsuario = U.idUsuario
      JOIN Especializacion E ON M.idEspecializacion = E.idEspecializacion
      WHERE U.estado = 0;
    `;
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener médicos inactivos:", error);
    res.status(500).json({ ok: false, mensaje: "Error del servidor" });
  }
});




module.exports = router;

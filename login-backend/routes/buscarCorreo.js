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

router.get('/', async (req, res) => {
  const { q } = req.query;
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT correo FROM UsuarioSistema WHERE correo LIKE ${'%' + q + '%'}
    `;
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error al buscar correos:", err);
    res.status(500).json([]);
  }
});

module.exports = router;
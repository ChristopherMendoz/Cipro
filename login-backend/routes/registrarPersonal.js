const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcrypt');

const config = {
  user: 'sa',
  password: '123456',
  server: 'DESKTOP-GMBSO0H',
  database: 'Cipro',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

// 🔢 Función para generar ID único (ej: PER001)
async function generarIdUsuario(idRol) {
  let prefijo = idRol === 2 ? 'PER' : 'ADM';
  // Buscar el máximo número usado para ese prefijo
  const result = await sql.query`
    SELECT MAX(CAST(SUBSTRING(idUsuario, 4, 3) AS INT)) AS maxId
    FROM UsuarioSistema
    WHERE idUsuario LIKE ${prefijo + '%'}
  `;
  const maxId = result.recordset[0].maxId || 0;
  return `${prefijo}${String(maxId + 1).padStart(3, '0')}`;
}

router.post('/', async (req, res) => {
  const {
    nombreCompleto,
    cedulaProfesional,
    telefono,
    correo,
    nombreUsuario,
    contraseña,
    idEspecializacion
  } = req.body;

  try {
    await sql.connect(config);

    // Validar existencia de correo o usuario
    const [correoCheck, usuarioCheck] = await Promise.all([
      sql.query`SELECT 1 FROM UsuarioSistema WHERE correo = ${correo}`,
      sql.query`SELECT 1 FROM UsuarioSistema WHERE nombreUsuario = ${nombreUsuario}`
    ]);

    if (correoCheck.recordset.length > 0)
      return res.json({ ok: false, mensaje: "Correo ya registrado" });

    if (usuarioCheck.recordset.length > 0)
      return res.json({ ok: false, mensaje: "Usuario ya registrado" });

    const idRol = 2; // Personal
    const idUsuario = await generarIdUsuario(idRol);
    const hash = await bcrypt.hash(contraseña, 10);

    // Insertar en UsuarioSistema
    await sql.query`
      INSERT INTO UsuarioSistema (idUsuario, nombreUsuario, contraseña, correo, idRol, Estado)
      VALUES (${idUsuario}, ${nombreUsuario}, ${hash}, ${correo}, ${idRol}, 1)
    `;

    // Insertar en Medico
    await sql.query`
      INSERT INTO Medico (nombreCompleto, cedulaProfesional, telefono, idEspecializacion, idUsuario)
      VALUES (${nombreCompleto}, ${cedulaProfesional}, ${telefono}, ${idEspecializacion}, ${idUsuario})
    `;

    res.json({ ok: true, mensaje: "Personal registrado correctamente" });
  } catch (error) {
    console.error("❌ Error al registrar personal:", error);
    res.status(500).json({ ok: false, mensaje: "Error en el servidor" });
  }
});

module.exports = router;
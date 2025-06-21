const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcrypt');
//const config = require('../config.js');

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


router.post('/', async (req, res) => {
  const {
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    fechaNacimiento,
    sexo,
    direccion,
    telefono,
    tipoSangre,
    correo,
    nombreUsuario,
    contrasena
  } = req.body;



  try {
    await sql.connect(config);
    const idRol = 1; // Cliente por defecto
    const idUsuario = await generarIdUsuario(idRol);

    async function generarIdUsuario(idRol) {
      let prefijo = "";

      switch (idRol) {
        case 1:
          prefijo = "CLI";
          break;
        case 2:
          prefijo = "PER";
          break;
        case 3:
          prefijo = "ADM";
          break;
        default:
          throw new Error("Rol no válido.");
      }

      const result = await sql.query`
      SELECT COUNT(*) AS total FROM UsuarioSistema WHERE idRol = ${idRol}
      `;

      const total = result.recordset[0].total + 1;
      const numeroFormateado = String(total).padStart(3, '0'); // 001, 002, ...
      return `${prefijo}${numeroFormateado}`;
    }



    // Verificar correo único
    const resultCorreo = await sql.query`SELECT * FROM UsuarioSistema WHERE correo = ${correo}`;
    if (resultCorreo.recordset.length > 0) {
      return res.json({ ok: false, mensaje: "El correo ya está registrado." });
    }

    // Verificar nombre de usuario único
    const resultUsername = await sql.query`SELECT * FROM UsuarioSistema WHERE nombreUsuario = ${nombreUsuario}`;
    if (resultUsername.recordset.length > 0) {
      return res.json({ ok: false, mensaje: "El nombre de usuario ya está registrado." });
    }

    // Hashear la contraseña
    const hash = await bcrypt.hash(contrasena, 10);

    // Insertar en UsuarioSistema (suponiendo RolId = 1 para Paciente)
    await sql.query`
    INSERT INTO UsuarioSistema (idUsuario, nombreUsuario, contraseña, correo, idRol, Estado)
    VALUES (${idUsuario}, ${nombreUsuario}, ${hash}, ${correo}, ${idRol}, 1)
    `;

    await sql.query`
    INSERT INTO Paciente (
    primerNombre, segundoNombre, primerApellido, segundoApellido,
    fechaNacimiento, sexo, direccion, telefono, tipoSangre, idUsuario
    )
    VALUES (
    ${primerNombre}, ${segundoNombre}, ${primerApellido}, ${segundoApellido},
    ${fechaNacimiento}, ${sexo}, ${direccion}, ${telefono}, ${tipoSangre}, ${idUsuario}
    )
    `;

    return res.json({ ok: true, mensaje: "Registro exitoso" });

  } catch (error) {
    console.error('❌ Error al registrar:', error);
    res.status(500).json({ ok: false, mensaje: "Error del servidor al registrar." });
  }
});




module.exports = router;

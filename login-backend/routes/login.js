const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcrypt');

let intentosFallidos = 0;
let bloqueoHasta = null;

// Configuración SQL Server
const config = {
  user: 'sa',
  password: '123456',
  server: 'pc',
  database: 'Cipro',
  options: {
    trustServerCertificate: true,
    encrypt: false,
  }
};

router.post('/', async (req, res) => {
  const { Username, Contrasena } = req.body;
  const ahora = Date.now();

  // Verifica si el login está bloqueado
  if (bloqueoHasta && ahora < bloqueoHasta) {
    const segundosRestantes = Math.ceil((bloqueoHasta - ahora) / 1000);
    return res.json({
      ok: false,
      mensaje: `Demasiados intentos fallidos. Intenta de nuevo en ${segundosRestantes} segundos.`
    });
  }

  try {
    await sql.connect(config);

    const result = await sql.query`
      SELECT * FROM UsuarioSistema WHERE nombreUsuario = ${Username}
    `;

    // Usuario no encontrado
    if (result.recordset.length === 0) {
      registrarIntentoFallido();
      return res.json({ ok: false, mensaje: "Usuario no encontrado." });
    }

    const usuario = result.recordset[0];
    const passwordCorrecta = await bcrypt.compare(Contrasena, usuario.contraseña);

    // Contraseña incorrecta
    if (!passwordCorrecta) {
      registrarIntentoFallido();
      return res.json({ ok: false, mensaje: "Contraseña incorrecta." });
    }

    // Login exitoso
    intentosFallidos = 0;
    bloqueoHasta = null;

    // Redirección por rol
    let redireccion = '/Clinica.html';
    switch (usuario.idRol) {
      case 1:
        redireccion = '/Paciente.html';
        break;
      case 2:
        redireccion = '/Medico.html';
        break;
      case 3:
        redireccion = '/Admin.html';
        break;
    }

    return res.json({
      ok: true,
      redireccion,
      idUsuario: usuario.idUsuario // 👈 Asegúrate que esto esté presente
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error del servidor."
    });
  }
});

// Función de intento fallido
function registrarIntentoFallido() {
  intentosFallidos++;
  if (intentosFallidos >= 5) {
    bloqueoHasta = Date.now() + 30 * 1000; // 30 segundos
    intentosFallidos = 0;
  }
}

module.exports = router;

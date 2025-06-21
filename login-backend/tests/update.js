//encripta todas las contraseñas que no esten encriptadas... y las que estan encriptadas solo las ignora..


const bcrypt = require('bcrypt');
const sql = require('mssql');

// CONFIGURACIÓN DE CONEXIÓN
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

async function actualizarContrasenas() {
  try {
    await sql.connect(config);

    // Traer todos los usuarios activos
    const result = await sql.query`
      SELECT idUsuario, nombreUsuario, contraseña 
      FROM UsuarioSistema 
      WHERE Estado = 1
    `;

    for (const user of result.recordset) {
      const contrasena = user.contraseña;

      // Si ya está encriptada, ignoramos
      if (contrasena.startsWith('$2')) {
        console.log(`🔒 ${user.nombreUsuario}: ya encriptada. Saltando...`);
        continue;
      }

      // Encriptar y actualizar
      const hash = await bcrypt.hash(contrasena, 10);

      await sql.query`
        UPDATE UsuarioSistema 
        SET contraseña = ${hash} 
        WHERE idUsuario = ${user.idUsuario}
      `;

      console.log(`✅ ${user.nombreUsuario}: contraseña actualizada`);
    }

    console.log('\n🎉 Todas las contraseñas fueron procesadas con éxito.');
    process.exit();

  } catch (error) {
    console.error('❌ Error al actualizar contraseñas:', error);
    process.exit(1);
  }
}

actualizarContrasenas();

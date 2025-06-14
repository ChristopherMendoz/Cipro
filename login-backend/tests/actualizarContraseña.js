const bcrypt = require('bcrypt');
bcrypt.hash('rata123', 10).then(hash => console.log(hash));
//                 ^ reemplazar con la contraseña que queres

//luego en sql server reemplazar y poner este comando:
//update UsuarioSistema set contraseña = 'HASH_GENERADO' where nombreUsuario = 'tu_usuario';
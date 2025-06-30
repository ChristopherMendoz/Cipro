const sql = require('mssql');

const config = {
  user: 'sa',
  password: '123456',
  server: 'ACER_Core_i7',
  database: 'Cipro',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

sql.connect(config)
  .then(() => {
    console.log('✅ Conexión exitosa a SQL Server');
    sql.close();
  })
  .catch(err => {
    console.error('❌ Error al conectar a SQL Server:', err);
  });
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); 
const sql = require('mssql');
const config = require('../../config.js');

const uploadDir = 'public/uploads';

// --- CAMBIO 1: AÑADIMOS UN FILTRO DE ARCHIVOS ---
// Esta función revisará cada archivo y solo aceptará los que sean imágenes.
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error(`Error: El tipo de archivo no es soportado. Solo se permiten imágenes (jpeg, jpg, png, gif).`));
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { idConsulta } = req.params;
        const consultaDir = path.join(uploadDir, `consulta_${idConsulta}`);
        fs.mkdirSync(consultaDir, { recursive: true });
        cb(null, consultaDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage, fileFilter: fileFilter });


router.post('/consultas/:idConsulta/upload', upload.array('imagenesConsulta', 10), async (req, res) => {
    const { idConsulta } = req.params;

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ ok: false, mensaje: 'No se seleccionó ningún archivo válido.' });
    }

    let pool;
    const transaction = new sql.Transaction(); // Mover la creación de la transacción fuera del try/catch del pool

    try {
        pool = await sql.connect(config);
        await transaction.begin();

        // Este enfoque es más seguro para las transacciones con esta librería.
        for (const file of req.files) {
            const urlImagen = `/uploads/consulta_${idConsulta}/${file.filename}`;
            const descripcion = req.body.descripcion || 'Imagen de estudio';

            const request = new sql.Request(transaction);
            await request.query`
                INSERT INTO ImagenesConsulta (idConsulta, urlImagen, descripcion)
                VALUES (${idConsulta}, ${urlImagen}, ${descripcion})
            `;
        }

        await transaction.commit();
        res.json({ ok: true, mensaje: 'Imágenes subidas y registradas correctamente.' });

    } catch (error) {
        console.error("Error al subir imágenes:", error);
        // Nos aseguramos de que el rollback solo se ejecute si la transacción se inició
        if (transaction.connected) {
            await transaction.rollback();
        }
        res.status(500).json({ ok: false, mensaje: 'Error del servidor al procesar las imágenes.' });
    } finally {
        if (pool) {
            pool.close();
        }
    }
});

// Middleware para manejar los errores específicos de Multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ ok: false, mensaje: `Error de Multer: ${error.message}` });
    } else if (error) {
        return res.status(400).json({ ok: false, mensaje: error.message });
    }
    next();
});

// RUTA PARA OBTENER IMÁGENES DE UNA CONSULTA
// GET /api/consultas/:id/imagenes
router.get('/consultas/:id/imagenes', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(config);
        // === CORRECCIÓN 1: Usamos la columna correcta 'urlImagen' en lugar de 'rutaArchivo' ===
        const result = await sql.query`
            SELECT idImagen, urlImagen 
            FROM ImagenesConsulta 
            WHERE idConsulta = ${id}`;
        
        // Mapeamos para que la URL sea accesible desde el frontend
        const imagenes = result.recordset.map(img => ({
            idImagen: img.idImagen,
            url: img.urlImagen // Usamos directamente el campo que ya es una URL
        }));
        res.json({ ok: true, imagenes });
    } catch (error) {
        console.error("Error al obtener imágenes de la consulta:", error);
        res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
    }
});

// RUTA PARA ELIMINAR UNA IMAGEN
// DELETE /api/imagenes/:id
router.delete('/imagenes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(config);
        
        // === CORRECCIÓN 2: Obtenemos de la columna correcta 'urlImagen' ===
        const result = await sql.query`SELECT urlImagen FROM ImagenesConsulta WHERE idImagen = ${id}`;
        if (result.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Imagen no encontrada en la base de datos.' });
        }
        
        const urlImagen = result.recordset[0].urlImagen;
        // === CORRECCIÓN 3: Reconstruimos la ruta física completa para poder borrar el archivo ===
        const rutaFisica = path.join(__dirname, '..', '..', 'public', urlImagen);

        if (fs.existsSync(rutaFisica)) {
            fs.unlinkSync(rutaFisica);
        }

        await sql.query`DELETE FROM ImagenesConsulta WHERE idImagen = ${id}`;
        res.json({ ok: true, mensaje: 'Imagen eliminada correctamente.' });
    } catch (error) {
        console.error("Error al eliminar la imagen:", error);
        res.status(500).json({ ok: false, mensaje: 'Error del servidor al eliminar la imagen.' });
    }
});


module.exports = router;
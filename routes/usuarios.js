const express = require('express');
const router = express.Router();
const db = require('../sqlite');

// Ruta para autenticar usuario
router.post('/login', (req, res) => {
    const { NombreUsuario, Password } = req.body;

    if (!NombreUsuario || !Password) {
        return res.status(400).json({ error: 'Nombre de usuario y contraseña son obligatorios' });
    }

    // Buscar el usuario en la base de datos
    db.get(`SELECT * FROM Usuarios WHERE NombreUsuario = ?`, [NombreUsuario], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error en el servidor', detalle: err.message });
        }

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (Password !== user.Password) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            usuario: {
                IDUsuario: user.IDUsuario,
                NombreUsuario: user.NombreUsuario,
                Rol: user.Rol,
                Correo: user.Correo,
                Telefono: user.Telefono,
                RFC: user.RFC,
                Password: user.Password,
                Nombres: user.Nombres,
                Apellidos: user.Apellidos
            },
        });
    });
});


// Ruta para obtener todos los usuarios
router.get('/', (req, res) => {
    db.all(`SELECT * FROM Usuarios`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.length > 0 ? rows : []);
        }
    });
});


//Ruta para crear un nuevo usuario
router.post('/', (req, res) => {
    const { Nombres, Apellidos, RFC, Telefono, Correo, Rol, NombreUsuario, Password } = req.body;

    db.run(`
        INSERT INTO Usuarios (Nombres, Apellidos, RFC, Telefono, Correo, Rol, NombreUsuario, Password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [Nombres, Apellidos, RFC, Telefono, Correo, Rol, NombreUsuario, Password], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ message: `¡Has registrado a ${req.body.NombreUsuario} en el sistema!`, id: this.lastID });
        }
    });
});

//Ruta para modificar un usuario
router.put('/:id', (req, res) => {
    const userId = req.params.id;
    const { Nombres, Apellidos, RFC, Telefono, NombreUsuario, Correo, Rol } = req.body;
    db.run(`
        UPDATE Usuarios SET Nombres = ?, Apellidos = ?, RFC = ?, Telefono = ?, NombreUsuario = ?, Correo = ?, Rol = ? WHERE IDUsuario = ?
    `, [Nombres, Apellidos, RFC, Telefono, NombreUsuario, Correo, Rol, userId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: `¡Has editados los datos de ${req.body.NombreUsuario} correctamente!` });
        }
    });
});

//Ruta para eliminar un usuario
router.delete('/:id', (req, res) => {
    const userId = req.params.id;
    db.run(`DELETE FROM Usuarios WHERE IDUsuario = ?`, [userId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: `¡Usuario eliminado con exito!` });
        }
    });
});

//Ruta para obtener un usuario por ID
router.get('/:id', (req, res) => {
    const userId = req.params.id;
    db.get(`SELECT * FROM Usuarios WHERE IDUsuario = ?`, [userId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: "Ese usuario no existe en el sistema." });
        }
    });
});

//Ruta para obtener un usuario por nombre
router.get('/nombre/:nombre', (req, res) => {
    const userName = req.params.nombre;
    db.all(`SELECT * FROM Usuarios WHERE NombreUsuario LIKE ?`, [`%${userName}%`], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

module.exports = router;
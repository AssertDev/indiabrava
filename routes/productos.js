const express = require('express');
const router = express.Router();
const db = require('../sqlite');


// Ruta para obtener todos los productos
router.get('/', (req, res) => {
    db.all(`SELECT * FROM Productos`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.length > 0 ? rows : []);
        }
    });
});


//Ruta para crear un nuevo producto
router.post('/', (req, res) => {
    const { Nombre, UnidadMedida, ContenidoNeto, Precio, Stock } = req.body;

    db.run(`
        INSERT INTO Productos (Nombre, UnidadMedida, ContenidoNeto, Precio, Stock) VALUES (?, ?, ?, ?, ?)
    `, [Nombre, UnidadMedida, ContenidoNeto, Precio, Stock], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ message: `¡Has registrado a ${req.body.Nombre} en el sistema!`, id: this.lastID });
        }
    });
});

// Ruta para modificar un producto
router.put('/:id', (req, res) => {
    const productoId = req.params.id;
    const { Nombre, UnidadMedida, ContenidoNeto, Precio, Stock, Imagen } = req.body;

    db.run(`
        UPDATE Productos SET Nombre = ?, UnidadMedida = ?, ContenidoNeto = ?, Precio = ?, Stock = ? WHERE IDProducto = ?
    `, [Nombre, UnidadMedida, ContenidoNeto, Precio, Stock, productoId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: `¡Has editado los datos de ${Nombre} correctamente!` });
        }
    });
});

//Ruta para eliminar un producto
router.delete('/:id', (req, res) => {
    const productoId = req.params.id;
    db.run(`DELETE FROM Productos WHERE IDProducto = ?`, [productoId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: `¡Producto eliminado con exito!` });
        }
    });
});

// Ruta para obtener un producto por ID
router.get('/:id', (req, res) => {
    const productoId = req.params.id;
    db.get(`SELECT * FROM Productos WHERE IDProducto = ?`, [productoId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: "Ese producto no existe en el sistema." });
        }
    });
});
//Ruta para obtener un producto por su nombre
router.get('/nombre/:nombre', (req, res) => {
    const producto = req.params.nombre;
    db.all(`SELECT * FROM Productos WHERE Nombre LIKE ?`, [`%${producto}%`], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

module.exports = router;
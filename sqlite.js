const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");

    /*db.run("DELETE FROM Usuarios", (err) => {
        if (err) {
            console.error('Error al eliminar usuarios:', err.message);
        } else {
            db.run("DELETE FROM sqlite_sequence WHERE name = 'Usuarios'", (err) => {
                if (err) {
                    console.error('Error al reiniciar el autoincremento:', err.message);
                } else {
                    console.log('ID de Usuarios reiniciado a 1.');
                }
            });
        }
    });

    db.run("DELETE FROM Productos", (err) => {
        if (err) {
            console.error('Error al eliminar productos:', err.message);
        } else {
            db.run("DELETE FROM sqlite_sequence WHERE name = 'Productos'", (err) => {
                if (err) {
                    console.error('Error al reiniciar el autoincremento:', err.message);
                } else {
                    console.log('ID de Productos reiniciado a 1.');
                }
            });
        }
    });

    db.run("DELETE FROM Ventas", (err) => {
        if (err) {
            console.error('Error al eliminar ventas:', err.message);
        } else {
            db.run("DELETE FROM sqlite_sequence WHERE name = 'Ventas'", (err) => {
                if (err) {
                    console.error('Error al reiniciar el autoincremento:', err.message);
                } else {
                    console.log('ID de Ventas reiniciado a 1.');
                }
            });
        }
    });

    db.run("DELETE FROM Clientes", (err) => {
        if (err) {
            console.error('Error al eliminar clientes:', err.message);
        } else {
            db.run("DELETE FROM sqlite_sequence WHERE name = 'Clientes'", (err) => {
                if (err) {
                    console.error('Error al reiniciar el autoincremento:', err.message);
                } else {
                    console.log('ID de Clientes reiniciado a 1.');
                }
            });
        }
    });*/

    db.run(`
        CREATE TABLE IF NOT EXISTS Usuarios (
            IDUsuario INTEGER PRIMARY KEY AUTOINCREMENT,
            Nombres TEXT NOT NULL,
            Apellidos TEXT NOT NULL,
            RFC TEXT NOT NULL,
            Telefono TEXT NOT NULL,
            Correo TEXT NOT NULL,
            Rol TEXT NOT NULL,
            NombreUsuario TEXT NOT NULL,
            Password TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Productos (
            IDProducto INTEGER PRIMARY KEY AUTOINCREMENT,
            Nombre TEXT NOT NULL,
            UnidadMedida TEXT NOT NULL,
            ContenidoNeto INTEGER NOT NULL,
            Precio REAL NOT NULL,
            Stock INTEGER NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Clientes (
            IDCliente INTEGER PRIMARY KEY AUTOINCREMENT,
            Empresa TEXT NOT NULL,
            RFC TEXT NOT NULL,
            Direccion TEXT NOT NULL,
            Telefono INTEGER NOT NULL,
            Correo TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Ventas (
            IDVenta INTEGER PRIMARY KEY AUTOINCREMENT,
            Fecha TEXT NOT NULL,
            Total REAL NOT NULL,
            Factura INTEGER NOT NULL,
            Pago REAL NOT NULL,
            Cambio REAL NOT NULL,
            IDCliente INTEGER,
            FOREIGN KEY (IDCliente) REFERENCES Clientes(IDCliente)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS DetalleVentas (
            IDVenta INTEGER,
            IDProducto INTEGER,
            Precio REAL NOT NULL,
            Cantidad INTEGER NOT NULL,
            PRIMARY KEY (IDVenta, IDProducto),
            FOREIGN KEY (IDVenta) REFERENCES Ventas(IDVenta),
            FOREIGN KEY (IDProducto) REFERENCES Productos(IDProducto)
        )
    `);
});

module.exports = db;
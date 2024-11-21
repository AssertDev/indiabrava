const express = require('express');
const router = express.Router();
const db = require('../sqlite');

const puppeteer = require('puppeteer');
const fs = require('fs');

router.post('/reporte', async (req, res) => {
    const { fechaInicial, fechaFinal } = req.body;

    if (!fechaInicial || !fechaFinal) {
        return res.status(400).json({ error: 'Fechas inicial y final son requeridas' });
    }

    try {
        const totalVentas = await new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) AS TotalVentas
                 FROM Ventas
                 WHERE Fecha BETWEEN ? AND ?`,
                [fechaInicial, fechaFinal],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row.TotalVentas);
                }
            );
        });

        const gananciaTotal = await new Promise((resolve, reject) => {
            db.get(
                `SELECT SUM(Total) AS GananciaTotal
                 FROM Ventas
                 WHERE Fecha BETWEEN ? AND ?`,
                [fechaInicial, fechaFinal],
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row.GananciaTotal || 0);
                }
            );
        });

        db.all(
            `SELECT Ventas.IDVenta, Clientes.Empresa AS Cliente, Ventas.Fecha, Ventas.Total
             FROM Ventas
             LEFT JOIN Clientes ON Ventas.IDCliente = Clientes.IDCliente
             WHERE Ventas.Fecha BETWEEN ? AND ?
             ORDER BY Ventas.Fecha ASC`,
            [fechaInicial, fechaFinal],
            async (err, rows) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al consultar ventas', detalle: err.message });
                }

                try {
                    const browser = await puppeteer.launch();
                    const page = await browser.newPage();
                    const logoBase64 = fs.readFileSync('./views/img/logo.png', { encoding: 'base64' });

                    const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Reporte de venta ${fechaInicial}-${fechaFinal}</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                            }
                            header {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin: 30px;
                                margin-bottom: 10px;
                            }
                            section {
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                align-items: center;
                                text-align: center;
                            }
                            table, td, th {
                                border: 1px solid rgba(58, 58, 58, 0.345);
                            }
                            table {
                                border-collapse: collapse;
                                width: 100%;
                            }
                            th {
                                height: 35px;
                                background-color: #9ABF21;
                            }
                            td {
                                height: 25px;
                            }
                        </style>
                    </head>
                    <body>
                        <header>
                            <div>
                                <p><strong>Total de ventas:</strong> ${totalVentas}</p>
                                <p><strong>Ganancia total:</strong> $${gananciaTotal.toFixed(2)}</p>
                            </div>
                            <img src="data:image/png;base64,${logoBase64}" width="150px" height="130px">
                        </header>
                        <section>
                            <h3>REPORTE DE VENTA DEL ${fechaInicial} HASTA ${fechaFinal}</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID Venta</th>
                                        <th>Cliente</th>
                                        <th>Fecha</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows.map(row => `
                                        <tr>
                                            <td>${row.IDVenta}</td>
                                            <td>${row.Cliente}</td>
                                            <td>${row.Fecha}</td>
                                            <td>$${row.Total.toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </section>
                    </body>
                    </html>
                    `;
                    await page.setContent(htmlContent);

                    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

                    await browser.close();

                    res.set({
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': 'attachment; filename="reporte.pdf"',
                        'Content-Length': pdfBuffer.length,
                    });

                    res.end(pdfBuffer);
                } catch (error) {
                    console.error('Error al generar el PDF:', error);
                    res.status(500).json({ error: 'Error al generar el PDF', detalle: error.message });
                }
            }
        );
    } catch (error) {
        console.error('Error en las consultas:', error);
        res.status(500).json({ error: 'Error al realizar las consultas', detalle: error.message });
    }
});

// Ruta para obtener todas las ventas
router.get('/', (req, res) => {
    db.all(`
        SELECT Ventas.IDVenta, Clientes.Empresa AS Cliente, Ventas.Fecha, Ventas.Total, Ventas.Factura 
        FROM Ventas
        LEFT JOIN Clientes ON Ventas.IDCliente = Clientes.IDCliente
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.length > 0 ? rows : []);
        }
    });
});

//Ruta para crear una nueva venta
router.post('/', (req, res) => {
    const { Fecha, Total, Factura, Pago, Cambio, IDCliente, Detalle } = req.body;

    if (!Fecha || !Total || !Factura || !Pago || !Cambio || !Detalle || Detalle.length === 0) {
        return res.status(400).json({ error: 'Datos inválidos. Verifica que todos los campos estén completos.' });
    }

    db.run(
        `INSERT INTO Ventas (Fecha, Total, Factura, Pago, Cambio, IDCliente) VALUES (?, ?, ?, ?, ?, ?)`,
        [Fecha, Total, Factura, Pago, Cambio, IDCliente],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Error al registrar la venta', detalle: err.message });
            }

            const ventaId = this.lastID;

            const detallePromise = Detalle.map(producto => {
                return new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO DetalleVentas (IDVenta, IDProducto, Precio, Cantidad) VALUES (?, ?, ?, ?)`,
                        [ventaId, producto.IDProducto, producto.Precio, producto.Cantidad],
                        function (err) {
                            if (err) {
                                return reject(err);
                            }

                            db.get(
                                `SELECT Stock FROM Productos WHERE IDProducto = ?`,
                                [producto.IDProducto],
                                (err, row) => {
                                    if (err || !row || row.Stock < producto.Cantidad) {
                                        return reject(
                                            new Error(`Stock insuficiente para el producto con [ID ${producto.IDProducto}].`)
                                        );
                                    }
                            
                                    db.run(
                                        `UPDATE Productos SET Stock = Stock - ? WHERE IDProducto = ?`,
                                        [producto.Cantidad, producto.IDProducto],
                                        function (err) {
                                            if (err) {
                                                return reject(err);
                                            }
                                            resolve();
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
            });

            Promise.all(detallePromise)
                .then(() => {
                    res.status(201).json({ message: 'Venta registrada exitosamente' });
                })
                .catch(err => {
                    res.status(500).json({ error: 'Error al registrar el detalle de la venta o actualizar el stock', detalle: err.message });
                });
        }
    );
});

// Ruta para modificar una nueva venta
router.put('/:id', (req, res) => {
    const ventaId = req.params.id;
    const { Factura } = req.body;

    db.run(
        `UPDATE Ventas SET Factura = ? WHERE IDVenta = ?`,
        [Factura, ventaId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: `¡Venta [ID: ${ventaId}] actualizada correctamente!` });
        }
    );
});

//Ruta para eliminar una venta
router.delete('/:id', (req, res) => {
    const ventaId = req.params.id;

    db.all(`SELECT IDProducto, Cantidad FROM DetalleVentas WHERE IDVenta = ?`, [ventaId], function (err, detalles) {
        if(err){
            return res.status(500).json({ error: 'Error al obtener los detalles de la venta', detalles: err.message });
        }

        const actualizarStock = detalles.map(detalle => {
            return new Promise((resolve, reject) => {
                db.run(
                    `UPDATE Productos SET Stock = Stock + ? WHERE IDProducto = ?`,
                    [detalle.Cantidad, detalle.IDProducto],
                    function (err) {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });
        });

        Promise.all(actualizarStock)
            .then(() => {
                db.run(`DELETE FROM DetalleVentas WHERE IDVenta = ?`, [ventaId], function (err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error al eliminar los detalles de la venta', detalle: err.message });
                    }

                    db.run(`DELETE FROM Ventas WHERE IDVenta = ?`, [ventaId], function (err) {
                        if (err) {
                            return res.status(500).json({ error: 'Error al eliminar la venta', detalle: err.message });
                        }

                        res.status(200).json({ message: 'Venta eliminada exitosamente y el stock ha sido restaurado' });
                    });
                });
            })
            .catch(err => {
                res.status(500).json({ error: 'Error al actualizar el stock', detalle: err.message });
            });
    })
});

// Ruta para obtener una venta por ID
router.get('/:id', (req, res) => {
    const ventaId = req.params.id;
    db.get(`
        SELECT Ventas.*, Clientes.Empresa AS Cliente
        FROM Ventas
        LEFT JOIN Clientes ON Ventas.IDCliente = Clientes.IDCliente
        WHERE Ventas.IDVenta = ?
    `, [ventaId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: "Esa venta no existe en el sistema." });
        }
    });
});


// Ruta para obtener los detalles de una venta por IDVenta
router.get('/detalle/:id', (req, res) => {
    const idVenta = req.params.id;

    db.all(`
        SELECT dv.IDProducto, p.Nombre, dv.Precio, dv.Cantidad
        FROM DetalleVentas dv
        INNER JOIN Productos p ON dv.IDProducto = p.IDProducto
        WHERE dv.IDVenta = ?
    `, [idVenta], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los detalles de la venta', detalle: err.message });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron detalles para esta venta.' });
        }

        res.status(200).json(rows);
    });
});

module.exports = router;
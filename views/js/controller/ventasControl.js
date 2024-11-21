const formVentas = {
    entidad: 'Venta',
    url: '/ventas',
    campos: [
        { id: 'inputCliente', nombre: 'IDCliente' },
        { id: 'fechaVenta', nombre: 'Fecha' },
        { id: 'floatingPago', nombre: 'Pago' },
        { id: 'inputCambio', nombre: 'Cambio' },
        { id: 'inputTotal', nombre: 'Total' }
    ]
};

const configVentas = {
    url: '/ventas',
    columnas: ['IDVenta', 'Cliente', 'Fecha', 'Factura', 'Total'],
    acciones: (venta) => `
        <button type="button" class="btn btn-secondary mx-1" onclick="editarVenta(${venta.IDVenta});" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Editar venta">
            <i class="bi bi-gear-fill"></i>
        </button>
        <button class="btn btn-danger mx-1" onclick="eliminarVenta(${venta.IDVenta});" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Eliminar venta">
            <i class="bi bi-trash3-fill"></i>
        </button>
    `
};

function abrirModalNuevaVenta() {
    lblCliente.innerHTML = 'N/A';
    lblCliente.setAttribute('data-cliente-id', 'null');
    abrirModal(formVentas, 'nuevo');
}

function abrirModalEditarVenta(venta) {
    const ventaId = venta.IDVenta;

    fetch(`/ventas/${ventaId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                return mostrarAlerta(`Error: ${data.error}`, 'error');
            }

            document.getElementById('clienteVenta').textContent = data.Cliente || 'N/A';
            document.getElementById('fechaVentaEditar').innerHTML = data.Fecha || 'N/A';
            document.getElementById('pagoCliente').innerHTML = `<i class="bi bi-cash"></i> $${data.Pago.toFixed(2)}`;
            document.getElementById('cambioCliente').innerHTML = `<i class="bi bi-cash"></i> $${data.Cambio.toFixed(2)}`;
            document.getElementById('totalVenta').innerHTML = `<i class="bi bi-cash"></i> $${data.Total.toFixed(2)}`;
            document.getElementById('facturaVenta').checked = data.Factura === 1;

            const tbody = document.querySelector('#tablaEditarProductos tbody');
            tbody.innerHTML = '';

            fetch(`/ventas/detalle/${ventaId}`)
                .then(response => response.json())
                .then(productos => {
                    if (productos.length > 0) {
                        productos.forEach(producto => {

                            const fila = document.createElement('tr');
                            fila.innerHTML = `
                                <td>${producto.Nombre}</td>
                                <td>$${producto.Precio.toFixed(2)}</td>
                                <td>${producto.Cantidad}</td>
                            `;
                            tbody.appendChild(fila);
                        });
                    } else {
                        tbody.innerHTML = `
                            <tr>
                                <td colspan="3" class="text-center">No hay productos asociados a esta venta.</td>
                            </tr>`;
                    }

                })
                .catch(error => console.error('Error al cargar los productos:', error));

            const modal = new bootstrap.Modal(document.getElementById('modalEditarVenta'));
            document.getElementById('modalEditarVenta').setAttribute('data-id', venta.IDVenta);
            modal.show();
        })
        .catch(error => console.error('Error al cargar la venta:', error));
}



document.addEventListener('DOMContentLoaded', () => {
    cargarDatos(configVentas);
    enviarFormulario(formVentas, configVentas);
});

function editarVenta(idVenta) {

    fetch(`/ventas/${idVenta}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data == null) {
            mostrarAlerta('Venta no encontrado en el sistema', 'error');
            return;
        }
        
        abrirModalEditarVenta(data);
    })
    .catch((error) => {
        console.error('Error:', error);
        mostrarAlerta(error, 'error');
    });
}

function eliminarVenta(idVenta) {
    mostrarModalConfirmacion("¿Estás seguro de querer eliminar esta venta?", () => {
        fetch(`/ventas/${idVenta}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            mostrarAlerta(data.message, 'exitoso');
            cargarDatos(configVentas);
        })
        .catch((error) => {
            console.error('Error:', error);
            mostrarAlerta(`Hubo un error al eliminar esta venta.`, 'error');
        });
    });
}

function buscarVenta(){
    const inputBuscar = document.getElementById('floatingBuscar').value.trim();

    if (inputBuscar === "") {
        mostrarAlerta('Por favor, ingresa un valor para buscar.', 'error')
        return;
    }

    fetch(`/ventas/${inputBuscar}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                mostrarAlerta(`¡La venta con el [ID: ${inputBuscar}] no existe!`, 'error');
                tablaVacia('Sin resultados en la busqueda.', '12');
            } else {
                console.log("Datos: ", [data]);
                llenarTabla([data], configVentas.columnas, configVentas.acciones);
            }
        })
        .catch(error => console.error("Error al buscar por ID:", error));
}

function buscarCliente(){
    const inputBuscar = document.getElementById('inputCliente').value.trim();

    if (inputBuscar === "") {
        mostrarAlerta('Por favor, ingresa un valor para buscar.', 'error')
        return;
    }

    fetch(`/clientes/${inputBuscar}`)
        .then(response => response.json())
        .then(data => {
            const lblCliente = document.getElementById('lblCliente');

            if (data.error) {
                mostrarAlerta(`¡El cliente con el [ID: ${inputBuscar}] no existe!`, 'error');
                lblCliente.innerHTML = 'N/A';
                lblCliente.setAttribute('data-cliente-id', 'null');
            }else{
                mostrarAlerta(`¡Esta venta será registrada al cliente ${data.Empresa}!`, 'exitoso')
                lblCliente.innerHTML = data.Empresa;
                lblCliente.setAttribute('data-cliente-id', inputBuscar);
            }
        })
        .catch(error => console.error("Error al buscar por ID:", error));
}

function verificarStock(idProducto, cantidad){
    return fetch(`/productos/${idProducto}`)
        .then((response) => response.json())
        .then((producto) => {
            if (producto.Stock >= cantidad) {
                return true;
            } else {
                mostrarAlerta(
                    `Stock insuficiente. Solo quedan ${producto.Stock} unidades disponibles.`,
                    'error'
                );
                return false;
            }
        })
        .catch((error) => {
            console.error('Error al verificar el stock:', error);
            return false;
        });
}

async function agregarProducto() {
    const cantidad = document.getElementById('floatingCantidad').value;
    const idProducto = document.getElementById('floatingSelect').value;

    if(isNaN(idProducto)) return mostrarAlerta('Seleccione un producto.', 'error');
    if(cantidad < 1) return mostrarAlerta('Debes ingresar una cantidad mayor a 0.', 'error');

    const stockDisponible = await verificarStock(idProducto, cantidad);

    if (stockDisponible) {
        try {
            const producto = await obtenerProducto(idProducto);
            const tbody = document.querySelector("#tablaProductos tbody");

            const productoExiste = Array.from(tbody.children).find(fila =>
                fila.getAttribute('data-id') === idProducto
            );

            if (productoExiste) {
                const celdaCantidad = productoExiste.children[2]; 
                const nuevaCantidad = parseInt(celdaCantidad.textContent) + parseInt(cantidad);

                if (nuevaCantidad > producto.Stock) {
                    mostrarAlerta(`Stock insuficiente para el producto: ${producto.Nombre}`, 'error');
                    return;
                }

                celdaCantidad.textContent = nuevaCantidad;
            } else {
                const noProductosRow = tbody.querySelector('tr td[colspan]');
                if (noProductosRow) noProductosRow.parentElement.remove();

                let celdas = '';
                celdas += `<td>${producto.Nombre}</td>`;
                celdas += `<td>$${producto.Precio}</td>`;
                celdas += `<td>${cantidad}</td>`;

                const fila = document.createElement("tr");
                fila.setAttribute("data-id", producto.IDProducto);
                fila.innerHTML = celdas + `
                    <td>
                        <button class="btn btn-danger mx-1" onclick="eliminarProductoTabla('${producto.Nombre}');">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </td>`;

                tbody.appendChild(fila);
            }

            actualizarTotalVenta();
        } catch (error) {
            console.error("Error al obtener el producto:", error);
        }
    }
}

function eliminarProductoTabla(nombreProducto) {
    const tbody = document.querySelector("#tablaProductos tbody");

    const fila = Array.from(tbody.children).find(fila =>
        fila.querySelector('td') && fila.querySelector('td').textContent === nombreProducto
    );

    if (fila) {
        fila.remove();

        if (tbody.children.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center">No hay productos agregados.</td>
            </tr>`;
        }

        actualizarTotalVenta();
    } else {
        mostrarAlerta(`El producto <b>${nombreProducto}</b> no se encontró en la tabla.`, 'error');
    }
}

async function obtenerProducto(idProducto){
    try {
        const response = await fetch(`/productos/${idProducto}`);
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.error) {
            mostrarAlerta(`¡El producto con el [ID: ${idProducto}] no existe!`, 'error');
            return null;
        }

        return data;
    } catch (error) {
        console.error("Error al buscar por ID:", error);
        mostrarAlerta("Hubo un error al buscar el producto.", 'error');
        return null;
    }
}

function actualizarTotalVenta() {
    const tbody = document.querySelector("#tablaProductos tbody");
    const inputTotal = document.getElementById("inputTotal");

    let total = 0;

    Array.from(tbody.children).forEach(fila => {
        const celdaPrecio = fila.children[1];
        const celdaCantidad = fila.children[2];

        if (celdaPrecio && celdaCantidad) {
            const precio = parseFloat(celdaPrecio.textContent.replace('$', ''));
            const cantidad = parseInt(celdaCantidad.textContent);

            if (!isNaN(precio) && !isNaN(cantidad)) {
                total += precio * cantidad;
            }
        }
    });

    const pago = parseFloat(document.getElementById('floatingPago').value) || 0;
    const cambio = (pago < total) ? 0 : pago - total;

    document.getElementById('inputCambio').dataset.cambio = cambio;
    document.getElementById('inputCambio').innerHTML = `<i class="bi bi-cash"></i> $${cambio.toFixed(2)}`;
    document.getElementById('inputTotal').dataset.total = total;
    inputTotal.innerHTML = `<i class="bi bi-cash"></i> $${total.toFixed(2)}`;
}

function rellenarDropdownProductos(){
    obtenerProductos((data) => {
        const select = document.getElementById('floatingSelect');
            select.innerHTML = '<option selected disabled>Seleccione un producto</option>';
            data.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto.IDProducto;
                option.textContent = producto.Nombre;
                select.appendChild(option);
        });
    })
}

function cerrarModalVenta() {
    const modal = document.getElementById('modalNuevoVenta');
    const modalInstance = bootstrap.Modal.getInstance(modal);

    if (modalInstance) {
        modalInstance.hide();
    }

    document.getElementById('formNuevoVenta').reset();
    document.querySelector("#tablaProductos tbody").innerHTML = `
        <tr>
            <td colspan="12" class="text-center">No hay productos agregados.</td>
        </tr>`;
}

function recargarVentas(){
    recargarPagina();
    cargarDatos(configVentas);
}

document.addEventListener('DOMContentLoaded', () => {
    rellenarDropdownProductos();
});


document.getElementById('floatingPago').addEventListener('input', () => {
    const pago = parseFloat(document.getElementById('floatingPago').value) || 0;
    const total = parseFloat(document.getElementById('inputTotal').dataset.total) || 0;

    const cambio = (pago < total) ? 0 : pago - total;

    const cambioElement = document.getElementById('inputCambio');
    cambioElement.dataset.cambio = cambio;
    cambioElement.innerHTML = `<i class="bi bi-cash"></i> $${cambio.toFixed(2)}`;
});

document.getElementById('btnEditarVenta').addEventListener('click', () => {
    const ventaId = document.getElementById('modalEditarVenta').getAttribute('data-id');
    const factura = document.getElementById('facturaVenta').checked ? 1 : 0;

    const datosVenta = {
        Factura: factura
    };

    fetch(`/ventas/${ventaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosVenta)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                mostrarAlerta(`Error: ${data.error}`, 'error');
            } else {
                mostrarAlerta(data.message, 'exitoso');
                cargarDatos(configVentas);
                bootstrap.Modal.getInstance(document.getElementById('modalEditarVenta')).hide();
            }
        })
        .catch(error => console.error('Error al actualizar la venta:', error));
});

document.getElementById('formReporte').addEventListener('submit', (event) => {
    event.preventDefault();

    const fechaInicial = document.getElementById('fechaInicial').value;
    const fechaFinal = document.getElementById('fechaFinal').value;

     if (!fechaInicial || !fechaFinal) {
        return mostrarAlerta('Por favor, ingresa ambas fechas.', 'error');
    }

    if (new Date(fechaInicial) > new Date(fechaFinal)) {
        return mostrarAlerta('La fecha inicial no puede ser mayor que la fecha final.', 'error');
    }

    fetch('/ventas/reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaInicial, fechaFinal }),
    })
        .then(response => {
            if (!response.ok) throw new Error('Error al generar el reporte');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-${fechaFinal}-${fechaFinal}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error al generar el reporte:', error);
            alert('Hubo un problema al generar el reporte.');
        });
});
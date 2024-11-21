function limpiarForm(config) {
    const form = document.getElementById(`formNuevo${config.entidad}`);
    form.reset();
    form.classList.remove('was-validated');
}

function abrirModal(config, modo = 'nuevo', datos = null) {
    const modal = document.querySelector(`#modalNuevo${config.entidad}`);
    modal.setAttribute('data-modo', modo);

    if (modo === 'nuevo') {
        document.querySelector('.modal-title').textContent = (config.entidad == 'Venta') ? `NUEVA ${config.entidad.toUpperCase()}` :`NUEVO ${config.entidad.toUpperCase()}`;
        modal.removeAttribute('data-id');
        if (config.entidad === 'Venta') {
            setTimeout(() => { 
                document.getElementById('fechaVenta').value = new Date().toISOString().split('T')[0];
                document.getElementById('inputTotal').innerHTML = `<i class="bi bi-cash"></i> $00.00`
                document.getElementById('inputCambio').innerHTML = `<i class="bi bi-cash"></i> $00.00`
                const tbody = document.querySelector("#tablaProductos tbody");
                tbody.innerHTML = `
        <tr>
            <td colspan="12" class="text-center">No hay productos agregados.</td>
        </tr>`;
             }, 100);
        }
        limpiarForm(config);
    } else if (modo === 'editar' && datos) {
        modal.setAttribute('data-id', datos[`ID${config.entidad}`]);
        document.querySelector('.modal-title').textContent = `EDITAR ${config.entidad.toUpperCase()} [ID: ${datos[`ID${config.entidad}`]}]`;

        config.campos.forEach(campo => {
            document.getElementById(campo.id).value = datos[campo.nombre];
        });
    }

    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}


function enviarFormulario(form, config) {
    const formNuevo = document.getElementById(`formNuevo${form.entidad}`);
    formNuevo.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!formNuevo.checkValidity()) {
            event.stopPropagation();
            formNuevo.classList.add('was-validated');
            return;
        }

        const modal = document.querySelector(`#modalNuevo${form.entidad}`);
        const modo = modal.getAttribute('data-modo');
        const id = modal.getAttribute('data-id');

        if(form.entidad === 'Venta'){
            crearObjetoVenta().then(venta => {
                if (!venta) return;

                enviarDatos(venta, modo, form, id, config, modal);
            }).catch(error => {
                console.error("Error al crear el objeto de venta:", error);
            });
        }else{
            const datos = {};
        
            form.campos.forEach(campo => {
                datos[campo.nombre] = document.getElementById(campo.id).value;
            });

            enviarDatos(datos, modo, form, id, config, modal);
        }
    });
}

function enviarDatos(datos, modo, form, id, config, modal) {
    const url = (modo === 'editar') ? `${form.url}/${id}` : form.url;
    const metodo = (modo === 'editar') ? 'PUT' : 'POST';

    fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
    .then(response => response.json())
    .then(data => {
        mostrarAlerta(data.message, 'exitoso');
        cargarDatos(config);
        modal.removeAttribute('data-id');
        bootstrap.Modal.getInstance(modal).hide();
        limpiarForm(form);
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarAlerta(error, 'error');
    });
}

function crearObjetoVenta() {
    return new Promise((resolve, reject) => {
        const clienteId = document.getElementById('lblCliente').getAttribute('data-cliente-id');
        const fechaVenta = document.getElementById('fechaVenta').value;
        const pagoCliente = parseFloat(document.getElementById('floatingPago').value) || 0;
        const cambio = parseFloat(document.getElementById('inputCambio').dataset.cambio) || 0;
        const factura = document.getElementById('flexSwitchCheckChecked').checked ? 1 : 0;
        const tbody = document.querySelector("#tablaProductos tbody");
        const productos = [];

        if (clienteId === 'null') {
            mostrarAlerta('Por favor, selecciona un cliente válido.', 'error');
            return resolve(null);
        }

        Array.from(tbody.children).forEach(fila => {
            if (!fila.querySelector('td[colspan]')) {
                const idProducto = fila.getAttribute('data-id');
                const precioProducto = parseFloat(fila.children[1].textContent.replace('$', '')) || 0;
                const cantidadProducto = parseInt(fila.children[2].textContent) || 0;

                if (!idProducto) {
                    mostrarAlerta('Error: Falta el ID del producto.', 'error');
                    return resolve(null);
                }

                productos.push({
                    IDProducto: parseInt(idProducto),
                    Precio: precioProducto,
                    Cantidad: cantidadProducto
                });
            }
        });

        if (productos.length === 0) {
            mostrarAlerta('Debes agregar al menos un producto.', 'error');
            return resolve(null);
        }

        const total = productos.reduce((acc, prod) => acc + (prod.Precio * prod.Cantidad), 0);

        if(pagoCliente < total){
            mostrarAlerta('El pago del cliente es menor al total de la venta.', 'error');
            return resolve(null);
        }

        resolve({
            Fecha: fechaVenta,
            Total: total,
            Factura: factura,
            Pago: pagoCliente,
            Cambio: cambio,
            IDCliente: clienteId,
            Detalle: productos
        });
    });
}

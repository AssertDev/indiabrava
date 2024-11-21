const formProductos = {
    entidad: 'Producto',
    url: '/productos',
    campos: [
        { id: 'floatingNombre', nombre: 'Nombre' },
        { id: 'floatingPrecio', nombre: 'Precio' },
        { id: 'floatingNeto', nombre: 'ContenidoNeto' },
        { id: 'floatingSelect', nombre: 'UnidadMedida' },
        { id: 'floatingStock', nombre: 'Stock' }
    ]
};

const configProductos = {
    url: '/productos',
    columnas: ['IDProducto', 'Nombre', 'UnidadMedida', 'ContenidoNeto', 'Precio', 'Stock'],
    acciones: (producto) => `
        <button type="button" class="btn btn-secondary mx-1" onclick="editarProducto(${producto.IDProducto});" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Editar producto">
            <i class="bi bi-gear-fill"></i>
        </button>
        <button class="btn btn-danger mx-1" onclick="eliminarProducto(${producto.IDProducto});" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Eliminar producto">
            <i class="bi bi-trash3-fill"></i>
        </button>
    `
};

function abrirModalNuevoProducto() {
    if(JSON.parse(localStorage.getItem('usuario')).Rol === 'Gestor') return mostrarAlerta('No tienes permisos para hacer esto.', 'info');

    abrirModal(formProductos, 'nuevo');
}

function abrirModalEditarProducto(datos) {
    abrirModal(formProductos, 'editar', datos);
}


document.addEventListener('DOMContentLoaded', () => {
    cargarDatos(configProductos);
    enviarFormulario(formProductos, configProductos);
});

function editarProducto(idProducto) {
    fetch(`/productos/${idProducto}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data == null) {
            mostrarAlerta('Producto no encontrado en el sistema', 'error');
            return;
        }
        
        abrirModalEditarProducto(data);
    })
    .catch((error) => {
        console.error('Error:', error);
        mostrarAlerta(error, 'error');
    });
}

function eliminarProducto(idProducto) {
    if(JSON.parse(localStorage.getItem('usuario')).Rol === 'Gestor') return mostrarAlerta('No tienes permisos para hacer esto.', 'info');
    mostrarModalConfirmacion("¿Estás seguro de querer eliminar a este producto?", () => {
        fetch(`/productos/${idProducto}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            mostrarAlerta(data.message, 'exitoso');
            cargarDatos(configProductos);
        })
        .catch((error) => {
            console.error('Error:', error);
            mostrarAlerta(`Hubo un error al eliminar al producto`, 'error');
        });
    });
}

function buscarProducto(){
    const buscarID = document.getElementById('buscarProductoID').checked;
    const inputBuscar = document.getElementById('floatingBuscar').value.trim();

    if (inputBuscar === "") {
        mostrarAlerta('Por favor, ingresa un valor para buscar.', 'error')
        return;
    }

    if(buscarID){
        fetch(`/productos/${inputBuscar}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    mostrarAlerta(`¡El producto con el [ID: ${inputBuscar}] no existe!`, 'error');
                    tablaVacia('Sin resultados en la busqueda.', '12');
                } else {
                    llenarTabla([data], configProductos.columnas, configProductos.acciones);
                }
            })
            .catch(error => console.error("Error al buscar por ID:", error));
    }else{
        fetch(`/productos/nombre/${inputBuscar}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    llenarTabla(data, configProductos.columnas, configProductos.acciones);
                } else {
                    mostrarAlerta("No se encontraron productos con ese nombre.", 'error');
                    tablaVacia('Sin resultados en la busqueda.', '12');
                }
            })
            .catch(error => console.error("Error al buscar por producto:", error));
    }
}

function recargarProductos(){
    recargarPagina();
    cargarDatos(configProductos);
}
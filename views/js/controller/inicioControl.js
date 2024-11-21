document.addEventListener('DOMContentLoaded', () => {
    obtenerUsuarios((data) => {
        document.getElementById('cantidadUsuarios').textContent = data.length;
    });

    obtenerClientes((data) => {
        document.getElementById('cantidadClientes').textContent = data.length;
    });

    obtenerProductos((data) => {
        document.getElementById('cantidadProductos').textContent = data.length;
    });

    obtenerVentas((data) => {
        document.getElementById('cantidadVentas').textContent = data.length;
    });
});

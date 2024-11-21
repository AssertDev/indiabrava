document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    if (!usuario) {
        window.location.href = '/login.html';
        return;
    }
  
    document.getElementById('floatingNombres').value = usuario.Nombres || '';
    document.getElementById('floatingApellidos').value = usuario.Apellidos || '';
    document.getElementById('floatingRFC').value = usuario.RFC || '';
    document.getElementById('floatingTelefono').value = usuario.Telefono || '';
    document.getElementById('floatingUsuario').value = usuario.NombreUsuario || '';
    document.getElementById('floatingPassword').value = usuario.Password || '';
    document.getElementById('floatingCorreo').value = usuario.Correo || '';
  });  


document.getElementById('formMisDatos').addEventListener('submit', (event) => {
    event.preventDefault();

    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const id = usuario.IDUsuario;

    const datos = {
        IDUsuario: id,
        Nombres: document.getElementById('floatingNombres').value,
        Apellidos: document.getElementById('floatingApellidos').value,
        RFC: document.getElementById('floatingRFC').value,
        Telefono: document.getElementById('floatingTelefono').value,
        NombreUsuario: document.getElementById('floatingUsuario').value,
        Password: document.getElementById('floatingPassword').value,
        Correo: document.getElementById('floatingCorreo').value,
        Rol: usuario.Rol
    };
    
    fetch(`/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
    })
    .then(response => response.json())
    .then(data => {
        localStorage.setItem('usuario', JSON.stringify({ ...usuario, ...datos }));
        mostrarAlerta('¡Has actualizado los datos de tu cuenta correctamente!', 'exitoso');
    })
    .catch(error => console.error('Error al editar tus datos:', error));
    mostrarAlerta('Hubo un error al querer actualizar los datos de tu cuenta.', 'error');
});
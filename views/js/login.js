document.getElementById('loginForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const username = document.getElementById('floatingNombreUsuario').value;
    const password = document.getElementById('floatingPassword').value;

    fetch('/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NombreUsuario: username, Password: password }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                mostrarAlerta(data.error, 'error');
            } else {
                mostrarAlerta('¡Inicio de sesión exitoso!', 'exitoso');
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                window.location.href = '/inicio.html';
            }
        })
        .catch((error) => console.error('Error:', error));
});

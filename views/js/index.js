document.addEventListener('DOMContentLoaded', () => {
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  if (!usuario) window.location.href = '/login.html';

  const navRol = document.getElementById('navRolUsuario');

  if(usuario.Rol === 'Gestor'){
    navRol.classList.remove('bg-danger');
    navRol.classList.add('bg-primary');

    if (['usuarios.html', 'clientes.html'].includes(window.location.pathname.split('/').pop())) {
      window.location.href = '/inicio.html';
      return;
    }

    document.querySelectorAll('[data-block-section="Gestor"]').forEach(seccion => {
      seccion.style.display = "none";
  });
  }

  navRol.textContent = usuario.Rol;
  document.getElementById('navNombreUsuario').textContent = usuario.NombreUsuario;
  document.getElementById('navCorreoUsuario').textContent = usuario.Correo || 'Correo no registrado';
  
});

document.getElementById('btnCerrarSesion').addEventListener('click', () => {
  localStorage.removeItem('usuario');
  window.location.href = '/login.html';
});


function recargarTooltips(){
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach((tooltipTriggerEl) => {
    const tooltipInstance = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
    if (tooltipInstance) {
        tooltipInstance.dispose();
    }
    const newTooltipInstance = new bootstrap.Tooltip(tooltipTriggerEl);
    if (tooltipTriggerEl.closest("#mainAside") && !mainAside.classList.contains('aside-collapse')) {
        newTooltipInstance.disable();
    }
  });
}

function recargarPagina(){
  document.getElementById('preloader').classList.remove('hidden');

  setTimeout(() => {
    document.getElementById('preloader').classList.add('hidden');
  }, 500)
}

window.addEventListener('load', function() { document.getElementById('preloader').classList.add('hidden'); });
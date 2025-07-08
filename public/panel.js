const apiURL = 'http://localhost:3000/api/deudores';

const tabs = document.querySelectorAll('.sidebar ul li');
const sections = document.querySelectorAll('.section');
const pendientesBody = document.getElementById('pendientesBody');
const pagadosBody = document.getElementById('pagadosBody');
const formNuevo = document.getElementById('nuevoDeudorForm');

// 🔷 Cambiar entre secciones
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const target = tab.getAttribute('data-section');
    sections.forEach(section => {
      section.classList.toggle('active', section.id === target);
    });
  });
});

// 🔷 Cargar deudores al iniciar
function cargarDeudores() {
  fetch(apiURL)
    .then(res => {
  console.log(res);
  return res.json();
})
    .then(deudores => {
      pendientesBody.innerHTML = '';
      pagadosBody.innerHTML = '';

      deudores.forEach(d => {
        const fila = crearFila(d);
        if (d.estado === 'pagado') pagadosBody.appendChild(fila);
        else pendientesBody.appendChild(fila);
      });
    })
    .catch(err => console.error('❌ Error al cargar deudores:', err));
}

// 🔷 Crear fila de deudor
function crearFila(deudor) {
  const fila = document.createElement('tr');
  fila.dataset.id = deudor.iddeudores;

  fila.innerHTML = `
    <td contenteditable="true">${deudor.nombreDeudor}</td>
    <td contenteditable="true">${deudor.productos}</td>
    <td contenteditable="true">S/ ${parseFloat(deudor.monto).toFixed(2)}</td>
    <td>${deudor.estado.charAt(0).toUpperCase() + deudor.estado.slice(1)}</td>
    <td>
      <select>
        <option value="pendiente" ${deudor.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
        <option value="pagado" ${deudor.estado === 'pagado' ? 'selected' : ''}>Pagado</option>
      </select>
      <button class="btn guardar">Actualizar</button>
      <button class="bot eliminar">Eliminar</button>
    </td>
  `;
  return fila;
}

// 🔷 Agregar nuevo deudor con fetch POST
formNuevo.addEventListener('submit', (e) => {
  e.preventDefault();

  const nombreDeudor = formNuevo.nombreDeudor.value.trim();
  const productos = formNuevo.productos.value.trim();
  const monto = parseFloat(formNuevo.monto.value).toFixed(2);

  if (!nombreDeudor || !productos || isNaN(monto)) {
    Swal.fire('⚠️ Monto inválido', 'Por favor llena todos los datos correctamente.', 'warning');
    return;
  }

  console.log('🔵 Enviando POST:', { nombreDeudor, productos, monto });

  fetch(apiURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombreDeudor, productos, monto })
  })
    .then(res => {
  console.log(res);
  return res.json();
})
    .then(data => {
      if (!data || data.message) {
        console.error('❌ Error al guardar en base de datos:', data);
        Swal.fire('❌ Error', 'Error al guardar en base de datos', 'error');
        return;
      }

      console.log('✅ Deudor guardado:', data);

      const nuevaFila = crearFila(data);
      pendientesBody.appendChild(nuevaFila);
      formNuevo.reset();

      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      document.querySelector('li[data-section="pendientes"]').classList.add('active');
      document.getElementById('pendientes').classList.add('active');
    })
    .catch(err => {
      console.error('❌ Error en fetch POST:', err);
      Swal.fire('❌ Error', 'Error al conectar con el servidor', 'error');
    });
});

// 🔷 Cambio de estado (PUT)
document.addEventListener('change', (e) => {
  if (e.target.tagName === 'SELECT') {
    const fila = e.target.closest('tr');
    const id = fila.dataset.id;
    const estado = e.target.value;

    console.log('🔵 Cambiando estado de id:', id); // Agrega este log

    fetch(`${apiURL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    })
      .then(res => {
  console.log(res);
  return res.json();
})
      .then(actualizado => {
        fila.cells[3].textContent = actualizado.estado.charAt(0).toUpperCase() + actualizado.estado.slice(1);

        if (estado === 'pagado') pagadosBody.appendChild(fila);
        else if (estado === 'pendiente') pendientesBody.appendChild(fila);
        else if (estado === 'cancelado') {
          if (confirm('¿Seguro que deseas cancelar este deudor?')) {
            fetch(`${apiURL}/${id}`, { method: 'DELETE' })
              .then(() => fila.remove())
              .catch(err => console.error('❌ Error al eliminar:', err));
          } else {
            e.target.value = 'pendiente';
            fila.cells[3].textContent = 'Pendiente';
          }
        }
      })
      .catch(err => {
        console.error('❌ Error al actualizar estado:', err);
        Swal.fire('❌ Error', 'Error al actualizar estado', 'error');
      });
  }
});

// 🔷 Eliminar deudor (DELETE)
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('eliminar')) {
    const fila = e.target.closest('tr');
    const id = fila.dataset.id;

    Swal.fire({
      title: '¿Estás seguro de eliminar este deudor?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`${apiURL}/${id}`, { method: 'DELETE' })
          .then(res => {
            if (!res.ok) throw new Error('Error al eliminar');
            fila.remove();
            console.log('✅ Deudor eliminado:', id);

            Swal.fire('Eliminado', 'El deudor ha sido eliminado correctamente.', 'success');
          })
          .catch(err => {
            console.error('❌ Error al eliminar el deudor:', err);
            Swal.fire('❌ Error', 'No se pudo eliminar el deudor.', 'error');
          });
      }
    });
  }
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('guardar')) {
    const fila = e.target.closest('tr');
    const id = fila.dataset.id;

    const nombreDeudor = fila.cells[0].textContent.trim();
    const productos = fila.cells[1].textContent.trim();
    const montoTexto = fila.cells[2].textContent.replace('S/', '').trim();
    const monto = parseFloat(montoTexto);
    const estado = fila.querySelector('select').value;

    // 🔴 Validación antes de enviar
    if (!nombreDeudor || !productos || isNaN(monto)) {
      Swal.fire('⚠️ Campos vacíos', 'Todos los campos deben estar completos y el monto ser un número válido.', 'warning');
      return;
    }
      
    fetch(`${apiURL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreDeudor, productos, monto, estado })
    })
    .then(res => res.json())
    .then(data => {
      Swal.fire('✅ Cambios guardados', '', 'success');
    })
    .catch(err => {
      console.error('❌ Error al guardar cambios:', err);
      Swal.fire('❌ Error', 'No se pudieron guardar los cambios.', 'error');
    });
  }
});

const buscarInput = document.getElementById('buscarInput');

buscarInput.addEventListener('input', () => {
  const valor = buscarInput.value.toLowerCase();

  document.querySelectorAll('tbody tr').forEach(fila => {
    const nombre = fila.cells[0].textContent.toLowerCase();
    const estado = fila.cells[3].textContent.toLowerCase();

    if (nombre.includes(valor) || estado.includes(valor)) {
      fila.style.display = '';
    } else {
      fila.style.display = 'none';
    }
  });
});

// 🔷 Inicializar tabla al cargar
cargarDeudores();

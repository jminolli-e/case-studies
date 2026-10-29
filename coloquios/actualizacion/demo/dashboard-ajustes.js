/* Ajustes de comportamiento de los controles y del mapa de organización. */
(() => {
  const start = document.querySelector('#desde');
  const end = document.querySelector('#hasta');
  let lastValid = { desde: start.value, hasta: end.value };
  const message = document.createElement('p');
  message.className = 'date-error';
  message.setAttribute('role', 'alert');
  message.hidden = true;
  document.querySelector('#filters').append(message);

  function validateDates() {
    const valid = start.value && end.value && start.checkValidity() && end.checkValidity() && start.value <= end.value;
    message.hidden = !!valid;
    message.textContent = 'Seleccioná fechas válidas entre el 01/01/2026 y el 28/10/2026. Desde no puede ser posterior a Hasta.';
    if (!valid) return;
    lastValid = { desde: start.value, hasta: end.value };
    render();
  }
  // Sustituye los handlers iniciales; nunca calcula con fechas vacías o inválidas.
  for (const input of [start, end]) {
    input.onchange = validateDates;
    input.oninput = () => {
      input.setCustomValidity('');
      validateDates();
    };
  }
  const originalDates = dates;
  dates = () => {
    const candidate = originalDates();
    return candidate.desde && candidate.hasta && start.validity.valid && end.validity.valid && candidate.desde <= candidate.hasta ? candidate : lastValid;
  };

  const originalPriorities = priorities;
  priorities = function () {
    originalPriorities();
    const range = dates();
    const header = document.querySelector('#summary-content .panel-head h3');
    if (header) header.textContent = `Avance Prioritarias por Inspector · ${range.desde.split('-').reverse().join('/')} - ${range.hasta.split('-').reverse().join('/')}`;
  };

  const originalTrainer = trainer;
  trainer = function () {
    originalTrainer();
    if (state.trainerTab !== 'organizaciones' || state.trainerUniverse !== 'operativo' || !document.querySelector('#trainer-select').value) return;
    const table = document.querySelector('#trainer-content .heatmap');
    if (!table) return;
    table.classList.add('organization-heatmap');
    const courses = d.capacitaciones.filter(c => c.universo === 'operativo');
    const inspector = document.querySelector('#trainer-select').value;
    const orgs = [...new Set(d.personas.filter(p => p.inspector === inspector && p.universo === 'operativo').map(p => p.organizacion))].sort();
    table.querySelectorAll('tbody tr').forEach((row, index) => {
      row.cells[0].title = orgs[index];
      courses.forEach((course, column) => {
        const cell = row.cells[column + 1];
        const result = calc({ universo: 'operativo', inspector, organizacion: orgs[index], codigo: course.codigo });
        const text = result.porcentaje === null ? 'Sin necesidad' : `${pct(result.porcentaje)} · ${result.capacitados} capacitados / ${result.necesidad} necesidades`;
        cell.title = text;
        cell.setAttribute('aria-label', `${orgs[index]}, ${course.codigo}: ${text}`);
        const badge = cell.querySelector('.pct');
        if (badge && result.porcentaje !== null) badge.textContent = Math.round(result.porcentaje) + '%';
      });
    });
    table.querySelectorAll('thead th').forEach((cell, index) => {
      if (index) cell.title = `${courses[index - 1].codigo} ${courses[index - 1].nombre}`;
    });
    const legend = document.querySelector('#trainer-content .legend');
    if (legend) legend.insertAdjacentHTML('afterbegin', '<span><i style="background:#f1f5f9"></i>Sin necesidad</span>');
  };
  render();
})();

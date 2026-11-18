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
    if (header) header.textContent = `Avance Prioritarias por Capacitador · ${range.desde.split('-').reverse().join('/')} - ${range.hasta.split('-').reverse().join('/')}`;
  };

  const originalTrainer = trainer;
  trainer = function () {
    originalTrainer();
    const selected = document.querySelector('#trainer-select').value;
    if (selected) renderInspectorKpis(selected);
    if (selected && state.trainerTab === 'avance' && state.trainerUniverse === 'operativo') renderInspectorChart(selected);
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
    // El pie no es un encabezado: el grid de .panel-head estiraba una
    // referencia sobre todo el ancho y desplazaba la otra al extremo opuesto.
    const footer = table.closest('.panel').querySelector('.panel-head:last-child');
    if (footer) {
      footer.className = 'heatmap-priority-footer';
      footer.innerHTML = '<span>Prioritarias:</span><span class="heatmap-priority-key first">1er semestre</span><span class="heatmap-priority-key second">2do semestre</span>';
    }
  };

  function renderInspectorChart(inspector) {
    const rows = d.capacitaciones.filter(c => c.universo === 'operativo').map(course => ({ course, ...calc({ universo: 'operativo', inspector, codigo: course.codigo }) })).filter(r => r.necesidad).sort((a, b) => b.porcentaje - a.porcentaje);
    const bars = rows.map(row => {
      const [background, foreground] = color(row.porcentaje);
      const label = `${pct(row.porcentaje)} (${row.capacitados}/${row.necesidad})`;
      const tooltip = `${row.course.codigo} ${row.course.nombre} · Avance: ${pct(row.porcentaje)} · Pendientes: ${row.pendientes}`;
      return `<div class="inspector-advance-row" title="${tooltip}"><div class="inspector-advance-label">${row.course.codigo} ${row.course.nombre}</div><div class="inspector-advance-track"><div class="inspector-advance-bar" style="width:${row.porcentaje}%;background:${background}">${row.porcentaje >= 30 ? `<span class="inspector-advance-value inside" style="color:${foreground}">${label}</span>` : ''}</div>${row.porcentaje < 30 ? `<span class="inspector-advance-value outside" style="left:calc(${row.porcentaje}% + 8px)">${label}</span>` : ''}</div></div>`;
    }).join('');
    document.querySelector('#trainer-content').innerHTML = `<article class="panel inspector-advance"><header class="panel-head"><h3>Avance por capacitación</h3><p class="caption">Porcentaje de personas capacitadas sobre la necesidad vigente de cada capacitación.</p>${legend()}</header><div class="inspector-advance-rows">${bars}</div></article>`;
  }

  function renderInspectorKpis(inspector) {
    const universe = state.trainerUniverse;
    const people = d.personas.filter(p => p.inspector === inspector && p.universo === universe);
    const ids = new Set(people.map(p => p.id));
    const range = dates();
    const completed = new Set(d.actividad.filter(a => a.fecha >= range.desde && a.fecha <= range.hasta).map(a => `${a.persona}:${a.codigo}`));
    const annual = new Set(d.actividad.filter(a => a.fecha >= '2026-01-01' && a.fecha <= '2026-10-28').map(a => `${a.persona}:${a.codigo}`));
    const requirements = d.necesidades.filter(n => ids.has(n.persona));
    const pending = new Set(requirements.filter(n => !completed.has(`${n.persona}:${n.codigo}`)).map(n => n.persona)).size;
    const organizations = new Set(people.map(p => p.organizacion)).size;
    const repartos = new Set(people.map(p => p.reparto)).size;
    const count = d.actividad.filter(a => ids.has(a.persona) && a.fecha >= range.desde && a.fecha <= range.hasta).length;
    const personIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 21v-3a6 6 0 0 1 12 0v3M15 13a5 5 0 0 1 7 4.6V21"/></svg>';
    const generalHelp = help([['Personas a cargo','Personas asignadas según el universo vigente. Personas únicas con al menos una capacitación requerida pendiente en el período seleccionado.']]);
    const sections = ['1er','2do'].map((semester, index) => {
      const codes = new Set(d.capacitaciones.filter(c => c.semestre === semester).map(c => c.codigo));
      const applicable = requirements.filter(n => codes.has(n.codigo));
      const total = new Set(applicable.map(n => n.persona)).size;
      const value = new Set(applicable.filter(n => !annual.has(`${n.persona}:${n.codigo}`)).map(n => n.persona)).size;
      return `<div class="semester-${index ? 'second' : 'first'}"><strong>${value}</strong><span>${index ? 'Segundo' : 'Primer'} semestre</span><small>Personas únicas pendientes</small><div class="kpi-track"><span style="width:${total ? value / total * 100 : 0}%"></span></div></div>`;
    }).join('');
    const priorityHelp = help([['Personas pendientes de prioritarias',universe === 'operativo' ? 'Acumulado: 01/01/2026 – 28/10/2026. Independiente del filtro de fechas. Personas únicas con al menos una MTS prioritaria pendiente, sobre necesidades vigentes.' : 'Las capacitaciones prioritarias por semestre corresponden al universo operativo.']]);
    document.querySelector('#trainer-kpis').innerHTML = `<article class="card inspector-card"><h3 class="kpi-heading">${personIcon}Personas a cargo${generalHelp}</h3><div class="numbers"><div><strong>${fmt(people.length)}</strong><span>Personas asignadas</span><small>Personas únicas del universo seleccionado</small></div><div><strong>${fmt(pending)}</strong><span>Personas pendientes</span><small>Al menos una capacitación pendiente en el período</small></div></div><footer><b>${organizations}</b> organizaciones · <b>${universe === 'operativo' ? repartos : count}</b> ${universe === 'operativo' ? 'repartos' : 'charlas dictadas en el período'}</footer></article><article class="card inspector-card"><h3 class="kpi-heading">${icons.shield}Personas pendientes de prioritarias${priorityHelp}</h3>${universe === 'operativo' ? `<div class="numbers">${sections}</div><footer>Cada semestre cuenta <b>personas únicas</b>; una persona puede aparecer en ambos.</footer>` : '<div class="no-aplica">No aplica</div>'}</article>`;
  }

  const originalSummaryAdvance = summaryAdvance;
  summaryAdvance = function () {
    originalSummaryAdvance();
    const panel = document.querySelector('#summary-content .panel:nth-of-type(2)');
    panel.className = 'needs-chart-panel';
    const range = dates();
    const formatDate = value => value.split('-').reverse().join('/');
    panel.innerHTML = `<header class="needs-chart-header"><h3>📊 Necesidad vs Capacitados — ${formatDate(range.desde)} al ${formatDate(range.hasta)}</h3><p>Personal con necesidad de capacitación asignada · Ajustá las fechas del panel izquierdo para comparar períodos</p></header><div class="needs-chart" role="img" aria-label="Necesidad y capacitados por capacitación"></div>`;
    const operational = state.summaryUniverse === 'operativo';
    const courses = d.capacitaciones.filter(c => c.universo === state.summaryUniverse);
    const rows = courses.map(c => ({ course: c, ...calc({ universo: c.universo, codigo: c.codigo }) }));

    const colors = c => c.semestre === '1er' ? ['#f7f3df','#b3a66b'] : c.semestre === '2do' ? ['#f2edf0','#a38a98'] : ['#d6e5f0','#245683'];
    const labels = courses.map(c => (operational && c.semestre ? '⚑ ' : '') + c.codigo);
    const hover = rows.map(r => `<b style="font-size:13px">${r.course.codigo} ${r.course.nombre}</b><br>━━━━━━━━━━━━━━━<br>📋 Necesidad: <b>${fmt(r.necesidad)}</b><br>✅ Capacitados: <b>${fmt(r.capacitados)}</b><br>📈 Avance: <b>${pct(r.porcentaje)}</b>`);
    const averageCount = rows.reduce((s, r) => s + r.capacitados, 0) / rows.length;
    const averagePct = rows.reduce((s, r) => s + (r.porcentaje || 0), 0) / rows.length;
    const traces = [
      { type: 'bar', name: 'Necesidad', x: labels, y: rows.map(r => r.necesidad), marker: { color: courses.map(c => operational ? colors(c)[0] : '#d6e5f0'), line: { color: courses.map(c => operational ? colors(c)[1] : '#a9c4d9'), width: operational ? .13 : 1 } }, hovertext: hover, hoverinfo: 'text' },
      { type: 'bar', name: 'Capacitados', x: labels, y: rows.map(r => r.capacitados), marker: { color: courses.map(c => operational ? colors(c)[1] : '#245683'), line: { color: courses.map(c => operational ? colors(c)[1] : '#18344f'), width: operational ? .13 : 1 } }, hovertext: hover, hoverinfo: 'text', text: rows.map(r => pct(r.porcentaje)), textposition: 'outside', textfont: { family: 'Plus Jakarta Sans', color: '#18344f', size: operational ? 10 : 11 } }
    ];
    const layout = {
      autosize: true, height: operational ? 468 : 378, barmode: 'overlay', font: { family: 'Plus Jakarta Sans', size: 12, color: '#1a2e2b' }, plot_bgcolor: '#fff', paper_bgcolor: '#fff',
      xaxis: { gridcolor: '#d8e1ea', linecolor: '#b8cde0', tickfont: { color: '#1a2e2b', size: 11 }, tickangle: operational ? -35 : 0, automargin: true },
      yaxis: { gridcolor: '#d8e1ea', linecolor: '#b8cde0', tickfont: { color: '#1a2e2b', size: 11 }, automargin: true },
      legend: { font: { color: '#1a2e2b', size: 14 }, bgcolor: 'rgba(234,240,246,.85)', bordercolor: '#b8cde0', borderwidth: 1, orientation: 'h', yanchor: 'bottom', y: 1.02, xanchor: 'right', x: 1 }, margin: { t: 45, b: 18, l: 9, r: 9 },
      hoverlabel: { bgcolor: '#f4f7fa', font: { size: 12, family: 'Plus Jakarta Sans', color: '#1a2e2b' }, bordercolor: '#245683' },
      shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: averageCount, y1: averageCount, line: { color: operational ? '#000' : '#f59e0b', width: 2.5, dash: 'dot' } }],
      annotations: [{ xref: 'paper', x: 1, y: averageCount, yanchor: 'bottom', text: `Promedio ${averagePct.toFixed(1)}%`, showarrow: false, font: { family: 'Plus Jakarta Sans', size: 12, color: operational ? '#080808' : '#b45309' } }]
    };
    window.dashboardChartReady = Plotly.newPlot(panel.querySelector('.needs-chart'), traces, layout, { responsive: true, displaylogo: false, toImageButtonOptions: { filename: 'necesidad-capacitados-sintetico' } });
  };
  // Agrupaciones exclusivamente ficticias a partir de las unidades del dataset.
  window.summaryGrouped = function () {
    const courses = d.capacitaciones.filter(c => c.universo === state.summaryUniverse && (state.summaryUniverse !== 'operativo' || c.semestre));
    const split = Math.ceil(d.organizaciones.length / 2);
    const groups = [
      { name: 'Gerencia ficticia A', organizations: d.organizaciones.slice(0, split) },
      { name: 'Gerencia ficticia B', organizations: d.organizaciones.slice(split) }
    ];
    const range = dates();
    const formatDate = value => value.split('-').reverse().join('/');
    const type = state.summaryUniverse === 'operativo' ? 'Operativos' : 'Administrativos';
    function table(title, rows, heading) {
      const columns = courses.map(course => `<th colspan="3" title="${course.codigo} ${course.nombre}">${course.codigo}</th>`).join('');
      const subhead = courses.map(() => '<th>Nec.</th><th>Cap.</th><th>%</th>').join('');
      const colgroup = '<col class="grouped-name">' + courses.map(() => '<col class="grouped-count"><col class="grouped-count"><col class="grouped-percent">').join('');
      const body = rows.map(row => {
        const cells = courses.map(course => {
          const parts = row.organizations.map(organizacion => calc({ universo: state.summaryUniverse, organizacion, codigo: course.codigo }));
          const necesidad = parts.reduce((sum, part) => sum + part.necesidad, 0);
          const capacitados = parts.reduce((sum, part) => sum + part.capacitados, 0);
          const progress = necesidad ? capacitados * 100 / necesidad : null;
          const description = `Capacitados: ${capacitados}; Necesidad: ${necesidad}`;
          return `<td>${fmt(necesidad)}</td><td>${fmt(capacitados)}</td><td title="${description}" aria-label="${description}">${pill(progress)}</td>`;
        }).join('');
        return `<tr><th scope="row">${row.name}</th>${cells}</tr>`;
      }).join('');
      return `<article class="panel grouped-panel"><header class="panel-head"><h3>${title} · ${type} · ${formatDate(range.desde)} - ${formatDate(range.hasta)}</h3><p class="caption">Agrupaciones ficticias para la demostración. Nec.: necesidad vigente; Cap.: capacitaciones realizadas en el período.</p>${legend()}</header><div class="table-scroll" tabindex="0" role="region" aria-label="${title}: tabla desplazable horizontalmente"><table class="grouped-table" style="width:${190 + courses.length * 188}px"><colgroup>${colgroup}</colgroup><thead><tr><th rowspan="2">${heading}</th>${columns}</tr><tr>${subhead}</tr></thead><tbody>${body}</tbody></table></div></article>`;
    }
    document.querySelector('#summary-content').innerHTML = state.summaryTab === 'gerencia'
      ? table('Avance por gerencia', groups, 'Gerencia')
      : groups.map(group => table(`Avance por zona · ${group.name}`, group.organizations.map(name => ({ name, organizations: [name] })), 'Zona ficticia')).join('');
  };
  render();
})();

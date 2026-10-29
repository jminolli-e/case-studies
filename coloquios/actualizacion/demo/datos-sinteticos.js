/* Dataset sintético y reproducible para las demostraciones públicas.
 * Las necesidades y los cumplimientos son pares únicos persona-capacitación;
 * los registros de actividad conservan quién dictó cada capacitación.
 */
(function (root) {
  const capacitaciones = [
    { codigo: 'MTS-01', nombre: 'Prevención de incidentes', universo: 'operativo', semestre: null },
    { codigo: 'MTS-02', nombre: 'Preparación segura de la tarea', universo: 'operativo', semestre: null },
    { codigo: 'MTS-03', nombre: 'Orden del espacio de trabajo', universo: 'operativo', semestre: '1er' },
    { codigo: 'MTS-04', nombre: 'Protección de manos', universo: 'operativo', semestre: '2do' },
    { codigo: 'MTS-09', nombre: 'Prevención de caídas', universo: 'operativo', semestre: '1er' },
    { codigo: 'MTS-12', nombre: 'Desplazamiento seguro', universo: 'operativo', semestre: '2do' },
    { codigo: 'MTS-18', nombre: 'Señalización del área', universo: 'operativo', semestre: '2do' },
    { codigo: 'MTS-21', nombre: 'Manipulación de cargas', universo: 'operativo', semestre: '1er' },
    { codigo: 'MTS-27', nombre: 'Verificación de herramientas', universo: 'operativo', semestre: '2do' },
    { codigo: 'MTS-34', nombre: 'Control previo a la tarea', universo: 'operativo', semestre: '1er' },
    { codigo: 'ADM-01', nombre: 'Ergonomía y pausas activas', universo: 'administrativo', semestre: null },
    { codigo: 'ADM-02', nombre: 'Seguridad en oficinas', universo: 'administrativo', semestre: null },
    { codigo: 'ADM-03', nombre: 'Prevención de incendios', universo: 'administrativo', semestre: null }
  ];
  const inspectores = ['Capacitador A01', 'Capacitador A02', 'Capacitador A03', 'Capacitador B01', 'Capacitador B02', 'Capacitador B03'];
  const organizaciones = ['Unidad Norte', 'Unidad Centro', 'Unidad Oeste', 'Unidad Este'];
  let estado = 82471;
  function azar() { estado = (estado * 1664525 + 1013904223) >>> 0; return estado / 4294967296; }
  const personas = Array.from({ length: 144 }, (_, i) => ({
    id: 8001 + i,
    nombre: `Persona Ficticia ${String(i + 1).padStart(3, '0')}`,
    inspector: inspectores[i % inspectores.length],
    organizacion: organizaciones[Math.floor(i / inspectores.length) % organizaciones.length],
    reparto: `Reparto ${String(1 + (i % 8)).padStart(2, '0')}`,
    universo: i % 4 === 0 ? 'administrativo' : 'operativo'
  }));
  const necesidades = [];
  const actividad = [];
  for (const persona of personas) {
    for (const curso of capacitaciones.filter(item => item.universo === persona.universo)) {
      if (azar() < .18) continue;
      necesidades.push({ persona: persona.id, codigo: curso.codigo });
      if (azar() < .69) {
        const mes = 1 + Math.floor(azar() * 9);
        const dia = 1 + Math.floor(azar() * 27);
        actividad.push({ persona: persona.id, codigo: curso.codigo, capacitador: inspectores[Math.floor(azar() * inspectores.length)], fecha: `2031-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}` });
      }
    }
  }
  function calcular(filtro = {}) {
    const seleccion = personas.filter(p => (!filtro.universo || p.universo === filtro.universo) && (!filtro.inspector || p.inspector === filtro.inspector) && (!filtro.organizacion || p.organizacion === filtro.organizacion));
    const ids = new Set(seleccion.map(p => p.id));
    const necesidadesFiltradas = necesidades.filter(n => ids.has(n.persona) && (!filtro.codigo || n.codigo === filtro.codigo));
    const completados = new Set(actividad.filter(a => (!filtro.desde || a.fecha >= filtro.desde) && (!filtro.hasta || a.fecha <= filtro.hasta)).map(a => `${a.persona}:${a.codigo}`));
    const capacitados = necesidadesFiltradas.filter(n => completados.has(`${n.persona}:${n.codigo}`)).length;
    const total = necesidadesFiltradas.length;
    return { personas: seleccion.length, necesidad: total, capacitados, pendientes: total - capacitados, porcentaje: total ? capacitados * 100 / total : null };
  }
  root.ColoquiosDatos = { capacitaciones, inspectores, organizaciones, personas, necesidades, actividad, calcular };
})(typeof window === 'undefined' ? globalThis : window);

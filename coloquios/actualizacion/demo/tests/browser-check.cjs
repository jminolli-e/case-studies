/* Node 22+; Chrome iniciado con --remote-debugging-port=9236.
 * CDP_PORT y DEMO_URL permiten usar otro puerto o servidor local.
 * No guarda capturas ni modifica datos del proyecto.
 */
const assert = require('node:assert/strict');
const port = process.env.CDP_PORT || '9236';
const url = process.env.DEMO_URL || 'http://127.0.0.1:18836/coloquios/actualizacion/demo/dashboard-actual.html';

async function main() {
  const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const page = pages.find(p => p.type === 'page');
  assert(page, 'Debe existir una pestaña de Chrome');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let next = 0;
  const pending = new Map();
  const exceptions = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    message.error ? request.reject(Error(message.error.message)) : request.resolve(message.result);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++next;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert(!response.exceptionDetails, JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  const check = async (expression, description) => {
    assert(await evaluate(expression), description);
    console.log('PASS:', description);
  };
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: url + '?validation=' + Date.now() });
    for (let i = 0; i < 100; i++) {
      if (await evaluate("!!document.querySelector('.needs-chart .main-svg')")) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await evaluate('document.fonts.ready');
    await check("document.querySelectorAll('#summary-content tbody tr').length===34", '34 contenidos operativos');
    await check("getComputedStyle(document.querySelector('.tabs button')).fontWeight==='700'", 'peso de navegación interna');
    await check("getComputedStyle(document.querySelector('.nav button:not(.active)')).fontWeight==='550'", 'peso de menú inactivo');
    await check("getComputedStyle(document.querySelector('#desde')).fontFamily.includes('Plus Jakarta Sans') && getComputedStyle(document.querySelector('#desde')).fontWeight==='600'", 'fuente y peso de fechas');
    await check("getComputedStyle(document.querySelector('.notice')).backgroundColor==='rgb(255, 248, 230)' && getComputedStyle(document.querySelector('.notice')).color==='rgb(122, 75, 0)'", 'colores del aviso original');
    await check("getComputedStyle(document.querySelector('.top')).borderBottomWidth==='2px'", 'separador de cabecera');
    await check("getComputedStyle(document.querySelector('.progress-value')).color==='rgb(24, 133, 111)'", 'color del porcentaje de Resumen');
    await evaluate("document.querySelector('.summary-kpi-help').focus()");
    await check("getComputedStyle(document.querySelector('.summary-kpi-tooltip')).visibility==='visible' && document.querySelector('.summary-kpi-help').firstChild.textContent==='?'", 'tooltip accesible con signo de pregunta');
    await evaluate('window.dashboardChartReady.then(() => true)');
    await check("document.querySelector('.needs-chart').data.length===2 && document.querySelector('.needs-chart').data[0].x.length===34 && document.querySelector('.needs-chart').layout.barmode==='overlay' && document.querySelector('.needs-chart').layout.height===468", 'gráfico Plotly operativo');
    await check("document.querySelector('.needs-chart').layout.shapes.length===1", 'línea de promedio');
    await evaluate("document.querySelector('[data-tab=prioridades]').click()");
    await check("document.querySelectorAll('#summary-content tbody tr').length===24 && document.querySelectorAll('.ring').length===2", 'prioridades y anillos de 24 inspectores');
    await check("[...document.querySelectorAll('.ring')].every(r=>{const range=document.createRange();range.selectNodeContents(r.querySelector('span'));return r.getBoundingClientRect().width===112 && range.getBoundingClientRect().width<r.getBoundingClientRect().width*.76})", 'porcentajes dentro del anillo');
    await check("!document.body.innerText.includes('Convenio')", 'nomenclatura Grupo A/B');
    await evaluate("document.querySelector('#summary-universe [data-universe=administrativo]').click()");
    await evaluate('window.dashboardChartReady.then(() => true)');
    await check("document.querySelector('.needs-chart').data[0].x.length===3 && document.querySelector('.needs-chart').layout.height===378", 'gráfico administrativo');
    await evaluate("document.querySelector('[data-view=trainer]').click();const s=document.querySelector('#trainer-select');s.value='Capacitador A01';s.dispatchEvent(new Event('change'))");
    await check("document.querySelectorAll('#trainer-kpis .numbers small').length===4 && !document.querySelector('#trainer-kpis').innerText.includes('ⓘ')", 'aclaraciones KPI completas y ayudas correctas');
    await check("getComputedStyle(document.querySelector('.semester-first strong')).color==='rgb(79, 96, 52)' && getComputedStyle(document.querySelector('.semester-second strong')).color==='rgb(39, 71, 100)'", 'colores por semestre');
    await check("document.querySelectorAll('.inspector-advance-row').length===34", 'avance del inspector completo');
    const annual = await evaluate("document.querySelector('#trainer-kpis .card:nth-child(2)').innerText");
    await evaluate("const input=document.querySelector('#desde');input.value='2026-10-01';input.dispatchEvent(new Event('change'))");
    assert.equal(await evaluate("document.querySelector('#trainer-kpis .card:nth-child(2)').innerText"), annual, 'KPI anual independiente del período');
    await check("document.querySelectorAll('.inspector-advance-value.outside').length>0", 'etiquetas legibles en barras cortas');
    await evaluate("document.querySelector('[data-tab=organizaciones]').click()");
    await check("document.querySelectorAll('.organization-heatmap th').length===35 && getComputedStyle(document.querySelector('.organization-heatmap td')).position==='sticky'", 'mapa completo con organización fija');
    await evaluate("document.querySelector('#desde').value='';document.querySelector('#desde').dispatchEvent(new Event('change'))");
    await check("!document.querySelector('.date-error').hidden && document.querySelector('#period').textContent.includes('01/10/2026')", 'fecha vacía no altera el período válido');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await check('document.documentElement.scrollWidth<=innerWidth', 'sin desborde horizontal de página en móvil');
    assert.equal(exceptions.length, 0, 'Sin excepciones JavaScript: ' + exceptions.join(', '));
    console.log('PASS: sin excepciones JavaScript');
  } finally {
    socket.close();
  }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });

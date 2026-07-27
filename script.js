function $(id) { return document.getElementById(id); }

// ---------- tema claro/escuro ----------
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = $('themeToggle');
  if (btn) btn.textContent = theme === 'light' ? '🌙' : '☀️';
  try { localStorage.setItem('bar-theme', theme); } catch (e) {}
}
let temaSalvo = 'dark';
try { temaSalvo = localStorage.getItem('bar-theme') || 'dark'; } catch (e) {}
applyTheme(temaSalvo);
$('themeToggle').addEventListener('click', () => {
  const atual = document.documentElement.getAttribute('data-theme');
  applyTheme(atual === 'light' ? 'dark' : 'light');
});

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function fmtDate(iso) {
  if (!iso) return '__/__/__';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

// ---------- wizard state ----------
const TOTAL_STEPS = 13;
let currentStep = 1;
let responsavelSelecionado = null;
let limpezaFora = null; // null | true | false
let fotoQuebrasFiles = [];
let fotoLimpezaFiles = [];
let fotoDespProdutosFiles = [];
let fotoDespInsumosFiles = [];
let fotoFechamentoFiles = [];
let ultimaBusca = null; // { registros, de, ate } — usado pra exportar PDF/Excel

const STEP_TITLES = {
  1: 'Identificação', 2: '1 — Movimento', 3: '2 — Quebras', 4: '3 — Desperdício produtos',
  5: '4 — Desperdício insumos', 6: '5 — Produção OK', 7: '6 — Produção iniciada',
  8: '7 — Produção baixa', 9: '8 — Estoque crítico', 10: '9 — Limpeza / organização',
  11: '10 — Observações', 12: 'Fechamento', 13: 'Revisão e envio'
};

// ---------- init ----------
$('data').value = todayISO();

$('responsavel').addEventListener('input', () => {
  responsavelSelecionado = $('responsavel').value.trim();
  if (responsavelSelecionado) hideError('errResponsavel');
});

$('btnSim').addEventListener('click', () => { limpezaFora = true; updateLimpezaToggle(); });
$('btnNao').addEventListener('click', () => { limpezaFora = false; updateLimpezaToggle(); });
function updateLimpezaToggle() {
  $('btnSim').classList.toggle('active-yes', limpezaFora === true);
  $('btnNao').classList.toggle('active-no', limpezaFora === false);
  $('fotoLimpezaBox').style.display = limpezaFora === true ? 'block' : 'none';
  hideError('errLimpeza');
}

$('semQuebras').addEventListener('change', () => {
  $('quebrasBox').style.display = $('semQuebras').checked ? 'none' : 'block';
  hideError('errQuebras');
});

$('semDespProdutos').addEventListener('change', () => {
  $('despProdutosBox').style.display = $('semDespProdutos').checked ? 'none' : 'block';
  hideError('errDespProdutos');
});

$('semDespInsumos').addEventListener('change', () => {
  $('despInsumosBox').style.display = $('semDespInsumos').checked ? 'none' : 'block';
  hideError('errDespInsumos');
});

$('semFotoFechamento').addEventListener('change', () => {
  $('fotoFechamentoBox').style.display = $('semFotoFechamento').checked ? 'none' : 'block';
  hideError('errFechamento');
});

$('fotoQuebrasCam').addEventListener('change', (ev) => addPhotos(ev, 'previewQuebras', fotoQuebrasFiles, () => hideError('errQuebras')));
$('fotoQuebrasGal').addEventListener('change', (ev) => addPhotos(ev, 'previewQuebras', fotoQuebrasFiles, () => hideError('errQuebras')));
$('fotoLimpezaCam').addEventListener('change', (ev) => addPhotos(ev, 'previewLimpeza', fotoLimpezaFiles, () => hideError('errLimpeza')));
$('fotoLimpezaGal').addEventListener('change', (ev) => addPhotos(ev, 'previewLimpeza', fotoLimpezaFiles, () => hideError('errLimpeza')));
$('fotoDespProdutosCam').addEventListener('change', (ev) => addPhotos(ev, 'previewDespProdutos', fotoDespProdutosFiles, () => hideError('errDespProdutos')));
$('fotoDespProdutosGal').addEventListener('change', (ev) => addPhotos(ev, 'previewDespProdutos', fotoDespProdutosFiles, () => hideError('errDespProdutos')));
$('fotoDespInsumosCam').addEventListener('change', (ev) => addPhotos(ev, 'previewDespInsumos', fotoDespInsumosFiles, () => hideError('errDespInsumos')));
$('fotoDespInsumosGal').addEventListener('change', (ev) => addPhotos(ev, 'previewDespInsumos', fotoDespInsumosFiles, () => hideError('errDespInsumos')));
$('fotoFechamentoCam').addEventListener('change', (ev) => addPhotos(ev, 'previewFechamento', fotoFechamentoFiles, () => hideError('errFechamento')));
$('fotoFechamentoGal').addEventListener('change', (ev) => addPhotos(ev, 'previewFechamento', fotoFechamentoFiles, () => hideError('errFechamento')));

// Adiciona 1+ arquivos escolhidos a um array de fotos da seção e re-renderiza a galeria
function addPhotos(ev, previewId, filesArr, onDone) {
  const files = Array.from(ev.target.files || []);
  if (!files.length) return;
  files.forEach(f => filesArr.push(f));
  renderGallery(previewId, filesArr);
  ev.target.value = ''; // permite selecionar/tirar outra foto igual depois
  onDone();
}

function renderGallery(previewId, filesArr) {
  const box = $(previewId);
  box.innerHTML = filesArr.map((file, idx) => {
    const url = URL.createObjectURL(file);
    return `<div class="mini-photo"><img src="${url}"><button type="button" class="rm" data-preview="${previewId}" data-idx="${idx}">✕</button></div>`;
  }).join('');
  box.querySelectorAll('.rm').forEach(btn => {
    btn.addEventListener('click', () => {
      const arr = filesArrByPreview(btn.dataset.preview);
      arr.splice(Number(btn.dataset.idx), 1);
      renderGallery(btn.dataset.preview, arr);
    });
  });
}

function filesArrByPreview(previewId) {
  return {
    previewQuebras: fotoQuebrasFiles,
    previewLimpeza: fotoLimpezaFiles,
    previewDespProdutos: fotoDespProdutosFiles,
    previewDespInsumos: fotoDespInsumosFiles,
    previewFechamento: fotoFechamentoFiles
  }[previewId];
}

function showError(id) { $(id).classList.add('show'); }
function hideError(id) { $(id).classList.remove('show'); }

// ---------- validation per step ----------
function validateStep(step) {
  if (step === 1) {
    if (!responsavelSelecionado) { showError('errResponsavel'); return false; }
    return true;
  }
  if (step === 3) {
    if ($('semQuebras').checked) return true;
    if (!fotoQuebrasFiles.length) { showError('errQuebras'); return false; }
    return true;
  }
  if (step === 4) {
    if ($('semDespProdutos').checked) return true;
    if (!fotoDespProdutosFiles.length) { showError('errDespProdutos'); return false; }
    return true;
  }
  if (step === 5) {
    if ($('semDespInsumos').checked) return true;
    if (!fotoDespInsumosFiles.length) { showError('errDespInsumos'); return false; }
    return true;
  }
  if (step === 10) {
    if (limpezaFora === null) { showError('errLimpeza'); return false; }
    if (limpezaFora === false) return true;
    if (!fotoLimpezaFiles.length) { showError('errLimpeza'); return false; }
    return true;
  }
  if (step === 12) {
    if ($('semFotoFechamento').checked) return true;
    if (!fotoFechamentoFiles.length) { showError('errFechamento'); return false; }
    return true;
  }
  return true;
}

// ---------- navigation ----------
function goToStep(step) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
  currentStep = step;
  $('stepLabel').textContent = `Passo ${step} de ${TOTAL_STEPS} — ${STEP_TITLES[step]}`;
  $('progressBar').style.width = `${(step / TOTAL_STEPS) * 100}%`;
  $('btnPrev').style.display = step === 1 ? 'none' : 'block';
  $('btnNext').style.display = step === TOTAL_STEPS ? 'none' : 'block';
  $('btnSave').style.display = step === TOTAL_STEPS ? 'block' : 'none';
  if (step === TOTAL_STEPS) renderReview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$('btnNext').addEventListener('click', () => {
  if (!validateStep(currentStep)) return;
  if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
});
$('btnPrev').addEventListener('click', () => {
  if (currentStep > 1) goToStep(currentStep - 1);
});

// ---------- review ----------
function renderReview() {
  const L = [];
  L.push(row('Data', fmtDate($('data').value)));
  L.push(row('Responsável', responsavelSelecionado || '–'));
  L.push(row('Fluxo', $('fluxo').value));
  L.push(row('Quebras', $('semQuebras').checked ? 'Sem quebras' : ($('quebras').value || '–')));
  L.push(row('Desperdício produtos', $('semDespProdutos').checked ? 'Sem desperdício' : ($('despProdutos').value || '–')));
  L.push(row('Desperdício insumos', $('semDespInsumos').checked ? 'Sem desperdício' : ($('despInsumos').value || '–')));
  L.push(row('Produção OK', $('prodOk').value || '–'));
  L.push(row('Produção iniciada', $('prodIniciada').value || '–'));
  L.push(row('Produção baixa', $('prodBaixa').value || '–'));
  L.push(row('Estoque crítico', $('estoqueCritico').value || '–'));
  L.push(row('Limpeza fora do padrão', limpezaFora === true ? 'Sim' : limpezaFora === false ? 'Não' : '–'));
  L.push(row('Observação limpeza', $('limpezaObs').value || '–'));
  L.push(row('Atenção', $('atencao').value || '–'));
  L.push(row('Problema', $('problema').value || '–'));
  L.push(row('Sugestão', $('sugestao').value || '–'));
  L.push(row('Bar fechado às', $('horaFechamento').value || '–'));
  $('reviewBox').innerHTML = L.join('');
  function row(label, val) {
    return `<div class="rline"><b>${label}:</b> ${escapeHtml(val)}</div>`;
  }
}
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ---------- build data object for Supabase (nomes de coluna em snake_case) ----------
function buildReportData() {
  return {
    data: $('data').value,
    responsavel: responsavelSelecionado,
    fluxo: $('fluxo').value,
    sem_quebras: $('semQuebras').checked,
    quebras: $('quebras').value,
    desp_produtos: $('despProdutos').value,
    desp_insumos: $('despInsumos').value,
    prod_ok: $('prodOk').value,
    prod_iniciada: $('prodIniciada').value,
    prod_baixa: $('prodBaixa').value,
    estoque_critico: $('estoqueCritico').value,
    limpeza_fora_padrao: limpezaFora,
    limpeza_obs: $('limpezaObs').value,
    atencao: $('atencao').value,
    problema: $('problema').value,
    sugestao: $('sugestao').value,
    hora_fechamento: $('horaFechamento').value
    // criado_em é preenchido automaticamente pelo banco (default now())
  };
}

// ---------- save to Supabase ----------
function setStatus(msg, type) {
  const el = $('statusMessage');
  el.textContent = msg;
  el.className = 'status-message show ' + type;
}

$('btnSave').addEventListener('click', async () => {
  $('btnSave').disabled = true;
  setStatus('Salvando registro e enviando fotos…', 'info');

  try {
    const reportData = buildReportData();

    if (fotoQuebrasFiles.length) {
      reportData.foto_quebras_urls = await uploadPhotos(fotoQuebrasFiles, 'quebras');
    }
    if (fotoDespProdutosFiles.length) {
      reportData.foto_desp_produtos_urls = await uploadPhotos(fotoDespProdutosFiles, 'desperdicio-produtos');
    }
    if (fotoDespInsumosFiles.length) {
      reportData.foto_desp_insumos_urls = await uploadPhotos(fotoDespInsumosFiles, 'desperdicio-insumos');
    }
    if (fotoLimpezaFiles.length) {
      reportData.foto_limpeza_urls = await uploadPhotos(fotoLimpezaFiles, 'limpeza');
    }
    if (fotoFechamentoFiles.length) {
      reportData.foto_fechamento_urls = await uploadPhotos(fotoFechamentoFiles, 'fechamento');
    }

    const { error } = await supabaseClient.from('fechamentos').insert([reportData]);
    if (error) throw error;

    setStatus('✅ Registro salvo na nuvem com sucesso!', 'success');
    $('footerNote').textContent = 'salvo — pode fechar o bar em paz.';
    setTimeout(() => {
      if (confirm('Registro salvo! Deseja iniciar um novo fechamento?')) {
        location.reload();
      }
    }, 800);
  } catch (err) {
    console.error(err);
    setStatus('❌ Erro ao salvar: ' + err.message + ' — verifique a configuração do Supabase (supabase-config.js).', 'error');
    $('btnSave').disabled = false;
  }
});

async function uploadPhotos(files, folder) {
  const urls = [];
  for (const file of files) {
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2,7)}_${file.name}`;
    const { error } = await supabaseClient.storage.from(BUCKET_FOTOS).upload(filename, file);
    if (error) throw error;
    const { data } = supabaseClient.storage.from(BUCKET_FOTOS).getPublicUrl(filename);
    urls.push(data.publicUrl);
  }
  return urls;
}

// ================================================================
// ABAS
// ================================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ================================================================
// ABA 2 — RELATÓRIO DE FECHAMENTO
// ================================================================
$('filtroPeriodo').addEventListener('change', () => {
  $('filtroPersonalizado').style.display = $('filtroPeriodo').value === 'personalizado' ? 'block' : 'none';
});

function getDateRange() {
  const periodo = $('filtroPeriodo').value;
  const today = new Date();
  const toISO = (d) => d.toISOString().slice(0, 10);

  if (periodo === 'hoje') {
    const iso = toISO(today);
    return { de: iso, ate: iso };
  }
  if (periodo === 'semana') {
    const de = new Date(today);
    de.setDate(de.getDate() - 6);
    return { de: toISO(de), ate: toISO(today) };
  }
  if (periodo === 'mes') {
    const de = new Date(today.getFullYear(), today.getMonth(), 1);
    return { de: toISO(de), ate: toISO(today) };
  }
  // personalizado
  return { de: $('filtroDe').value || toISO(today), ate: $('filtroAte').value || toISO(today) };
}

function setStatusRelatorio(msg, type) {
  const el = $('statusRelatorio');
  el.textContent = msg;
  el.className = 'status-message show ' + (type || 'info');
}

$('btnBuscarRelatorio').addEventListener('click', async () => {
  const { de, ate } = getDateRange();
  if (!de || !ate) { setStatusRelatorio('Selecione as datas do período personalizado.', 'error'); return; }

  $('btnBuscarRelatorio').disabled = true;
  setStatusRelatorio('Buscando registros no banco de dados…', 'info');
  $('resumoBox').style.display = 'none';
  $('listaBox').style.display = 'none';

  try {
    const { data: registrosRaw, error } = await supabaseClient
      .from('fechamentos')
      .select('*')
      .gte('data', de)
      .lte('data', ate);

    if (error) throw error;

    let registros = registrosRaw || [];

    const filtroResp = $('filtroResponsavel').value.trim().toLowerCase();
    if (filtroResp) {
      registros = registros.filter(r => (r.responsavel || '').toLowerCase().includes(filtroResp));
    }

    registros.sort((a, b) => (b.data + (b.hora_fechamento || '')).localeCompare(a.data + (a.hora_fechamento || '')));

    renderResumo(registros);
    renderSemaforoPanel(registros);
    renderLista(registros);
    ultimaBusca = { registros, de, ate };

    setStatusRelatorio(`✅ ${registros.length} registro(s) encontrado(s) entre ${fmtDate(de)} e ${fmtDate(ate)}.`, 'success');
  } catch (err) {
    console.error(err);
    setStatusRelatorio('❌ Erro ao buscar: ' + err.message, 'error');
  } finally {
    $('btnBuscarRelatorio').disabled = false;
  }
});

function renderResumo(registros) {
  const total = registros.length;
  const comQuebras = registros.filter(r => !r.sem_quebras).length;
  const comDespProdutos = registros.filter(r => (r.desp_produtos || '').trim()).length;
  const comDespInsumos = registros.filter(r => (r.desp_insumos || '').trim()).length;

  $('statsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Fechamentos</div></div>
    <div class="stat-card"><div class="stat-num">${comQuebras}</div><div class="stat-label">Com quebras</div></div>
    <div class="stat-card"><div class="stat-num">${comDespProdutos}</div><div class="stat-label">Desperdício produtos</div></div>
    <div class="stat-card"><div class="stat-num">${comDespInsumos}</div><div class="stat-label">Desperdício insumos</div></div>
  `;

  const estoqueItens = registros.filter(r => (r.estoque_critico || '').trim());
  $('estoqueCriticoResumo').innerHTML = estoqueItens.length ? `
    <div class="mini-list">
      <div class="mini-title">Estoque crítico relatado no período</div>
      ${estoqueItens.map(r => `<div class="mini-item"><b>${fmtDate(r.data)}</b> (${escapeHtml(r.responsavel || '–')}) — ${escapeHtml(r.estoque_critico)}</div>`).join('')}
    </div>` : '';

  const comHora = registros.filter(r => r.hora_fechamento);
  $('horariosResumo').innerHTML = comHora.length ? `
    <div class="mini-list">
      <div class="mini-title">Horários de fechamento</div>
      ${comHora.map(r => `<div class="mini-item"><b>${fmtDate(r.data)}</b> — fechado às ${r.hora_fechamento} (${escapeHtml(r.responsavel || '–')})</div>`).join('')}
    </div>` : '';

  $('resumoBox').style.display = 'block';
}

function urlsOf(arr, legacyUrl) {
  if (Array.isArray(arr) && arr.length) return arr;
  return legacyUrl ? [legacyUrl] : [];
}

function issueFlags(r) {
  return {
    hasQuebras: !r.sem_quebras && (r.quebras || '').trim().length > 0,
    hasDespProd: (r.desp_produtos || '').trim().length > 0,
    hasDespIns: (r.desp_insumos || '').trim().length > 0,
    hasProblem: (r.problema || '').trim().length > 0,
    hasStockOut: (r.estoque_critico || '').toLowerCase().includes('acabou')
  };
}
function semaforo(flags) {
  if (flags.hasProblem || flags.hasStockOut) return 'red';
  if (flags.hasQuebras || flags.hasDespProd || flags.hasDespIns) return 'yellow';
  return 'green';
}
function semaforoLabel(s) { return s === 'red' ? 'Atenção' : s === 'yellow' ? 'Ocorrências' : 'Normal'; }

function renderSemaforoPanel(registros) {
  const byDate = {};
  registros.forEach(r => {
    const f = issueFlags(r);
    if (!byDate[r.data]) {
      byDate[r.data] = { hasQuebras: false, hasDespProd: false, hasDespIns: false, hasProblem: false, hasStockOut: false };
    }
    const acc = byDate[r.data];
    acc.hasQuebras = acc.hasQuebras || f.hasQuebras;
    acc.hasDespProd = acc.hasDespProd || f.hasDespProd;
    acc.hasDespIns = acc.hasDespIns || f.hasDespIns;
    acc.hasProblem = acc.hasProblem || f.hasProblem;
    acc.hasStockOut = acc.hasStockOut || f.hasStockOut;
  });

  const dates = Object.keys(byDate).sort().slice(-14);
  if (!dates.length) { $('semaforoBox').innerHTML = ''; return; }

  function dotsForDay(flags) {
    const dots = [];
    if (flags.hasProblem) dots.push({ cor: 'red', titulo: 'Problema relatado' });
    if (flags.hasStockOut) dots.push({ cor: 'red', titulo: 'Estoque zerado' });
    if (flags.hasQuebras) dots.push({ cor: 'yellow', titulo: 'Quebra' });
    if (flags.hasDespProd) dots.push({ cor: 'yellow', titulo: 'Desperdício de produtos' });
    if (flags.hasDespIns) dots.push({ cor: 'yellow', titulo: 'Desperdício de insumos' });
    if (dots.length === 0) dots.push({ cor: 'green', titulo: 'Normal' });
    return dots;
  }

  $('semaforoBox').innerHTML = `
    <div class="mini-list">
      <div class="mini-title">🚦 Indicadores por dia (últimos ${dates.length})</div>
      <div class="semaphore-strip">
        ${dates.map(d => {
          const { dia, mesAno } = ficDiaMes(d);
          const dots = dotsForDay(byDate[d]);
          return `<div class="sem-item">
            <div class="dot-cluster">
              ${dots.map(dot => `<span class="dot dot-${dot.cor}" title="${escapeHtml(dot.titulo)}"></span>`).join('')}
            </div>
            <span>${dia}/${mesAno.split('/')[0]}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="semaphore-legend">
        <span><span class="dot dot-green"></span> Normal</span>
        <span><span class="dot dot-yellow"></span> Quebra/desperdício</span>
        <span><span class="dot dot-red"></span> Problema ou estoque zerado</span>
      </div>
    </div>
  `;
}

function statusFicha(r) {
  const temQuebra = !r.sem_quebras && (r.quebras || '').trim();
  const temDesperdicio = (r.desp_produtos || '').trim() || (r.desp_insumos || '').trim();
  const limpezaFora = r.limpeza_fora_padrao === true;
  const temAlerta = (r.atencao || '').trim() || (r.problema || '').trim();

  const tags = [];
  let classe = 'st-ok';
  if (temQuebra) { tags.push(['tag-danger', 'Quebra']); classe = 'st-quebra'; }
  if (temDesperdicio) { tags.push(['tag-warn', 'Desperdício']); if (classe === 'st-ok') classe = 'st-desperdicio'; }
  if (limpezaFora) { tags.push(['tag-danger', 'Limpeza pendente']); classe = 'st-quebra'; }
  if (temAlerta) { tags.push(['tag-warn', 'Alerta']); if (classe === 'st-ok') classe = 'st-desperdicio'; }
  if (tags.length === 0) tags.push(['tag-ok', 'Sem ocorrências']);

  return { tags, classe };
}

function ficDiaMes(iso) {
  if (!iso) return { dia: '––', mesAno: '––/––' };
  const [y, m, d] = iso.split('-');
  return { dia: d, mesAno: `${m}/${y.slice(2)}` };
}

function secao(num, titulo, conteudo) {
  const vazio = !conteudo || !String(conteudo).trim();
  return `
    <div class="ficha-section">
      <div class="ficha-section-head"><div class="num-mini">${num}</div><div class="stitle">${titulo}</div></div>
      <div class="sbody ${vazio ? 'empty' : ''}">${vazio ? '–' : escapeHtml(conteudo)}</div>
    </div>`;
}

function renderLista(registros) {
  if (registros.length === 0) {
    $('listaRegistros').innerHTML = '<div class="hint">Nenhum registro encontrado nesse período.</div>';
    $('listaBox').style.display = 'block';
    return;
  }

  $('listaRegistros').innerHTML = registros.map(r => {
    const { tags, classe } = statusFicha(r);
    const { dia, mesAno } = ficDiaMes(r.data);

    const fotos = [
      ...urlsOf(r.foto_quebras_urls, r.foto_quebras_url).map(u => [u, 'Quebra']),
      ...urlsOf(r.foto_desp_produtos_urls, r.foto_desp_produtos_url).map(u => [u, 'Desperdício produto']),
      ...urlsOf(r.foto_desp_insumos_urls, r.foto_desp_insumos_url).map(u => [u, 'Desperdício insumo']),
      ...urlsOf(r.foto_limpeza_urls, r.foto_limpeza_url).map(u => [u, 'Bar limpo']),
      ...urlsOf(r.foto_fechamento_urls, r.foto_fechamento_url).map(u => [u, 'Fechamento']),
    ];

    return `
    <details class="record-card ${classe}">
      <summary>
        <div class="ficha-date">${dia}<small>${mesAno}</small></div>
        <div class="ficha-info">
          <div class="ficha-resp">${escapeHtml(r.responsavel || '–')}</div>
          <div class="ficha-tags">${tags.map(([c, t]) => `<span class="tag ${c}">${t}</span>`).join('')}</div>
        </div>
        <div class="ficha-hora">${r.hora_fechamento || '--:--'}</div>
      </summary>
      <div class="record-detail">
        ${secao('1', 'Movimento', r.fluxo)}
        ${secao('2', 'Quebras', r.sem_quebras ? 'Sem quebras' : r.quebras)}
        ${secao('3', 'Desperdício — produtos', r.desp_produtos)}
        ${secao('4', 'Desperdício — insumos', r.desp_insumos)}
        ${secao('5', 'Produção OK', r.prod_ok)}
        ${secao('6', 'Produção iniciada', r.prod_iniciada)}
        ${secao('7', 'Produção baixa', r.prod_baixa)}
        ${secao('8', 'Estoque crítico', r.estoque_critico)}
        ${secao('9', 'Limpeza / organização', [
          r.limpeza_fora_padrao === true ? 'Fora do padrão' : r.limpeza_fora_padrao === false ? 'Dentro do padrão' : null,
          r.limpeza_obs
        ].filter(Boolean).join(' — '))}
        ${secao('10', 'Atenção', r.atencao)}
        ${secao('10', 'Problema', r.problema)}
        ${secao('10', 'Sugestão', r.sugestao)}
        ${fotos.length ? `
        <div class="ficha-comprovantes">
          <span class="stitle">Comprovantes (${fotos.length})</span>
          <div class="photo-grid">
            ${fotos.map(([url, label]) => `
              <figure>
                <img src="${url}" alt="${escapeHtml(label)}" loading="lazy">
                <figcaption>${escapeHtml(label)}</figcaption>
              </figure>`).join('')}
          </div>
        </div>` : ''}
      </div>
    </details>`;
  }).join('');

  $('listaBox').style.display = 'block';
}

// ================================================================
// EXPORTAR PDF / EXCEL
// ================================================================
function stripEmojis(s) {
  return String(s).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\uFE0F]/gu, '').replace(/ {2,}/g, ' ');
}

function fichaTextoPlano(r) {
  const flags = issueFlags(r);
  const status = semaforoLabel(semaforo(flags)).toUpperCase();
  const linhas = [];
  linhas.push(`${fmtDate(r.data)} - ${r.responsavel || '-'} - STATUS: ${status}`);
  linhas.push(`Fluxo: ${r.fluxo || '-'}`);
  linhas.push(`Quebras: ${r.sem_quebras ? 'Sem quebras' : (r.quebras || '-')}`);
  linhas.push(`Desperdicio produtos: ${r.desp_produtos || '-'}`);
  linhas.push(`Desperdicio insumos: ${r.desp_insumos || '-'}`);
  linhas.push(`Producao OK: ${r.prod_ok || '-'}`);
  linhas.push(`Producao iniciada: ${r.prod_iniciada || '-'}`);
  linhas.push(`Producao baixa: ${r.prod_baixa || '-'}`);
  linhas.push(`Estoque critico: ${r.estoque_critico || '-'}`);
  linhas.push(`Limpeza fora do padrao: ${r.limpeza_fora_padrao === true ? 'Sim' : r.limpeza_fora_padrao === false ? 'Nao' : '-'}`);
  linhas.push(`Observacao limpeza: ${r.limpeza_obs || '-'}`);
  linhas.push(`Atencao: ${r.atencao || '-'}`);
  linhas.push(`Problema: ${r.problema || '-'}`);
  linhas.push(`Sugestao: ${r.sugestao || '-'}`);
  linhas.push(`Bar fechado as: ${r.hora_fechamento || '-'}`);
  return stripEmojis(linhas.join('\n'));
}

$('btnExportExcel').addEventListener('click', () => {
  if (typeof XLSX === 'undefined') { alert('A biblioteca de exportação ainda está carregando. Tente novamente em alguns segundos.'); return; }
  if (!ultimaBusca || !ultimaBusca.registros.length) { alert('Busque um relatório antes de exportar.'); return; }
  const { registros, de, ate } = ultimaBusca;

  const linhas = registros.map(r => {
    const flags = issueFlags(r);
    return {
      Data: fmtDate(r.data),
      Responsavel: r.responsavel || '-',
      Fluxo: r.fluxo || '-',
      Quebras: r.sem_quebras ? 'Sem quebras' : (r.quebras || '-'),
      DesperdicioProdutos: r.desp_produtos || '-',
      DesperdicioInsumos: r.desp_insumos || '-',
      ProducaoOk: r.prod_ok || '-',
      ProducaoIniciada: r.prod_iniciada || '-',
      ProducaoBaixa: r.prod_baixa || '-',
      EstoqueCritico: r.estoque_critico || '-',
      LimpezaForaPadrao: r.limpeza_fora_padrao === true ? 'Sim' : r.limpeza_fora_padrao === false ? 'Nao' : '-',
      ObservacaoLimpeza: r.limpeza_obs || '-',
      Atencao: r.atencao || '-',
      Problema: r.problema || '-',
      Sugestao: r.sugestao || '-',
      Fechamento: r.hora_fechamento || '-',
      Status: semaforoLabel(semaforo(flags))
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhas), 'Fechamentos');
  XLSX.writeFile(wb, `beijupira-fechamentos_${de}_a_${ate}.xlsx`);
});

$('btnExportPdf').addEventListener('click', () => {
  if (typeof window.jspdf === 'undefined') { alert('A biblioteca de exportação ainda está carregando. Tente novamente em alguns segundos.'); return; }
  if (!ultimaBusca || !ultimaBusca.registros.length) { alert('Busque um relatório antes de exportar.'); return; }
  const { registros, de, ate } = ultimaBusca;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 12;
  let y = 16;

  doc.setFont('courier', 'bold'); doc.setFontSize(13);
  doc.text('BEIJUPIRA - FECHAMENTOS DO BAR - PERIODO', marginX, y); y += 6;
  doc.setFont('courier', 'normal'); doc.setFontSize(9);
  doc.text(`${fmtDate(de)} a ${fmtDate(ate)}  |  Gerado em ${new Date().toLocaleString('pt-BR')}`, marginX, y);
  y += 9;

  registros.forEach(r => {
    const lines = doc.splitTextToSize(fichaTextoPlano(r), pageW - marginX * 2);
    if (y + lines.length * 4.2 + 8 > pageH - 14) { doc.addPage(); y = 16; }
    doc.setFontSize(8.5);
    lines.forEach(line => {
      if (y > pageH - 14) { doc.addPage(); y = 16; }
      doc.text(line, marginX, y);
      y += 4.2;
    });
    y += 4;
    if (y > pageH - 14) { doc.addPage(); y = 16; } else {
      doc.setDrawColor(200); doc.line(marginX, y - 2, pageW - marginX, y - 2); y += 5;
    }
  });

  doc.save(`beijupira-fechamentos_${de}_a_${ate}.pdf`);
});

// ---------- start ----------
goToStep(1);

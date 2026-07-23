/**
 * SISTEMA DE INVENTÁRIO DIGITAL DE EQUIPAMENTOS DE TI
 * Projeto de Extensão II - Tecnologia Aplicada à Inclusão Digital
 * Escola Estadual Prof. João Martins de Almeida - Pindamonhangaba/SP
 */

// ===================== CONFIGURAÇÃO FIXA =====================

const TIPOS_EQUIPAMENTO = [
  'Computador (desktop)',
  'Notebook',
  'Projetor',
  'TV',
  'Tablet',
  'Impressora',
  'Equipamento de rede (roteador/switch)',
  'Outro'
];

// Marcas/modelos fixos para Notebook (demais tipos usam texto livre)
const MARCAS_NOTEBOOK = [
  'Multilaser',
  'Positivo',
  'Samsung Chromebook 2023',
  'Samsung Chromebook 2025'
];

const STATUS_OPCOES = [
  'Funcionando',
  'Em manutenção',
  'Aguardando peça/garantia',
  'Para descarte'
];

const NOME_ABA_INVENTARIO = 'Inventario';
const NOME_ABA_CONFIG = 'Config';

// ===================== SETUP INICIAL (rodar 1x) =====================

/**
 * Roda esta função UMA VEZ (manualmente, no editor do Apps Script)
 * para criar as abas necessárias na planilha, caso ainda não existam.
 */
function configurarPlanilhaInicial() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let config = ss.getSheetByName(NOME_ABA_CONFIG);
  if (!config) {
    config = ss.insertSheet(NOME_ABA_CONFIG);
    config.appendRow(['Tipos de Equipamento (editável)']);
    config.getRange('A1').setFontWeight('bold');
    TIPOS_EQUIPAMENTO.forEach(tipo => config.appendRow([tipo]));

    config.getRange('C1').setValue('Status (editável)').setFontWeight('bold');
    STATUS_OPCOES.forEach((status, i) => config.getRange(i + 2, 3).setValue(status));
  }

  let inventario = ss.getSheetByName(NOME_ABA_INVENTARIO);
  if (!inventario) {
    inventario = ss.insertSheet(NOME_ABA_INVENTARIO);
    inventario.appendRow([
      'ID', 'Equipamento', 'Marca/Modelo', 'Etiqueta da Escola', 'Número de Série',
      'Local/Sala', 'Status', 'Data de Cadastro', 'Última Atualização'
    ]);
    inventario.getRange('A1:I1').setFontWeight('bold');
    inventario.setFrozenRows(1);
  }

  SpreadsheetApp.getUi().alert('Planilha configurada com sucesso! Abas: Config, Inventario.');
}

// ===================== SERVIR O WEB APP =====================

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Inventário de TI - Escola')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ===================== LEITURA DE CONFIGURAÇÃO =====================

function getListasConfig_() {
  const config = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_CONFIG);
  const dados = config.getDataRange().getValues();

  const tipos = [];
  const status = [];
  for (let i = 1; i < dados.length; i++) {
    if (dados[i][0]) tipos.push(dados[i][0]);
    if (dados[i][2]) status.push(dados[i][2]);
  }
  return { tipos: tipos, status: status };
}

function getDadosIniciais() {
  const listas = getListasConfig_();
  listas.marcasNotebook = MARCAS_NOTEBOOK;
  return listas;
}

// ===================== CADASTRO / LISTAGEM =====================

function gerarId_() {
  return 'EQ-' + Utilities.getUuid().slice(0, 8).toUpperCase();
}

/**
 * Cadastra um ou vários equipamentos de uma vez.
 * payload = { equipamento, marca, etiquetaDe, etiquetaAte, numeroSerie, local, status }
 *
 * Regras:
 * - equipamento, marca e local são obrigatórios.
 * - Se etiquetaDe/etiquetaAte forem informados, cadastra um equipamento para
 *   cada número no intervalo (ex: de 1 até 35 = 35 notebooks Positivo).
 * - Etiqueta é opcional; se informada, só bloqueia duplicidade dentro da
 *   MESMA combinação equipamento + marca.
 * - Número de série só é aplicado quando o cadastro é de UM único item
 *   (não faz sentido repetir o mesmo nº de série em vários equipamentos).
 */
function cadastrarEquipamento(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    if (!payload.equipamento || !payload.marca || !payload.local) {
      return { sucesso: false, mensagem: 'Preencha equipamento, marca/modelo e local/sala.' };
    }

    // Monta a lista de etiquetas a cadastrar
    let etiquetas = [];
    if (payload.etiquetaDe) {
      const de = parseInt(payload.etiquetaDe, 10);
      const ate = payload.etiquetaAte ? parseInt(payload.etiquetaAte, 10) : de;

      if (isNaN(de) || isNaN(ate) || ate < de) {
        return { sucesso: false, mensagem: 'Intervalo de etiquetas inválido.' };
      }
      if (ate - de > 200) {
        return { sucesso: false, mensagem: 'Intervalo muito grande (máximo de 200 por vez).' };
      }
      for (let n = de; n <= ate; n++) etiquetas.push(String(n));
    } else {
      etiquetas.push(''); // cadastro único, sem etiqueta
    }

    const inventario = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_INVENTARIO);
    const dados = inventario.getDataRange().getValues();

    // Conjunto de etiquetas já existentes para a mesma combinação equipamento+marca
    const existentes = new Set();
    for (let i = 1; i < dados.length; i++) {
      const mesmoEquipamento = String(dados[i][1]).trim() === String(payload.equipamento).trim();
      const mesmaMarca = String(dados[i][2]).trim().toLowerCase() === String(payload.marca).trim().toLowerCase();
      if (mesmoEquipamento && mesmaMarca && dados[i][3]) {
        existentes.add(String(dados[i][3]).trim());
      }
    }

    const agora = new Date();
    const status = payload.status || 'Funcionando';
    const numeroSerie = etiquetas.length === 1 ? (payload.numeroSerie || '') : '';

    const novasLinhas = [];
    const puladas = [];

    etiquetas.forEach(etq => {
      if (etq && existentes.has(etq)) {
        puladas.push(etq);
        return;
      }
      if (etq) existentes.add(etq); // evita duplicar dentro do próprio lote
      novasLinhas.push([
        gerarId_(),
        payload.equipamento,
        payload.marca,
        etq,
        numeroSerie,
        payload.local,
        status,
        agora,
        agora
      ]);
    });

    if (novasLinhas.length === 0) {
      return {
        sucesso: false,
        mensagem: `Todas as etiquetas informadas já existem para ${payload.equipamento} ${payload.marca}: ${puladas.join(', ')}.`
      };
    }

    const primeiraLinha = inventario.getLastRow() + 1;
    inventario.getRange(primeiraLinha, 1, novasLinhas.length, novasLinhas[0].length).setValues(novasLinhas);

    let mensagem = `${novasLinhas.length} equipamento(s) cadastrado(s) com sucesso.`;
    if (puladas.length > 0) {
      mensagem += ` ${puladas.length} etiqueta(s) já existiam e foram ignoradas: ${puladas.join(', ')}.`;
    }

    return { sucesso: true, mensagem: mensagem };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Retorna todos os equipamentos cadastrados.
 */
function getInventario() {
  const inventario = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_INVENTARIO);
  const dados = inventario.getDataRange().getValues();
  const itens = [];

  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    if (!linha[0]) continue;
    itens.push({
      id: linha[0],
      equipamento: linha[1],
      marca: linha[2],
      etiqueta: linha[3],
      numeroSerie: linha[4],
      local: linha[5],
      status: linha[6],
      dataCadastro: linha[7] ? Utilities.formatDate(new Date(linha[7]), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '',
      ultimaAtualizacao: linha[8] ? Utilities.formatDate(new Date(linha[8]), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '',
      linha: i + 1
    });
  }
  return itens;
}

/**
 * Atualiza o status de um equipamento (identificado pelo número da linha na planilha).
 */
function atualizarStatus(linha, novoStatus) {
  const inventario = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_INVENTARIO);
  inventario.getRange(linha, 7).setValue(novoStatus); // coluna Status
  inventario.getRange(linha, 9).setValue(new Date()); // coluna Última Atualização
  return { sucesso: true };
}

/**
 * Remove um equipamento do inventário (ex: equipamento descartado fisicamente).
 */
function removerEquipamento(linha) {
  const inventario = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_INVENTARIO);
  inventario.deleteRow(linha);
  return { sucesso: true };
}

// ===================== TOTAIS / DASHBOARD =====================

/**
 * Retorna a contagem total de equipamentos, agrupados por tipo e por status.
 */
function getTotais() {
  const itens = getInventario();

  const porTipo = {};
  const porStatus = {};
  const porTipoEStatus = {};
  const porTipoEMarca = {};

  itens.forEach(item => {
    porTipo[item.equipamento] = (porTipo[item.equipamento] || 0) + 1;
    porStatus[item.status] = (porStatus[item.status] || 0) + 1;

    if (!porTipoEStatus[item.equipamento]) porTipoEStatus[item.equipamento] = {};
    porTipoEStatus[item.equipamento][item.status] =
      (porTipoEStatus[item.equipamento][item.status] || 0) + 1;

    const marca = item.marca || 'Sem marca informada';
    if (!porTipoEMarca[item.equipamento]) porTipoEMarca[item.equipamento] = {};
    porTipoEMarca[item.equipamento][marca] = (porTipoEMarca[item.equipamento][marca] || 0) + 1;
  });

  return {
    totalGeral: itens.length,
    porTipo: porTipo,
    porStatus: porStatus,
    porTipoEStatus: porTipoEStatus,
    porTipoEMarca: porTipoEMarca
  };
}

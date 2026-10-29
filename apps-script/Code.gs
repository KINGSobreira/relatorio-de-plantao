/**
 * Relatório de Plantão — Grupo SERVNAC
 * Backend em Google Apps Script: recebe os relatórios do site (GitHub Pages),
 * grava uma linha na planilha e guarda o PDF (com as fotos da viatura) no Google Drive.
 *
 * Criados automaticamente:
 *   Aba "Relatorios"                         → uma linha por relatório enviado
 *   Pasta "Relatórios de Plantão - PDFs"     → os PDFs, no Drive de quem implantou o script
 */

const ABA = "Relatorios";
const PASTA_NOME = "Relatórios de Plantão - PDFs";

// [chave usada pelo site, título da coluna na planilha]
const COLS = [
  ["id", "ID"],
  ["criadoEm", "Enviado em"],
  ["supervisor", "Supervisor"],
  ["dataInicio", "Data início plantão"],
  ["horaInicio", "Hora início plantão"],
  ["inicioRota", "Início da rota"],
  ["dataFim", "Data término"],
  ["horaFim", "Término da rota"],
  ["vtr", "VTR"],
  ["placa", "Placa"],
  ["kmInicial", "KM inicial"],
  ["kmFinal", "KM final"],
  ["kmPercorrido", "KM percorrido"],
  ["postosVisitados", "Postos visitados"],
  ["faltasRegistradas", "Faltas registradas"],
  ["faltasCobertas", "Faltas cobertas em tempo hábil"],
  ["sincronizacao", "Sincronização da rota"],
  ["sincronizacaoObs", "Detalhe da sincronização"],
  ["ocorrenciasQtd", "Ocorrências / conduções"],
  ["ocorrencias", "Destinos e postos das ocorrências"],
  ["faltasEfetivo", "Faltas no efetivo"],
  ["reservasInformados", "Vigilantes reservas informados"],
  ["localReferencia", "Local de referência"],
  ["fatos", "Fatos relevantes"],
  ["fotosQtd", "Fotos da viatura"],
  ["pdfUrl", "PDF"],
  ["texto", "Texto do relatório"]
];
const KEYS = COLS.map(c => c[0]);
const LABEL = {};
COLS.forEach(c => (LABEL[c[0]] = c[1]));
const NUMERICOS = ["kmInicial", "kmFinal", "kmPercorrido", "postosVisitados", "faltasRegistradas",
  "ocorrenciasQtd", "faltasEfetivo", "reservasInformados", "fotosQtd"];

/** Rode esta função uma vez pelo editor: cria a aba e a pasta e pede as autorizações. */
function setup() {
  aba_();
  pasta_();
}

function doGet() {
  try {
    return json_({ ok: true, relatorios: ler_() });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (body.action !== "addRelatorio") throw new Error("Ação desconhecida.");
    const d = body.data || {};
    ["id", "supervisor", "dataInicio", "horaInicio", "dataFim", "horaFim", "vtr", "placa"].forEach(c => {
      if (d[c] === undefined || d[c] === null || String(d[c]).trim() === "") throw new Error("Campo obrigatório ausente: " + c);
    });
    const sh = aba_();
    const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
    // o mesmo relatório enviado duas vezes (clique duplo, internet instável) não duplica a linha
    if (sh.getLastRow() > 1) {
      const ids = sh.getRange(2, head.indexOf(LABEL.id) + 1, sh.getLastRow() - 1, 1).getDisplayValues().map(l => l[0]);
      if (ids.indexOf(String(d.id)) >= 0) return json_({ ok: true, duplicado: true });
    }
    if (body.pdf) d.pdfUrl = salvarPdf_(body.pdf, body.pdfNome || ("Relatorio-Plantao_" + d.dataInicio + ".pdf"));
    d.criadoEm = Utilities.formatDate(new Date(), "America/Fortaleza", "dd/MM/yyyy HH:mm");
    const porTitulo = {};
    KEYS.forEach(k => (porTitulo[LABEL[k]] = k));
    const valores = head.map(t => {
      const k = porTitulo[t];
      if (!k) return "";
      const v = d[k];
      if (v === undefined || v === null) return "";
      if (NUMERICOS.indexOf(k) >= 0 && String(v).trim() !== "" && !isNaN(Number(v))) return Number(v);
      if (k === "dataInicio" || k === "dataFim") return dataBR_(v);
      return String(v);
    });
    sh.getRange(sh.getLastRow() + 1, 1, 1, valores.length).setValues([valores]);
    return json_({ ok: true, pdfUrl: d.pdfUrl || "" });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- PDF no Drive ---------- */
function salvarPdf_(base64, nome) {
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), "application/pdf", nome);
  const arq = pasta_().createFile(blob);
  // link de visualização: qualquer pessoa com o link; se a conta da empresa bloquear, só quem é do domínio
  try { arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (e) { try { arq.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {} }
  return arq.getUrl();
}

function pasta_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("PASTA_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const it = DriveApp.getFoldersByName(PASTA_NOME);
  const p = it.hasNext() ? it.next() : DriveApp.createFolder(PASTA_NOME);
  props.setProperty("PASTA_ID", p.getId());
  return p;
}

/* ---------- planilha ---------- */
function aba_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA);
  if (!sh) {
    sh = ss.insertSheet(ABA, 0);
    sh.getRange(1, 1, 1, COLS.length).setValues([COLS.map(c => c[1])]).setFontWeight("bold")
      .setBackground("#14532d").setFontColor("#ffffff");
    sh.setFrozenRows(1);
    // texto puro nas colunas de texto (preserva placa, horários e datas como digitados)
    KEYS.forEach((k, i) => { if (NUMERICOS.indexOf(k) < 0) sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat("@"); });
    sh.getRange(1, KEYS.indexOf("kmInicial") + 1, sh.getMaxRows(), 3).setNumberFormat("#,##0");
    sh.setColumnWidth(KEYS.indexOf("texto") + 1, 380);
    sh.setColumnWidth(KEYS.indexOf("fatos") + 1, 320);
  } else {
    // acrescenta colunas novas em abas criadas por versões anteriores do script
    const ultima = Math.max(sh.getLastColumn(), 1);
    const head = sh.getRange(1, 1, 1, ultima).getDisplayValues()[0];
    const faltam = COLS.map(c => c[1]).filter(t => head.indexOf(t) < 0);
    if (faltam.length) sh.getRange(1, ultima + 1, 1, faltam.length).setValues([faltam]).setFontWeight("bold")
      .setBackground("#14532d").setFontColor("#ffffff");
  }
  return sh;
}

function ler_() {
  const sh = aba_();
  const v = sh.getDataRange().getValues();
  const head = v.shift() || [];
  const idx = KEYS.map(k => head.indexOf(LABEL[k]));
  return v.filter(l => l[idx[0]]).map(l => {
    const o = {};
    KEYS.forEach((k, i) => {
      let x = idx[i] >= 0 ? l[idx[i]] : "";
      if (x instanceof Date) x = Utilities.formatDate(x, "America/Fortaleza", k === "criadoEm" ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy");
      if (k === "dataInicio" || k === "dataFim") x = iso_(x);
      o[k] = x;
    });
    return o;
  });
}

function dataBR_(iso) {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? m[3] + "/" + m[2] + "/" + m[1] : String(iso);
}

function iso_(br) {
  const m = String(br).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? m[3] + "-" + m[2] + "-" + m[1] : String(br);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

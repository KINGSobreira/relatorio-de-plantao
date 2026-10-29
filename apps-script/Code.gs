/**
 * Relatório de Plantão — Grupo SERVNAC
 * Backend em Google Apps Script: recebe os relatórios do site (GitHub Pages)
 * e grava na planilha Google onde este script está instalado.
 *
 * Aba criada automaticamente:
 *   Relatorios → uma linha por relatório de plantão enviado
 */

const ABA = "Relatorios";

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
  ["texto", "Texto do relatório"]
];
const KEYS = COLS.map(c => c[0]);
const LABELS = COLS.map(c => c[1]);
const NUMERICOS = ["kmInicial", "kmFinal", "kmPercorrido", "postosVisitados", "faltasRegistradas",
  "ocorrenciasQtd", "faltasEfetivo", "reservasInformados"];

/** Rode esta função uma vez pelo editor para criar a aba. */
function setup() {
  aba_();
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
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (body.action !== "addRelatorio") throw new Error("Ação desconhecida.");
    const d = body.data || {};
    ["id", "supervisor", "dataInicio", "horaInicio", "dataFim", "horaFim", "vtr", "placa", "texto"].forEach(c => {
      if (d[c] === undefined || d[c] === null || String(d[c]).trim() === "") throw new Error("Campo obrigatório ausente: " + c);
    });
    const sh = aba_();
    // o mesmo relatório enviado duas vezes (clique duplo, internet instável) não duplica a linha
    if (sh.getLastRow() > 1) {
      const ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getDisplayValues().map(l => l[0]);
      if (ids.indexOf(String(d.id)) >= 0) return json_({ ok: true, duplicado: true });
    }
    d.criadoEm = Utilities.formatDate(new Date(), "America/Fortaleza", "dd/MM/yyyy HH:mm");
    const linha = sh.getLastRow() + 1;
    const valores = KEYS.map(k => {
      const v = d[k];
      if (v === undefined || v === null) return "";
      if (NUMERICOS.indexOf(k) >= 0 && String(v).trim() !== "" && !isNaN(Number(v))) return Number(v);
      if (k === "dataInicio" || k === "dataFim") return dataBR_(v);
      return String(v);
    });
    const rng = sh.getRange(linha, 1, 1, KEYS.length);
    rng.setValues([valores]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- utilitários ---------- */
function aba_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA);
  if (!sh) {
    sh = ss.insertSheet(ABA, 0);
    sh.getRange(1, 1, 1, LABELS.length).setValues([LABELS]).setFontWeight("bold")
      .setBackground("#14532d").setFontColor("#ffffff");
    sh.setFrozenRows(1);
    // texto puro nas colunas de texto (preserva placa, horários e datas como digitados)
    KEYS.forEach((k, i) => { if (NUMERICOS.indexOf(k) < 0) sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat("@"); });
    sh.getRange(1, KEYS.indexOf("kmInicial") + 1, sh.getMaxRows(), 3).setNumberFormat("#,##0");
    sh.setColumnWidth(KEYS.indexOf("texto") + 1, 380);
    sh.setColumnWidth(KEYS.indexOf("fatos") + 1, 320);
  }
  return sh;
}

function ler_() {
  const sh = aba_();
  const v = sh.getDataRange().getValues();
  const head = v.shift() || [];
  const idx = KEYS.map(k => head.indexOf(LABELS[KEYS.indexOf(k)]));
  return v.filter(l => l[0]).map(l => {
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

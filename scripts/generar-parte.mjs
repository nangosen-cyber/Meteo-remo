#!/usr/bin/env node
// Genera el "Parte de la Dársena" del día: consulta las fuentes de viento/mar,
// se lo pasa a la API de Anthropic junto con el modelo de reglas del club,
// y edita index.html con el resultado. Pensado para correr en GitHub Actions
// (tiene internet completo, a diferencia del sandbox de las rutinas en la nube de Claude).

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('Falta la variable de entorno ANTHROPIC_API_KEY (secreto del repo).');
  process.exit(1);
}

const FUENTES = [
  { nombre: 'Tablademareas (viento hora a hora)', url: 'https://www.tablademareas.com/es/valencia/valencia/prevision/viento' },
  { nombre: 'Windfinder Marina Valencia', url: 'https://es.windfinder.com/forecast/marina_valencia' },
  { nombre: 'AEMET municipio Valencia', url: 'https://www.aemet.es/en/eltiempo/prediccion/municipios/valencia-id46250' },
  { nombre: 'AEMET marítima val1', url: 'https://www.aemet.es/es/eltiempo/prediccion/maritima?area=val1' },
];

async function fetchTexto(url) {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const html = await res.text();
    const texto = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 20000);
    return { ok: true, texto };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

const hoy = new Date();
const fechaISO = hoy.toISOString().slice(0, 10);
const fechaLarga = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid',
}).format(hoy);

const modelo = await readFile(path.join(ROOT, 'modelo-prediccion-remo.md'), 'utf8');
const htmlActual = await readFile(path.join(ROOT, 'index.html'), 'utf8');

console.log(`Generando parte para ${fechaLarga} (${fechaISO})`);

const datosFuentes = [];
for (const f of FUENTES) {
  console.log(`Consultando: ${f.nombre}...`);
  const r = await fetchTexto(f.url);
  console.log(r.ok ? `  ok (${r.texto.length} chars)` : `  fallo: ${r.error}`);
  datosFuentes.push({ ...f, ...r });
}

const bloqueFuentes = datosFuentes
  .map((f) => `--- ${f.nombre} (${f.url}) ---\n${f.ok ? f.texto : `[FALLÓ: ${f.error}]`}`)
  .join('\n\n');

const prompt = `Eres el sistema que genera el "Parte de la Dársena" para la Escuela de Remo FRCV (Marina Real Juan Carlos I, Valencia). Hoy es ${fechaLarga} (${fechaISO}). Esto es un experimento personal de Nando, sin relación oficial con el club.

Aquí tienes el modelo de reglas completo (nomenclatura de viento del club, escalas de intensidad, expresiones temporales, lógica de decisión, formato exacto del boletín de WhatsApp):

${modelo}

Aquí tienes el texto extraído HOY de las fuentes de datos (algunas pueden haber fallado; usa solo las que respondieron; si Windguru no aparece en la lista es porque nunca se intenta, es una página JavaScript que no carga con una petición simple):

${bloqueFuentes}

IMPORTANTE: revisa las páginas de AEMET buscando CUALQUIER tipo de alerta activa (calor, lluvia, tormenta, viento, costera, nieve...), no solo temperatura — el 16/09/2026 el sistema falló precisamente por mirar solo alertas de calor y no detectar una alerta naranja de lluvia + amarilla de tormenta. Aplica la lógica de decisión del modelo en este orden: alerta de calor > alerta de lluvia/tormenta/otro fenómeno (sección 6b del modelo) > alerta marítima > alerta de viento > criterio fino agua/dársena/tierra. Ante cualquier alerta naranja o roja de cualquier tipo que no sepas encajar en las reglas exactas, menciónala igualmente en "datos_usados" y aplica el criterio más conservador (tendiendo a SUSPENDIDO o PARCIAL) antes que ignorarla.

MUY IMPORTANTE — SUSPENDIDO vs PARCIAL (añadido el 16/09/2026, corrección de un fallo real): si la suspensión/alerta empieza a una hora concreta (ej. "desde las 14h") y la franja anterior del día no tiene ningún problema, usa "PARCIAL", NUNCA "SUSPENDIDO". Con "PARCIAL" el boletín empieza igual que un día normal (datos de viento/mar de la mañana, "Entrenamiento en el agua durante la mañana") y AÑADE la alerta como excepción para la tarde, usando la plantilla "Día con alerta que solo afecta a PARTE de la jornada" del modelo (sección 7). Reserva "SUSPENDIDO" (todo el boletín es el aviso de cancelación, sin datos de viento) solo para cuando la suspensión aplica desde primera hora o todo el día entero.

Redacta el boletín exactamente en el formato del modelo. Usa siempre los nombres locales de viento del club (Tramuntana, Gregal, Llevant, Garbí, Migjorn, Llebeig, Ponent, Mistral), nunca grados.

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin texto antes o después) con esta forma exacta:
{
  "fecha_visible": "Lunes, 14 de septiembre de 2026",
  "decision": "AGUA",
  "color_token": "green",
  "resumen_corto": "Ponent flojo a primera hora → Garbí moderado desde mediodía",
  "boletin_texto": "PREVISIÓN METEOROLÓGICA DEL lunes 14 de septiembre\\n\\nBuenas días!\\n\\n...",
  "datos_usados": [
    {"etiqueta": "Viento AM", "valor": "..."},
    {"etiqueta": "Viento PM", "valor": "..."},
    {"etiqueta": "Estado del mar", "valor": "..."},
    {"etiqueta": "Alerta AEMET", "valor": "..."},
    {"etiqueta": "Fuentes", "valor": "..."}
  ]
}
"decision" debe ser exactamente uno de: AGUA, DARSENA, TIERRA, SUSPENDIDO, PARCIAL. "color_token" debe ser exactamente uno de: green (para AGUA), amber (para DARSENA), coral (para TIERRA, SUSPENDIDO o PARCIAL). Añade una fila {"etiqueta":"Sin acceso","valor":"..."} en datos_usados solo si alguna fuente falló.`;

async function llamarClaude() {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Error de la API de Anthropic: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  console.log('stop_reason:', data.stop_reason, '- bloques de contenido:', (data.content || []).map((b) => b.type).join(', '));

  // El modelo puede devolver bloques de "thinking" antes del bloque de texto final:
  // nos quedamos solo con los bloques de tipo "text" concatenados.
  const textoRespuesta = (data.content || [])
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('');

  const jsonMatch = textoRespuesta.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : textoRespuesta); // lanza si no es JSON valido
}

// El modelo a veces consume todo el presupuesto de tokens "pensando" antes de
// escribir la respuesta (variable de una ejecucion a otra) y se queda sin
// texto que devolver. Con 16000 de margen debería ser raro, pero por si acaso
// reintentamos una vez antes de rendirnos.
let parte;
try {
  parte = await llamarClaude();
} catch (e) {
  console.error('Primer intento fallido:', e.message || e);
  console.log('Reintentando una vez más...');
  try {
    parte = await llamarClaude();
  } catch (e2) {
    console.error('Segundo intento también fallido:', e2.message || e2);
    process.exit(1);
  }
}

console.log('Decisión de hoy:', parte.decision, '-', parte.resumen_corto);

let html = htmlActual;

html = html.replace(
  /(<p class="fecha">)([\s\S]*?)(<\/p>)/,
  `$1${parte.fecha_visible}$3`,
);

html = html.replace(
  /<div class="status-word"[^>]*>[\s\S]*?<\/div>/,
  `<div class="status-word" style="color:var(--${parte.color_token})">${parte.decision}</div>`,
);

html = html.replace(
  /<div class="status-flag"[^>]*><\/div>/,
  `<div class="status-flag" style="background:var(--${parte.color_token})"></div>`,
);

html = html.replace(
  /(<div class="status-sub">)([\s\S]*?)(<\/div>)/,
  `$1${parte.resumen_corto}$3`,
);

// Las ejecuciones automáticas no muestran el "✓ acierto": eso se añade a mano tras comparar.
html = html.replace(/\s*<div class="badge">[\s\S]*?<\/div>/, '');

html = html.replace(
  /(<p class="bulletin" id="bulletinText">)([\s\S]*?)(<\/p>)/,
  `$1${parte.boletin_texto}$3`,
);

const filasDatos = (parte.datos_usados || [])
  .map((d) => `      <div><dt>${d.etiqueta}</dt><dd>${d.valor}</dd></div>`)
  .join('\n');
html = html.replace(
  /(<dl class="datos">)([\s\S]*?)(<\/dl>)/,
  `$1\n${filasDatos}\n    $3`,
);

await writeFile(path.join(ROOT, 'index.html'), html, 'utf8');
console.log('index.html actualizado correctamente.');

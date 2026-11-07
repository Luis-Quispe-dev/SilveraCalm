/* =========================================================
   SilveraCalm — Worker de Cloudflare
   - Sirve la landing (archivos estáticos) tal como antes.
   - Agrega la ruta POST /api/chat para el chatbot Silvio,
     usando Workers AI (incluido gratis en Cloudflare).
   La API key NO existe: Cloudflare conecta la IA por "binding",
   así que nadie puede robarla desde el navegador.
   ========================================================= */
import { SYSTEM_PROMPT } from './knowledge.js';

// Modelos en orden de preferencia (todos del plan gratis y SIN modo "pensamiento",
// que era lo que cortaba o vaciaba las respuestas con Gemma 4).
// Si uno falla o responde vacío, se prueba el siguiente.
const MODELS = [
  '@cf/meta/llama-4-scout-17b-16e-instruct', // mejor calidad en español
  '@cf/google/gemma-3-12b-it',               // respaldo económico
  '@cf/meta/llama-3.1-8b-instruct-fast'      // último recurso
];

const MAX_HISTORY = 8;          // mensajes previos que se envían a la IA
const MAX_CHARS = 600;          // largo máximo de cada mensaje del usuario
const MAX_TOKENS = 700;         // margen amplio: el prompt ya pide respuestas cortas
const RATE_LIMIT = 20;          // mensajes por IP...
const RATE_WINDOW_MS = 10 * 60 * 1000; // ...cada 10 minutos

const hits = new Map(); // límite simple por IP (por servidor de Cloudflare)

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  rec.count++;
  return rec.count > RATE_LIMIT;
}

function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
      .filter(m => m.content)
      .slice(-MAX_HISTORY);
  // la conversación debe empezar y terminar con el usuario
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return null;
  return msgs;
}

function extractText(res) {
  if (!res) return { text: '', cut: false };
  let t = '', finish = '';
  if (typeof res === 'string') t = res;
  else if (typeof res.response === 'string') t = res.response;
  else if (res.choices && res.choices[0]) {
    const c = res.choices[0];
    t = (c.message && c.message.content) || c.text || '';
    finish = c.finish_reason || '';
  } else if (res.result && typeof res.result.response === 'string') t = res.result.response;

  // Quitar cualquier "razonamiento" que el modelo haya dejado en el texto
  t = String(t)
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<\|channel\|?>thought[\s\S]*?<\\?channel\|>/gi, '')
      .replace(/<\|?\/?(channel|turn|start_of_turn|end_of_turn)[^>]*>/gi, '')
      .trim();

  const cut = finish === 'length' || (res.usage && res.usage.completion_tokens >= MAX_TOKENS);
  return { text: t, cut };
}

// Si la respuesta quedó cortada, la recorta hasta la última frase completa
function trimToSentence(t) {
  const m = t.match(/^[\s\S]*[.!?…)\]🦉🌿](?=\s|$)/u);
  return m && m[0].length > t.length * 0.4 ? m[0].trim() : t.trim() + '…';
}

async function askAI(env, model, messages) {
  const res = await env.AI.run(model, {
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    max_tokens: MAX_TOKENS,
    temperature: 0.4
  });
  const { text, cut } = extractText(res);
  if (!text) {
    console.log('Respuesta vacía de', model, JSON.stringify(res).slice(0, 400));
    throw new Error('Respuesta vacía');
  }
  return cut ? trimToSentence(text) : text;
}

async function handleChat(request, env) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  // Solo aceptamos peticiones desde tu propia página
  const origin = request.headers.get('Origin');
  const host = new URL(request.url).host;
  if (origin) {
    const oHost = new URL(origin).host;
    if (oHost !== host && !oHost.startsWith('localhost') && !oHost.startsWith('127.0.0.1')) {
      return json({ error: 'Origen no permitido' }, 403);
    }
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'anon';
  if (rateLimited(ip)) {
    return json({ reply: 'Has enviado muchos mensajes seguidos 🦉. Dame unos minutos para tomar aire y seguimos conversando.' }, 429);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'JSON inválido' }, 400); }
  const messages = cleanMessages(body && body.messages);
  if (!messages) return json({ error: 'Mensaje vacío' }, 400);

  try {
    let reply = '', lastError;
    for (const model of MODELS) {
      try {
        reply = await askAI(env, model, messages);
        break;
      } catch (e) {
        lastError = e;
        console.log('Falló', model, '→', e && e.message);
        if (/limit|quota|neuron|4006/i.test(String(e && e.message))) break; // sin cupo: no sirve probar otro
      }
    }
    if (!reply) throw lastError || new Error('Sin respuesta');
    return json({ reply });
  } catch (e) {
    console.log('Error de IA:', e && e.message);
    const quota = /limit|quota|neuron|429|4006/i.test(String(e && e.message));
    return json({
      reply: quota
          ? 'Hoy conversé con muchas familias y necesito descansar hasta mañana 🌿. Mientras tanto, puedes hacer el Test de Tranquilidad Familiar.\n[[TEST]]'
          : 'Tuve un problema para responderte. ¿Lo intentamos de nuevo en un momento?'
    }, 503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/chat') return handleChat(request, env);
    // Todo lo demás: la landing de siempre
    return env.ASSETS.fetch(request);
  }
};
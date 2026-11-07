/* =========================================================
   SilveraCalm — Worker de Cloudflare
   - Sirve la landing (archivos estáticos) tal como antes.
   - Agrega la ruta POST /api/chat para el chatbot Silvio,
     usando Workers AI (incluido gratis en Cloudflare).
   La API key NO existe: Cloudflare conecta la IA por "binding",
   así que nadie puede robarla desde el navegador.
   ========================================================= */
import { SYSTEM_PROMPT } from './knowledge.js';

// Modelo principal y de respaldo (ambos disponibles en el plan gratis)
const MODEL = '@cf/google/gemma-4-26b-a4b-it';
const FALLBACK_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';

const MAX_HISTORY = 8;          // mensajes previos que se envían a la IA
const MAX_CHARS = 600;          // largo máximo de cada mensaje del usuario
const MAX_TOKENS = 380;         // largo máximo de la respuesta
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
  if (!res) return '';
  let t = '';
  if (typeof res === 'string') t = res;
  else if (typeof res.response === 'string') t = res.response;
  else if (res.choices && res.choices[0]) {
    const c = res.choices[0];
    t = (c.message && c.message.content) || c.text || '';
  } else if (res.result && typeof res.result.response === 'string') t = res.result.response;
  // algunos modelos devuelven su "razonamiento": lo quitamos
  return String(t).replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

async function askAI(env, model, messages) {
  const res = await env.AI.run(model, {
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    max_tokens: MAX_TOKENS,
    temperature: 0.4
  });
  return extractText(res);
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
    let reply = '';
    try {
      reply = await askAI(env, MODEL, messages);
    } catch (e) {
      console.log('Modelo principal falló, usando respaldo:', e && e.message);
      reply = await askAI(env, FALLBACK_MODEL, messages);
    }
    if (!reply) throw new Error('Respuesta vacía');
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

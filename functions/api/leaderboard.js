function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

function cleanName(value) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 18);
}

export async function onRequestGet({ env }) {
  if (!env.DB) {
    return json({ error: "Base de données non configurée." }, 503);
  }

  try {
    const result = await env.DB.prepare(
      "SELECT name, score, created_at FROM scores ORDER BY score DESC, id ASC LIMIT 10"
    ).all();

    return json({ scores: result.results || [] });
  } catch (error) {
    return json({ error: "Impossible de charger le classement." }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: "Base de données non configurée." }, 503);
  }

  try {
    const body = await request.json();

    const name = cleanName(body.name) || "Chamois";
    const score = Number(body.score);

    if (!Number.isInteger(score) || score < 1 || score > 100000000) {
      return json({ error: "Score invalide." }, 400);
    }

    await env.DB.prepare(
      "INSERT INTO scores (name, score) VALUES (?, ?)"
    ).bind(name, score).run();

    const result = await env.DB.prepare(
      "SELECT name, score, created_at FROM scores ORDER BY score DESC, id ASC LIMIT 10"
    ).all();

    return json({ scores: result.results || [] }, 201);
  } catch (error) {
    return json({ error: "Impossible d'enregistrer le score." }, 500);
  }
}

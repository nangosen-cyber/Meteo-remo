// Intermediario en Vercel: recibe un simple GET (sin cabeceras ni tokens)
// desde el servicio de cron externo, y desde aquí dentro (con acceso completo
// a internet y sin bloqueos de proveedores "cron gratis") hace la llamada
// autenticada real a GitHub para disparar el workflow de Meteo-remo.
//
// Variables de entorno necesarias en Vercel (Project Settings → Environment Variables):
//   GITHUB_TOKEN   - fine-grained PAT con permiso "Actions: Read and write" sobre Meteo-remo
//   TRIGGER_SECRET - una contraseña cualquiera inventada por ti, para que nadie más pueda
//                    disparar esto solo con adivinar la URL

module.exports = async (req, res) => {
  const secret = req.query.key;

  if (!process.env.TRIGGER_SECRET || secret !== process.env.TRIGGER_SECRET) {
    res.status(403).send('Forbidden: falta o no coincide ?key=');
    return;
  }

  if (!process.env.GITHUB_TOKEN) {
    res.status(500).send('Falta configurar GITHUB_TOKEN en las variables de entorno de Vercel');
    return;
  }

  try {
    const r = await fetch(
      'https://api.github.com/repos/nangosen-cyber/Meteo-remo/actions/workflows/parte-darsena.yml/dispatches',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'meteo-remo-vercel-trigger',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    );

    if (r.status === 204) {
      res.status(200).send('OK: workflow disparado en GitHub correctamente.');
    } else {
      const text = await r.text();
      res.status(502).send(`Error de GitHub (HTTP ${r.status}): ${text}`);
    }
  } catch (e) {
    res.status(500).send('Error al llamar a GitHub: ' + (e && e.message ? e.message : String(e)));
  }
};

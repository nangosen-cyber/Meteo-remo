# Parte de la Dársena

Experimento personal de Nando (sin relación oficial con el club) para la Escuela de Remo FRCV (Marina Real Juan Carlos I, Valencia): una IA lee las mismas fuentes de viento y mar que usa la escuela, traduce la dirección a los nombres locales del club (Tramuntana, Gregal, Llevant, Garbí, Migjorn, Llebeig, Ponent, Mistral) y redacta el parte del día en el mismo formato que el aviso de WhatsApp del club.

Validado a mano contra el aviso real del club durante julio de 2026, con 8 de 8 aciertos en la decisión de entrenamiento (agua / suspensión).

## Cómo funciona

Cada día a las 06:10h (hora de Madrid), un GitHub Action:

1. Consulta las webs de viento y mar (Tablademareas, Windfinder, AEMET).
2. Envía ese texto junto con las reglas del club (`modelo-prediccion-remo.md`) a la API de Anthropic (modelo Claude Sonnet 5), que redacta el boletín del día.
3. Actualiza `index.html` con el resultado y lo publica.

`index.html` se sirve como página estática con GitHub Pages — la URL no cambia nunca.

No usa base de datos ni backend propio: todo el estado es el propio `index.html` versionado en este repositorio.

## Archivos

- `modelo-prediccion-remo.md` — las reglas del club (nomenclatura de viento, escalas, lógica de decisión, formato del boletín).
- `index.html` — la página publicada (se regenera sola cada mañana).
- `scripts/generar-parte.mjs` — el script que hace el trabajo (sin dependencias externas, solo Node 20+).
- `.github/workflows/parte-darsena.yml` — la tarea programada.

## Configuración (una sola vez)

1. **Secreto del repo**: en *Settings → Secrets and variables → Actions → New repository secret*, crear `ANTHROPIC_API_KEY` con una clave de [console.anthropic.com](https://console.anthropic.com/settings/keys).
2. **GitHub Pages**: en *Settings → Pages → Source*, elegir "Deploy from a branch" → rama `main` → carpeta `/ (root)`.
3. **Probar a mano**: pestaña *Actions* → "Parte de la Dársena - previsión diaria" → *Run workflow*, para lanzarlo sin esperar a las 06:10h.

## Nota sobre por qué existe este repo

Las rutinas en la nube de Claude Code no pueden acceder a la web abierta (solo a un puñado de dominios de infraestructura), así que la consulta a las fuentes de viento/mar tiene que hacerse desde un entorno con internet completo — GitHub Actions lo tiene y es gratuito para repos públicos.

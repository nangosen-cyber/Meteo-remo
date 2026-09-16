https://nangosen-cyber.github.io/Meteo-remo/

# Modelo de Predicción Meteorológica — Escuela de Remo FRCV
**Dársena interior / Marina Real Juan Carlos I / Puerto de Valencia**
*Experimento de Nando (nangosen@gmail.com) para comparar con el aviso real del club*

---

## 1. OBJETIVO

Replicar el aviso meteorológico diario que la Escuela de Remo FRCV publica cada mañana por WhatsApp. El output es un **borrador de Gmail** (no se envía a nadie más) para que Nando lo compare con el aviso real del club.

---

## 2. FUENTES DE DATOS (por orden de prioridad)

| Fuente | Variable | Estado |
|--------|----------|--------|
| **Windguru La Patacona** (windguru.cz/48864) | Viento principal | ⚠️ No carga con web_fetch (JavaScript) |
| **Tablademareas.com** (tablademareas.com/es/valencia/valencia/prevision/viento) | Viento hora a hora | ✅ Carga bien |
| **Windfinder Marina Valencia** (es.windfinder.com/forecast/marina_valencia) | Viento + olas (Hs) | ✅ Carga bien |
| **AEMET municipio Valencia** (aemet.es/en/eltiempo/prediccion/municipios/valencia-id46250) | Temp máx + alertas litoral norte (774602) | ✅ Carga bien |
| **AEMET marítima val1** (aemet.es/es/eltiempo/prediccion/maritima?area=val1) | Predicción costera | ⚠️ No siempre accesible |

**Si Windguru no carga:** usar Tablademareas como primera alternativa y Windfinder como segunda. Ambas son suficientes.

---

## 3. ROSA DELS VENTS — NOMENCLATURA DEL CLUB

El club usa nombres mediterráneos locales, nunca grados ni "componente X".

| Nombre | Dirección | Notas |
|--------|-----------|-------|
| **Tramuntana** | N / NNE (315°-360° / 0°-30°) | Viento del norte. Perfil predominante N/NNE en horas matinales. |
| **Gregal** | NE / NNE (30°-60°) | Viento del noreste, más seco que Levante. |
| **Levante (Llevant)** | E / ENE (60°-100°) | Brisa marina clásica del este. Solo E/ENE puro. |
| **Garbí / Xaloc** | ESE / SE (100°-160°) | El club llama Garbí al ESE/SE. NO confundir con Levante. |
| **Migjorn** | S / SSE (160°-200°) | Viento del sur, poco frecuente. |
| **Llebeig** | SW / WSW (200°-240°) | Cálido y húmedo, poco frecuente. |
| **Ponent / Poniente** | W / WNW / NW (240°-315°) | Terral seco. El club llama Poniente también al NW. |
| **Mistral** | NNW predominante (~330°-350°) | Distinto de Tramuntana pura y de Poniente. Solo cuando el perfil matinal es NNW dominante. |

### Reglas críticas de nomenclatura (validadas con mensajes reales)
- **NW en verano = Poniente** (no Mestral). Confirmado 27/07/2026.
- **NNW predominante = Mistral** (no Tramuntana, no Poniente). Confirmado 29/07/2026.
- **ESE = Garbí** (no Levante). Levante es solo E/ENE puro. Confirmado 27 y 28/07/2026.
- **N/NNE = Tramuntana**. Confirmado 24 y 28/07/2026.

### Criterio práctico Tramuntana vs Mistral
- Mayoría de horas matinales (00-09h) en NNW o mezcla NNW/NW → **Mistral**
- Mayoría en N/NNE puros → **Tramuntana**

---

## 4. ESCALA DE INTENSIDADES DEL CLUB

| Término | Rango |
|---------|-------|
| Flojo / Suave | < 10 kts (el club usa "flojo" para <5 kts aprox.) |
| Moderado | 10–13 kts |
| Moderado a fuerte | 13–16 kts (el club reserva este término para el Garbí a partir de ~13 kts) |
| Fuerte | > 16 kts |

> ⚠️ Con 11-12 kts el club dice "moderado", no "moderado a fuerte". Confirmado 29/07/2026.
> ⚠️ El umbral de "moderado a fuerte" para Garbí está más cerca de 13 kts que de 12 kts.

---

## 5. EXPRESIONES TEMPORALES DEL CLUB

| Hora de entrada del viento secundario | Expresión |
|---------------------------------------|-----------|
| ~09-11h | "a partir de mitad mañana" |
| ~12-13h | "a partir de mediodía" |
| ~14h+ | "a partir de la tarde" |
| Garbí que baja claramente al final del día (≥40% de caída entre 17h-20h) | "bajará de intensidad a última hora de la tarde" |
| Garbí que se mantiene estable hasta el final | "hasta el final de la jornada" |

---

## 6. DECISIÓN DE ENTRENAMIENTO (aplicar en este orden)

### a) Alerta por ALTAS TEMPERATURAS (temperatura máxima litoral norte)
- **Amarillo** ≥36°C y <39°C → sin suspensión. Mencionar SOLO si afecta al litoral norte directamente (no sur ni interior).
- **Naranja** ≥39°C y <42°C → **SE SUSPENDE** el entrenamiento exterior.
  - Hora inicio: la que indique AEMET (o 11:00 si AEMET empieza antes o no especifica).
  - Hora fin: 19:00 salvo que AEMET indique otro.
- **Rojo** ≥42°C → **SE SUSPENDE** toda actividad física.

### b) Alerta por LLUVIA / TORMENTA / CUALQUIER OTRO FENÓMENO ADVERSO (no solo calor)
⚠️ **Añadido el 16/09/2026 tras un fallo real**: el modelo original solo miraba alertas de calor porque toda la validación de julio fue en pleno verano. El 16/09/2026 hubo alerta naranja por lluvias + amarilla por tormentas desde las 16h y el sistema no la detectó ni la mencionó — falló silenciosamente.

**Regla explícita conocida** (criterio del Centro de Coordinación de Emergencias de la Generalitat Valenciana, Guía de recomendaciones a los ayuntamientos para la toma de decisiones preventivas ante fenómenos meteorológicos adversos):
- Alerta **naranja por lluvias** + alerta **amarilla por tormentas** activas el mismo día → **SE SUSPENDE toda actividad al aire libre desde las 14:00h**, aunque la alerta de AEMET indique una hora de inicio posterior (ej. 16h) — la suspensión de la Generalitat es preventiva y empieza antes.

**Regla general (para combinaciones no vistas todavía)**: en la página de AEMET (municipio Valencia y marítima val1) buscar SIEMPRE, no solo temperatura, cualquier aviso activo de: lluvia, tormenta, viento, nieve, costero, o cualquier otro fenómeno, y su nivel (amarillo/naranja/rojo). Si aparece cualquier alerta naranja o roja de cualquier tipo (no solo calor o marítima), tratarla como posible causa de suspensión: mencionarla siempre en el bloque "Datos usados" aunque no se esté seguro de si aplica suspensión, y aplicar el criterio más conservador (suspender) si hay dos o más alertas simultáneas de nivel naranja/amarillo de fenómenos distintos, tal como pasó el 16/09. Ante la duda, es preferible que Nando revise y corrija a que el sistema calle una alerta real.

**Importante — cuándo es suspensión TOTAL y cuándo es PARCIAL:** si la alerta/suspensión empieza a una hora concreta del día (ej. "desde las 14h") y la franja anterior no tiene ningún problema, la decisión es `PARCIAL`, no `SUSPENDIDO`: el boletín debe dar primero la información normal de la mañana (viento, entrenamiento en el agua) y añadir la alerta como excepción para la tarde — ver la plantilla "Día con alerta que solo afecta a PARTE de la jornada" en la sección 7. `SUSPENDIDO` (todo el boletín es el aviso de cancelación, sin datos de viento) se reserva para cuando la suspensión aplica desde primera hora de la mañana o todo el día.

### c) Alerta marítima (litoral norte, código 774602)
- Naranja → suspensión. Rojo → suspensión total. Amarillo → sin suspensión, precaución.

### d) Alerta de viento
- Racha ≥90 km/h (naranja) → suspensión al aire libre.
- Racha ≥130 km/h (rojo) → suspensión total.

### e) Criterio fino agua / dársena / tierra (si no hay alertas)

**Viento:**
- Suave: <10 kts
- Moderado: 10-16 kts
- Fuerte: 17-21 kts
- Temporal: >21 kts o rachas >25 kts

**Mar — Hs boya Valencia:**
- Hs <0.5m → agua
- Hs 0.5-1.25m → dársena
- Hs >1.25m → tierra

---

## 7. FORMATO DEL TEXTO WHATSAPP

### Día normal (sin suspensión)

```
PREVISIÓN METEREOLÓGICA DEL [día] [fecha]

Buenas días!

[Nombre viento local] [intensidad] [durante/a primera hora]; [segundo viento] [intensidad] a partir de [expresión temporal][, y que bajará de intensidad a última hora de la tarde / hasta el final de la jornada].

Entrenamiento en el agua.

No os olvideis traer algún tipo de protección solar y agua a los entrenamientos.

Cualquier actualización se realizará por los medios habituales (WhatsApp, Wodbuster)
```

### Día con suspensión por calor (naranja)

```
PREVISIÓN METEREOLÓGICA DEL [día] [fecha]

Buenas días!

⚠️ La AEMET activa la ALERTA NARANJA por ALTAS TEMPERATURAS a partir de las [hora AEMET] ⚠️

Debido a esta alerta por ola de calor activada también por la Fundación Deportiva Municipal, nos vemos obligados a paralizar las clases a partir de esa hora.

Las clases dentro de ese horario no contarán como realizadas y os podréis apuntar en otros horarios durante el mes.

Cualquier actualización se realizará por los medios habituales (WhatsApp, Wodbuster)

Gracias!
```

### Día con alerta que solo afecta a PARTE de la jornada (ej. una alerta que empieza a las 14h/16h y la mañana es normal)
⚠️ **Añadido el 16/09/2026**: si la suspensión no cubre todo el día (por ejemplo, una alerta de lluvia/tormenta desde las 14h pero la mañana no tiene ningún problema), **NO** se sustituye todo el boletín por el aviso de suspensión. Se empieza igual que un día normal (con la información de viento/mar de la mañana, para que las clases que sí hay puedan hacerse con normalidad) y **se añade la alerta como excepción**, dejando claro a partir de qué hora se anula la actividad. En este caso `decision` es `"PARCIAL"` y `color_token` es `"coral"` (llama la atención sin decir que todo el día está cancelado).

```
PREVISIÓN METEOROLÓGICA DEL [día] [fecha]

Buenas días!

[Nombre viento local] [intensidad] a primera hora; [segundo viento] [intensidad] a partir de [expresión temporal].

Entrenamiento en el agua durante la mañana.

⚠️ La AEMET activa la ALERTA [NIVEL] por [FENÓMENO, ej. LLUVIAS] y la ALERTA [NIVEL] por [FENÓMENO, ej. TORMENTAS] a partir de las [hora AEMET] ⚠️

Siguiendo las recomendaciones del Centro de Coordinación de Emergencias de la Generalitat Valenciana, se suspende toda actividad al aire libre a partir de las [hora de suspensión].

Las clases de la tarde dentro de ese horario no contarán como realizadas y os podréis apuntar en otros horarios durante el mes.

No os olvideis traer algún tipo de protección solar y agua a los entrenamientos de la mañana.

Cualquier actualización se realizará por los medios habituales (WhatsApp, Wodbuster)
```

### Reglas de estilo
- Separar viento de primera hora y evolución con **punto y coma (;)**
- Usar siempre nombres locales de viento (nunca grados ni "componente")
- Máximo 2-4 emojis, solo donde aporten
- Alerta amarilla: omitir del WhatsApp si no afecta directamente al litoral norte
- Alerta naranja/roja: siempre con todos los detalles

---

## 8. ESTRUCTURA DEL BORRADOR DE GMAIL

- **Asunto:** `Previsión remo Valencia - [fecha de hoy]`
- **Cuerpo:** texto WhatsApp completo
- **Separador:** `---`
- **Bloque de datos:** `DATOS USADOS (para comparar)` con viento hora a hora, Hs, temperatura máxima, nivel de alerta AEMET, fuentes consultadas y limitaciones de acceso
- **Destinatario:** nangosen@gmail.com
- **Acción:** `create_draft` — NO enviar

---

## 9. HISTORIAL DE VALIDACIONES

| Fecha | Alerta AEMET | Decisión club real | Decisión IA | Acierto | Lecciones |
|-------|-------------|-------------------|-------------|---------|-----------|
| 07/07/2026 | Naranja calor | Suspensión 11:00-19:00 | Suspensión | ✅ | — |
| 08/07/2026 | Naranja calor | Suspensión 11:00-19:00 | Suspensión | ✅ | — |
| 23/07/2026 | Naranja calor (≥12h) | Suspensión "a partir de las 12" | Suspensión | ✅ | Hora: IA 13h, real 12h |
| 24/07/2026 | Sin alerta relevante | Agua — Tramuntana + Levante | Agua | ✅ | IA dijo Levante+Garbí en lugar de Tramuntana+Levante; alerta amarilla incluida innecesariamente |
| 27/07/2026 | Sin alerta relevante | Agua — Poniente suave + Garbí moderado a fuerte (desde mediodía) | Agua | ✅ | IA dijo Mestral+Levante → corregido a Poniente+Garbí; NW = Poniente |
| 28/07/2026 | Sin alerta relevante | Agua — Tramuntana suave + Garbí moderado a fuerte (desde mitad mañana, hasta final jornada) | Agua | ✅ | Timing "mitad mañana" ~10-11h; N/NNE = Tramuntana |
| 29/07/2026 | Sin alerta relevante | Agua — Mistral suave + Garbí moderado (desde mitad mañana, hasta final jornada) | Agua | ✅ | NNW dominante = Mistral; 11-12 kts Garbí = "moderado" (no "moderado a fuerte") |
| 14/09/2026 | Sin alerta | Agua — Poniente flojo + Garbí moderado (desde mediodía, baja intensidad última tarde) | Agua | ✅ | "Flojo" para <5 kts (vs "suave"); el club matiza bajada de intensidad al final si Windfinder la muestra (≥40% de caída 17h-20h) |
| 16/09/2026 | Naranja lluvia + amarilla tormenta (desde 16h) | Suspensión desde las 14h (criterio Generalitat) | Agua (❌ no detectó la alerta) | ❌ | Corregido a mano por Nando. El sistema solo miraba alertas de calor/marítima/viento — nunca lluvia/tormenta. Ver sección 6b. |

---

## 10. LECCIONES ACUMULADAS

1. **"Flojo" vs "suave":** el club usa "flojo" cuando la intensidad es muy baja (<5 kts). Usar "flojo" en esos casos.
2. **NW = Poniente** siempre (no Mestral). Confirmado varias veces.
3. **NNW predominante = Mistral**, no Tramuntana ni Poniente.
4. **ESE = Garbí**, no Levante. Levante es solo E/ENE puro.
5. **"Moderado a fuerte" para Garbí** solo a partir de ~13 kts; con 11-12 kts usar solo "moderado".
6. **Alerta amarilla por calor:** omitir del WhatsApp si no afecta directamente al litoral norte.
7. **Evolución del Garbí al final del día:** si Windfinder muestra caída ≥40% entre 17h-20h, añadir "bajará de intensidad a última hora de la tarde" en lugar de "hasta el final de la jornada".
8. **Timing "mitad mañana":** entrada del viento secundario a las ~10-11h.
9. **Windguru no carga con web_fetch** (JavaScript). Usar tablademareas + Windfinder como sustitutos habituales.
10. **AEMET litoral norte Valencia = código 774602.** Verificar siempre en aemet.es/en/eltiempo/prediccion/municipios/valencia-id46250 (campo "Warnings. Litoral norte de Valencia").
11. **No solo alertas de calor.** El 16/09/2026 hubo alerta naranja de lluvia + amarilla de tormenta que el sistema no vio porque solo comprobaba temperatura. Revisar SIEMPRE cualquier tipo de alerta activa en AEMET (lluvia, tormenta, viento, costera, nieve...), no solo calor. Ver regla 6b.
12. **Criterio de la Generalitat puede ser más estricto y más preventivo que el de AEMET.** Una combinación de alertas (ej. naranja lluvia + amarilla tormenta) puede implicar suspensión desde una hora *anterior* a la que indica el propio aviso de AEMET, según la Guía de recomendaciones a los ayuntamientos del Centro de Coordinación de Emergencias de la Generalitat Valenciana.

---

*Última actualización: 14 de septiembre de 2026*

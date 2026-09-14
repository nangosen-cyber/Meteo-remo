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

### b) Alerta marítima (litoral norte, código 774602)
- Naranja → suspensión. Rojo → suspensión total. Amarillo → sin suspensión, precaución.

### c) Alerta de viento
- Racha ≥90 km/h (naranja) → suspensión al aire libre.
- Racha ≥130 km/h (rojo) → suspensión total.

### d) Criterio fino agua / dársena / tierra (si no hay alertas)

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

---

*Última actualización: 14 de septiembre de 2026*

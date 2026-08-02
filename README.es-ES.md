

# Puntuación del Algoritmo de X

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/affaan-m/x-algorithm-score/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest_V3-yellow.svg)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

Una extensión de Chrome que puntúa tus tweets **antes de publicarlos**, basándose en el algoritmo de recomendación de código abierto de X. Obtén una puntuación de 0 a 100, una calificación por letra (S a F), sugerencias accionables y alcance previsto, todo en tiempo real mientras escribes.

---

## Características

### Puntuación en página (Script de contenido)
- **Superposición de puntuación en vivo** en x.com: aparece una insignia flotante mientras redactas tweets
- **Haz clic para expandir** en un panel completo con tres pestañas: Sugerencias, Desglose, Factores del algoritmo
- **Detecta automáticamente** los medios adjuntos (imágenes, videos, GIFs, encuestas) y ajusta la puntuación en consecuencia
- **Detección de respuestas/citas**: sabe si estás respondiendo o publicando algo nuevo

### Popup (Icono de la barra de herramientas)
- **Pestaña de prueba**: puntúa cualquier texto de tweet sin conexión sin navegar a x.com
- **Pestaña de aprendizaje**: 8 tarjetas de insights del algoritmo que cubren el valor de las respuestas (¡75x!), impulso de video, penalizaciones de enlaces, tiempo de permanencia y más
- **Pestaña de configuración**: configura la clave API de Claude para análisis con IA, activa/desactiva la superposición, establece el umbral de alerta de puntuación

### Motor de puntuación
- **Desglose de 5 componentes**: Contenido (0-25), Medios (0-20), Momento (0-15), Interacción (0-20), Riesgo (penalización de 0-30)
- **Detección de plantillas**: marca formatos sobreutilizados ("gm", "opinión impopular", "día X de...")
- **Análisis de sentimiento**: coincidencia de patrones ligera ya que Grok AI puntúa el tono
- **Modelado de penalización por enlaces**: cálculos separados para cuentas Premium vs. no Premium

### Análisis profundo con IA (Opcional)
- **Puntuación de originalidad** con detección de patrones de plantilla
- **Predicción de interacción**: probabilidad de respuesta y potencial viral con razonamiento
- **Sugerencias de reescritura**: versiones mejoradas de tu tweet con explicaciones
- **Análisis de audiencia**: a quién le interesa tu tweet y cómo dirigirlo mejor
- Impulsado por la API de Claude (requiere tu propia clave API, almacenada localmente)

---

## Capturas de pantalla

> Carga la extensión y visita x.com para ver la interfaz en acción.

| Vista | Descripción |
|------|-------------|
| **Insignia de puntuación** | Círculo flotante en la esquina inferior derecha que muestra tu calificación (S/A/B/C/D/F) mientras redactas |
| **Superposición expandida** | Haz clic en la insignia para ver sugerencias, barras de desglose de puntuación y tarjetas de factores del algoritmo |
| **Popup — Prueba** | Escribe cualquier texto de tweet, ve la puntuación instantánea con el círculo de calificación, sugerencias y análisis opcional con IA |
| **Popup — Aprende** | 8 tarjetas que cubren insights clave del algoritmo: multiplicadores de respuesta, impulso de video, penalizaciones de enlaces, momento óptimo |
| **Popup — Configuración** | Entrada de clave API de Claude, activación de superposición, activación de sugerencias, control deslizante de umbral de alerta mínima |

Para capturar pantallas para la Chrome Web Store, consulta `store-assets/STORE_LISTING.md`.

---

## Instalación

### Para usuarios: Cargar como extensión desempaquetada

1. Descarga o clona este repositorio
2. Instala las dependencias y compila:
   ```bash
   npm install
   npm run build
   ```
3. Abre Chrome y ve a `chrome://extensions/`
4. Habilita el **modo desarrollador** (interruptor en la esquina superior derecha)
5. Haz clic en **Cargar desempaquetado**
6. Selecciona la carpeta `dist/` dentro de este proyecto
7. El icono **XS** aparecerá en tu barra de herramientas: navega a [x.com](https://x.com) y comienza a redactar

> **Consejo**: Después de cambios en el código, ejecuta `npm run build` nuevamente y luego haz clic en el botón de recargar (flecha circular) en la tarjeta de la extensión en `chrome://extensions/`.

### Para desarrolladores: Modo de desarrollo

```bash
git clone https://github.com/affaan-m/x-algorithm-score.git
cd x-algorithm-score

npm install

# Start dev server with hot module replacement
npm run dev
```

Luego carga `dist/` como una extensión desempaquetada (pasos 3-6 anteriores). CRXJS proporciona HMR para que la mayoría de los cambios se reflejen sin una recarga manual.

### Empaquetar para Chrome Web Store

```bash
npm run package
# Outputs: x-algorithm-score.zip (clean build, ready for CWS upload)
```

---

## Uso

### En x.com

1. Ve a [x.com](https://x.com) y abre el redactor de tweets
2. Aparece una **insignia de puntuación** en la esquina inferior derecha mientras escribes
3. Haz clic en la insignia para expandir: ve las pestañas de Sugerencias, Desglose y Factores del algoritmo
4. La puntuación se actualiza en tiempo real con un rebote de 150 ms
5. Adjunta medios, agrega preguntas o elimina enlaces y observa cómo cambia tu puntuación

### En el Popup

Haz clic en el icono de la barra de herramientas (**XS**) para abrir el popup sin salir de tu página actual:

| Pestaña | Qué hace |
|-----|--------------|
| **Prueba** | Pega o escribe un borrador de tweet, activa "tiene medios", ve la puntuación + sugerencias. Haz clic en "Análisis profundo con IA" para obtener comentarios impulsados por Claude. |
| **Aprende** | Explora 8 tarjetas de insights del algoritmo basadas en el análisis del código de `twitter/the-algorithm` y la investigación de la comunidad. |
| **Configuración** | Ingresa la clave API de Claude (almacenada en `chrome.storage.local`), activa/desactiva la superposición del redactor, configura el umbral de alerta. |

---

## Desglose de Puntuación

### Escala de calificación

| Calificación | Puntuación | Significado |
|-------|-------|---------|
| **S** | 90-100 | Excelente: optimizado para alcance máximo |
| **A** | 80-89 | Muy bueno: señales algorítmicas fuertes |
| **B** | 65-79 | Bueno: espacio para mejorar |
| **C** | 50-64 | Regular: faltan optimizaciones clave |
| **D** | 35-49 | Deficiente: se detectaron problemas significativos |
| **F** | 0-34 | Necesita trabajo: problemas mayores |

### Componentes de puntuación

| Componente | Máx | Qué mide |
|-----------|-----|------------------|
| Contenido | 25 | Longitud (punto dulce: 120-240 caracteres), hilos, emojis, estructura |
| Medios | 20 | Video (+20), imágenes (+17), GIFs (+16), encuestas (+18), ninguno (+0) |
| Momento | 15 | Horas pico (9am-12pm, 7pm-10pm EST), bonificación de días laborables |
| Interacción | 20 | Preguntas (+8), CTAs (+4), tweets de cita (+3), respuestas (+2) |
| Riesgo | -30 | Enlaces externos (-15/-20), hashtags en exceso (-3 cada uno), menciones en exceso (-2 cada una), plantillas (-5), sentimiento negativo (-3) |

---

## Investigación del Algoritmo

La puntuación se basa en [twitter/the-algorithm](https://github.com/twitter/the-algorithm) (home-mixer, heavy-ranker, SimClusters) más la investigación de la comunidad.

### Multiplicadores clave del código del algoritmo

| Señal | Multiplicador | Por qué importa |
|--------|------------|----------------|
| Respuesta a respuesta | **75x** | Responder a comentarios es la acción de mayor valor |
| Respuestas directas | **13.5-27x** | Las señales de conversación dominan el ranking |
| Tweets de cita | **> retuits** | El comentario añade valor sobre la amplificación simple |
| Retuits | **1-2x** | Amplificación básica, señal positiva más baja |
| Me gusta | **0.5x** | Valor de interacción más bajo en el algoritmo |
| Reportes | **-369x** | Devastador, crea una "deuda algorítmica" duradera |
| Bloqueos/silencios | **-74x** | Se acumula, equivalente a "muéstrame menos" |

### Hallazgos críticos (2024-2026)

- **Los enlaces matan el alcance no Premium**: Desde marzo de 2026, las publicaciones con enlaces no Premium obtienen ~0% de interacción mediana
- **Video nativo = 10x**: 4 de cada 5 sesiones de usuario ahora incluyen video
- **Los primeros 30 minutos son críticos**: La velocidad de interacción en esta ventana determina la distribución algorítmica
- **Umbral de tiempo de permanencia: 3 segundos**: Los usuarios deben permanecer en tu tweet >3s para signalizar calidad
- **El sentimiento positivo gana**: Grok AI puntúa el tono: el contenido constructivo se distribuye más ampliamente
- **TweepCred por debajo de 0.65**: Solo 3 de tus tweets son considerados para distribución

---

## Privacidad

- Toda la puntuación se ejecuta **localmente en tu navegador**: el texto del tweet nunca sale de tu dispositivo
- Sin servidores backend, sin rastreo, sin analítica
- No se requiere acceso ni autenticación a la API de X/Twitter
- La única llamada externa es el análisis opcional con IA a través de la API de Claude usando **tu propia** clave API
- La clave API se almacena en `chrome.storage.local` (nunca se transmite excepto a la API de Anthropic)
- Código fuente completo disponible para auditoría

Consulta [PRIVACY_POLICY.md](PRIVACY_POLICY.md) para la política de privacidad completa.

---

## Desarrollo

### Stack tecnológico

| Tecnología | Rol |
|------------|------|
| TypeScript 5.3 | Código fuente seguro con tipos |
| React 18 | Componentes de UI del popup y la superposición |
| Vite 5 + @crxjs/vite-plugin | Cadena de compilación con HMR para extensiones de Chrome |
| Tailwind CSS 3 | Estilos utility-first (popup) |
| Chrome Manifest V3 | APIs de la plataforma de extensiones |

### Scripts

```bash
npm run dev          # Vite dev server with HMR
npm run build        # TypeScript check + production build
npm run build:clean  # Clean dist/ then build
npm run package      # Clean build + zip for Chrome Web Store
npm run type-check   # TypeScript only (no emit)
npm run lint         # ESLint on src/
```

### Estructura del proyecto

```
x-score-extension/
├── manifest.json              # Source manifest (CRXJS transforms for build)
├── src/
│   ├── background/
│   │   └── index.ts           # Service worker: install, messaging, score history
│   ├── content/
│   │   ├── index.tsx          # Content script: composer detection, overlay injection
│   │   ├── styles.css         # Overlay animations and scoped styles
│   │   └── components/
│   │       └── ScoreOverlay.tsx  # Collapsible score badge + expanded panel
│   ├── lib/
│   │   ├── scoring-engine.ts  # Core scoring algorithm (5 components + suggestions)
│   │   └── ai-analysis.ts     # Claude API integration for deep analysis
│   ├── popup/
│   │   ├── index.html         # Popup entry HTML
│   │   ├── main.tsx           # React mount point
│   │   ├── Popup.tsx          # 3-tab popup UI (Test, Learn, Settings)
│   │   └── styles.css         # Popup styles + Tailwind directives
│   └── types/
│       └── index.ts           # All TypeScript interfaces + default scoring weights
├── assets/                    # Extension icons (16/32/48/128 in PNG + SVG)
├── store-assets/              # Chrome Web Store listing copy
├── vite.config.ts             # Vite + CRXJS + React plugin config
├── tailwind.config.js         # Tailwind theme with X color palette
├── tsconfig.json              # TypeScript config (strict, paths alias)
└── package.json               # Dependencies and scripts
```

### Cómo funciona la compilación

1. `tsc` verifica los tipos de todos los archivos fuente (sin emitir: Vite se encarga de la transpilación)
2. Vite + CRXJS lee `manifest.json` y transforma las referencias de fuente (`.tsx`, `.ts`) en fragmentos compilados
3. CRXJS genera un **cargador** de script de contenido (IIFE diminuto) que importa dinámicamente el paquete real del script de contenido a través de `chrome.runtime.getURL()`
4. Se genera un `service-worker-loader.js` para importar el paquete del script de fondo
5. La salida se almacena en `dist/`: esta es la carpeta que Chrome carga como la extensión

---

## Hoja de ruta

- [ ] Puntuación en línea de tiempo: mostrar puntuaciones en tweets de tu feed
- [ ] Historial de puntuación: rastrea tus puntuaciones a lo largo del tiempo
- [ ] Contexto de usuario: integrar recuento de seguidores y tasa de interacción en las predicciones
- [ ] Redactor de hilos: puntuación por tweet dentro de hilos
- [ ] Momento óptimo de publicación: sugerencias personalizadas basadas en las zonas horarias de los seguidores
- [ ] Lanzamiento en Chrome Web Store
- [ ] Soporte para Firefox y Safari

---

## Contribuciones

1. Haz un fork del repositorio
2. Crea una rama de función (`git checkout -b feature/mi-caracteristica`)
3. Confirma tus cambios (`git commit -m 'feat: agregar mi característica'`)
4. Publica en la rama (`git push origin feature/mi-caracteristica`)
5. Abre un Pull Request

La lógica de puntuación reside en `src/lib/scoring-engine.ts` con comentarios detallados que explican cada factor del algoritmo y su multiplicador en el mundo real.

---

## Descargo de responsabilidad

Esta extensión se basa en información públicamente disponible del lanzamiento de código abierto del algoritmo de Twitter y la investigación de la comunidad. Las puntuaciones son estimaciones: el rendimiento real de los tweets depende de tu audiencia, momento, calidad del contenido, tendencias y el algoritmo en constante evolución de X.

---

## Licencia

MIT: consulta [LICENSE](LICENSE).

## Agradecimientos

- [twitter/the-algorithm](https://github.com/twitter/the-algorithm): código del algoritmo de código abierto
- Investigadores y creadores de la comunidad que publicaron sus hallazgos
- [Anthropic Claude](https://anthropic.com): capacidades de análisis con IA

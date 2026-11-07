# SilveraCalm — Landing page

Landing del **Test de Tranquilidad Familiar** con el sistema visual *Serene Sanctuary* y el blog de Blogger conectado en vivo.

Proyecto Académico S1708 · Luis Anthony Quispe Rivera

---

## 1. Qué hay en esta carpeta

```
silveracalm-landing/
├── index.html                  ← la página (textos y secciones)
├── .nojekyll                   ← le dice a GitHub que publique los archivos tal cual
├── README.md                   ← esta guía
└── assets/
    ├── css/styles.css          ← diseño: colores, fuentes, tamaños
    ├── img/
    │   ├── logo-silveracalm.png   ← tu logo con fondo transparente
    │   └── favicon.png            ← icono de la pestaña del navegador
    └── js/
        ├── config.js           ← ⭐ CONFIGURACIÓN (el único archivo que necesitas tocar)
        ├── main.js             ← menú móvil, botones y ventanas emergentes
        ├── blog.js             ← blog en vivo
        └── vendor-purify.min.js← librería de seguridad para mostrar los artículos
```

---

## 2. Publicarla en GitHub Pages (gratis), paso a paso

### Opción A: desde el navegador (sin instalar nada)

1. Entra a <https://github.com> e inicia sesión (o crea tu cuenta).
2. Arriba a la derecha haz clic en **+** → **New repository**.
3. En **Repository name** escribe `silveracalm` (o el nombre que quieras; será parte de la URL).
4. Marca **Public**. No marques nada más. Clic en **Create repository**.
5. En la página que aparece, haz clic en el enlace **uploading an existing file**.
6. Abre la carpeta `silveracalm-landing` en tu computadora, **selecciona todo su contenido** (`index.html`, `README.md`, `.nojekyll` y la carpeta `assets`) y arrástralo a la ventana de GitHub.
   - ⚠️ Arrastra lo que está *dentro* de la carpeta, no la carpeta misma. `index.html` debe quedar en la raíz del repositorio.
   - El archivo `.nojekyll` está oculto en Windows/Mac. Si no lo ves, no pasa nada: la página funciona igual.
7. Abajo, en **Commit changes**, escribe `Primera versión de la landing` y haz clic en **Commit changes**.
8. Ve a **Settings** (pestaña de arriba) → **Pages** (menú izquierdo).
9. En **Build and deployment** → **Source**, elige **Deploy from a branch**.
10. En **Branch** elige `main` y la carpeta `/ (root)`. Clic en **Save**.
11. Espera de 1 a 3 minutos y recarga la página. Arriba aparecerá:
    **Your site is live at `https://TU-USUARIO.github.io/silveracalm/`**

¡Listo! Esa es la URL que compartes.

### Opción B: con Git (si ya lo usas)

```bash
cd silveracalm-landing
git init
git add .
git commit -m "Primera versión de la landing"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/silveracalm.git
git push -u origin main
```
Luego repite los pasos 8 a 11 de la Opción A.

### Cómo hacer cambios después

- **Desde el navegador:** abre el archivo en GitHub → ícono del lápiz ✏️ → edita → **Commit changes**. La página se actualiza sola en 1–2 minutos.
- **Con Git:** edita en tu computadora → `git add .` → `git commit -m "lo que cambiaste"` → `git push`.

> Si no ves tus cambios, recarga con **Ctrl + Shift + R** (Windows) o **Cmd + Shift + R** (Mac) para saltarte la memoria del navegador.

---

## 3. Configuración rápida (`assets/js/config.js`)

| Opción | Para qué sirve |
| --- | --- |
| `TEST_URL` | Pega el enlace de tu test. Mientras esté vacío `''`, los botones muestran el aviso «El test estará disponible muy pronto». |
| `TEST_NEW_TAB` | `true` abre el test en otra pestaña; `false` en la misma. |
| `BLOG_URL` | Dirección de tu Blogger. Ya está configurada. |
| `BLOG_PAGE_SIZE` | Cuántos artículos se ven antes de «Cargar más». |
| `BLOG_REFRESH_MINUTES` | Cada cuántos minutos revisa si publicaste algo nuevo. |
| `BLOG_NEW_DAYS` | Días durante los que un artículo lleva la etiqueta «Nuevo». |

Ejemplo:
```js
TEST_URL: 'https://forms.gle/abc123',
```

Si el test es otra página dentro del mismo repositorio (por ejemplo `test.html`), pon `TEST_URL: 'test.html'`.

---

## 4. Cómo funciona el blog en vivo

- Lee **todos** los artículos publicados en `silveracalm.blogspot.com` usando el feed público de Blogger. No necesitas ninguna clave.
- **Publicas en Blogger y aparece solo** en la landing: la página vuelve a revisar el blog cada 3 minutos y cada vez que el visitante regresa a la pestaña. Si llega un artículo nuevo, aparece el aviso «¡Nuevo artículo publicado!».
- El artículo más reciente sale **destacado** en grande, y los demás en la grilla con «Cargar más».
- Las **etiquetas** que pongas en Blogger se convierten en filtros (Historias, Guías, Salud…). Usa siempre las mismas etiquetas para que los filtros queden ordenados.
- **Buscador** que busca en títulos y en el texto completo, con o sin tildes.
- **Lector integrado:** al hacer clic, el artículo completo se abre en la misma landing. Al final aparece el «Consejo de Silvera» con el botón del test, para que el blog también lleve gente al test (embudo RACE).
- Cada artículo tiene su propio enlace compartible: `…/#articulo-123456`.
- Si Blogger no responde, se muestra la última versión guardada en el navegador o, si no hay ninguna, 3 artículos de respaldo.

### Requisitos en Blogger

1. **Configuración → Privacidad**: el blog debe ser **visible para todos**.
2. **Configuración → Feed del sitio → Permitir feed del blog**: elige **Completo**. Si eliges «Hasta salto de línea» o «Breve», el lector solo mostrará un resumen.
3. Para que cada tarjeta tenga foto, pon **al menos una imagen** en cada entrada. La primera imagen se usa como portada.

---

## 5. Cambiar el diseño

Todos los colores y fuentes están al inicio de `assets/css/styles.css`, en `:root`:

```css
--color-primary: #3A637B;    /* Azul pizarra: botones y títulos */
--color-secondary: #4E7C6B;  /* Verde salvia: checks y Consejo de Silvera */
--color-tertiary: #8A87B8;   /* Lavanda: etiquetas */
--color-neutral-bg: #F9F8F5; /* Crema: fondo */
```

Si cambias un valor ahí, cambia en toda la página.

> Nota de accesibilidad: el lavanda `#8A87B8` y el verde `#4E7C6B` no tienen contraste suficiente para texto pequeño sobre fondo claro. Por eso existen `--color-tertiary-text` y `--color-secondary-text`, que son versiones más oscuras para texto y cumplen WCAG AA.

---

## 6. Dominio propio (opcional)

Si compras un dominio (ej. `silveracalm.pe`): en **Settings → Pages → Custom domain** escríbelo y sigue las instrucciones de DNS que te da GitHub. Después activa **Enforce HTTPS**.

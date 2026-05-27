# Precios Bimbo — Supermercados Uruguay

Monitor de precios del Grupo Bimbo en supermercados uruguayos.

## Supermercados
- Tata
- Disco
- Tienda Inglesa
- El Dorado

## Marcas monitoreadas
- **Bimbo** (submarcas: Artesano, Vital, Rapiditas + productos Bimbo genéricos)
- Los Sorchantes
- Takis
- Merienda HIT
- Salmas
- Maestro Cubano
- Nutrabien
- Tia Rosa

---

## Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Correr el scraper manualmente
```bash
npm run scrape
```
Esto genera `public/data/latest.json`, `latest.csv` y agrega una línea a `history.jsonl`.

### 3. Correr el frontend localmente
```bash
npm run dev
# Abre http://localhost:3000
```

---

## Estructura del proyecto
```
precios-bimbo/
├── public/
│   ├── index.html       # Frontend principal
│   ├── app.js           # Lógica de UI
│   ├── styles.css       # Estilos
│   ├── logo.jpg         # Logo Bimbo (agregar)
│   └── data/
│       ├── latest.json  # Datos actuales (generado por scraper)
│       ├── latest.csv   # Export CSV
│       └── history.jsonl # Histórico de precios
├── scripts/
│   └── scraper.js       # Scraper principal
└── package.json
```

---

## Deploy en Vercel

1. Subir el proyecto a GitHub
2. Conectar el repo en Vercel
3. El frontend se sirve desde `/public` (configurar como root)
4. Para el botón "Actualizar precios": el scraper se puede disparar vía GitHub Actions
   - Crear `.github/workflows/scrape.yml` con un workflow que corra `npm run scrape` y haga commit del JSON
   - El endpoint `/api/refresh` dispara ese workflow via GitHub API

## Cómo agregar/quitar marcas

Editar `scripts/scraper.js`, en `BRANDS_CONFIG`:
- Cada entrada tiene `brand` (nombre interno), `group` (siempre `bimbo`) y `terms` (términos a buscar en cada super)
- Los términos son los que se mandan al buscador de cada super
- Agregar el nombre de la marca también a `ALL_BRAND_KEYWORDS` para que el filtro de falsos positivos funcione

## Cómo agregar/quitar supers

Editar `scripts/scraper.js`, en `SUPERS`:
- Agregar una nueva entrada con `name`, `searchUrl` y `parseProducts`
- Los supers VTEX (Tata, Disco, Tienda Inglesa, El Dorado) usan el mismo formato de API
- En `public/app.js`, agregar el super a `SUPERS` y `SUPER_LABEL`
- En `public/styles.css`, agregar el color de la pill `.pill.nombre`

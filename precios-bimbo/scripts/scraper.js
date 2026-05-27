/**
 * scraper.js — Grupo Bimbo Uruguay
 * Scrapea: Tata, Disco, Tienda Inglesa, El Dorado
 * Marcas: Bimbo (+ submarcas), Los Sorchantes, Takis, Merienda HIT,
 *         Salmas, Maestro Cubano, Nutrabien, Tia Rosa
 *
 * Uso: node scripts/scraper.js
 * Requiere: node-fetch (npm install node-fetch)
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../public/data');

// ─── Configuración de marcas y términos de búsqueda ───────────────────────────

const BRANDS_CONFIG = [
  // Marca principal Bimbo con submarcas
  { brand: 'bimbo',          group: 'bimbo', terms: ['bimbo vainillas', 'bimbo lactal', 'bimbo integral', 'bimbo lacteado', 'bimbo brioche', 'bimbo tortuga'] },
  { brand: 'artesano',       group: 'bimbo', terms: ['artesano bimbo', 'bimbo artesano'] },
  { brand: 'vital',          group: 'bimbo', terms: ['vital bimbo', 'bimbo vital'] },
  { brand: 'rapiditas',      group: 'bimbo', terms: ['rapiditas'] },
  // Otras marcas del portfolio
  { brand: 'los sorchantes', group: 'bimbo', terms: ['sorchantes'] },
  { brand: 'takis',          group: 'bimbo', terms: ['takis'] },
  { brand: 'merienda hit',   group: 'bimbo', terms: ['merienda hit', 'hit bimbo'] },
  { brand: 'salmas',         group: 'bimbo', terms: ['salmas'] },
  { brand: 'maestro cubano', group: 'bimbo', terms: ['maestro cubano'] },
  { brand: 'nutrabien',      group: 'bimbo', terms: ['nutrabien', 'nutra bien'] },
  { brand: 'tia rosa',       group: 'bimbo', terms: ['tia rosa'] },
];

// Lista plana de todos los términos de búsqueda para filtrar falsos positivos
const ALL_BRAND_KEYWORDS = [
  'bimbo', 'artesano', 'vital', 'rapiditas',
  'sorchantes', 'takis', 'merienda hit', 'salmas',
  'maestro cubano', 'nutrabien', 'nutra bien', 'tia rosa',
];

// ─── Configuración de supermercados ──────────────────────────────────────────

const SUPERS = {
  tata: {
    name: 'tata',
    searchUrl: (term) => `https://www.tata.com.uy/api/catalog_system/pub/products/search/${encodeURIComponent(term)}?_from=0&_to=49`,
    parseProducts: parseTata,
  },
  disco: {
    name: 'disco',
    searchUrl: (term) => `https://www.disco.com.uy/api/catalog_system/pub/products/search/${encodeURIComponent(term)}?_from=0&_to=49`,
    parseProducts: parseDisco,
  },
  tiendainglesa: {
    name: 'tiendainglesa',
    searchUrl: (term) => `https://www.tiendainglesa.com.uy/api/catalog_system/pub/products/search/${encodeURIComponent(term)}?_from=0&_to=49`,
    parseProducts: parseTiendaInglesa,
  },
  eldorado: {
    name: 'eldorado',
    searchUrl: (term) => `https://www.eldorado.com.uy/api/catalog_system/pub/products/search/${encodeURIComponent(term)}?_from=0&_to=49`,
    parseProducts: parseElDorado,
  },
};

// ─── Parsers por supermercado ─────────────────────────────────────────────────

function parseTata(products, brand, group) {
  return products.flatMap((p) => {
    const item = p.items?.[0];
    if (!item) return [];
    const seller = item.sellers?.[0]?.commertialOffer;
    const price = seller?.Price ?? null;
    const listPrice = seller?.ListPrice ?? null;
    return [{
      super: 'tata',
      sku: item.itemId,
      name: p.productName,
      brand,
      group,
      price: price ? Math.round(price) : null,
      listPrice: listPrice && listPrice !== price ? Math.round(listPrice) : null,
      currency: 'UYU',
      url: `https://www.tata.com.uy/${p.linkText}/p`,
    }];
  });
}

function parseDisco(products, brand, group) {
  return products.flatMap((p) => {
    const item = p.items?.[0];
    if (!item) return [];
    const seller = item.sellers?.[0]?.commertialOffer;
    const price = seller?.Price ?? null;
    const listPrice = seller?.ListPrice ?? null;
    return [{
      super: 'disco',
      sku: item.itemId,
      name: p.productName,
      brand,
      group,
      price: price ? Math.round(price) : null,
      listPrice: listPrice && listPrice !== price ? Math.round(listPrice) : null,
      currency: 'UYU',
      url: `https://www.disco.com.uy/product/${p.linkText}/${item.itemId}`,
    }];
  });
}

function parseTiendaInglesa(products, brand, group) {
  return products.flatMap((p) => {
    const item = p.items?.[0];
    if (!item) return [];
    const seller = item.sellers?.[0]?.commertialOffer;
    const price = seller?.Price ?? null;
    const listPrice = seller?.ListPrice ?? null;
    return [{
      super: 'tiendainglesa',
      sku: item.itemId,
      name: p.productName,
      brand,
      group,
      price: price ? Math.round(price) : null,
      listPrice: listPrice && listPrice !== price ? Math.round(listPrice) : null,
      currency: 'UYU',
      url: `https://www.tiendainglesa.com.uy/supermercado/${p.linkText}.producto?${item.itemId},,42`,
    }];
  });
}

function parseElDorado(products, brand, group) {
  return products.flatMap((p) => {
    const item = p.items?.[0];
    if (!item) return [];
    const seller = item.sellers?.[0]?.commertialOffer;
    const price = seller?.Price ?? null;
    const listPrice = seller?.ListPrice ?? null;
    return [{
      super: 'eldorado',
      sku: item.itemId,
      name: p.productName,
      brand,
      group,
      price: price ? Math.round(price) : null,
      listPrice: listPrice && listPrice !== price ? Math.round(listPrice) : null,
      currency: 'UYU',
      url: `https://www.eldorado.com.uy/${p.linkText}/p`,
    }];
  });
}

// ─── Filtro para descartar falsos positivos ───────────────────────────────────

function isBimboProduct(name) {
  const lower = name.toLowerCase();
  return ALL_BRAND_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Fetcher con reintentos ───────────────────────────────────────────────────

async function fetchWithRetry(url, retries = 3, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PreciosBimboBot/1.0)',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i < retries - 1) {
        console.warn(`  Reintentando (${i + 1}/${retries - 1})... ${err.message}`);
        await sleep(delayMs * (i + 1));
      } else {
        throw err;
      }
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Scraping principal ───────────────────────────────────────────────────────

async function scrapeSuper(superConfig, brandConfig) {
  const results = [];
  const seen = new Set();

  for (const term of brandConfig.terms) {
    try {
      console.log(`    [${superConfig.name}] Buscando: "${term}"`);
      const url = superConfig.searchUrl(term);
      const products = await fetchWithRetry(url);

      if (!Array.isArray(products)) {
        console.warn(`    [${superConfig.name}] Respuesta inesperada para "${term}"`);
        continue;
      }

      const parsed = superConfig.parseProducts(products, brandConfig.brand, brandConfig.group);

      for (const item of parsed) {
        // Filtrar falsos positivos: el producto debe contener alguna keyword de la marca
        if (!isBimboProduct(item.name)) {
          console.log(`    Descartado (no Bimbo): ${item.name}`);
          continue;
        }
        // Deduplicar por SKU dentro del mismo super
        const key = `${item.super}:${item.sku}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push(item);
        }
      }

      await sleep(300); // pausa cortés entre requests
    } catch (err) {
      console.error(`    [${superConfig.name}] Error buscando "${term}": ${err.message}`);
    }
  }

  return results;
}

async function runScrape() {
  console.log('🍞 Iniciando scrape — Grupo Bimbo Uruguay');
  console.log(`📅 ${new Date().toLocaleString('es-UY')}`);
  console.log(`🏪 Supers: ${Object.keys(SUPERS).join(', ')}`);
  console.log(`🏷️  Marcas: ${BRANDS_CONFIG.map((b) => b.brand).join(', ')}\n`);

  const allItems = [];

  for (const brandConfig of BRANDS_CONFIG) {
    console.log(`\n📦 Marca: ${brandConfig.brand.toUpperCase()}`);
    for (const superConfig of Object.values(SUPERS)) {
      const items = await scrapeSuper(superConfig, brandConfig);
      console.log(`  ✓ ${superConfig.name}: ${items.length} productos`);
      allItems.push(...items);
    }
  }

  // Deduplicación global por super+sku
  const seen = new Set();
  const unique = allItems.filter((item) => {
    const key = `${item.super}:${item.sku}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\n✅ Total productos únicos: ${unique.length}`);
  console.log(`   Tata: ${unique.filter((i) => i.super === 'tata').length}`);
  console.log(`   Disco: ${unique.filter((i) => i.super === 'disco').length}`);
  console.log(`   Tienda Inglesa: ${unique.filter((i) => i.super === 'tiendainglesa').length}`);
  console.log(`   El Dorado: ${unique.filter((i) => i.super === 'eldorado').length}`);

  // Armar output
  const output = {
    brands: [...new Set(BRANDS_CONFIG.map((b) => b.brand))],
    groups: {
      bimbo: [...new Set(BRANDS_CONFIG.filter((b) => b.group === 'bimbo').map((b) => b.brand))],
    },
    generatedAt: new Date().toISOString(),
    items: unique,
  };

  // Guardar latest.json
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const jsonPath = join(DATA_DIR, 'latest.json');
  writeFileSync(jsonPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n💾 Guardado: ${jsonPath}`);

  // Guardar latest.csv
  const csvPath = join(DATA_DIR, 'latest.csv');
  const csvHeader = 'super,sku,name,brand,group,price,listPrice,currency,url\n';
  const csvRows = unique.map((i) =>
    [i.super, i.sku, `"${i.name.replace(/"/g, '""')}"`, i.brand, i.group,
     i.price ?? '', i.listPrice ?? '', i.currency, i.url].join(',')
  ).join('\n');
  writeFileSync(csvPath, csvHeader + csvRows, 'utf-8');
  console.log(`💾 Guardado: ${csvPath}`);

  // Append a history.jsonl
  const historyPath = join(DATA_DIR, 'history.jsonl');
  const prices = {};
  for (const i of unique) prices[`${i.super}:${i.sku}`] = i.price;
  const histLine = JSON.stringify({ t: output.generatedAt, prices }) + '\n';
  const fs = await import('fs');
  fs.appendFileSync(historyPath, histLine, 'utf-8');
  console.log(`💾 Histórico actualizado: ${historyPath}`);

  console.log('\n🎉 Scrape completado exitosamente.\n');
  return output;
}

runScrape().catch((err) => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});

import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const root = process.cwd();
const storefrontPublicDir = join(root, "apps", "storefront", "public");
const mirrorPublicPrefix = "/supabase-mirror";
const mirrorDir = join(storefrontPublicDir, mirrorPublicPrefix.slice(1));
const mapPath = join(root, "packages", "shared", "src", "supabase-asset-map.ts");
const backupDir = join(root, "output", "supabase-egress-hotfix");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(join(root, ".env"));
loadEnvFile(join(root, "apps", "storefront", ".env.local"));
loadEnvFile(join(root, "apps", "admin", ".env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase anon/publishable key.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const allowedPublicBuckets = new Set(["product-images", "banners", "logos"]);
const tables = [
  "categories",
  "products",
  "product_images",
  "store_settings",
  "banners",
  "payment_settings",
  "promotion_banners",
  "qr_payment_methods",
];

function collectUrls(value, urls = new Set()) {
  if (typeof value === "string") {
    const matches = value.match(/https?:\/\/[^\s"'<>\\)]+/g) ?? [];
    for (const match of matches) urls.add(match.replace(/[.,;]+$/g, ""));
    if (/^https?:\/\//.test(value)) urls.add(value);
    return urls;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, urls);
    return urls;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectUrls(item, urls);
  }

  return urls;
}

function publicStorageInfo(url) {
  if (!url.startsWith(supabaseUrl)) return null;
  const parsed = new URL(url);
  const prefix = "/storage/v1/object/public/";
  if (!parsed.pathname.startsWith(prefix)) return null;
  const [, bucket, ...pathParts] = parsed.pathname.slice(prefix.length).match(/^([^/]+)\/(.+)$/) ?? [];
  if (!bucket || !pathParts.length) return null;
  const path = pathParts.join("");
  if (!allowedPublicBuckets.has(bucket)) return null;
  return { bucket, path };
}

function safeOutputPath({ bucket, path }) {
  const cleanPath = path
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "-"))
    .join("/");
  return join(mirrorDir, bucket, cleanPath);
}

function publicPath({ bucket, path }) {
  return `${mirrorPublicPrefix}/${bucket}/${path
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "-"))
    .join("/")}`;
}

async function selectAll(table) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) {
    console.warn(`[warn] ${table}: ${error.message}`);
    return [];
  }
  return data ?? [];
}

async function download(url, info) {
  const outPath = safeOutputPath(info);
  mkdirSync(dirname(outPath), { recursive: true });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timer);
  if (!response.ok) {
    throw new Error(`Download failed ${response.status}: ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(outPath, buffer);
  return { bytes: buffer.length, outPath };
}

mkdirSync(mirrorDir, { recursive: true });
mkdirSync(backupDir, { recursive: true });

const rowsByTable = {};
for (const table of tables) {
  rowsByTable[table] = await selectAll(table);
}

writeFileSync(
  join(backupDir, `supabase-public-data-${new Date().toISOString().replace(/[:.]/g, "-")}.json`),
  JSON.stringify(rowsByTable, null, 2)
);

const urls = collectUrls(rowsByTable);
const entries = [];

for (const url of urls) {
  const info = publicStorageInfo(url);
  if (!info) continue;
  entries.push({ url, info, publicPath: publicPath(info) });
}

const uniqueEntries = [...new Map(entries.map((entry) => [entry.url, entry])).values()];
const mapping = {};
let downloaded = 0;
let skipped = 0;
let bytes = 0;
let failed = 0;

for (const [index, entry] of uniqueEntries.entries()) {
  const outPath = safeOutputPath(entry.info);
  const extension = extname(outPath).toLowerCase();
  if (!extension || [".php", ".html", ".txt"].includes(extension)) {
    skipped += 1;
    continue;
  }

  try {
    if (!existsSync(outPath)) {
      const result = await download(entry.url, entry.info);
      bytes += result.bytes;
      downloaded += 1;
    }

    mapping[entry.url] = entry.publicPath;
  } catch (error) {
    failed += 1;
    console.warn(`[warn] failed ${index + 1}/${uniqueEntries.length}: ${entry.url}`);
    console.warn(error instanceof Error ? error.message : error);
  }

  if ((index + 1) % 25 === 0) {
    console.log(`[progress] ${index + 1}/${uniqueEntries.length}`);
  }
}

const source = `export const supabaseAssetMap: Record<string, string> = ${JSON.stringify(mapping, null, 2)};\n`;
writeFileSync(mapPath, source);

writeFileSync(
  join(backupDir, "supabase-asset-map.json"),
  JSON.stringify(mapping, null, 2)
);

console.log(JSON.stringify({
  mapped: Object.keys(mapping).length,
  downloaded,
  skipped,
  failed,
  bytes,
  mirrorDir,
  mapPath,
}, null, 2));

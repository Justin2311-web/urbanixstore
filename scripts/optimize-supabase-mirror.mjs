import sharp from "sharp";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "apps", "storefront", "public");
const mapJsonPath = join(root, "output", "supabase-egress-hotfix", "supabase-asset-map.json");
const mapTsPath = join(root, "packages", "shared", "src", "supabase-asset-map.ts");

if (!existsSync(mapJsonPath)) {
  throw new Error(`Missing map JSON: ${mapJsonPath}`);
}

const mapping = JSON.parse(readFileSync(mapJsonPath, "utf8"));
const nextMapping = {};
let originalBytes = 0;
let optimizedBytes = 0;
let converted = 0;
let skipped = 0;

for (const [sourceUrl, publicPath] of Object.entries(mapping)) {
  const sourcePath = join(publicDir, publicPath.replace(/^\//, ""));
  if (!existsSync(sourcePath)) {
    skipped += 1;
    continue;
  }

  const extension = extname(sourcePath).toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(extension)) {
    nextMapping[sourceUrl] = publicPath;
    skipped += 1;
    continue;
  }

  const targetPublicPath = publicPath.replace(/\.(png|jpe?g)$/i, ".webp");
  const targetPath = join(publicDir, targetPublicPath.replace(/^\//, ""));
  mkdirSync(dirname(targetPath), { recursive: true });

  const input = sharp(sourcePath, { failOn: "none" }).rotate();
  const metadata = await input.metadata();
  const shouldResize = Math.max(metadata.width ?? 0, metadata.height ?? 0) > 1600;

  let pipeline = input;
  if (shouldResize) {
    pipeline = pipeline.resize({
      fit: "inside",
      height: 1600,
      withoutEnlargement: true,
      width: 1600,
    });
  }

  const buffer = await pipeline.webp({ effort: 5, quality: 82 }).toBuffer();
  writeFileSync(targetPath, buffer);

  const sourceSize = Buffer.byteLength(readFileSync(sourcePath));
  originalBytes += sourceSize;
  optimizedBytes += buffer.length;
  converted += 1;
  nextMapping[sourceUrl] = targetPublicPath;
}

writeFileSync(mapJsonPath, JSON.stringify(nextMapping, null, 2));
writeFileSync(
  mapTsPath,
  `export const supabaseAssetMap: Record<string, string> = ${JSON.stringify(nextMapping, null, 2)};\n`
);

for (const publicPath of Object.values(mapping)) {
  const sourcePath = join(publicDir, publicPath.replace(/^\//, ""));
  if (existsSync(sourcePath) && !sourcePath.endsWith(".webp")) {
    rmSync(sourcePath);
  }
}

console.log(JSON.stringify({
  converted,
  skipped,
  originalBytes,
  optimizedBytes,
  savedBytes: originalBytes - optimizedBytes,
}, null, 2));

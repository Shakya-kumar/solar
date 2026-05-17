import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const apiEndpoint = process.env.VSS_API_ENDPOINT || "/api/submit";

const staticFiles = [
  "about.html",
  "app-config.js",
  "api-client.js",
  "brand-logo.png",
  "calculator.html",
  "contact.html",
  "contact.js",
  "faq.html",
  "index.html",
  "nav.js",
  "quotation.html",
  "roi.js",
  "script.js",
  "services.html",
  "services.js",
  "style.css",
  "utils.js",
  "_headers",
  "_redirects",
  "_routes.json"
];

const staticDirs = ["images", "vendor"];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const file of staticFiles) {
  const source = join(root, file);
  if (!existsSync(source)) {
    throw new Error(`Build source missing: ${file}`);
  }
  copyFileSync(source, join(dist, file));
}

for (const dir of staticDirs) {
  const source = join(root, dir);
  if (!existsSync(source)) {
    throw new Error(`Build source directory missing: ${dir}`);
  }
  cpSync(source, join(dist, dir), { recursive: true });
}

const config = `window.__VSS_ENV = Object.freeze({
  VSS_API_ENDPOINT: ${JSON.stringify(apiEndpoint)}
});
`;

writeFileSync(join(dist, "env-config.js"), config);
writeFileSync(join(root, "env-config.js"), config);

console.log(`Built Cloudflare Pages assets in ${dist}`);

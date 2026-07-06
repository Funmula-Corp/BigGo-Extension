import { execSync } from "child_process"
import fs from "fs"
import { createRequire } from "module"
import * as url from "url"
import path from "path"

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url)

if(!fs.existsSync(path.join(__dirname, "../dist")) || !fs.existsSync(path.join(__dirname, "../dist/manifest.json"))) {
  throw new Error("dist not found")
}

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../dist/manifest.json")))
const { version } = manifest
let bundleName = `BigGo_extension_v${version}`

if(fs.existsSync(path.join(__dirname, `../${bundleName}.zip`))) {
  execSync(`rm ${path.join(__dirname, `../${bundleName}.zip`)} -rf`, {stdio: "inherit"})
}

execSync(`cd dist; zip ../${bundleName}.zip ./* -r`, {stdio: "inherit"})
console.log(`${bundleName}.zip has created`)
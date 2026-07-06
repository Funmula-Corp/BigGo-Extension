import "dotenv/config"
import { execSync } from "child_process"
import fs from "fs"
import { createRequire } from "module"
const require = createRequire(import.meta.url)

const manifestBase = require("../biggo/manifest.base.json")
const manifestV2 = require("../biggo/manifest.v2.json")
const manifestV3 = require("../biggo/manifest.v3.json")
const manifestBigGoDomain = require("../biggo/manifest.biggo.json")
const manifestSafari = require("../biggo/manifest.safari.json")
const pkg = require("../package.json")

const env = process.env.NODE_ENV || "production"
const manifestVersion = +process.env.MANIFEST_VERSION || 3
const browser = process.env.BROWSER || "chrome"

const isProduction = env === "production"

if(isProduction) {
  // clear
  execSync("rm -rf ./dist; mkdir ./dist")
}

// copy assets
const assetsPath = [
  "_locales",
  "icons",
  "images",
  "pages",
  "style",
  "template",
]

if(manifestVersion == 2) {
  assetsPath.push("background.html")
}

for (const path of assetsPath) {
  execSync(`cp ${isProduction?"-f":"--update=none"} -R biggo/${path} dist/${path}`, {stdio: 'inherit'})
}

execSync(`rm -rf ./dist/pages/popmenu/script`, {stdio: 'inherit'})

// build dist
execSync(`npx cross-env NODE_ENV=${env} MANIFEST_VERSION=${manifestVersion} BROWSER=${browser} node util/vite-build.js`, {stdio: 'inherit'})

const domains = manifestBigGoDomain.map(dn => `https://*.${dn}/*`)

// fix manifest domain
manifestBase.externally_connectable.matches = [
  ...manifestBase.externally_connectable.matches,
  ...domains
]

manifestBase.content_scripts.forEach((list, index) => {
  if(list.js.length === 1 && list.js[0] === "js/iframe/biggo.internal.listener.rollup.js") {
    manifestBase.content_scripts[index].matches = [
      ...manifestBase.content_scripts[index].matches,
      ...domains
    ]
  }
})

manifestV2.permissions = [
  ...manifestV2.permissions,
  ...domains
]

manifestV3.host_permissions = [
  ...manifestV3.host_permissions,
  ...domains
]

// build manifest
let manifest = manifestBase
if(manifestVersion === 3) {
  manifest = {...manifest, ...manifestV3}
}

if(manifestVersion === 2) {
  manifest = {...manifest, ...manifestV2}
}

if(browser === "safari") {
  manifest = {...manifest, ...manifestSafari}
}

manifest.version = pkg.version

const { version } = pkg
let [breakVersion, commonVersion, fixVersion] = version.split(".")

if(manifestVersion === 2) {
  breakVersion = 2
  commonVersion = +commonVersion + 3
  manifest.version = `${breakVersion}.${commonVersion}.${fixVersion}`
}

fs.writeFileSync("dist/manifest.json", JSON.stringify(manifest))

import "dotenv/config"
import { build } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import path from "path"
import * as url from "url"

const __dirname = url.fileURLToPath(new URL(".", import.meta.url))
const root = path.resolve(__dirname, "..")

const isWatch = process.argv.includes("--watch")
const isDev = process.env.NODE_ENV === "development"

const fileList = [
  "js/content.bundle",
  "js/content.listener",
  "js/background.bundle",
  "js/frontend.bundle",
  "js/iframe/biggo.internal.listener",
  "js/frontend/loader/mlt",
  "js/frontend/loader/idleCashback",
  "js/injection/SPA",
  "pages/popmenu/script/popmenu",
  "pages/popmenu/script/storeIframe",
  "pages/popmenu/script/couponIframe",
  "pages/privacy/page",
]

const dir = "./biggo"
const outputDir = "./dist"

async function buildEntry(name) {
  const inputPath = path.resolve(root, `${dir}/${name}.js`)
  const outDir = path.resolve(root, outputDir, path.dirname(name))
  const fileName = path.basename(name)

  await build({
    configFile: false,
    root,
    plugins: [
      svelte({
        emitCss: false,
        compilerOptions: {
          css: "injected"
        },
        onwarn(warning, handler) {
          if (warning.code?.startsWith("a11y")) return
          handler(warning)
        }
      })
    ],
    resolve: {
      alias: {
        "@core": path.resolve(root, "./biggo/js/core/"),
        "@shared": path.resolve(root, "./biggo/js/core/shared"),
        "@background": path.resolve(root, "./biggo/js/libs"),
        "@": path.resolve(root, "./biggo/js")
      }
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
      "process.env.API_DOMAIN": JSON.stringify("extension.biggo.com"),
      "process.env.BROWSER": JSON.stringify(process.env.BROWSER || ""),
      "process.env.ACCOUNT_DOMAIN": JSON.stringify("account.biggo.com"),
      "process.env.MANIFEST_VERSION": JSON.stringify(process.env.MANIFEST_VERSION || ""),
      "process.env.GA_API_SECRET": JSON.stringify(process.env.GA_API_SECRET || ""),
      "process.env.GA_MEASUREMENT_ID": JSON.stringify(process.env.GA_MEASUREMENT_ID || ""),
    },
    build: {
      outDir,
      emptyOutDir: false,
      lib: {
        entry: inputPath,
        formats: ["iife"],
        name: fileName.replace(/[.-]/g, "_"),
        fileName: () => `${fileName}.rollup.js`,
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        }
      },
      sourcemap: isDev ? "inline" : false,
      minify: false,
      terserOptions: isDev ? undefined : {
        output: {
          comments: function (node, comment) {
            var text = comment.value
            var type = comment.type
            if (type == "comment2") {
              return /@preserve|@license|@cc_on/i.test(text)
            }
          },
        },
      },
      watch: isWatch ? {} : null,
    },
    logLevel: "info",
  })
}

async function buildAll() {
  if (isWatch) {
    // In watch mode, build all entries concurrently (each watches independently)
    await Promise.all(fileList.map(name => buildEntry(name)))
  } else {
    // Sequential builds for cleaner output
    for (const name of fileList) {
      console.log(`\nBuilding ${name}...`)
      await buildEntry(name)
    }
  }
}

buildAll().catch(err => {
  console.error(err)
  process.exit(1)
})

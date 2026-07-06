import { writeFileSync } from 'fs'
import { execSync } from 'child_process'

const SITES_URL = 'https://extension.biggo.com/api/sites_v2.php'
const SITES_PATH = 'biggo/js/sites.json'

const res = await fetch(SITES_URL)
if (!res.ok) {
  console.error(`Failed to fetch sites: ${res.status} ${res.statusText}`)
  process.exit(1)
}

const data = await res.json()
writeFileSync(SITES_PATH, JSON.stringify(data))
console.log(`Downloaded sites.json: ${Object.keys(data).length} entries`)

execSync('node util/clean-sites.js', { stdio: 'inherit' })

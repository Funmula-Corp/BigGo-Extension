import { readFileSync, writeFileSync } from 'fs'

const SITES_PATH = 'biggo/js/sites.json'
const sites = JSON.parse(readFileSync(SITES_PATH, 'utf8'))
const cleaned = {}

for (const nindex in sites) {
  const site = sites[nindex]
  if (site.domain) {
    cleaned[nindex] = { domain: site.domain }
  }
}

writeFileSync(SITES_PATH, JSON.stringify(cleaned))
console.log(`Cleaned sites.json: ${Object.keys(cleaned).length} entries, domain only`)

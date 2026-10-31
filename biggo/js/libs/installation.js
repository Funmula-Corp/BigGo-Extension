const KEY = 'installation_conversion_v1'

// Kept in extension storage, so clearing website cookies cannot count it again.
export function createInstallationTracker(storage, allowedOrigin, now = Date.now, makeId = () => crypto.randomUUID()) {
  let pending = Promise.resolve()
  const serialize = fn => {
    const result = pending.then(fn)
    pending = result.catch(() => {})
    return result
  }

  return {
    recordInstall() {
      return serialize(async () => {
        const existing = await storage.getItem(KEY, null)
        if(existing) return existing
        const record = {id: makeId(), installedAt: now(), claimed: false}
        if(await storage.setItem(KEY, record) === false) return null
        return record
      })
    },
    claim(sender) {
      return serialize(async () => {
        let url
        try { url = new URL(sender?.url) } catch { return null }
        if(sender.frameId !== 0 || url.origin !== allowedOrigin
          || !/^\/welcome(?:\.php)?\/?$/.test(url.pathname)
          || url.searchParams.get('is_install') !== 'true') return null
        const record = await storage.getItem(KEY, null)
        // Old installations upgraded to this version have no record and must not
        // turn into new installs just because a welcome page is visited.
        if(!record || record.claimed || typeof record.id !== 'string') return null
        if(await storage.setItem(KEY, {...record, claimed: true}) === false) return null
        return {installation_id: record.id, installed_at: record.installedAt}
      }).catch(() => null)
    }
  }
}

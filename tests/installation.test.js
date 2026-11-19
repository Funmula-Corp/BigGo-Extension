import test from 'node:test'
import assert from 'node:assert/strict'
import {createInstallationTracker, INSTALL_CONVERSION_MAX_AGE_MS} from '../biggo/js/libs/installation.js'

const sender = {url: 'https://extension.biggo.com/welcome.php?is_install=true', frameId: 0}
function fixture(fail = false) {
  const data = {}
  const storage = {getItem: async k => data[k] || null, setItem: async (k,v) => {
    if(fail) return false
    data[k] = structuredClone(v)
  }}
  return {storage, tracker: createInstallationTracker(storage, 'https://extension.biggo.com', () => 123, () => 'install-one')}
}
test('only a recorded fresh install may be claimed', async () => {
  const {tracker} = fixture()
  assert.equal(await tracker.claim(sender), null)
  await tracker.recordInstall()
  assert.deepEqual(await tracker.claim(sender), {installation_id: 'install-one', installed_at: 123})
  assert.equal(await tracker.claim(sender), null)
})
test('concurrent tabs and worker restart do not count again', async () => {
  const {tracker, storage} = fixture()
  await tracker.recordInstall()
  const results = await Promise.all([tracker.claim(sender), tracker.claim(sender)])
  assert.equal(results.filter(Boolean).length, 1)
  const restarted = createInstallationTracker(storage, 'https://extension.biggo.com')
  assert.equal(await restarted.claim(sender), null)
  await restarted.recordInstall()
  assert.equal(await restarted.claim(sender), null)
})
test('rejects other origins, frames, pages and ordinary welcome visits', async () => {
  const {tracker} = fixture(); await tracker.recordInstall()
  for(const bad of [
    {...sender,url:'https://evil.example/welcome.php?is_install=true'},
    {...sender,frameId:1}, {...sender,url:'https://extension.biggo.com/welcome.php'},
    {...sender,url:'https://extension.biggo.com/help?is_install=true'},
    {...sender,url:'https://extension.biggo.com.evil.example/welcome?is_install=true'}
  ]) assert.equal(await tracker.claim(bad), null)
  assert.ok(await tracker.claim(sender))
})
test('storage failure must not authorize a conversion', async () => {
  const {tracker} = fixture(true)
  assert.equal(await tracker.recordInstall(), null)
  assert.equal(await tracker.claim(sender), null)
})

test('only installs less than 24 hours old are eligible, including after restart', async () => {
  for(const age of [0, INSTALL_CONVERSION_MAX_AGE_MS - 1, INSTALL_CONVERSION_MAX_AGE_MS,
    INSTALL_CONVERSION_MAX_AGE_MS + 1, 60 * INSTALL_CONVERSION_MAX_AGE_MS, -1]) {
    const {tracker, storage} = fixture()
    await tracker.recordInstall()
    const restarted = createInstallationTracker(storage, 'https://extension.biggo.com', () => 123 + age)
    const receipt = await restarted.claim(sender)
    assert.equal(!!receipt, age >= 0 && age < INSTALL_CONVERSION_MAX_AGE_MS, `age=${age}`)
    if(age >= INSTALL_CONVERSION_MAX_AGE_MS) {
      await restarted.recordInstall()
      assert.equal(await restarted.claim(sender), null, 'recordInstall must not refresh an expired install')
      assert.equal((await storage.getItem('installation_conversion_v1')).installedAt, 123)
    }
  }
})

test('missing and invalid installation times cannot convert', async () => {
  for(const installedAt of [undefined, null, 0, -1, NaN, Infinity, '123']) {
    const {tracker, storage} = fixture()
    await tracker.recordInstall()
    const record = await storage.getItem('installation_conversion_v1')
    await storage.setItem('installation_conversion_v1', {...record, installedAt})
    assert.equal(await tracker.claim(sender), null)
  }
})

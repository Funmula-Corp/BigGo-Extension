import * as storage from '@shared/storage'
import { uuid } from '../util.shared'
import {createInstallationTracker} from './installation'

// crypto.randomUUID needs Firefox 95+ / Chrome 92+; the MV2 manifest sets no minimum version.
const makeId = () => globalThis.crypto?.randomUUID ? crypto.randomUUID() : uuid()

export default createInstallationTracker(storage, `https://${process.env.API_DOMAIN}`, Date.now, makeId)

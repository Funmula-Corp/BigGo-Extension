import * as storage from '@shared/storage'
import {createInstallationTracker} from './installation'

export default createInstallationTracker(storage, `https://${process.env.API_DOMAIN}`)

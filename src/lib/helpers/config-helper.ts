import 'dotenv/config'
import path from 'path'
import { readYamlEnvSync } from 'yaml-env-defaults'

import isFileExist from '../utils/file'
import { IConfiguration } from '../../interface'

class ConfigHelper {
  async readConfig() {
    const configFilePath = path.join(process.cwd(), 'migration-config.yaml')

    if (!isFileExist(configFilePath)) {
      throw new Error(`Migration has not been initialized yet. Run 'mongo-migrate init' to initialize`)
    }

    const doc = readYamlEnvSync(configFilePath)
    return doc as IConfiguration
  }
}

export default new ConfigHelper()

import path from 'path'
import { readFile } from 'fs/promises'
import isFileExist from '../utils/file'
import { IConfiguration } from '../../interface'

class ConfigHelper {
  async readConfig() {
    const configFilePath = path.join(process.cwd(), 'mongo-migrate-config.json')

    if (!isFileExist(configFilePath)) {
      throw new Error(`Migration has not been initialized yet. Run 'mongo-migrate init' to initialize`)
    }

    const file = await readFile(configFilePath, { encoding: 'utf8' })
    return JSON.parse(file) as IConfiguration
  }
}

export default new ConfigHelper()

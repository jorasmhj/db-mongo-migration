import path from 'path'
import { readFile } from 'fs/promises'
import { IConfiguration } from '../../interface'
import isFileExist from '../utils/file'

class ConfigHelper {
  async readConfig() {
    const configFilePath = path.join(process.cwd(), 'mongo-migrate-config.json')

    if (!isFileExist(configFilePath)) {
      throw new Error('Migration has not been initialized yet')
    }

    const file = await readFile(configFilePath, { encoding: 'utf8' })
    return JSON.parse(file) as IConfiguration
  }
}

export default new ConfigHelper()

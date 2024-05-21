import path from 'path'
import { copyFileSync } from 'fs'

import isFileExist from '../utils/file'

export default async function init() {
  const source = path.join(__dirname, `../../samples/migration-config.yaml.txt`)
  const destination = path.join(process.cwd(), 'migration-config.yaml')

  const alreadyInitialized = isFileExist(destination)
  if (alreadyInitialized) return console.log('Migration already initialized')

  copyFileSync(source, destination)

  return console.log('Migration successfully initialized')
}

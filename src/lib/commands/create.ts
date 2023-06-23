import path from 'path'
import chalk from 'chalk'
import { copyFileSync, mkdirSync } from 'fs'

import isFileExist from '../utils/file'
import configHelper from '../helpers/config-helper'

export default async function create(name: string, options: any) {
  try {
    const config = await configHelper.readConfig()
    if (!config) return console.error('Migration not initialized yet.')

    const migrationDirPath = config.migrationsDir

    if (!isFileExist(migrationDirPath)) {
      mkdirSync(migrationDirPath)
    }

    const source = path.join(__dirname, `../../samples/migration.txt`)

    const currentTimestamp = new Date().getTime()
    const filename = `${migrationDirPath}/${currentTimestamp}-${name}.ts`
    const destination = path.join(process.cwd(), filename)

    copyFileSync(source, destination)

    return console.log(`${chalk.green('Migration created: ')}${filename}`)
  } catch (error: any) {
    console.log(error.toString())
    process.exit(1)
  }
}

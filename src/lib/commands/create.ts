import path from 'path'
import chalk from 'chalk'
import { copyFileSync, mkdirSync } from 'fs'

import isFileExist from '../utils/file'
import configHelper from '../helpers/config-helper'
import FileExtension from '../../enums/file-extension'
import { MIGRATION_NATIVE_FILE_PREFIX } from '../utils/migration-dir'

function resolveMigrationFile(fileExtension: FileExtension, options: any) {
  if (fileExtension === FileExtension.TS) {
    return options.native ? '../../samples/native-migration.txt' : '../../samples/migration.txt'
  } else {
    return options.native ? '../../samples/native-migration.js.txt' : '../../samples/migration.js.txt'
  }
}

export default async function create(name: string, options: any) {
  try {
    //DISABLED NATIVE FEATURE | Reason: Need to handle the global transaction commitment
    options.native = false

    const config = configHelper.readConfig()

    const migrationDirPath = config.migrationsDir
    const sampleFile = resolveMigrationFile(config.fileExtension, options)

    if (!isFileExist(migrationDirPath)) {
      mkdirSync(migrationDirPath)
    }

    const source = path.join(__dirname, sampleFile)

    const currentTimestamp = new Date().getTime()
    const native = options.native ? MIGRATION_NATIVE_FILE_PREFIX : ''
    const filename = `${migrationDirPath}/${currentTimestamp}${native}-${name}.${config.fileExtension}`
    const destination = path.join(process.cwd(), filename)

    copyFileSync(source, destination)

    return console.log(`${chalk.green('Migration created: ')}${filename}`)
  } catch (error: any) {
    console.log(error.toString())
    process.exit(1)
  }
}

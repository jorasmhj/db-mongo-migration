import path from 'path'
import chalk from 'chalk'
import * as tsImport from 'ts-import'
import { ClientSession, Db, MongoClient, ObjectId } from 'mongodb'

import DB from '../helpers/db-helper'
import configHelper from '../helpers/config-helper'
import { IMigration, IMigrationInfo, INativeMigration } from '../../interface'
import isFileExist, { removeDirectory } from '../utils/file'
import { getLatestMigrationBatch, getLatestMigrations, getMigrationForFile, nativeDetectionRegexPattern } from '../utils/migration-dir'
import { handleDbTransaction } from '../helpers/db-session-helper'

export default async function down(db: Db, dbClient: MongoClient, options: any) {
  try {
    const config = configHelper.readConfig()
    const migrationsToRollback = await getMigrationsToRollback(db, options)

    const uniqueMigrationIds = migrationsToRollback.map(m => m._id)

    await handleDbTransaction(dbClient, session => rollbackMigrations(migrationsToRollback, db, dbClient, config, options, session), options)

    await db.collection(config.changelogCollectionName).deleteMany({ _id: { $in: uniqueMigrationIds as unknown as ObjectId[] } })
  } finally {
    await removeDirectory('.cache', { recursive: true })
  }
}

async function rollbackMigrations(migrationsToRollback: IMigrationInfo[], db: Db, dbClient: MongoClient, config: any, options: any, session?: ClientSession) {
  const model = new DB(db, session)

  for (const appliedMigration of migrationsToRollback) {
    console.log(`${chalk.yellow(`Rolling back: `)} ${appliedMigration.fileName}`)
    const filePath = `${config.migrationsDir}/${appliedMigration.fileName}`
    if (!isFileExist(path.resolve(filePath))) {
      console.log(chalk.yellow(`${appliedMigration.fileName} not found, skipping..`))
      continue
    }

    if (nativeDetectionRegexPattern.test(appliedMigration.fileName)) {
      const { default: NativeMigration } = await import(path.resolve(filePath))
      const nativeMigration: INativeMigration = new NativeMigration()
      await nativeMigration.down(db, dbClient, options)
    } else {
      // const { default: Migration } = await tsImport.load(filePath)
      const { default: Migration } = await import(path.resolve(filePath))
      const migration: IMigration = new Migration()
      await migration.down(model)
    }

    console.log(`${chalk.green(`Rolled back:  `)} ${appliedMigration.fileName}`)
  }
}

async function getMigrationsToRollback(db: Db, options: any) {
  const migrationsToRollback = options.file
    ? await getMigrationForFile(options.file, db)
    : options.reset
      ? await getLatestMigrations(db, 0)
      : options.batch
        ? await getLatestMigrationBatch(db, options.batch)
        : await getLatestMigrations(db, options.steps)

  return migrationsToRollback
}

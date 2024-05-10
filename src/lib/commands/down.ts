import path from 'path'
import chalk from 'chalk'
import * as tsImport from 'ts-import'
import { ClientSession, Db, ObjectId } from 'mongodb'

import DB from '../helpers/db-helper'
import configHelper from '../helpers/config-helper'
import { IMigration, IMigrationDetail, IMigrationInfo, INativeMigration } from '../../interface'
import isFileExist, { removeDirectory } from '../utils/file'
import { MongoClient, getLatestMigrationBatch, getLatestMigrations, getMigrationForFile, nativeDetectionRegexPattern } from '../utils/migration-dir'
import { handleDbTransaction } from '../helpers/db-session-helper'

export default async function down(db: Db, dbClient: MongoClient, options: any) {
  try {
    dbClient.customOptions = options
    const config = configHelper.readConfig()
    const hasGlobalTransaction = config.useDefaultTransaction || options.dryRun ? true : false

    console.log(`${options.dryRun ? 'Dry run initiated!' : config.useDefaultTransaction ? 'Running with global session' : 'Running without global session'}\n`)

    const allMigrationsToRollback = await getMigrationsToRollback(db, options)
    const migrationsToRollback: IMigrationDetail[] = []
    const nativeMigrationsToRollback: IMigrationDetail[] = []

    //Separate out the custom migrations from the native once
    allMigrationsToRollback.forEach(m => {
      const filePath = `${config.migrationsDir}/${m.fileName}`
      if (isFileExist(path.resolve(filePath))) {
        const migrationData = { ...m, filePath }
        if (nativeDetectionRegexPattern.test(m.fileName)) nativeMigrationsToRollback.push(migrationData)
        else migrationsToRollback.push(migrationData)
      } else {
        console.log(chalk.yellow(`${m.fileName} not found, skipping..`))
      }
    })

    if (nativeMigrationsToRollback.length) {
      const uniqueMigrationIds = await rollbackMigrations(nativeMigrationsToRollback, db, dbClient)
      await db.collection(config.changelogCollectionName).deleteMany({ _id: { $in: uniqueMigrationIds as unknown as ObjectId[] } })
    }

    if (migrationsToRollback.length) {
      const uniqueMigrationIds = await (hasGlobalTransaction
        ? handleDbTransaction(dbClient, session => rollbackMigrationsWithSession(migrationsToRollback, db, dbClient, session))
        : rollbackMigrations(migrationsToRollback, db, dbClient))
      await db.collection(config.changelogCollectionName).deleteMany({ _id: { $in: uniqueMigrationIds as unknown as ObjectId[] } })
    }
  } finally {
    await removeDirectory('.cache', { recursive: true })
  }
}

async function rollbackMigrations(migrationsToRollback: IMigrationDetail[], db: Db, dbClient: MongoClient) {
  const model = new DB(db)
  const uniqueMigrationIds = []

  for (const appliedMigration of migrationsToRollback) {
    let isProcessed = true
    console.log(`${chalk.yellow(`Rolling back: `)} ${appliedMigration.fileName}`)

    try {
      // const { default: Migration } = await tsImport.load(filePath)
      const importedObject = await import(path.resolve(appliedMigration.filePath))

      if (nativeDetectionRegexPattern.test(appliedMigration.fileName)) {
        await downNativeMigration(importedObject, db, dbClient)
      } else {
        await downMigration(importedObject, model, dbClient)
      }
    } catch (err) {
      console.log(`${chalk.red(`Error: `)} ${err.message}`)
      isProcessed = false
    }

    if (isProcessed) {
      uniqueMigrationIds.push(appliedMigration._id)
      console.log(`${chalk.green(`Rolled back:  `)} ${appliedMigration.fileName}`)
    } else {
      console.log(`${chalk.red(`Roll back failed: `)} ${appliedMigration.fileName}`)
    }
  }

  return uniqueMigrationIds
}

async function rollbackMigrationsWithSession(migrationsToRollback: IMigrationDetail[], db: Db, dbClient: MongoClient, session: ClientSession) {
  const model = new DB(db, session)
  const uniqueMigrationIds = []
  for (const appliedMigration of migrationsToRollback) {
    console.log(`${chalk.yellow(`Rolling back: `)} ${appliedMigration.fileName}`)

    // const { default: Migration } = await tsImport.load(filePath)
    const importedObject = await import(path.resolve(appliedMigration.filePath))
    await downMigration(importedObject, model, dbClient)

    console.log(`${chalk.green(`Rolled back:  `)} ${appliedMigration.fileName}`)
    uniqueMigrationIds.push(appliedMigration._id)
  }

  return uniqueMigrationIds
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

async function downMigration({ default: Migration }: any, model: DB, dbClient: MongoClient) {
  const migration: IMigration = new Migration()
  if (migration.down.length > 1) await migration.down(model, dbClient)
  else await migration.down(model)
}

async function downNativeMigration({ default: NativeMigration }: any, db: Db, dbClient: MongoClient) {
  const nativeMigration: INativeMigration = new NativeMigration()
  await nativeMigration.down(db, dbClient)
}

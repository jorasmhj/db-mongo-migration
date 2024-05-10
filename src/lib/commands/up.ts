import path from 'path'
import chalk from 'chalk'
import * as tsImport from 'ts-import'
import { ClientSession, Db } from 'mongodb'

import status from './status'
import DB from '../helpers/db-helper'
import { removeDirectory } from '../utils/file'
import configHelper from '../helpers/config-helper'
import { IConfiguration, IMigration, IMigrationInfo, INativeMigration } from '../../interface'
import { MongoClient, nativeDetectionRegexPattern } from '../utils/migration-dir'
import { handleDbTransaction } from '../helpers/db-session-helper'

async function process(db: Db, dbClient: MongoClient, config: IConfiguration, unAppliedMigrations: IMigrationInfo[], batchId: any) {
  try {
    const migrationsToApply: IMigrationInfo[] = []

    const model = new DB(db)

    for (const unAppliedMigration of unAppliedMigrations) {
      let isProcessed = true
      try {
        const filePath = `${config.migrationsDir}/${unAppliedMigration.fileName}`

        console.log(`${chalk.yellow(`Migrating: `)} ${unAppliedMigration.fileName}`)
        // const { default: Migration } = await tsImport.load(path.resolve(filePath))
        const importedObject = await import(path.resolve(filePath))

        if (nativeDetectionRegexPattern.test(unAppliedMigration.fileName)) {
          await upNativeMigration(importedObject, db, dbClient)
        } else {
          await upMigration(importedObject, model, dbClient)
        }
      } catch (err) {
        console.log(`${chalk.red(`Error: `)} ${err.message}`)
        isProcessed = false
      }

      if (isProcessed) {
        migrationsToApply.push({ fileName: unAppliedMigration.fileName, appliedAt: new Date(), batchId })
        console.log(`${chalk.green(`Migrated:  `)} ${unAppliedMigration.fileName}`)
      } else {
        console.log(`${chalk.red(`Migration failed: `)} ${unAppliedMigration.fileName}`)
      }
    }
    return migrationsToApply
  } finally {
    await removeDirectory('.cache', { recursive: true })
  }
}

async function processWithSession(
  db: Db,
  dbClient: MongoClient,
  config: IConfiguration,
  unAppliedMigrations: IMigrationInfo[],
  batchId: any,
  session: ClientSession
) {
  const migrationsToApply: IMigrationInfo[] = []

  try {
    const model = new DB(db, session)

    for (const unAppliedMigration of unAppliedMigrations) {
      const filePath = `${config.migrationsDir}/${unAppliedMigration.fileName}`

      console.log(`${chalk.yellow(`Migrating: `)} ${unAppliedMigration.fileName}`)
      // const { default: Migration } = await tsImport.load(path.resolve(filePath))
      const importedObject = await import(path.resolve(filePath))
      await upMigration(importedObject, model, dbClient)

      console.log(`${chalk.green(`Migrated:  `)} ${unAppliedMigration.fileName}`)

      migrationsToApply.push({ fileName: unAppliedMigration.fileName, appliedAt: new Date(), batchId })
    }
  } finally {
    await removeDirectory('.cache', { recursive: true })
  }

  return migrationsToApply
}

export default async function up(db: Db, dbClient: MongoClient, options: any) {
  dbClient.customOptions = options
  const config = configHelper.readConfig()
  const hasGlobalTransaction = config.useDefaultTransaction || options.dryRun ? true : false

  console.log(`${options.dryRun ? 'Dry run initiated!' : config.useDefaultTransaction ? 'Running with global session' : 'Running without global session'}\n`)

  const allMigrations = await status(db, dbClient)
  const latestBatchId = allMigrations.filter(m => m.appliedAt !== 'PENDING')[0]
  const batchId = !latestBatchId?.batchId ? 1 : +latestBatchId.batchId + 1

  const unAppliedMigrations: IMigrationInfo[] = []
  const unAppliedNativeMigrations: IMigrationInfo[] = []

  //Separate out the custom migrations from the native once
  allMigrations.forEach(m => {
    if (options.file ? m.appliedAt === 'PENDING' && m.fileName === options.file : m.appliedAt === 'PENDING') {
      if (nativeDetectionRegexPattern.test(m.fileName)) {
        unAppliedNativeMigrations.push(m)
      } else {
        unAppliedMigrations.push(m)
      }
    }
  })

  if (unAppliedNativeMigrations.length) {
    const nativeMigrationToApply = await process(db, dbClient, config, unAppliedNativeMigrations, batchId)
    if (!options.dryRun && !!nativeMigrationToApply.length) {
      await db.collection(config.changelogCollectionName).insertMany(nativeMigrationToApply as any)
    }
  }

  if (unAppliedMigrations.length) {
    const migrationsToApply = await (hasGlobalTransaction
      ? handleDbTransaction(dbClient, session => processWithSession(db, dbClient, config, unAppliedMigrations, batchId, session))
      : process(db, dbClient, config, unAppliedMigrations, batchId))

    if (!options.dryRun && !!migrationsToApply.length) {
      await db.collection(config.changelogCollectionName).insertMany(migrationsToApply as any)
    }
  }
}

async function upMigration({ default: Migration }: any, model: DB, dbClient: MongoClient) {
  const migration: IMigration = new Migration()
  if (migration.up.length > 1) await migration.up(model, dbClient)
  else await migration.up(model)
}

async function upNativeMigration({ default: NativeMigration }: any, db: Db, dbClient: MongoClient) {
  const nativeMigration: INativeMigration = new NativeMigration()
  await nativeMigration.up(db, dbClient)
}

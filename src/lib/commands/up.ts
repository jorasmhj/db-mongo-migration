import path from 'path'
import chalk from 'chalk'
import { Db } from 'mongodb'
import * as tsImport from 'ts-import'

import status from './status'
import DB from '../helpers/db-helper'
import { removeDirectory } from '../utils/file'
import configHelper from '../helpers/config-helper'
import { handleDbTransaction } from '../helpers/db-session-helper'
import { IMigration, IMigrationDetail, IMigrationOptions, INativeMigration } from '../../interface'
import { MongoClient, getEffectiveMigrationsDir, nativeDetectionRegexPattern } from '../utils/migration-dir'

export default async function up(db: Db, dbClient: MongoClient, options: IMigrationOptions) {
  dbClient.customOptions = options
  const config = configHelper.readConfig()
  const hasGlobalTransaction = config.useDefaultTransaction || options.dryRun ? true : false

  console.log(
    `${chalk.blueBright(`${options.dryRun ? 'Dry run initiated!' : config.useDefaultTransaction ? 'Running with global session' : 'Running without global session'}`)} \n`
  )

  const allMigrations = await status(db)
  const migrationDirPath = getEffectiveMigrationsDir()
  const latestBatchId = allMigrations.filter(m => m.appliedAt !== 'PENDING')[0]
  const batchId = !latestBatchId?.batchId ? 1 : +latestBatchId.batchId + 1

  const unAppliedMigrations: IMigrationDetail[] = allMigrations
    .filter(m => (options.file ? m.appliedAt === 'PENDING' && m.fileName === options.file : m.appliedAt === 'PENDING'))
    .map(m => ({ ...m, filePath: `${migrationDirPath}/${m.fileName}` }) as IMigrationDetail)

  if (unAppliedMigrations.length) {
    await (hasGlobalTransaction
      ? handleDbTransaction(dbClient, async session => {
          dbClient.globalSession = session
          return await process(db, dbClient, unAppliedMigrations, batchId)
        })
      : process(db, dbClient, unAppliedMigrations, batchId))
  }
}

async function process(db: Db, dbClient: MongoClient, unAppliedMigrations: IMigrationDetail[], batchId: number) {
  try {
    const config = configHelper.readConfig()
    const model = new DB(db, dbClient.globalSession)

    for (const unAppliedMigration of unAppliedMigrations) {
      let isProcessed = true
      try {
        console.log(`${chalk.yellow(`Migrating: `)} ${unAppliedMigration.fileName}`)
        const migrationObject = await tsImport.load(path.resolve(unAppliedMigration.filePath), {
          mode: tsImport.LoadMode.Compile
        })

        if (nativeDetectionRegexPattern.test(unAppliedMigration.fileName)) {
          await upNativeMigration(migrationObject, db, dbClient)
        } else {
          await upMigration(migrationObject, model, dbClient)
        }
      } catch (err) {
        if (dbClient.globalSession) throw err
        else {
          console.log(`${chalk.red(`Error: `)} ${err.message}`)
          isProcessed = false
        }
      }

      if (isProcessed) {
        const appliedMigration = { fileName: unAppliedMigration.fileName, appliedAt: new Date(), batchId }
        await db.collection(config.changelogCollectionName).insertOne(appliedMigration, { session: dbClient.globalSession })
        console.log(`${chalk.green(`Migrated:  `)} ${unAppliedMigration.fileName}`)
      } else {
        console.log(`${chalk.red(`Migration failed: `)} ${unAppliedMigration.fileName}`)
      }
    }
  } finally {
    await removeDirectory('.cache', { recursive: true })
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

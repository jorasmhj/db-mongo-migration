import path from 'path'
import chalk from 'chalk'
import * as tsImport from 'ts-import'
import { ClientSession, Db, MongoClient, ObjectId } from 'mongodb'

import DB from '../helpers/db-helper'
import configHelper from '../helpers/config-helper'
import { IMigration, IMigrationInfo } from '../../interface'
import isFileExist, { removeDirectory } from '../utils/file'
import { getLatestMigrationBatch, getLatestMigrations, getMigrationForFile } from '../utils/migration-dir'

export default async function down(db: Db, dbClient: MongoClient, options: any) {
  const useDefaultTransaction = configHelper.readConfig().useDefaultTransaction ?? false
  const hasGlobalTransaction = useDefaultTransaction || options.dryRun

  let session = undefined
  if (hasGlobalTransaction) {
    session = dbClient.startSession()
    session.startTransaction()
  }

  try {
    const config = configHelper.readConfig()
    const migrationsToRollback = await getMigrationsToRollback(db, options)

    await rollbackMigrations(migrationsToRollback, db, config, session)

    if (hasGlobalTransaction) {
      if (options.dryRun) {
        await session?.abortTransaction()
        console.log(chalk.green('Dry run completed sucessfully'))
      } else {
        await session?.commitTransaction()
        console.log(chalk.green('Migration rollback sucessfully'))
      }
    }
  } catch (error: any) {
    if (hasGlobalTransaction) await session?.abortTransaction()
    dbClient.close()

    throw error
  } finally {
    if (hasGlobalTransaction) session?.endSession()
    await removeDirectory('.cache', { recursive: true })
  }
}

async function rollbackMigrations(migrationsToRollback: IMigrationInfo[], db: Db, config: any, session?: ClientSession) {
  const model = new DB(db, session)
  const uniquemigrationIds = migrationsToRollback.map(m => m._id)

  for (const appliedMigration of migrationsToRollback) {
    console.log(`${chalk.yellow(`Rolling back: `)} ${appliedMigration.fileName}`)
    if (!isFileExist(path.resolve(`${config.migrationsDir}/${appliedMigration.fileName}`))) {
      console.log(chalk.yellow(`${appliedMigration.fileName} not found, skipping..`))
      continue
    }

    const { default: Migration } = await tsImport.load(path.resolve(`${config.migrationsDir}/${appliedMigration.fileName}`))
    const migration: IMigration = new Migration()

    await migration.down(model)
    console.log(`${chalk.green(`Rolled back:  `)} ${appliedMigration.fileName}`)
  }

  await db.collection(config.changelogCollectionName).deleteMany({ _id: { $in: uniquemigrationIds as unknown as ObjectId[] } }, { session })

  return uniquemigrationIds
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

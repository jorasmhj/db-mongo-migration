import path from 'path'
import chalk from 'chalk'
import * as tsImport from 'ts-import'
import { Db, MongoClient } from 'mongodb'

import status from './status'
import DB from '../helpers/db-helper'
import { removeDirectory } from '../utils/file'
import configHelper from '../helpers/config-helper'
import { IMigration, IMigrationInfo } from '../../interface'
import { randomUUID } from 'crypto'

export default async function up(db: Db, dbClient: MongoClient, options: any) {
  const session = dbClient.startSession()
  session.startTransaction()

  try {
    const config = await configHelper.readConfig()

    const allMigrations = await status(db)
    const unAppliedMigrations = allMigrations.filter(m => {
      return options.file ? m.appliedAt === 'PENDING' && m.fileName === options.file : m.appliedAt === 'PENDING'
    })

    // const latestBatchId = allMigrations.filter(m => m.appliedAt !== 'PENDING')[0]
    // const batchId = (!latestBatchId?.batchId ? 1 : +latestBatchId.batchId + 1).toString()
    const batchId = randomUUID()

    const migrationsToApply: IMigrationInfo[] = []

    const model = new DB(db, session)

    for (const unAppliedMigration of unAppliedMigrations) {
      const filePath = `${config.migrationsDir}/${unAppliedMigration.fileName}`
      const { default: Migration } = await import(path.resolve(filePath))

      // const { default: Migration } = await tsImport.load(path.resolve(filePath))
      const migration: IMigration = new Migration()

      console.log(`${chalk.yellow(`Migrating: `)} ${unAppliedMigration.fileName}`)
      await migration.up(model)
      console.log(`${chalk.green(`Migrated:  `)} ${unAppliedMigration.fileName}`)

      migrationsToApply.push({
        fileName: unAppliedMigration.fileName,
        appliedAt: new Date(),
        batchId
      })
    }

    await db.collection(config.changelogCollectionName).insertMany(migrationsToApply as any, { session })

    if (options.dryRun) {
      await session.abortTransaction()
      console.log(chalk.green('Dry run completed sucessfully'))
    } else {
      await session.commitTransaction()
      console.log(chalk.green('Migration completed sucessfully'))
    }
    session.endSession()

    await removeDirectory('.cache', { recursive: true })
  } catch (error: any) {
    await session.abortTransaction()
    await removeDirectory('.cache', { recursive: true })
    dbClient.close()

    throw error
  }
}

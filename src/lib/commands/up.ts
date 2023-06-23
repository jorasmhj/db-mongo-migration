import path from 'path'
import chalk from 'chalk'
import { rm } from 'fs/promises'
import { randomUUID } from 'crypto'
import * as tsImport from 'ts-import'
import { Db, MongoClient } from 'mongodb'

import status from './status'
import DB from '../helpers/db-helper'
import configHelper from '../helpers/config-helper'
import { IMigration, IMigrationInfo } from '../../interface'

export default async function up(db: Db, dbClient: MongoClient, options: any) {
  const config = await configHelper.readConfig()
  if (!config) return console.error('Migration not initialized yet.')

  const allMigrations = await status(db)
  const unAppliedMigrations = allMigrations.filter(m => m.appliedAt === 'PENDING')

  const session = dbClient.startSession()
  session.startTransaction()

  try {
    const batchId = randomUUID()
    const migrationsToApply: IMigrationInfo[] = []

    const model = new DB(db, session)

    for (const unAppliedMigration of unAppliedMigrations) {
      const { default: Migration } = await tsImport.load(
        path.resolve(`${config.migrationsDir}/${unAppliedMigration.fileName}`)
      )
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

    await rm(path.resolve(`.cache`), { recursive: true })
  } catch (error: any) {
    await session.abortTransaction()
    await rm(path.resolve(`.cache`), { recursive: true })
    dbClient.close()

    throw error
  }
}

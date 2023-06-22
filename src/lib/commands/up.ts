import path from 'path'
import { randomUUID } from 'crypto'
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
      const { default: Migration } = await import(
        path.resolve(`${config.migrationsDir}/${unAppliedMigration.fileName}`)
      )
      const migration: IMigration = new Migration()

      console.log(`Migrating: ${unAppliedMigration.fileName}`)
      await migration.up(model)
      console.log(`Migrated: ${unAppliedMigration.fileName}`)

      migrationsToApply.push({
        fileName: unAppliedMigration.fileName,
        appliedAt: new Date(),
        batchId
      })
    }

    await db.collection(config.changelogCollectionName).insertMany(migrationsToApply as any, { session })

    if (options.dryRun) {
      await session.abortTransaction()
      console.log('Dry run completed sucessfully')
    } else {
      await session.commitTransaction()
      console.log('Migration completed sucessfully')
    }
    session.endSession()
  } catch (error: any) {
    console.log(error.toString())
    await session.abortTransaction()
    dbClient.close()
  }
}

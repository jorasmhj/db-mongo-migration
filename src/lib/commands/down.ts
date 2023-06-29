import path from 'path'
import chalk from 'chalk'
import * as tsImport from 'ts-import'
import { Db, MongoClient, ObjectId } from 'mongodb'

import DB from '../helpers/db-helper'
import { IMigration } from '../../interface'
import { removeDirectory } from '../utils/file'
import configHelper from '../helpers/config-helper'
import { getLatestMigrationBatch, getLatestMigrations } from '../utils/migration-dir'

export default async function down(db: Db, dbClient: MongoClient, options: any) {
  const config = await configHelper.readConfig()
  if (!config) return console.error('Migration not initialized yet.')

  const migrationsToRollback = options.batch
    ? await getLatestMigrationBatch(db, options.batch)
    : await getLatestMigrations(db, options.steps)

  const uniquemigrationIds = migrationsToRollback.map(m => m._id)

  const session = dbClient.startSession()
  session.startTransaction()

  try {
    const model = new DB(db, session)

    for (const appliedMigration of migrationsToRollback) {
      const { default: Migration } = await tsImport.load(
        path.resolve(`${config.migrationsDir}/${appliedMigration.fileName}`)
      )
      const migration: IMigration = new Migration()

      console.log(`${chalk.yellow(`Rolling back: `)} ${appliedMigration.fileName}`)
      await migration.down(model)
      console.log(`${chalk.green(`Rolled back:  `)} ${appliedMigration.fileName}`)
    }

    await db.collection(config.changelogCollectionName).deleteMany(
      {
        _id: { $in: uniquemigrationIds as unknown as ObjectId[] }
      },
      { session }
    )

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
    await removeDirectory('.cache', { recursive: true })
    await session.abortTransaction()
    dbClient.close()

    throw error
  }
}

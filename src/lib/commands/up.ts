import path from 'path'
import chalk from 'chalk'
import * as tsImport from 'ts-import'
import { Db, MongoClient } from 'mongodb'

import status from './status'
import DB from '../helpers/db-helper'
import { IMigration } from '../../interface'
import { removeDirectory } from '../utils/file'
import configHelper from '../helpers/config-helper'

export default async function up(db: Db, dbClient: MongoClient, options: any) {
  const config = configHelper.readConfig()
  const useDefaultTransaction = config.useDefaultTransaction ?? false
  const hasGlobalTransaction = useDefaultTransaction || options.dryRun

  let session = undefined
  if (hasGlobalTransaction) {
    session = dbClient.startSession()
    session.startTransaction()
  }
  console.log(`Running ${session ? 'with' : 'without'} global session \n`)

  try {
    const allMigrations = await status(db)
    const unAppliedMigrations = allMigrations.filter(m => {
      return options.file ? m.appliedAt === 'PENDING' && m.fileName === options.file : m.appliedAt === 'PENDING'
    })

    const latestBatchId = allMigrations.filter(m => m.appliedAt !== 'PENDING')[0]
    const batchId = !latestBatchId?.batchId ? 1 : +latestBatchId.batchId + 1

    const model = new DB(db, session)

    for (const unAppliedMigration of unAppliedMigrations) {
      const filePath = `${config.migrationsDir}/${unAppliedMigration.fileName}`

      const { default: Migration } = await tsImport.load(path.resolve(filePath))
      const migration: IMigration = new Migration()

      console.log(`${chalk.yellow(`Migrating: `)} ${unAppliedMigration.fileName}`)
      await migration.up(model)
      console.log(`${chalk.green(`Migrated:  `)} ${unAppliedMigration.fileName}`)

      await db.collection(config.changelogCollectionName).insertOne(
        {
          fileName: unAppliedMigration.fileName,
          appliedAt: new Date(),
          batchId
        },
        { session }
      )
    }

    if (hasGlobalTransaction) {
      if (options.dryRun) {
        await session?.abortTransaction()
        console.log(chalk.green('Dry run completed sucessfully'))
      } else {
        await session?.commitTransaction()
        console.log(chalk.green('Migration completed sucessfully'))
      }
      session?.endSession()
    }

    await removeDirectory('.cache', { recursive: true })
  } catch (error: any) {
    if (hasGlobalTransaction) await session?.abortTransaction()

    await removeDirectory('.cache', { recursive: true })

    throw error
  } finally {
    dbClient.close()
  }
}

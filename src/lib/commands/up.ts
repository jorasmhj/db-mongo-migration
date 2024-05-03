import path from 'path'
import chalk from 'chalk'
import * as tsImport from 'ts-import'
import { ClientSession, Db, MongoClient } from 'mongodb'

import status from './status'
import DB from '../helpers/db-helper'
import { removeDirectory } from '../utils/file'
import configHelper from '../helpers/config-helper'
import { IConfiguration, IMigration, IMigrationInfo, INativeMigration } from '../../interface'
import { nativeDetectionRegexPattern } from '../utils/migration-dir'
import { handleDbTransaction } from '../helpers/db-session-helper'

async function process(db: Db, dbClient: MongoClient, config: IConfiguration, options: any, session?: ClientSession) {
  try {
    const allMigrations = await status(db, options)
    const unAppliedMigrations = allMigrations.filter(m => {
      return options.file ? m.appliedAt === 'PENDING' && m.fileName === options.file : m.appliedAt === 'PENDING'
    })

    const latestBatchId = allMigrations.filter(m => m.appliedAt !== 'PENDING')[0]
    const batchId = !latestBatchId?.batchId ? 1 : +latestBatchId.batchId + 1

    const migrationsToApply: IMigrationInfo[] = []

    const model = new DB(db, session)

    for (const unAppliedMigration of unAppliedMigrations) {
      const filePath = `${config.migrationsDir}/${unAppliedMigration.fileName}`

      console.log(`${chalk.yellow(`Migrating: `)} ${unAppliedMigration.fileName}`)
      if (nativeDetectionRegexPattern.test(unAppliedMigration.fileName)) {
        const { default: NativeMigration } = await import(path.resolve(filePath))
        const nativeMigration: INativeMigration = new NativeMigration()
        await nativeMigration.up(db, dbClient, options)
      } else {
        // const { default: Migration } = await tsImport.load(path.resolve(filePath))
        const { default: Migration } = await import(path.resolve(filePath))
        const migration: IMigration = new Migration()
        await migration.up(model)
      }
      console.log(`${chalk.green(`Migrated:  `)} ${unAppliedMigration.fileName}`)

      migrationsToApply.push({ fileName: unAppliedMigration.fileName, appliedAt: new Date(), batchId })
    }

    return migrationsToApply
  } finally {
    await removeDirectory('.cache', { recursive: true })
  }
}

export default async function up(db: Db, dbClient: MongoClient, options: any) {
  const config = configHelper.readConfig()

  const migrationsToApply = await handleDbTransaction(dbClient, session => process(db, dbClient, config, options, session), options)

  if (!!migrationsToApply.length && !options.dryRun) {
    await db.collection(config.changelogCollectionName).insertMany(migrationsToApply as any)
  }
}

// export default async function up(db: Db, dbClient: MongoClient, options: any) {
//   const session = dbClient.startSession()
//   session.startTransaction()

//   try {
//     const config = configHelper.readConfig()

//     const allMigrations = await status(db)
//     const unAppliedMigrations = allMigrations.filter(m => {
//       return options.file ? m.appliedAt === 'PENDING' && m.fileName === options.file : m.appliedAt === 'PENDING'
//     })

//     const latestBatchId = allMigrations.filter(m => m.appliedAt !== 'PENDING')[0]
//     const batchId = !latestBatchId?.batchId ? 1 : +latestBatchId.batchId + 1

//     const migrationsToApply: IMigrationInfo[] = []

//     const model = new DB(db, session)

//     for (const unAppliedMigration of unAppliedMigrations) {
//       const filePath = `${config.migrationsDir}/${unAppliedMigration.fileName}`
//       const { default: Migration } = await import(path.resolve(filePath))

//       // const { default: Migration } = await tsImport.load(path.resolve(filePath))
//       const migration: IMigration = new Migration()

//       console.log(`${chalk.yellow(`Migrating: `)} ${unAppliedMigration.fileName}`)
//       await migration.up(model)
//       console.log(`${chalk.green(`Migrated:  `)} ${unAppliedMigration.fileName}`)

//       migrationsToApply.push({
//         fileName: unAppliedMigration.fileName,
//         appliedAt: new Date(),
//         batchId
//       })
//     }

//     if (!!migrationsToApply.length) {
//       await db.collection(config.changelogCollectionName).insertMany(migrationsToApply as any, { session })
//     }

//     if (options.dryRun) {
//       await session.abortTransaction()
//       console.log(chalk.green('Dry run completed successfully'))
//     } else {
//       await session.commitTransaction()
//       console.log(chalk.green('Migration completed successfully'))
//     }
//     session.endSession()

//     await removeDirectory('.cache', { recursive: true })
//   } catch (error: any) {
//     await session.abortTransaction()
//     await removeDirectory('.cache', { recursive: true })
//     dbClient.close()

//     throw error
//   }
// }

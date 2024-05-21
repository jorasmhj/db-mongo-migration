import { ClientSession, Db, MongoClient as DbClient } from 'mongodb'
import { mkdirSync } from 'fs'
import { readdir } from 'fs/promises'

import isFileExist from './file'
import { IMigrationInfo, IOption } from '../../interface'
import configHelper from '../helpers/config-helper'

export const MIGRATION_NATIVE_FILE_PREFIX = '_nat'
export const nativeDetectionRegexPattern: RegExp = new RegExp(`^\\d{13}${MIGRATION_NATIVE_FILE_PREFIX}-(.+)`)

export type MongoClient = DbClient & { customOptions?: IOption; globalSession?: ClientSession }

export async function migrationDirExist() {
  const config = configHelper.readConfig()
  if (!config) return console.error('Migration not initialized yet.')

  const migrationDirPath = config.migrationsDir

  return isFileExist(migrationDirPath)
}

export async function createMigrationDir() {
  const config = configHelper.readConfig()
  if (!config) return console.error('Migration not initialized yet.')

  const migrationDirPath = config.migrationsDir
  mkdirSync(migrationDirPath)
}

export async function getMigrationFiles() {
  const config = configHelper.readConfig()
  if (!config) throw console.error('Migration not initialized yet.')

  const migrationDirPath = config.migrationsDir
  const files = await readdir(migrationDirPath)

  return files.sort()
}

export async function getAppliedMigrations(db: Db): Promise<IMigrationInfo[]> {
  const config = configHelper.readConfig()
  if (!config) throw console.error('Migration not initialized yet.')

  return db.collection(config.changelogCollectionName).find({}).sort({ _id: -1 }).toArray() as unknown as Promise<IMigrationInfo[]>
}

export async function getLatestMigrationBatch(db: Db, limit: number = 1) {
  const config = configHelper.readConfig()
  if (!config) throw console.error('Migration not initialized yet.')

  const distinctBatches = (await db
    .collection(config.changelogCollectionName)
    .aggregate([
      { $sort: { _id: -1 } },
      { $limit: limit },
      {
        $group: {
          _id: '$batchId',
          doc: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$doc' } }
    ])
    .toArray()) as unknown as IMigrationInfo[]

  return db
    .collection(config.changelogCollectionName)
    .find({ batchId: { $in: distinctBatches.map(m => m.batchId) } })
    .sort({ _id: -1 })
    .toArray() as unknown as Promise<IMigrationInfo[]>
}

export async function getLatestMigrations(db: Db, limit: number = 1) {
  const config = configHelper.readConfig()
  if (!config) throw console.error('Migration not initialized yet.')

  return db.collection(config.changelogCollectionName).find({}).sort({ _id: -1 }).limit(limit).toArray() as unknown as Promise<IMigrationInfo[]>
}

export async function getMigrationForFile(fileName: string, db: Db) {
  const config = configHelper.readConfig()

  return db.collection(config.changelogCollectionName).find({ fileName }).toArray() as unknown as Promise<IMigrationInfo[]>
}

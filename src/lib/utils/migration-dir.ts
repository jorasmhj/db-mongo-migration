import { Db } from 'mongodb'
import { mkdirSync } from 'fs'
import { readdir } from 'fs/promises'

import isFileExist from './file'
import { IMigrationInfo } from '../../interface'
import configHelper from '../helpers/config-helper'

export async function migrationDirExist() {
  const config = await configHelper.readConfig()
  if (!config) return console.error('Migration not initialized yet.')

  const migrationDirPath = config.migrationsDir

  return isFileExist(migrationDirPath)
}

export async function createMigrationDir() {
  const config = await configHelper.readConfig()
  if (!config) return console.error('Migration not initialized yet.')

  const migrationDirPath = config.migrationsDir
  mkdirSync(migrationDirPath)
}

export async function getMigrationFiles() {
  const config = await configHelper.readConfig()
  if (!config) throw console.error('Migration not initialized yet.')

  const migrationDirPath = config.migrationsDir
  const files = await readdir(migrationDirPath)

  return files.sort()
}

export async function getAppliedMigrations(db: Db): Promise<IMigrationInfo[]> {
  const config = await configHelper.readConfig()
  if (!config) throw console.error('Migration not initialized yet.')

  return db.collection(config.changelogCollectionName).find({}).sort({ _id: -1 }).toArray() as unknown as Promise<
    IMigrationInfo[]
  >
}

export async function getLatestMigrationBatch(db: Db, limit: number = 1) {
  const config = await configHelper.readConfig()
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
  const config = await configHelper.readConfig()
  if (!config) throw console.error('Migration not initialized yet.')

  return db
    .collection(config.changelogCollectionName)
    .find({})
    .sort({ _id: -1 })
    .limit(limit)
    .toArray() as unknown as Promise<IMigrationInfo[]>
}

export async function getMigrationForFile(fileName: string, db: Db) {
  const config = await configHelper.readConfig()

  return db.collection(config.changelogCollectionName).find({ fileName }).toArray() as unknown as Promise<
    IMigrationInfo[]
  >
}

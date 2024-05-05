import { Db } from 'mongodb'

import { IMigrationStatus } from '../../interface'
import configHelper from '../helpers/config-helper'
import { getAppliedMigrations, getMigrationFiles } from '../utils/migration-dir'

export default async function status(db: Db, options?: any) {
  const config = configHelper.readConfig()
  let [migrationFiles, appliedMigrations] = await Promise.all([getMigrationFiles(), getAppliedMigrations(db)])

  const uniqueBatches = [...new Set(appliedMigrations.map(m => m.batchId))]

  if (uniqueBatches[0] && isNaN(uniqueBatches[0] as unknown as number)) {
    const updateBatchIdToNumeric = uniqueBatches.reverse().map((m, index) => {
      return {
        updateMany: {
          filter: { batchId: m },
          update: { $set: { batchId: index + 1 } }
        }
      }
    })

    await db.collection(config.changelogCollectionName).bulkWrite(updateBatchIdToNumeric)
    appliedMigrations = await getAppliedMigrations(db)
  }

  const unAppliedMigrations: IMigrationStatus[] = migrationFiles.reduce((acc: IMigrationStatus[], file: string) => {
    const migrated = appliedMigrations.find(f => f.fileName === file)
    if (!migrated) acc.push({ fileName: file, appliedAt: 'PENDING', batchId: 'N/A' })

    return acc
  }, [])

  return [
    ...unAppliedMigrations,
    ...appliedMigrations.map(m => ({ fileName: m.fileName, appliedAt: m.appliedAt + '', batchId: m.batchId }))
  ]
}

import { Db } from 'mongodb'

import { IMigrationStatus } from '../../interface'
import { getAppliedMigrations, getMigrationFiles } from '../utils/migration-dir'

export default async function status(db: Db, options?: any) {
  const migrationFiles = await getMigrationFiles()
  const appliedMigrations = await getAppliedMigrations(db)

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
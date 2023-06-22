import { Db } from 'mongodb'

import { IMigrationInfo } from '../../interface'
import { getAppliedMigrations, getMigrationFiles } from '../utils/migration-dir'

export default async function status(db: Db, options?: any) {
  const migrationFiles = await getMigrationFiles()
  const appliedMigrations = await getAppliedMigrations(db)

  const migrations: IMigrationInfo[] = migrationFiles.reduce((acc: IMigrationInfo[], file: string) => {
    const migrated = appliedMigrations.find(f => f.fileName === file)
    if (!migrated) acc.push({ fileName: file, appliedAt: 'PENDING' })

    return acc
  }, appliedMigrations)

  const sortedMigrations = migrations
    .map(m => ({ fileName: m.fileName, appliedAt: m.appliedAt + '' }))
    .sort((a, b) => {
      if (a.appliedAt! < b.appliedAt!) return 1
      if (a.appliedAt! > b.appliedAt!) return -1
      return 0
    })

  return sortedMigrations
}

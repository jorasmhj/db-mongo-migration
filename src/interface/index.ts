import FileExtension from '../enums/file-extension'
import DB from '../lib/helpers/db-helper'

export interface IMigration {
  up: (db: DB) => Promise<any>
  down: (db: DB) => Promise<any>
}

export interface IConfiguration {
  'db-connection': IDbConnection
  useFileHash: boolean
  migrationsDir: string
  changelogCollectionName: string
  fileExtension?: FileExtension
  useDefaultTransaction?: boolean
}

export interface IDbConnection {
  url: string
  databaseName: string
  options: {
    useNewUrlParser?: boolean
    useUnifiedTopology?: boolean
  }
}

export interface IMigrationInfo {
  _id?: string
  fileName: string
  appliedAt?: Date | string
  batchId?: string | number
}

export interface IMigrationStatus {
  fileName: string
  appliedAt: string
  batchId: string
}

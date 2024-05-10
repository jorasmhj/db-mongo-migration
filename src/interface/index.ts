import { Db, MongoClient } from 'mongodb'
import FileExtension from '../enums/file-extension'
import DB from '../lib/helpers/db-helper'

export interface IOption {
  dryRun: boolean
}

export interface IMigration {
  up: (db: DB, dbClient?: MongoClient) => Promise<any>
  down: (db: DB, dbClient?: MongoClient) => Promise<any>
}

export interface INativeMigration {
  up: (db: Db, dbClient: MongoClient, options?: IOption) => Promise<any>
  down: (db: Db, dbClient: MongoClient, options?: IOption) => Promise<any>
}

export interface IConfiguration {
  'db-connection': IDbConnection
  useFileHash: boolean
  migrationsDir: string
  changelogCollectionName: string
  fileExtension?: FileExtension
  projectName?: string
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

export interface IMigrationDetail extends IMigrationInfo {
  filePath: string
}

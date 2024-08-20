#!/usr/bin/env node
import chalk from 'chalk'
import figlet from 'figlet'

import { Command } from 'commander'
import up from '../lib/commands/up'
import { MongoClient } from 'mongodb'
import init from '../lib/commands/init'
import down from '../lib/commands/down'
import create from '../lib/commands/create'
import status from '../lib/commands/status'
import { IMigrationOptions } from '../interface'
import configHelper from '../lib/helpers/config-helper'

const program = new Command()

// const { projectName } = configHelper.readConfig()
// const figletPrefix = projectName ? `${projectName}-` : ''

console.log(figlet.textSync('Mongo-Migrate'))

program.version('1.0.0')
program.command('init').description('Initialize migration config').action(init)

program.command('create [name]').option('-n --native', 'Create migration file for native Mongo DB operation').description('Create a migration').action(create)

program
  .command('status')
  .description('Get migration status')
  .action(async () => {
    try {
      const {
        'db-connection': { url, databaseName }
      } = configHelper.readConfig()
      const mongoClient = new MongoClient(url, { maxPoolSize: 5, minPoolSize: 0, maxIdleTimeMS: 5000 })
      const dbInstance = mongoClient.db(databaseName)
      await mongoClient.connect()
      const migrationStatus = await status(dbInstance)

      console.table(migrationStatus)
      process.exit(0)
    } catch (error: any) {
      console.error(chalk.red(error.toString()))
      process.exit(1)
    }
  })

program
  .command('up')
  .option('-f --file <filename>', 'Run migration for a specific file')
  .option('-d --dry-run', 'Run migration with a dry run')
  .description('Run migration')
  .action(async (options: IMigrationOptions) => {
    try {
      const {
        'db-connection': { url, databaseName }
      } = configHelper.readConfig()
      const mongoClient = new MongoClient(url, { maxPoolSize: 5, minPoolSize: 0, maxIdleTimeMS: 5000 })
      const dbInstance = mongoClient.db(databaseName)
      await mongoClient.connect()
      await up(dbInstance, mongoClient, options)
      process.exit(0)
    } catch (error: any) {
      console.error(chalk.red(error.toString()))
      process.exit(1)
    }
  })

program
  .command('down')
  .description('Rollback migrations')
  .option('-f --file <filename>', 'Run migration rollback for a specific file')
  .option('-d --dry-run', 'Run migration rollback with a dry run')
  .option('-r --reset', 'Reset migration')
  .option('-b --batch <number>', 'Number of batch to rollback')
  .option('-s --steps <number>', 'Number of steps to rollback')
  .action(async (options: IMigrationOptions) => {
    try {
      const opts: IMigrationOptions = {}
      const {
        'db-connection': { url, databaseName }
      } = configHelper.readConfig()

      const mongoClient = new MongoClient(url, { maxPoolSize: 5, minPoolSize: 0, maxIdleTimeMS: 5000 })
      const dbInstance = mongoClient.db(databaseName)
      await mongoClient.connect()

      if (options.file) opts.file = options.file
      if (options.dryRun) opts.dryRun = options.dryRun

      if (options.batch || options.steps || options.reset) {
        if (options.reset) opts.reset = options.reset
        else if (options.batch) opts.batch = +options.batch
        else opts.steps = +options.steps!
      } else {
        opts.batch = 1
      }

      await down(dbInstance, mongoClient, opts)
      process.exit(0)
    } catch (error: any) {
      console.error(chalk.red(error.toString()))
      process.exit(1)
    }
  })

program.parse(process.argv)

#!/usr/bin/env -S node -r "ts-node/register"
import chalk from 'chalk'
import figlet from 'figlet'

import { Command } from 'commander'
import up from '../lib/commands/up'
import { MongoClient } from 'mongodb'
import init from '../lib/commands/init'
import down from '../lib/commands/down'
import create from '../lib/commands/create'
import status from '../lib/commands/status'
import configHelper from '../lib/helpers/config-helper'

const program = new Command()

console.log(figlet.textSync('Mongo-Migrate'))

program.version('1.0.0')
program.command('init').description('Initialize migration config').action(init)

program.command('create [name]').description('Create a migration').action(create)

program
  .command('status')
  .description('Get migration status')
  .action(async options => {
    try {
      const {
        'db-connection': { url, databaseName }
      } = await configHelper.readConfig()
      const mongoClient = new MongoClient(url, { maxPoolSize: 5, minPoolSize: 0, maxIdleTimeMS: 5000 })
      const dbInstance = mongoClient.db(databaseName)
      await mongoClient.connect()
      const migrationStatus = await status(dbInstance, options)

      console.table(migrationStatus)
      process.exit(0)
    } catch (error: any) {
      console.error(chalk.red(error.toString()))
      process.exit(1)
    }
  })

program
  .command('up')
  .option('-d --dry-run', 'Run migration with a dry run')
  .description('Run migration')
  .action(async options => {
    try {
      const {
        'db-connection': { url, databaseName }
      } = await configHelper.readConfig()
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
  .option('-d --dry-run', 'Run migration rollback with a dry run')
  .option('-b --batch <number>', 'Number of batch to rollback')
  .option('-s --steps <number>', 'Number of steps to rollback')
  .action(async options => {
    try {
      const opts: any = {}
      const {
        'db-connection': { url, databaseName }
      } = await configHelper.readConfig()

      const mongoClient = new MongoClient(url, { maxPoolSize: 5, minPoolSize: 0, maxIdleTimeMS: 5000 })
      const dbInstance = mongoClient.db(databaseName)
      await mongoClient.connect()

      if (options.dryRun) opts.dryRun = options.dryRun

      if (options.batch || options.steps) {
        if (options.batch) opts.batch = +options.batch
        else opts.steps = +options.steps
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

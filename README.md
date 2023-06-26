# Db-Mongo-Migration

<p align="center">

[![Coverage Status](https://coveralls.io/repos/github/jorasmhj/db-mongo-migration/badge.svg?branch=master)](https://coveralls.io/r/jorasmhj/db-mongo-migration) [![NPM](https://img.shields.io/npm/v/db-mongo-migration.svg?style=flat)](https://www.npmjs.org/package/db-mongo-migration) [![Downloads](https://img.shields.io/npm/dm/db-mongo-migration.svg?style=flat)](https://www.npmjs.org/package/db-mongo-migration) [![Known Vulnerabilities](https://snyk.io/test/github/jorasmhj/db-mongo-migration/badge.svg)](https://snyk.io/test/github/jorasmhj/db-mongo-migration)

[![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/jorasmhj)

A command-line tool for running and managing MongoDB migrations.

</p>

## Installation

To install Db-Mongo-Migration, run the following command:

```
npm i db-mongo-migration
```

## CLI Usage

```
  __  __                               __  __ _                 _
 |  \/  | ___  _ __   __ _  ___       |  \/  (_) __ _ _ __ __ _| |_ ___
 | |\/| |/ _ \| '_ \ / _` |/ _ \ _____| |\/| | |/ _` | '__/ _` | __/ _ \
 | |  | | (_) | | | | (_| | (_) |_____| |  | | | (_| | | | (_| | ||  __/
 |_|  |_|\___/|_| |_|\__, |\___/      |_|  |_|_|\__, |_|  \__,_|\__\___|
                     |___/                      |___/
Usage: mongo-migration [options] [command]

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  init            Initialize migration config
  create [name]   Create a migration
  status          Get migration status
  up [options]    Run migration
  down [options]  Rollback migrations
  help [command]  display help for command
```

## Basic Usage

### Initialize Migration Config

To initialize the migration config, run the following command:

```
npx mongo-migrate init
```

This will create a `migration-config.yaml` file in the current directory.

```yaml
db-connection:
  url: ${URL}
  databaseName: ${DATABASE_NAME}
  options:
    useNewUrlParser: true
    useUnifiedTopology: true

migrationsDir: migrations
changelogCollectionName: migrations
```

You can use `.env` to auto populate the environment variables

### Create a Migration

To create a new migration, run the following command:

```
npx mongo-migrate create [name]
```

Replace `[name]` with the name of your migration. This will create a new migration file in the `migrations` directory.

### Get Migration Status

To get the status of your migrations, run the following command:

```
npx mongo-migrate status
```

This will display a table showing the status of each migration.

### Run Migrations

To run your migrations, run the following command:

```
npx mongo-migrate up
```

This will run all pending migrations.

#### Options

- `-f, -file <filename>`: Run migration for a specific file.
- `-d, --dry-run`: Run migration with a dry run.

### Rollback Migrations

To rollback your migrations, run the following command:

```
npx mongo-migrate down
```

This will rollback the last batch of migrations.

#### Options

- `-d, --dry-run`: Run migration rollback with a dry run.
- `-b, --batch <number>`: Number of batch to rollback.
- `-s, --steps <number>`: Number of steps to rollback.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

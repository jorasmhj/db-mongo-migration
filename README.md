# Db-Mongo-Migration

A command-line tool for running and managing MongoDB migrations.

## Installation

To install Db-Mongo-Migration, run the following command:

```
npm install db-mongo-migration
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

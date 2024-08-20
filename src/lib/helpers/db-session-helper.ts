import chalk from 'chalk'
import { IMigrationOptions } from '../../interface'
import { MongoClient } from '../utils/migration-dir'
import { ClientSession, ClientSessionOptions } from 'mongodb'

async function commitWithRetry(session: ClientSession, option?: IMigrationOptions) {
  try {
    if (option?.dryRun) {
      await session.abortTransaction()
      console.log(chalk.green('Dry run completed successfully'))
    } else {
      await session.commitTransaction()
      console.log(chalk.green('Migration completed successfully'))
    }
  } catch (error: any) {
    if (error.errorLabels && error.errorLabels.indexOf('UnknownTransactionCommitResult') >= 0) {
      console.log(`${chalk.yellow(`Retrying commit operation due to UnknownTransactionCommitResult...`)}`)
      await commitWithRetry(session, option)
    } else {
      throw error
    }
  }
}

/**
 * The function `handleTransaction` creates a MongoDB session, starts a transaction, executes
 * a callback function with the session, commits the transaction if successful, and ends the session.
 * @param callback - The `callback` parameter is a function that takes a `ClientSession` as an argument
 * and returns a value. This function is responsible for performing the desired operations within the
 * transaction.
 * @param clientSessionOption - Optional settings for the client session.
 * @returns The result of the callback function is being returned.
 * @throws An error if the transaction is aborted or fails.
 */
async function handleDbTransaction(dbClient: MongoClient, callback: (session: ClientSession) => any, clientSessionOption?: ClientSessionOptions) {
  if (dbClient) {
    const session = dbClient.startSession(clientSessionOption)
    session.startTransaction()
    try {
      const result = await callback(session)

      await commitWithRetry(session, dbClient.customOptions)
      await session.endSession()

      return result
    } catch (error: any) {
      console.log(`${chalk.red(`Transaction aborted! Caught exception during transaction.`)}`)

      // If transient error, retry the whole transaction
      if (error.errorLabels && error.errorLabels.indexOf('TransientTransactionError') >= 0) {
        console.log(`${chalk.yellow(`Retrying transaction due to TransientTransactionError...`)}`)

        return await handleDbTransaction(dbClient, callback, clientSessionOption)
      } else {
        await session.abortTransaction()
        await session.endSession()
        throw error
      }
    }
  }
}

export { handleDbTransaction }

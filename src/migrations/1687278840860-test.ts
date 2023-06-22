import { IMigration } from '../interface'
import DB from '../lib/helpers/db-helper'

class Migration implements IMigration {
  /**
   * Run the migrations.
   */
  async up(db: DB) {
    return await db.insertOne('otps', { code: '123' })
  }

  /**
   * Reverse the migrations.
   */
  async down(db: DB) {
    return await db.deleteOne('otps', { code: '123' })
  }
}

export default Migration

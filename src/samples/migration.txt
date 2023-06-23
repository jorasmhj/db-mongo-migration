import { IMigration, DB } from 'migrations-mongodb'

class Migration implements IMigration {
  /**
   * Run the migrations.
   */
  async up(db: DB) {}

  /**
   * Reverse the migrations.
   */
  async down(db: DB) {}
}

export default Migration

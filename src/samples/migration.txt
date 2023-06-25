import { IMigration, DB } from 'db-mongo-migration'

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

import {
  AggregateOptions,
  AnyBulkWriteOperation,
  BulkWriteOptions,
  ClientSession,
  CountDocumentsOptions,
  CreateCollectionOptions,
  CreateIndexesOptions,
  Db,
  DeleteOptions,
  Document,
  Filter,
  FindOneAndDeleteOptions,
  FindOneAndReplaceOptions,
  FindOneAndUpdateOptions,
  FindOptions,
  IndexDescription,
  IndexSpecification,
  InsertOneOptions,
  OptionalId,
  RunCommandOptions,
  UpdateFilter,
  UpdateOptions,
  WithoutId
} from 'mongodb'

class DB {
  constructor(
    public db: Db,
    private session?: ClientSession
  ) {}

  bulkWrite(collection: string, operations: AnyBulkWriteOperation<Document>[], options?: BulkWriteOptions) {
    return this.db.collection(collection).bulkWrite(operations, { ...options, session: this.session })
  }

  deleteMany(collection: string, filter?: Filter<Document>, options?: DeleteOptions) {
    return this.db.collection(collection).deleteMany(filter, { ...options, session: this.session })
  }

  deleteOne(collection: string, filter?: Filter<Document>, options?: DeleteOptions) {
    return this.db.collection(collection).deleteOne(filter, { ...options, session: this.session })
  }

  /**
   * create a collection (with options/settings).
   * Example usage: (create users collection with only one field - email)
   * db.createCollection("users", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["email"],
          additionalProperties: false,
          properties: {
            email: {
              bsonType: "string",
              pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", // Ensures a valid email format
              description: "Email must be a valid email address and is required."
            }
          }
        }
      },
      validationLevel: "strict",
      validationAction: "error"
    });

   * Visit https://www.mongodb.com/docs/manual/reference/command/create/ for more info
   * @param name - name of the collectino
   * @param options - collection creation settings
   */
  createCollection(name: string, options: CreateCollectionOptions) {
    return this.db.createCollection(name, { ...options, session: this.session });
  }

  createIndex(collection: string, indexSpec: IndexSpecification, options?: CreateIndexesOptions) {
    return this.db.collection(collection).createIndex(indexSpec, { ...options, session: this.session })
  }

  createIndexes(collection: string, indexSpecs: IndexDescription[], options?: CreateIndexesOptions) {
    return this.db.collection(collection).createIndexes(indexSpecs, { ...options, session: this.session })
  }

  aggregate(collection: string, pipeline?: Document[], options?: AggregateOptions) {
    return this.db.collection(collection).aggregate(pipeline, { ...options, session: this.session })
  }

  countDocuments(collection: string, filter?: Document, options?: CountDocumentsOptions) {
    return this.db.collection(collection).countDocuments(filter, { ...options, session: this.session })
  }

  find(collection: string, filter: Filter<Document>, options?: FindOptions<Document>) {
    return this.db.collection(collection).find(filter, { ...options, session: this.session })
  }

  findOne(collection: string, filter: Filter<Document>, options?: FindOptions<Document>) {
    return this.db.collection(collection).findOne(filter, { ...options, session: this.session })
  }

  findOneAndDelete(
    collection: string,
    filter: Filter<Document>,
    options: FindOneAndDeleteOptions & {
      includeResultMetadata: true
    }
  ) {
    return this.db.collection(collection).findOneAndDelete(filter, { ...options, session: this.session })
  }

  findOneAndReplace(
    collection: string,
    filter: Filter<Document>,
    replacement: WithoutId<Document>,
    options?: FindOneAndReplaceOptions & {
      includeResultMetadata: true
    }
  ) {
    return this.db.collection(collection).findOneAndReplace(filter, replacement, { ...options, session: this.session })
  }

  findOneAndUpdate(
    collection: string,
    filter: Filter<Document>,
    update: UpdateFilter<Document>,
    options: FindOneAndUpdateOptions & {
      includeResultMetadata: true
    }
  ) {
    return this.db.collection(collection).findOneAndUpdate(filter, update, { ...options, session: this.session })
  }

  insertOne(collection: string, doc: OptionalId<Document>, options?: InsertOneOptions) {
    return this.db.collection(collection).insertOne(doc, { ...options, session: this.session })
  }

  insertMany(collection: string, doc: OptionalId<Document>[], options?: BulkWriteOptions) {
    return this.db.collection(collection).insertMany(doc, { ...options, session: this.session })
  }

  /**
   * Run any command provided by mongodb
   * Example Usage (update schema for a collection):
   * db.runCommand({
      collMod: "collectionName",
      validator: {
        $jsonSchema: {
          // Updated schema definition
        }
      },
      validationLevel: "strict",
      validationAction: "error"
    });
   * 
   * @param command - the command to run
   * @param options - optional settings for the command
   */
  runCommand(command: Document, options?: RunCommandOptions) {
    return this.db.command(command, { ...options, session: this.session });
  }

  updateOne(collection: string, filter: Filter<Document>, update: UpdateFilter<Document>, options?: UpdateOptions) {
    return this.db.collection(collection).updateOne(filter, update, { ...options, session: this.session })
  }

  updateMany(collection: string, filter: Filter<Document>, update: UpdateFilter<Document>, options?: UpdateOptions) {
    return this.db.collection(collection).updateMany(filter, update, { ...options, session: this.session })
  }
}

export default DB

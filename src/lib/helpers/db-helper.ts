import {
  AnyBulkWriteOperation,
  ClientSession,
  Db,
  Document,
  Filter,
  IndexDescription,
  IndexSpecification,
  OptionalId,
  UpdateFilter,
  WithoutId
} from 'mongodb'

class DB {
  constructor(public db: Db, private session?: ClientSession) {}

  bulkWrite(collection: string, operations: AnyBulkWriteOperation<Document>[]) {
    return this.db.collection(collection).bulkWrite(operations, { session: this.session })
  }

  deleteMany(collection: string, filter?: Filter<Document>) {
    return this.db.collection(collection).deleteMany(filter, { session: this.session })
  }

  deleteOne(collection: string, filter?: Filter<Document>) {
    return this.db.collection(collection).deleteOne(filter, { session: this.session })
  }

  createIndex(collection: string, indexSpec: IndexSpecification) {
    return this.db.collection(collection).createIndex(indexSpec, { session: this.session })
  }

  createIndexes(collection: string, indexSpecs: IndexDescription[]) {
    return this.db.collection(collection).createIndexes(indexSpecs, { session: this.session })
  }

  aggregate(collection: string, pipeline?: Document[]) {
    return this.db.collection(collection).aggregate(pipeline, { session: this.session })
  }

  countDocuments(collection: string, filter?: Document) {
    return this.db.collection(collection).countDocuments(filter, { session: this.session })
  }

  find(collection: string, filter: Filter<Document>) {
    return this.db.collection(collection).find(filter, { session: this.session })
  }

  findOne(collection: string, filter: Filter<Document>) {
    return this.db.collection(collection).findOne(filter, { session: this.session })
  }

  findOneAndDelete(collection: string, filter: Filter<Document>) {
    return this.db.collection(collection).findOneAndDelete(filter, { session: this.session })
  }

  findOneAndReplace(collection: string, filter: Filter<Document>, replacement: WithoutId<Document>) {
    return this.db.collection(collection).findOneAndReplace(filter, replacement, { session: this.session })
  }

  findOneAndUpdate(collection: string, filter: Filter<Document>, update: UpdateFilter<Document>) {
    return this.db.collection(collection).findOneAndUpdate(filter, update, { session: this.session })
  }

  insertOne(collection: string, doc: OptionalId<Document>) {
    return this.db.collection(collection).insertOne(doc, { session: this.session })
  }

  insertMany(collection: string, doc: OptionalId<Document>[]) {
    return this.db.collection(collection).insertMany(doc, { session: this.session })
  }

  updateOne(collection: string, filter: Filter<Document>, update: UpdateFilter<Document>) {
    return this.db.collection(collection).updateOne(filter, update, { session: this.session })
  }

  updateMany(collection: string, filter: Filter<Document>, update: UpdateFilter<Document>) {
    return this.db.collection(collection).updateMany(filter, update, { session: this.session })
  }
}

export default DB

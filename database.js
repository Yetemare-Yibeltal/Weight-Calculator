const { MongoClient, ObjectId } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI || "");
const databaseName = process.env.MONGODB_DB_NAME || "weight_calculator";

let connection;

async function getCollection() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is missing");
  }

  if (!connection) {
    connection = client.connect().catch((error) => {
      connection = null;
      throw error;
    });
  }

  await connection;
  return client.db(databaseName).collection("conversions");
}

async function getConversions() {
  const collection = await getCollection();
  return collection.find({}).sort({ timestamp: -1 }).toArray();
}

async function createConversion({ weight, fromUnit, toUnit, result }) {
  const collection = await getCollection();

  const document = {
    weight: Number(weight),
    fromUnit,
    toUnit,
    result: Number(result),
    timestamp: new Date()
  };

  const saved = await collection.insertOne(document);
  return { id: saved.insertedId.toString() };
}

async function deleteConversion(id) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid conversion ID");
  }

  const collection = await getCollection();
  const deleted = await collection.deleteOne({ _id: new ObjectId(id) });

  if (!deleted.deletedCount) {
    throw new Error("Conversion not found");
  }

  return { success: true };
}

async function deleteAllConversions() {
  const collection = await getCollection();
  await collection.deleteMany({});
  return { success: true };
}

async function checkConnection() {
  const collection = await getCollection();
  await collection.database.command({ ping: 1 });
}

module.exports = {
  getConversions,
  createConversion,
  deleteConversion,
  deleteAllConversions,
  checkConnection
};

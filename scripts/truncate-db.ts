import { connect, disconnect } from 'mongoose';

const MONGODB_URI =
  'mongodb://root:root@localhost:27017/unii_exam_db?authSource=admin';

async function truncateDatabase() {
  try {
    // Connect to MongoDB
    const mongoose = await connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    console.log(`📋 Found ${collections.length} collections`);

    // Delete all documents in each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      // Skip system collections
      if (!collectionName.startsWith('system.')) {
        const result = await mongoose.connection.db
          .collection(collectionName)
          .deleteMany({});
        console.log(
          `🗑️  Truncated ${collectionName}: deleted ${result.deletedCount} documents`,
        );
      }
    }

    console.log('✨ Database truncated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error truncating database:', error);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

truncateDatabase();

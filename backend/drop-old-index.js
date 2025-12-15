// Drop old index from availabilities collection
const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'when3meet'
    });
    
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('availabilities');
    
    // List all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    // Drop the old email-based index
    try {
      await collection.dropIndex('eventId_1_email_1');
      console.log('✅ Dropped old index: eventId_1_email_1');
    } catch (err) {
      console.log('Index eventId_1_email_1 does not exist or already dropped');
    }
    
    // Create the correct index
    await collection.createIndex({ eventId: 1, userId: 1 }, { unique: true });
    console.log('✅ Created new index: eventId_1_userId_1');
    
    console.log('\nFinal indexes:');
    const finalIndexes = await collection.indexes();
    console.log(finalIndexes);
    
    await mongoose.connection.close();
    console.log('\n✅ Done! Restart your backend server.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

dropOldIndex();

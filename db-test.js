const {MongoClient} = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DATABASE_NAME = 'account-db';

async function main(){
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(DATABASE_NAME);
    const users = db.collection('users');
    console.log('จำนวนสมาชิกทั้งหมด:', await users.countDocuments());

    await client.close();
}

main().catch(console.error);
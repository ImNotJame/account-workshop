const express = require('express');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DATABASE_NAME = 'account-db';
const PORT = 3000;

const app = express();
app.use(express.json());
app.use(express.static('public'));

let users = null;
const HIDE_PASSWORD = { projection: { passwordHash: 0 } };

// POSTT /api/register
app.post('/api/register', async (req, res) => {
    const { username, name, email, password } = req.body;
    if (!username || !name || !email || !password) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    if(!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({ error: 'ชื่อผู้ใช้ต้องมีความยาว 3-20 ตัวอักษร และประกอบด้วยตัวอักษรภาษาอังกฤษ ตัวเลข หรือ _ เท่านั้น' });
    }
    if(password.length < 8) {
        return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' });
    }

    const user = {username, name, email: email.toLowerCase(),
        role: 'member',
        createdAt: new Date(),
    };

    try{
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await users.insertOne({...user, passwordHash});
        res.status(201).json({ _id: result.insertedId, ...user });
    } catch (error) {
        if(error.code === 11000) {
            res.status(400).json({ error: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว' });
        }
        throw error;
    }
});


// POST /api/login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await users.findOne({ username });
    const ok = user && await bcrypt.compare(password ?? '', user.passwordHash);
    if (!ok) {
        return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }
    await users.updateOne(
        {_id: user._id},
        {$inc: {loginCount: 1}, $set: {lastLoginAt: new Date()}}
    );
    res.json({ message: 'เข้าสู่ระบบสำเร็จ', user: {username: user.username, name: user.name, email: user.email, role: user.role } });
});

// GET /api/users
app.get('/api/users', async (req, res) => {
    const list = await users.find({}, HIDE_PASSWORD).sort({ createdAt: -1 }).toArray();
    res.json(list);
});

// DELETE /api/users/:username
app.delete('/api/users/:username', async (req, res) => {
    const result = await users.deleteOne({ username: req.params.username });
    if(result.deletedCount === 0) {
        res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }
    res.status(204).end();
});


async function main(){
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    users = client.db(DATABASE_NAME).collection('users');
    await users.createIndex({ username: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
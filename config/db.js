const mongoose = require('mongoose');
const dns = require('node:dns');

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const connectDB = async () => {
    const username = process.env.MONGODB_USER || process.env.MONGODB_USERNAME;
    const password = process.env.MONGODB_PASSWORD;
    const uri = process.env.MONGO_URL || (
        username && password
            ? `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@cluster0.weznmgg.mongodb.net/dragcare?retryWrites=true&w=majority&appName=Cluster0`
            : null
    );

    if (!uri) {
        throw new Error('MongoDB is not configured. Set MONGO_URL before starting the API.');
    }

    const dnsServers = (process.env.MONGODB_DNS_SERVERS || '8.8.8.8')
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean);
    dns.setServers(dnsServers);

    mongoose.connection.on('error', (error) => {
        console.error(`MongoDB connection error: ${error.message}`);
    });

    try {
        await mongoose.connect(uri, {
            dbName: process.env.MONGODB_DATABASE || 'dragcare',
            serverSelectionTimeoutMS: 10000
        });
    } catch (error) {
        const message = error.message.replace(
            /(mongodb(?:\+srv)?:\/\/)[^/@\s]+@/gi,
            '$1[credentials-redacted]@'
        );
        console.error(`MongoDB connection failed (${error.name}): ${message}`);
        throw new Error('MongoDB connection failed. Check Atlas DNS/network access and the connection string.');
    }

    console.log('✅ MongoDB Atlas Connected Successfully');
    return true;
};

module.exports = { connectDB, isDatabaseConnected };
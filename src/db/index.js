import mongoose from 'mongoose';
import { DB_NAME } from '../constants';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        
        console.log("DB connected !!! Host: ", connectionInstance.connection.host);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export { connectDB };
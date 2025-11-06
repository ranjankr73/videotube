import dotenv from 'dotenv';
import { app } from './app';
import { connectDB } from './db';

dotenv.config({
    path: './.env'
});

connectDB()
.then(() => {
    app.listen(process.env.PORT || 4000, () => {
        console.log(`Server is running at PORT: ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.error("DB connection failed !!!", error);
});
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./.env",
});

connectDB();


























// const app = express();

// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

//         console.log(`MONGODB Connected !!!`);

//         app.on("error", (error) => {
//             console.log("Error: ", error);
//             throw error;
//         });

//         app.listen(process.env.PORT, () => {
//             console.log(`Server is running on PORT: ${process.env.PORT}`);
//         });
//     } catch (error) {
//         console.log(`MONGODB Connection Error: `, error);
//         throw error;
//     }
// })();

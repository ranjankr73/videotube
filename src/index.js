import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path: "./.env",
});

const PORT = process.env.PORT || 4000;

connectDB()
    .then(() => {
        console.log("MongoDB connected successfully.");

        app.listen(PORT, () => {
            console.log(`Server is listening on PORT: ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MONGODB CONNECTION FAILED");
        console.error(err);

        process.exit(1);
    });

process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION");
    console.error(err);

    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION");
    console.error(err);

    process.exit(1);
});

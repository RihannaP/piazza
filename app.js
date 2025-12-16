import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import authRoute from "./routes/auth.js";
import postsRouter from "./routes/posts.js";


dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());
// app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/posts", postsRouter);


app.get("/", (req, res) => {
  res.send("Piazza API running");
});

mongoose.connect(process.env.DB_CONNECTOR).then(() => {
  console.log("Your mongoDB connector is on...");
});

app.listen(PORT, () => {
  console.log("Server is up and running...");
});

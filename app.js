import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Piazza API running");
});

app.listen(3000)

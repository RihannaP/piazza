import express from "express";
import {
  registerValidation,
  loginValidation,
} from "../validations/validation.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// POST (Create) /auth/register
router.post("/register", async (req, res) => {
  // Validation 1 to check user input
  const { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).send({ message: error["details"][0]["message"] });
  }

  // Validation 2 to check if user exists!
  const userExists = await User.findOne({ email: req.body.email });
  if (userExists) {
    return res.status(400).send({ message: "User already exists" });
  }

  // A hashed representation of password
  const hashedPassword = await bcrypt.hash(req.body.password, 5);

  // Code to insert data
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });
  try {
    const savedUser = await user.save();
    res.send(savedUser);
  } catch (err) {
    res.status(400).send({ message: err });
  }
});

router.post("/login", async (req, res) => {
  // Validation 1 to check user input
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send({ message: error["details"][0]["message"] });
  }

  // Validation 2 to check if user exists!
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).send({ message: "User does not exist" });
  }

  // Validation 3 to check user password
  const passwordValidation = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!passwordValidation) {
    return res.status(400).send({ message: "Password is wrong" });
  }

//   Generate an auth-token
  const token = jwt.sign(
    { userId: user._id, username: user.username },
    process.env.TOKEN_SECRET,
    { expiresIn: "2h" }
  );
  res.header("auth-token", token).send({ "auth-token": token });
});

export default router;

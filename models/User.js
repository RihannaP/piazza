import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      min: 3,
      max: 256,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      min: 6,
      max: 256,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 1024,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;

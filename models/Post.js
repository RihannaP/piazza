import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    topics: {
      type: [String],
      required: true,
      enum: ["Politics", "Health", "Sport", "Tech"],
    },

    body: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Live", "Expired"],
      default: "Live",
    },

    owner: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [commentSchema],
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;

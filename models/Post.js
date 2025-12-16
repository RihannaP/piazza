import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
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
    type: { type: String, enum: ["like", "dislike", "comment"], required: true },
    value: { type: String }, // comment text if type=comment
    timeLeftSeconds: { type: Number, required: true }
  },
  {timestamps: true }
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

    likes: [interactionSchema],
    dislikes: [interactionSchema],
    comments: [interactionSchema],
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;

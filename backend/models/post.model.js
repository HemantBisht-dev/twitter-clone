import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming you have a User model
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String, // URL for images if using a service like Cloudinary
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        comment: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Post = mongoose.model("Post", PostSchema);

export default Post;

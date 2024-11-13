import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
  try {
    // Extract data from request body
    const { text } = req.body;
    let { image } = req.body;
    const userId = req.user._id.toString();

    // Fetch user from database
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "user not found" });

    // Validate post content
    if (!text && !image) {
      return res.status(400).json({ error: "post must have text and image" });
    }

    // Handle image upload
    if (image) {
      const uploadedImage = await cloudinary.uploader.upload(image);
      image = uploadedImage.secure_url;
    }

    // Create and save the post
    const newPost = new Post({
      author: userId,
      text,
      image,
    });

    await newPost.save();

    // Send success response
    res.status(201).json(newPost);
  } catch (error) {
    console.log("error in createPost controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ error: "You are not authourized to delete this post" });
    }

    // delete image from cloudinary
    if (post.image) {
      const image = post.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(image);
    }

    // delete post from database
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error in deletePost controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ error: "text field is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "post not found" });
    }

    const comment = { user: userId, comment: text };

    post.comments.push(comment);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.log("Error in commentOnPost controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "post not found" });
    }

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      //unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPost: postId } });

      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );

      res.status(200).json({ message: "post unlike successfully" });
    } else {
      //like post
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedPost: postId } });
      await post.save();

      const notification = new Notification({
        from: userId,
        to: post.author,
        type: "like",
      });

      await notification.save();
      res.status(200).json({ message: "post like successfully" });
    }
  } catch (error) {
    console.log("Error in likeUnlikePost controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    // populate gives us all the details of author of the post like profile image, fullname, username etc and de-selecting password
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "-password" })
      .populate({ path: "comments.user", select: "-password" }); // sort latest post at the top

    if (posts.length === 0) return res.status(200).json([]);

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getAllPosts controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLikedPosts = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const likedPost = await Post.find({ _id: { $in: user.likedPost } })
      .populate({ path: "author", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(likedPost);
  } catch (error) {
    console.log("Error in getLikedPosts controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const feedPosts = await Post.find({ author: { $in: user.following } })
      .sort({
        createdAt: -1,
      })
      .populate({ path: "author", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(feedPosts);
  } catch (error) {
    console.log("Error in getFollowingPosts controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserPosts = async(req,res)=>{
  const {username} = req.params;

  try {
    const user = await User.findOne({username});

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const posts = await Post.find({ author: user._id })
      .sort({
        createdAt: -1,
      })
      .populate({ path: "author", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getFollowingPosts controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}
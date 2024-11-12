import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");

    if (!user) return res.status(404).json({ message: "user not found" });

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getProfile:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const followUnfollowUser = async (req, res) => {
  const { id } = req.params;

  try {
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString())
      return res
        .status(400)
        .json({ error: "you can't follow/unfollow yourself" });

    if (!userToModify || !currentUser)
      return res.status(400).json({ error: "user not found" });

    const isfollowing = currentUser.following.includes(id);

    if (isfollowing) {
      // unfollow the user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

      res.status(200).json({ message: "user unfollowed successfully" });
    } else {
      // follow the user
      // this will push my id(req.user._id) into other person's followers list
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });

      // this will push others person id(id) into my following list
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      // send notification to the user
      const newNotification = new Notification({
        from: req.user._id,
        to: userToModify._id,
        type: "follow",
      });

      await newNotification.save();

      // TODO: return the id of the user as a response
      res.status(200).json({ message: "user followed successfully" });
    }
  } catch (error) {
    console.log("Error in followUnfollowUser:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// export const getSuggestedUsers = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const usersFollowedByMe = await User.findById(userId).select("following");

//     const user = await User.aggregate([
//       {
//         $match: {
//           _id: { $ne: userId },
//         },
//       },
//       {
//         $sample: {
//           size: 10,
//         },
//       },
//     ]);
//   } catch (error) {}
// };

export const updateUserProfile = async (req, res) => {
  const { username, fullname, email, currentPassword, newPassword, bio, link } =
    req.body;
  let { profileImg, coverImg } = req.body;
  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not found" });

    if (
      (!currentPassword && newPassword) ||
      (currentPassword && !newPassword)
    ) {
      return res.status(404).json({
        error: "please provide both current password and new password",
      });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res
          .status(400)
          .json({ error: "current password doesn't match" });
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "password must be 6 character long" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      if (user.profileImg) {
        // https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorwfrfmlslsmlcd.png

        // we want to extract this key zmxorwfrfmlslsmlcd
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }

      // upload it cloudinary database
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }
    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }

      // upload in cloudinary
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    // update in database
    user.fullname = fullname || user.fullname;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();

    // password should be null in response
    user.password = null;

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in updateUserProfile:", error.message);
    res.status(500).json({ error: error.message });
  }
};

import bcrypt from "bcryptjs";

import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";


// signup 
export const signup = async (req, res) => {
  // 1- check for valid email format using regex
  // 2- username, email must be unique, check for existing username and email
  // 3- password must be hash before saving into database
  // 4- if all above checks are true then generate a token and set cookie for new user and save it database

  try {
    const { username, fullname, email, password } = req.body;

    // validate input
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // check if user exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already exist" });
    }

    // check if email exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "email already exist" });
    }

    // check if password length is correct
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullname,
      username,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // GENERATE TOKEN and SET COOKIE
      generateTokenAndSetCookie(newUser._id, res);

      // SAVE TO DATABASE
      await newUser.save();

      // SEND RESPONSE TO CLIENT
      res.status(201).json({
        _id: newUser._id,
        fullname: newUser.fullname,
        username: newUser.username,
        email: newUser.email,
        followers: newUser.followers,
        following: newUser.following,
        profileImg: newUser.profileImg,
        coverImg: newUser.coverImg,
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ error: "Internal server Error" });
  }
};


// login
export const login = async (req, res) => {
  try {
    // Extract user input
    const { username, password } = req.body;

    // Fetch user from database
    const user = await User.findOne({ username });

    // Validate password
    const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

    // Validate input
    if(!user || !isPasswordCorrect){
      return res.status(400).json({error:"Invalid username and password"})
    }

    // Generate token and set cookie
    generateTokenAndSetCookie(user._id, res);

    // SEND RESPONSE TO CLIENT
    res.status(200).json({
      _id: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      followers: user.followers,
      following: user.following,
      profileImg: user.profileImg,
      coverImg: user.coverImg,
    });

  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ error: "Internal server Error" });
  }
};


// logout
export const logout = async (req, res) => {
  try {
    // Clear the jwt cookie
    res.cookie("jwt","",{maxAge:0})
    res.status(200).json({message:"Logged out successfully"})
    
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ error: "Internal server Error" });
  }
}

// get us authenticated user
export const getMe = async(req,res)=>{
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.status(200).json(user)
    
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ error: "Internal server Error" });
  }
}
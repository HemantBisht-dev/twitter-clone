import jwt from "jsonwebtoken";

// Function to generate a token and set it as an HTTP-only cookie
export const generateTokenAndSetCookie = (userId, res) => {

  // Generate a JWT token containing the user's ID as the payload.
  // The token is signed using a secret key from the environment variables and is set to expire in 15 day.
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  // Set the token in an HTTP-only cookie for secure storage in the user's browser.
  res.cookie("jwt", token, {
    // maxAge sets the cookie's expiration time in milliseconds (1 day = 24 * 60 * 60 * 1000 ms).
    maxAge: 15 * 24 * 60 * 60 * 1000, //millisecond

    // httpOnly ensures the cookie cannot be accessed via JavaScript, reducing the risk of XSS attacks.
    httpOnly: true,

    // sameSite controls cross-origin requests:
    // 'strict' ensures the cookie is only sent with requests originating from the same site.
    sameSite: "strict",

    // secure ensures the cookie is only sent over HTTPS in production environments.
    secure: process.env.NODE_ENV !== "development",
  });
};

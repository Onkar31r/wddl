import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AsyncHandler } from "../utils/wrapAsync.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { connectDB } from "../db/index.js";

// REGISTER
export const registerUser = AsyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (![username, email, password].every((f) => f?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const connection = await connectDB();

  // Check for existing user
  const [existing] = await connection.execute(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, email]
  );

  if (existing.length > 0) {
    throw new ApiError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  await connection.execute(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username.toLowerCase(), email, hashedPassword]
  );

  return res
    .status(201)
    .json(new ApiResponse(201, null, "User created successfully"));
});

// LOGIN
export const loginUser = AsyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "Username or email is required");
  }

  const connection = await connectDB();

  const [users] = await connection.execute(
    "SELECT * FROM users WHERE email = ? OR username = ?",
    [email, username]
  );

  const user = users[0];

  if (!user) throw new ApiError(404, "User does not exist");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        id: user.id,
        username: user.username,
        email: user.email,
        accessToken,
        refreshToken,
      }, "User logged in")
    );
});

// LOGOUT
export const logoutUser = AsyncHandler(async (req, res) => {
  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out"));
});

// CHANGE PASSWORD
export const changeCurrentPassword = AsyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Both passwords required");
  }

  const connection = await connectDB();

  const [users] = await connection.execute(
    "SELECT * FROM users WHERE id = ?",
    [req.user.id]
  );

  const user = users[0];

  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid current password");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await connection.execute(
    "UPDATE users SET password = ? WHERE id = ?",
    [hashedPassword, req.user.id]
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const bcrypt = require("bcrypt")
const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const Blacklist = require("../models/blacklist.model")

async function registerUserController(req, res) {
  try {
    const { username, email, password = "user" } = req.body
    if (!username || !password || !email) {
      return res.status(400).json({
        message: "Please provide username, email, and password",
      })
    }

    const isExist = await userModel.findOne({
      $or: [{ username }, { email }],
    })

    if (isExist) {
      return res.status(409).json({
        message: "User already exists, try login",
      })
    }

    const hash = await bcrypt.hash(password, 10)
    const result = await userModel.create({
      username,
      email,
      password: hash,
    })

    const token = jwt.sign(
      { id: result._id, username: result.username },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1d" }
    )

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    })
    res.status(201).json({
      message: "User has been registered",
      user: {
        id: result._id,
        username: result.username,
        email: result.email,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body
    const userExist = await userModel.findOne({ email })
    if (!userExist) {
      return res.status(401).json({
        message: "User doesn't exist",
      })
    }

    const isPassword = await bcrypt.compare(password, userExist.password)
    if (!isPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
      })
    }

    const token = jwt.sign(
      { id: userExist._id, email: userExist.email },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1d" }
    )

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    })
    res.status(200).json({
      message: "User login successful",
      user: {
        id: userExist._id,
        email: userExist.email,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

async function logoutuser(req, res) {
  try {
    const token = req.cookies.token

    if (token) {
      await Blacklist.create({ token })
    }

    res.clearCookie("token", {
      sameSite: "lax",
      secure: false,
    })
    res.status(200).json({
      message: "User logged out successfully",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

async function getmeController(req, res) {
  try {
    const user = await userModel.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    return res.status(200).json({
      message: "User details fetched successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

module.exports = { registerUserController, loginUser, logoutuser, getmeController }

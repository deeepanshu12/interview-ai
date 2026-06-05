const jwt = require("jsonwebtoken")
const Blacklist = require("../models/blacklist.model")

async function authUser(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(" ")[1])
  if (!token) {
    return res.status(401).json({ message: "token not provided or invalid" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret")
    if (!decoded) return res.status(401).json({ message: "Invalid token" })

    const blacklisted = await Blacklist.findOne({ token })
    if (blacklisted) {
      return res.status(401).json({ message: "Invalid token" })
    }

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" })
  }
}

module.exports = authUser;
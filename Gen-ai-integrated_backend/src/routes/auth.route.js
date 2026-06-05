const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controllers");
const authMiddleware = require("../middleware/auth.middleware")

router.post("/register", authController.registerUserController);
router.post("/login", authController.loginUser);
router.get("/get-me", authMiddleware, authController.getmeController);
router.get("/logout", authMiddleware, authController.logoutuser);
module.exports = router;
const express = require("express");
const interviewController = require("../controllers/interview.controller")
const interviewrouter = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/file.middleware");
const interviewReportModel = require("../models/interviewReport.model")


interviewrouter.post(
	"/",
	authMiddleware,
	upload.single("resume"),
	interviewController.generateinterviewController
)
interviewrouter.get("/report/:interviewId", authMiddleware, interviewController.getinterviewController)
interviewrouter.get("/", authMiddleware, interviewController.getAllInterviewReports)

interviewrouter.post("/resume/pdf/:interviewReportId", authMiddleware, interviewController.generateResumePdfController)

module.exports = interviewrouter;
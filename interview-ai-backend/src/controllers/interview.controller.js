const pdfParse = require("pdf-parse")
const PDFDocument = require("pdfkit")
const generateInterviewReport = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

async function generateinterviewController(req, res) {
  try {
    let resumeText = ""
    if (req.file) {
      try {
        resumeText = (await pdfParse(req.file.buffer)).text
      } catch (err) {
        return res.status(400).json({ message: "We couldn't extract text from your PDF. It might be a scanned image, password-protected, or corrupted. Please copy-paste your resume text into the 'Quick Self-Description' box instead." })
      }
    }
    const { selfDescription = "", jobDescription = "" } = req.body

    if (!resumeText && !selfDescription) {
      return res.status(400).json({ message: "Please provide a resume file or self description" })
    }

    const reportData = await generateInterviewReport({
      resume: resumeText,
      selfDescription,
      jobDescription,
    })

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      title: reportData.title || jobDescription.slice(0, 80) || "Interview Report",
      jobDescription,
      resume: resumeText,
      selfDescription,
      matchScore: reportData.matchScore,
      technicalQuestions: reportData.technicalQuestions,
      behavioralQuestions: reportData.behavioralQuestions,
      skillGaps: reportData.skillGaps,
      preparationPlan: reportData.preparationPlan,
    })

    return res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: "Failed to generate interview report",
      error: error.message,
    })
  }
}

async function getinterviewController(req, res) {
  try {
    const { interviewId } = req.params
    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id,
    })

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found",
      })
    }

    return res.status(200).json({
      message: "Interview report fetched successfully",
      interviewReport,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: "Failed to fetch interview report",
      error: error.message,
    })
  }
}

async function getAllInterviewReports(req, res) {
  try {
    const interviewReports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("-resume -__v")

    return res.status(200).json({
      message: "Interview reports fetched successfully",
      interviewReports,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: "Failed to fetch interview reports",
      error: error.message,
    })
  }
}

async function generateResumePdfController(req, res) {
  try {
    const { interviewReportId } = req.params
    const interviewReport = await interviewReportModel.findOne({
      _id: interviewReportId,
      user: req.user.id,
    })

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found",
      })
    }

    const doc = new PDFDocument({ margin: 40 })
    const chunks = []

    doc.on("data", (chunk) => chunks.push(chunk))
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks)
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename="resume_${interviewReportId}.pdf"`)
      res.send(pdfBuffer)
    })

    doc.fontSize(20).text(interviewReport.title || "Interview Report")
    doc.moveDown()
    doc.fontSize(12).text(`Job Description:`)
    doc.text(interviewReport.jobDescription || "N/A")
    doc.moveDown()
    doc.text(`Self Description:`)
    doc.text(interviewReport.selfDescription || "N/A")
    doc.moveDown()
    doc.text(`Match Score: ${interviewReport.matchScore || 0}%`)
    doc.moveDown()

    if (interviewReport.technicalQuestions?.length) {
      doc.fontSize(14).text("Technical Questions:")
      interviewReport.technicalQuestions.forEach((question, index) => {
        doc.fontSize(12).text(`${index + 1}. ${question.question}`)
        doc.text(`Intention: ${question.intention}`)
        doc.text(`Answer: ${question.answer}`)
        doc.moveDown()
      })
    }

    if (interviewReport.behavioralQuestions?.length) {
      doc.fontSize(14).text("Behavioral Questions:")
      interviewReport.behavioralQuestions.forEach((question, index) => {
        doc.fontSize(12).text(`${index + 1}. ${question.question}`)
        doc.text(`Intention: ${question.intention}`)
        doc.text(`Answer: ${question.answer}`)
        doc.moveDown()
      })
    }

    if (interviewReport.preparationPlan?.length) {
      doc.fontSize(14).text("Preparation Plan:")
      interviewReport.preparationPlan.forEach((item) => {
        doc.fontSize(12).text(`Day ${item.day}: ${item.focus}`)
        doc.text(`Tasks: ${item.tasks}`)
        doc.moveDown()
      })
    }

    doc.end()
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: "Failed to generate resume PDF",
      error: error.message,
    })
  }
}

module.exports = {
  generateinterviewController,
  getinterviewController,
  getAllInterviewReports,
  generateResumePdfController,
}

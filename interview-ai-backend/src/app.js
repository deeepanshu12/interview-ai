const express  = require("express");
const authRoutes = require("./routes/auth.route");
const interviewrouter = require("./routes/interview.route")
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
	cors({ origin: ["http://localhost:5173", "http://localhost:5174"], credentials: true })
);

app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewrouter);

module.exports = app;
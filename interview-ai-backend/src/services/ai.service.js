const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAPI || process.env.GOOGLE_GENAI,
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
  const prompt = `Generate an interview report for a candidate with the following details:
Resume: ${resume || "N/A"}
Self Description: ${selfDescription || "N/A"}
Job Description: ${jobDescription || "N/A"}

You MUST return the response strictly as a valid JSON object with the following structure, and nothing else (no markdown, no comments):
{
  "matchScore": 80,
  "technicalQuestions": [ { "question": "...", "intention": "...", "answer": "..." } ],
  "behavioralQuestions": [ { "question": "...", "intention": "...", "answer": "..." } ],
  "skillGaps": [ { "skill": "...", "severity": "low|medium|high" } ],
  "preparationPlan": [ { "day": 1, "focus": "...", "tasks": ["...", "..."] } ],
  "title": "..."
}`

  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    })

    let text = res.text || (res.output && Array.isArray(res.output) ? res.output[0]?.content?.find((item) => item.type === "output_text")?.text : undefined)
    if (!text) {
      throw new Error("AI service did not return a valid response")
    }
    
    if (text.startsWith("\`\`\`json")) {
      text = text.replace(/^\`\`\`json[\r\n]*/, "").replace(/[\r\n]*\`\`\`$/, "");
    }

    return JSON.parse(text)
  } catch (err) {
    console.warn("AI generation failed or timed out, returning fallback data. Error:", err.message)
    return {
      title: jobDescription?.slice(0, 80) || "Interview Report",
      matchScore: 72,
      technicalQuestions: [
        {
          question: "What is your experience with the primary technology stack?",
          intention: "Understand your familiarity with the stack",
          answer: "Explain your key projects and the tools you used, focusing on impact and problem solving.",
        },
      ],
      behavioralQuestions: [
        {
          question: "Tell me about a time you solved a difficult technical problem.",
          intention: "Assess your problem-solving process and collaboration skills.",
          answer: "Explain the challenge, your approach, the outcome, and what you learned.",
        },
      ],
      skillGaps: [
        { skill: "Domain knowledge", severity: "medium" },
      ],
      preparationPlan: [
        { day: 1, focus: "Review core concepts", tasks: ["Study the job requirements", "Revise key technologies"] },
        { day: 2, focus: "Practice interview questions", tasks: ["Solve sample technical questions", "Prepare behavioral responses"] },
      ],
    }
  }
}

module.exports = generateInterviewReport;
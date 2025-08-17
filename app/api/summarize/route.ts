import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { transcript, customInstructions } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY environment variable is not set" }, { status: 500 })
    }

    const systemPrompt = `You are an expert meeting summarizer. Your task is to create clear, actionable summaries of meeting transcripts.

Default format:
- **Key Discussion Points**: Main topics covered
- **Decisions Made**: Concrete decisions and outcomes
- **Action Items**: Who needs to do what and by when
- **Next Steps**: Follow-up meetings or processes

Keep the summary concise but comprehensive. Focus on actionable insights and important details.`

    const userPrompt = customInstructions
      ? `Please summarize this meeting transcript with the following specific instructions: ${customInstructions}

Meeting Transcript:
${transcript}`
      : `Please summarize this meeting transcript:

${transcript}`

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    })

    return NextResponse.json({ summary: text })
  } catch (error) {
    console.error("Error generating summary:", error)
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}

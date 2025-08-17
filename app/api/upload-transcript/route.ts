import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size too large. Maximum 10MB allowed." }, { status: 400 })
    }

    // Get file extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase()

    let text = ""

    try {
      if (fileExtension === "txt") {
        // Handle plain text files
        text = await file.text()
      } else if (fileExtension === "pdf") {
        const pdfParse = (await import("pdf-parse")).default
        const buffer = await file.arrayBuffer()
        const data = await pdfParse(Buffer.from(buffer))
        text = data.text
      } else if (fileExtension === "doc" || fileExtension === "docx") {
        const mammoth = await import("mammoth")
        const arrayBuffer = await file.arrayBuffer()
        const nodeBuffer = Buffer.from(arrayBuffer)

        console.log("[ Processing DOCX file, buffer size:", nodeBuffer.length)

        const result = await mammoth.extractRawText({ buffer: nodeBuffer })
        text = result.value

        console.log("Extracted text length:", text.length)
      } else {
        return NextResponse.json(
          { error: "Unsupported file type. Please use .txt, .pdf, .doc, or .docx files." },
          { status: 400 },
        )
      }

      // Basic validation - ensure we have some content
      if (!text.trim()) {
        return NextResponse.json(
          { error: "The uploaded file appears to be empty or could not be read." },
          { status: 400 },
        )
      }

      // Clean up the text (remove excessive whitespace, normalize line breaks)
      const cleanedText = text
        .replace(/\r\n/g, "\n") // Normalize line breaks
        .replace(/\n{3,}/g, "\n\n") // Limit consecutive line breaks
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim()

      return NextResponse.json({ text: cleanedText })
    } catch (parseError) {
      console.error("Error parsing file:", parseError)
      return NextResponse.json(
        {
          error: `Error reading ${fileExtension?.toUpperCase()} file. Please ensure the file is not corrupted or password-protected.`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json({ error: "Failed to process file upload" }, { status: 500 })
  }
}

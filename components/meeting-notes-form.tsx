"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, Send, Loader2, FileText, X, Edit, Save, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function MeetingNotesForm() {
  const [transcript, setTranscript] = useState("")
  const [customInstructions, setCustomInstructions] = useState("")
  const [summary, setSummary] = useState("")
  const [originalSummary, setOriginalSummary] = useState("")
  const [isEditingSummary, setIsEditingSummary] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    const allowedTypes = [".txt", ".doc", ".docx", ".pdf"]
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

    if (!allowedTypes.includes(fileExtension)) {
      alert("Please upload a text file (.txt, .doc, .docx, or .pdf)")
      return
    }

    setUploadedFile(file)
    setIsProcessingFile(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-transcript", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to process file")
      }

      if (data.text) {
        setTranscript(data.text)
      } else {
        throw new Error("No text content received from file")
      }
    } catch (error) {
      console.error("Error processing file:", error)
      alert(
        `Error processing file: ${error instanceof Error ? error.message : "Please try again or paste the text manually."}`,
      )
      setUploadedFile(null)
    } finally {
      setIsProcessingFile(false)
    }
  }

  const clearUploadedFile = () => {
    setUploadedFile(null)
    setTranscript("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSummarize = async () => {
    if (!transcript.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, customInstructions }),
      })

      const data = await response.json()
      if (data.summary) {
        setSummary(data.summary)
        setOriginalSummary(data.summary)
        setIsEditingSummary(false)
        toast({
          title: "Summary generated successfully!",
          description: "Your meeting transcript has been summarized.",
        })
      } else if (data.error) {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error summarizing:", error)
      toast({
        title: "Failed to generate summary",
        description: "Please try again or check your API configuration.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSend = async () => {
    if (!emailRecipient || !summary) return

    setIsSendingEmail(true)
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailRecipient,
          subject: emailSubject || "Meeting Summary",
          summary,
        }),
      })

      if (response.ok) {
        setShowEmailForm(false)
        setEmailRecipient("")
        setEmailSubject("")
        toast({
          title: "Email sent successfully!",
          description: `Meeting summary sent to ${emailRecipient}`,
        })
      } else {
        throw new Error("Failed to send email")
      }
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Failed to send email",
        description: "Please try again or check your email configuration.",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleEditSummary = () => {
    setIsEditingSummary(true)
  }

  const handleSaveSummary = () => {
    setIsEditingSummary(false)
    setOriginalSummary(summary)
    toast({
      title: "Summary updated!",
      description: "Your changes have been saved.",
    })
  }

  const handleCancelEdit = () => {
    setSummary(originalSummary)
    setIsEditingSummary(false)
  }

  const handleResetSummary = () => {
    setSummary(originalSummary)
    toast({
      title: "Summary reset",
      description: "Summary restored to original version.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Meeting Transcript
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Upload Transcript File</Label>
            <div className="flex items-center gap-3">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".txt,.doc,.docx,.pdf"
                onChange={handleFileUpload}
                className="file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                disabled={isProcessingFile}
              />
              {uploadedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{uploadedFile.name}</span>
                  <Button variant="ghost" size="sm" onClick={clearUploadedFile} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            {isProcessingFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing file...
              </div>
            )}
            <div className="text-center text-sm text-muted-foreground">
              <span>or</span>
            </div>
          </div>

          <div>
            <Label htmlFor="transcript">Paste your meeting transcript here</Label>
            <Textarea
              id="transcript"
              placeholder="Enter the meeting transcript you'd like to summarize..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[200px] mt-2"
              suppressHydrationWarning={true}
            />
          </div>

          <div>
            <Label htmlFor="instructions">Custom Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="e.g., Focus on action items and key decisions, include deadlines..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="mt-2"
              rows={3}
              suppressHydrationWarning={true}
            />
          </div>

          <Button onClick={handleSummarize} disabled={!transcript.trim() || isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Summary...
              </>
            ) : (
              "Generate Summary"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Summary Display */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Meeting Summary</CardTitle>
              <div className="flex items-center gap-2">
                {isEditingSummary ? (
                  <>
                    <Button
                      onClick={handleSaveSummary}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Save className="h-3 w-3" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleEditSummary}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    {summary !== originalSummary && (
                      <Button
                        onClick={handleResetSummary}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {isEditingSummary ? (
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Edit your meeting summary here..."
                  suppressHydrationWarning={true}
                />
              ) : (
                <div className="whitespace-pre-wrap text-foreground bg-muted/20 rounded-md p-4 border">
                  {summary}
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => setShowEmailForm(!showEmailForm)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Share via Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Form */}
      {showEmailForm && summary && (
        <Card>
          <CardHeader>
            <CardTitle>Share Summary via Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                placeholder="Meeting Summary - [Date/Topic]"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleEmailSend} disabled={!emailRecipient || isSendingEmail}>
                {isSendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowEmailForm(false)} disabled={isSendingEmail}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

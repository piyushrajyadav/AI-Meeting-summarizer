import { MeetingNotesForm } from "@/components/meeting-notes-form"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">AI Meeting Notes Summarizer</h1>
          <p className="text-muted-foreground text-lg">Transform transcripts into actionable insights</p>
        </div>
        <MeetingNotesForm />
      </div>
    </main>
  )
}

import { useState, useRef, useCallback } from 'react'

// Uses the browser's built-in Web Speech API — zero tokens, zero cost, no API keys.
// Works in Chrome, Edge, and Safari. Not supported in Firefox.
export function useDictation(onAppend: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const recRef = useRef<any>(null)
  const cbRef = useRef(onAppend)
  cbRef.current = onAppend

  const toggle = useCallback(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      alert('Speech recognition not supported in this browser. Use Chrome or Safari.')
      return
    }

    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }

    const rec = new SpeechRec()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as any)
        .slice(e.resultIndex)
        .filter((r: any) => r.isFinal)
        .map((r: any) => (r as any)[0].transcript.trim())
        .join(' ')
      if (transcript) cbRef.current(transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.start()
    recRef.current = rec
    setListening(true)
  }, [listening])

  return { listening, toggle }
}

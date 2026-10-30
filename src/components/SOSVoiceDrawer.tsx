import { CheckCircle2, LockKeyhole, Mic, MicOff, Radio, Siren, Sparkles, Volume2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Condition } from '../conditions'
import { matchSimulatedCondition } from '../lib/simulatedTriage'

type SpeechRecognitionAlternativeLike = { transcript: string }
type SpeechRecognitionResultLike = { isFinal: boolean; 0: SpeechRecognitionAlternativeLike }
type SpeechRecognitionEventLike = { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> }
type SpeechRecognitionErrorLike = { error: string }
type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

type CaptureState = 'idle' | 'listening' | 'processing' | 'ready' | 'fallback' | 'error'

type SOSVoiceDrawerProps = {
  open: boolean
  onClose: () => void
  onAllocate: (conditionId: string) => void
}

export function SOSVoiceDrawer({ open, onClose, onAllocate }: SOSVoiceDrawerProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const microphoneStreamRef = useRef<MediaStream | null>(null)
  const startListeningRef = useRef<(() => void) | null>(null)
  const [captureState, setCaptureState] = useState<CaptureState>('idle')
  const [transcript, setTranscript] = useState('')
  const [matched, setMatched] = useState<Condition | null>(null)
  const [message, setMessage] = useState('')

  const stopListening = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop())
    microphoneStreamRef.current = null
  }

  const handleStopListening = () => {
    stopListening()
    setCaptureState('idle')
  }

  const analyze = (input: string, autoAllocate = false) => {
    const cleanInput = input.trim()
    if (!cleanInput) return
    setCaptureState('processing')
    window.setTimeout(() => {
      const condition = matchSimulatedCondition(cleanInput)
      setMatched(condition)
      setCaptureState('ready')
      setMessage(autoAllocate ? 'Fictional SOS support is being assigned locally.' : 'Fictional scenario matched locally. Nothing was sent or saved.')
      if (autoAllocate) {
        window.setTimeout(() => {
          onAllocate(condition.id)
          close()
        }, 500)
      }
    }, 420)
  }

  const startListening = () => {
    stopListening()
    setMatched(null)
    setMessage('')
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Recognition) {
      setCaptureState('fallback')
      setMessage('Voice recognition is unavailable in this browser. Use the local text fallback below.')
      return
    }

    try {
      const recognition = new Recognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = navigator.language.startsWith('hi') ? 'hi-IN' : 'en-IN'
      recognition.onresult = (event) => {
        let nextTranscript = ''
        let receivedFinalResult = false
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          nextTranscript += event.results[index][0].transcript
          receivedFinalResult ||= event.results[index].isFinal
        }
        setTranscript(nextTranscript.trim())
        if (receivedFinalResult) {
          stopListening()
          analyze(nextTranscript)
        }
      }
      recognition.onerror = (event) => {
        recognitionRef.current = null
        setCaptureState(event.error === 'not-allowed' ? 'fallback' : 'error')
        setMessage(event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Microphone access was not granted. Allow it in your browser, then try again.'
          : event.error === 'network'
            ? 'Speech transcription needs Chrome or Edge with an internet connection. You can retry or use the text field below.'
            : 'Voice capture could not start. You can retry or use the local text fallback.')
      }
      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null
          setCaptureState((current) => current === 'listening' ? 'idle' : current)
        }
      }
      recognitionRef.current = recognition
      setCaptureState('listening')
      if (navigator.mediaDevices?.getUserMedia) {
        void navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          microphoneStreamRef.current = stream
        }).catch(() => {
          // SpeechRecognition reports the user-facing permission error itself.
        })
      }
      recognition.start()
    } catch {
      setCaptureState('error')
      setMessage('Voice capture could not start. Use the local text fallback below.')
    }
  }
  startListeningRef.current = startListening

  const close = () => {
    stopListening()
    setCaptureState('idle')
    setTranscript('')
    setMatched(null)
    setMessage('')
    onClose()
  }

  const allocate = () => {
    if (!matched) return
    onAllocate(matched.id)
    close()
  }

  useEffect(() => {
    const beginCapture = () => startListeningRef.current?.()
    window.addEventListener('pulsegrid:start-sos-voice', beginCapture)
    return () => window.removeEventListener('pulsegrid:start-sos-voice', beginCapture)
  }, [])

  useEffect(() => {
    if (!open) stopListening()
  }, [open])

  useEffect(() => () => recognitionRef.current?.stop(), [])

  if (!open) return null

  return <div className="modal-backdrop sos-voice-backdrop" role="presentation" onMouseDown={close}>
    <section className="sos-voice-drawer" role="dialog" aria-modal="true" aria-labelledby="sos-voice-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="modal-close" aria-label="Close SOS voice capture" onClick={close}><X size={18} /></button>
      <div className={`sos-voice-orb ${captureState === 'listening' ? 'is-listening' : ''}`}><Mic size={30} /></div>
      <span className="drawer-label"><Sparkles size={13} /> simulated SOS voice capture</span>
      <h2 id="sos-voice-title">Describe the emergency</h2>
      <p className="sos-voice-intro">PULSEGRID uses the recognised text only to select a fictional scenario and prepare the simulation workflow. It is not a diagnosis or a real dispatch request.</p>

      <div className={`sos-voice-status state-${captureState}`} aria-live="polite">
        {captureState === 'listening' ? <><Volume2 size={17} /> Listening… describe the simulation scenario</> : captureState === 'processing' ? <><Radio size={17} /> Matching the fictional scenario…</> : <><MicOff size={17} /> {message || 'Press the microphone to begin voice capture.'}</>}
      </div>

      <label htmlFor="sos-transcript">Local transcript</label>
      <textarea id="sos-transcript" value={transcript} onChange={(event) => { setTranscript(event.target.value); setMatched(null); setCaptureState('idle') }} placeholder="Say or type a short simulation condition, for example: chest discomfort and difficulty breathing" rows={4} />
      <div className="sos-voice-actions">
        <button className="btn-outline" onClick={captureState === 'listening' ? handleStopListening : startListening}>{captureState === 'listening' ? <><MicOff size={16} /> Stop listening</> : <><Mic size={16} /> Start microphone</>}</button>
        <button className="btn-primary" disabled={!transcript.trim() || captureState === 'processing'} onClick={() => analyze(transcript)}>{captureState === 'processing' ? 'Matching…' : 'Match simulation scenario'}</button>
      </div>

      {matched && <div className="sos-allocation-card">
        <div><span className={`triage-severity severity-${matched.severity}`}>{matched.severity} simulation</span><h3>{matched.name}</h3><p>Allocated in this local simulation:</p></div>
        <ul><li><CheckCircle2 size={15} /> Condition-matched fictional ambulance</li><li><CheckCircle2 size={15} /> Two simulated helpers</li><li><CheckCircle2 size={15} /> Capability-first hospital comparison</li></ul>
        <button className="btn-danger" onClick={allocate}><Siren size={16} /> Assign simulated SOS support</button>
      </div>}

      <p className="sos-voice-privacy"><LockKeyhole size={13} /> PULSEGRID does not retain audio or add your transcript to the audit history. Browser speech recognition may process audio under your browser provider’s privacy settings.</p>
    </section>
  </div>
}

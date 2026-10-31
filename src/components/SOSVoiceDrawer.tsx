import { CheckCircle2, LockKeyhole, Mic, MicOff, Radio, Siren, Sparkles, Volume2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Condition } from '../conditions'
import { useApp } from '../context'
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
  const { lang } = useApp()
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const microphoneStreamRef = useRef<MediaStream | null>(null)
  const startListeningRef = useRef<(() => void | Promise<void>) | null>(null)
  const [captureState, setCaptureState] = useState<CaptureState>('idle')
  const [transcript, setTranscript] = useState('')
  const [matched, setMatched] = useState<Condition | null>(null)
  const [message, setMessage] = useState('')

  const stopListening = () => {
    try { recognitionRef.current?.stop() } catch { /* recognition may already be stopped */ }
    recognitionRef.current = null
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop())
    microphoneStreamRef.current = null
  }

  const handleStopListening = () => {
    stopListening()
    setCaptureState('idle')
  }

  const analyze = (input: string) => {
    const cleanInput = input.trim()
    if (!cleanInput) return
    setCaptureState('processing')
    window.setTimeout(() => {
      const condition = matchSimulatedCondition(cleanInput)
      setMatched(condition)
      setCaptureState('ready')
      setMessage('Fictional scenario matched locally. Confirm before any simulation action is started.')
    }, 420)
  }

  const startListening = async () => {
    stopListening()
    setMatched(null)
    setMessage('')
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Recognition) {
      setCaptureState('fallback')
      setMessage('Speech-to-text is not available in this browser. Use Chrome or Edge, or enter the fictional condition below.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCaptureState('fallback')
      setMessage('Microphone access is unavailable in this browser. Enter the fictional condition below.')
      return
    }

    try {
      // Request microphone permission first. Starting recognition only after the
      // permission promise resolves avoids the silent failure seen in browsers
      // that block SpeechRecognition before an audio device is authorised.
      microphoneStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recognition = new Recognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
      recognition.onresult = (event) => {
        let nextTranscript = ''
        let receivedFinalResult = false
        for (let index = 0; index < event.results.length; index += 1) {
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
        stopListening()
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
      recognition.start()
    } catch (error) {
      stopListening()
      const permissionDenied = error instanceof DOMException && error.name === 'NotAllowedError'
      setCaptureState(permissionDenied ? 'fallback' : 'error')
      setMessage(permissionDenied
        ? 'Microphone access was not granted. Allow it in your browser, then try again.'
        : 'Voice capture could not start. Use the local text fallback below.')
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
      <span className="drawer-label"><Sparkles size={13} /> Voice-assisted SOS intake</span>
      <h2 id="sos-voice-title">Describe the situation</h2>
      <p className="sos-voice-intro">PULSEGRID converts recognised text into a fictional condition selection and prepares the training workflow. It is not a diagnosis or a real dispatch request.</p>

      <div className={`sos-voice-status state-${captureState}`} aria-live="polite">
        {captureState === 'listening' ? <><Volume2 size={17} /> Listening… describe the situation</> : captureState === 'processing' ? <><Radio size={17} /> Matching the fictional condition…</> : <><MicOff size={17} /> {message || 'Press the microphone to begin voice capture.'}</>}
      </div>

      <label htmlFor="sos-transcript">Voice transcript</label>
      <textarea id="sos-transcript" value={transcript} onChange={(event) => { setTranscript(event.target.value); setMatched(null); setCaptureState('idle') }} placeholder="Your recognised voice text will appear here. If voice capture is unavailable, enter a fictional condition." rows={4} />
      <div className="sos-voice-actions">
        <button className="btn-outline" onClick={captureState === 'listening' ? handleStopListening : startListening}>{captureState === 'listening' ? <><MicOff size={16} /> Stop listening</> : <><Mic size={16} /> {captureState === 'error' || captureState === 'fallback' ? 'Retry microphone' : 'Start microphone'}</>}</button>
        <button className="btn-primary" disabled={!transcript.trim() || captureState === 'processing'} onClick={() => analyze(transcript)}>{captureState === 'processing' ? 'Matching…' : 'Analyze transcript'}</button>
      </div>
      <p className="sos-browser-hint">For browser speech transcription, Chrome or Edge are recommended. PULSEGRID does not retain the audio and only uses the text visible above in this browser session.</p>

      {matched && <div className="sos-allocation-card">
        <div><span className={`triage-severity severity-${matched.severity}`}>{matched.severity} priority</span><h3>{matched.name}</h3><p>Prepared in this fictional training flow:</p></div>
        <ul><li><CheckCircle2 size={15} /> Condition-matched fictional ambulance</li><li><CheckCircle2 size={15} /> Two fictional helpers</li><li><CheckCircle2 size={15} /> Capability-first hospital comparison</li></ul>
        <div className="requirement-row sos-requirements">{matched.requiredFacilities.map((facility) => <span className="requirement-chip" key={facility}>{facility}</span>)}</div>
        <div className="sos-allocation-actions"><button className="btn-danger" onClick={allocate}><Siren size={16} /> Prepare SOS support</button><button className="sos-change-scenario" onClick={() => { setMatched(null); setTranscript(''); setCaptureState('idle'); setMessage('Describe a different fictional condition or retry voice capture.') }}>Change condition</button></div>
      </div>}

      <p className="sos-voice-privacy"><LockKeyhole size={13} /> PULSEGRID does not retain audio or add your transcript to the audit history. Browser speech recognition may process audio under your browser provider’s privacy settings.</p>
    </section>
  </div>
}

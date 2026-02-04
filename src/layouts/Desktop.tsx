import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"

const CONTRACT_ADDRESS = "FjpnMgwhXjt6rGA295TQo61PZ2hwrymYQhoWt1Zjpump"

const HEARTBEAT_TARGET_VOLUME = 0.05
const HEARTBEAT_FADE_IN = 20000
const HEARTBEAT_FADE_OUT = 5000

const MICRO_TEXTS = [
  "Comfort is rented.",
  "Discipline is owned.",
  "Waiting feels productive.",
  "It isn’t.",
  "No one is coming.",
  "You already know what to do.",
]

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const heartbeatRef = useRef<HTMLAudioElement>(null)
  const heartbeatFadeRef = useRef<number | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.25)

  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [microIndex, setMicroIndex] = useState(0)
  const [microVisible, setMicroVisible] = useState(true)

  const [warningText, setWarningText] = useState<string | null>(null)
  const [warningVisible, setWarningVisible] = useState(false)

  const [flash, setFlash] = useState(false)
  const [copied, setCopied] = useState(false)
  const [contractTaken, setContractTaken] = useState(false)

  const [bgOpacity, setBgOpacity] = useState(0.06)
  const [bgContrast, setBgContrast] = useState(0.96)
  const [showCommunityLink, setShowCommunityLink] = useState(false)

  /* -------------------- TIME -------------------- */
  useEffect(() => {
    const i = setInterval(() => setSecondsElapsed((p) => p + 1), 1000)
    return () => clearInterval(i)
  }, [])

  /* -------------------- COMMUNITY LINK -------------------- */
  useEffect(() => {
    const t = setTimeout(() => setShowCommunityLink(true), 7500)
    return () => clearTimeout(t)
  }, [])

  /* -------------------- BACKGROUND DRIFT -------------------- */
  useEffect(() => {
    const start = Date.now()
    const i = setInterval(() => {
      const t = (Date.now() - start) / 1000
      const phase = (t / 240) * Math.PI * 2
      setBgOpacity(0.06 + Math.sin(phase) * 0.01)
      setBgContrast(0.96 + Math.sin(phase + Math.PI / 2) * 0.02)
    }, 1000)
    return () => clearInterval(i)
  }, [])

  /* -------------------- MICRO TEXT -------------------- */
  useEffect(() => {
    const fade = setTimeout(() => setMicroVisible(false), 4200)
    const next = setTimeout(() => {
      setMicroIndex((p) => (p + 1) % MICRO_TEXTS.length)
      setMicroVisible(true)
    }, 6000)
    return () => {
      clearTimeout(fade)
      clearTimeout(next)
    }
  }, [microIndex])

  /* -------------------- HEARTBEAT INIT -------------------- */
  useEffect(() => {
    if (!heartbeatRef.current) return
    heartbeatRef.current.loop = true
    heartbeatRef.current.volume = 0
  }, [])

  /* -------------------- TAB VISIBILITY -------------------- */
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") {
        triggerWarning("Welcome back.")
      }
    }
    document.addEventListener("visibilitychange", handler)
    return () => document.removeEventListener("visibilitychange", handler)
  }, [])

  const triggerWarning = (text: string) => {
    setWarningText(text)
    setWarningVisible(true)
    setTimeout(() => setWarningVisible(false), 2600)
    setTimeout(() => setWarningText(null), 3200)
  }

  /* -------------------- HEARTBEAT FADES -------------------- */
  const fadeInHeartbeat = () => {
    if (!heartbeatRef.current) return
    clearInterval(heartbeatFadeRef.current!)

    const audio = heartbeatRef.current
    audio.volume = 0
    audio.play().catch(() => {})

    const steps = 50
    const stepTime = HEARTBEAT_FADE_IN / steps
    let step = 0

    heartbeatFadeRef.current = window.setInterval(() => {
      step++
      audio.volume = Math.min(
        HEARTBEAT_TARGET_VOLUME,
        (HEARTBEAT_TARGET_VOLUME / steps) * step
      )
      if (step >= steps) {
        clearInterval(heartbeatFadeRef.current!)
        audio.volume = HEARTBEAT_TARGET_VOLUME
      }
    }, stepTime)
  }

  const fadeOutHeartbeat = () => {
    if (!heartbeatRef.current) return
    clearInterval(heartbeatFadeRef.current!)

    const audio = heartbeatRef.current
    const start = audio.volume
    const steps = 20
    const stepTime = HEARTBEAT_FADE_OUT / steps
    let step = 0

    heartbeatFadeRef.current = window.setInterval(() => {
      step++
      audio.volume = Math.max(0, start * (1 - step / steps))
      if (step >= steps) {
        clearInterval(heartbeatFadeRef.current!)
        audio.volume = 0
        audio.pause()
      }
    }, stepTime)
  }

  /* -------------------- VIDEO CONTROLS -------------------- */
  const togglePlay = () => {
    if (!videoRef.current) return
    const video = videoRef.current

    if (video.paused) {
      video.muted = false
      video.volume = volume
      video.play()
      setIsPlaying(true)
      setIsMuted(false)
      fadeInHeartbeat()
    } else {
      video.pause()
      setIsPlaying(false)
      fadeOutHeartbeat()
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return

    const next = !videoRef.current.muted
    videoRef.current.muted = next
    setIsMuted(next)

    if (next) {
      fadeOutHeartbeat()
      triggerWarning("Turning it down doesn’t make it go away.")
    } else {
      videoRef.current.volume = volume
      fadeInHeartbeat()
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    const v = Number(e.target.value)
    setVolume(v)
    if (videoRef.current) videoRef.current.volume = v
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(CONTRACT_ADDRESS)
    setCopied(true)
    setContractTaken(true)
    setFlash(true)
    navigator.vibrate?.(80)
    fadeInHeartbeat()
    setTimeout(() => setFlash(false), 120)
    setTimeout(() => setCopied(false), 1500)
  }

  const minutes = Math.floor(secondsElapsed / 60)
  const timerText =
    minutes >= 2.5
      ? `TIME WASTED — ${formatTime(secondsElapsed)}`
      : `TIME PASSED — ${formatTime(secondsElapsed)}`

  return (
    <main style={styles.container}>
      {/* PHANTOM LOGO */}
      <a
        href="https://phantom.com/tokens/solana/FjpnMgwhXjt6rGA295TQo61PZ2hwrymYQhoWt1Zjpump"
        target="_blank"
        rel="noopener noreferrer"
        style={styles.phantomLink}
      >
        <img src="/phantom.svg" alt="Phantom" style={styles.phantomLogo} />
      </a>

      <a
        href="https://x.com/i/communities/2018803002983710937"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          ...styles.communityLink,
          opacity: showCommunityLink ? 0.8 : 0,
          pointerEvents: showCommunityLink ? "auto" : "none",
        }}
      >
        Join us
      </a>

      <video
        src="/background.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{
          ...styles.backgroundVideo,
          opacity: bgOpacity,
          filter: `invert(1) contrast(${bgContrast})`,
        }}
      />

      {flash && <div style={styles.flash} />}

      <audio ref={heartbeatRef} src="/heartbeat.mp3" />

      {warningText && (
        <div
          style={{
            ...styles.systemWarning,
            opacity: warningVisible ? 0.7 : 0,
          }}
        >
          {warningText}
        </div>
      )}

      <div style={styles.videoWrapper} onClick={togglePlay}>
        <div style={styles.timerOverlay}>{timerText}</div>

        <video
          ref={videoRef}
          src="/Video.mp4"
          loop
          playsInline
          preload="metadata"
          style={styles.video}
        />

        {!isPlaying && <div style={styles.playOverlay}>▶</div>}

        <div
          style={styles.audioControls}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={toggleMute}
            onPointerDown={(e) => e.stopPropagation()}
            style={styles.muteButton}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={styles.volumeSlider}
          />
        </div>
      </div>

      <p style={styles.text}>Nobody is coming to save you.</p>

      <p style={{ ...styles.microText, opacity: microVisible ? 0.45 : 0 }}>
        {MICRO_TEXTS[microIndex]}
      </p>

      <button onClick={handleCopy} style={styles.button}>
        {contractTaken ? "YOU TOOK IT." : copied ? "COPIED" : CONTRACT_ADDRESS}
      </button>
    </main>
  )
}

/* -------------------- STYLES -------------------- */
const styles: Record<string, CSSProperties> = {
  container: {
    position: "relative",
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "14px",
    overflow: "hidden",
  },
  phantomLink: {
    position: "fixed",
    top: "4%",
    right: "4%",
    zIndex: 20,
    opacity: 0.8,
    transition: "opacity 0.2s ease",
  },
  phantomLogo: {
    width: "40px",
    height: "40px",
  },
  communityLink: {
    position: "fixed",
    top: "4%",
    left: "4%",
    fontSize: "16px",
    letterSpacing: "2px",
    color: "rgba(255,255,255,0.55)",
    textDecoration: "none",
    zIndex: 10,
    transition: "opacity 1.6s ease",
  },
  backgroundVideo: {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    objectFit: "cover",
    zIndex: -10,
    pointerEvents: "none",
  },
  flash: {
    position: "fixed",
    inset: 0,
    background: "rgba(255,255,255,0.15)",
    pointerEvents: "none",
  },
  systemWarning: {
    position: "fixed",
    top: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "20px",
    letterSpacing: "3px",
    transition: "opacity 1.2s ease",
    pointerEvents: "none",
  },
  videoWrapper: {
    position: "relative",
    width: "80%",
    maxWidth: "900px",
    aspectRatio: "16 / 9",
    cursor: "pointer",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  playOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "64px",
    pointerEvents: "none",
  },
  audioControls: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    display: "flex",
    gap: "8px",
    background: "rgba(0,0,0,0.6)",
    padding: "6px 8px",
  },
  muteButton: {
    background: "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  volumeSlider: {
    width: "80px",
  },
  text: {
    fontSize: "18px",
    letterSpacing: "3px",
    opacity: 0.6,
  },
  microText: {
    fontSize: "14px",
    letterSpacing: "2px",
    transition: "opacity 1.4s ease",
    height: "22px",
  },
  timerOverlay: {
    position: "absolute",
    top: "-18px",
    right: "0",
    fontSize: "11px",
    letterSpacing: "3px",
    opacity: 0.35,
  },
  button: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff",
    padding: "10px 18px",
    letterSpacing: "2px",
    cursor: "pointer",
  },
}

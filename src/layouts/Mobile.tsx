import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"

const CONTRACT_ADDRESS = "Placeholder Contract Address"

const HEARTBEAT_TARGET_VOLUME = 0.05
const HEARTBEAT_FADE_IN = 16000
const HEARTBEAT_FADE_OUT = 4000

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

export default function Mobile() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const heartbeatRef = useRef<HTMLAudioElement>(null)
  const heartbeatFadeRef = useRef<number | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [microIndex, setMicroIndex] = useState(0)
  const [microVisible, setMicroVisible] = useState(true)

  const [warningText, setWarningText] = useState<string | null>(null)
  const [warningVisible, setWarningVisible] = useState(false)

  const [copied, setCopied] = useState(false)
  const [contractTaken, setContractTaken] = useState(false)

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

  /* -------------------- MICRO TEXT -------------------- */
  useEffect(() => {
    const fade = setTimeout(() => setMicroVisible(false), 3600)
    const next = setTimeout(() => {
      setMicroIndex((p) => (p + 1) % MICRO_TEXTS.length)
      setMicroVisible(true)
    }, 5200)

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
    setTimeout(() => setWarningVisible(false), 2200)
    setTimeout(() => setWarningText(null), 2800)
  }

  /* -------------------- HEARTBEAT -------------------- */
  const fadeInHeartbeat = () => {
    if (!heartbeatRef.current) return
    if (videoRef.current?.muted) return

    clearInterval(heartbeatFadeRef.current!)

    const audio = heartbeatRef.current
    audio.volume = 0
    audio.play().catch(() => {})

    const steps = 40
    const stepTime = HEARTBEAT_FADE_IN / steps
    let step = 0

    heartbeatFadeRef.current = window.setInterval(() => {
      step++
      audio.volume = Math.min(
        HEARTBEAT_TARGET_VOLUME,
        (HEARTBEAT_TARGET_VOLUME / steps) * step
      )
      if (step >= steps) clearInterval(heartbeatFadeRef.current!)
    }, stepTime)
  }

  const fadeOutHeartbeat = () => {
    if (!heartbeatRef.current) return
    clearInterval(heartbeatFadeRef.current!)

    const audio = heartbeatRef.current
    const start = audio.volume
    const steps = 16
    const stepTime = HEARTBEAT_FADE_OUT / steps
    let step = 0

    heartbeatFadeRef.current = window.setInterval(() => {
      step++
      audio.volume = Math.max(0, start * (1 - step / steps))
      if (step >= steps) {
        clearInterval(heartbeatFadeRef.current!)
        audio.pause()
      }
    }, stepTime)
  }

  /* -------------------- VIDEO AUTOPLAY (MOBILE SAFE) -------------------- */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.playsInline = true
    video.preload = "auto"

    const tryPlay = () => {
      const p = video.play()
      if (p !== undefined) {
        p.then(() => {
          setIsPlaying(true)
          setIsMuted(true)
        }).catch(() => {})
      }
    }

    if (video.readyState >= 2) {
      tryPlay()
    } else {
      video.addEventListener("loadeddata", tryPlay, { once: true })
    }
  }, [])

  /* -------------------- VIDEO CONTROLS -------------------- */
  const togglePlay = () => {
    if (!videoRef.current) return
    const video = videoRef.current

    if (video.paused) {
      video.muted = false
      video.volume = 1

      video
        .play()
        .then(() => {
          setIsPlaying(true)
          setIsMuted(false)
          fadeInHeartbeat()
        })
        .catch(() => {})
    } else {
      video.pause()
      setIsPlaying(false)
      fadeOutHeartbeat()
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return

    const video = videoRef.current
    const next = !video.muted

    video.muted = next
    setIsMuted(next)

    if (next) {
      fadeOutHeartbeat()
      triggerWarning("Turning it down doesn’t make it go away.")
    } else {
      video.volume = 1
      fadeInHeartbeat()
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(CONTRACT_ADDRESS)
    setCopied(true)
    setContractTaken(true)
    fadeInHeartbeat()
    setTimeout(() => setCopied(false), 1500)
  }

  const minutes = Math.floor(secondsElapsed / 60)

  const timerText =
    minutes >= 2.5
      ? `TIME WASTED — ${formatTime(secondsElapsed)}`
      : `TIME PASSED — ${formatTime(secondsElapsed)}`

  return (
    <main style={styles.container}>
      <a
        href="https://phantom.com/"
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
          opacity: showCommunityLink ? 0.75 : 0,
          pointerEvents: showCommunityLink ? "auto" : "none",
        }}
      >
        Join us
      </a>

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
          muted
          playsInline
          preload="auto"
          style={styles.video}
        />

        {!isPlaying && <div style={styles.playOverlay} />}

        <div style={styles.audioControls} onClick={(e) => e.stopPropagation()}>
          <button onClick={toggleMute} style={styles.muteButton}>
            {isMuted ? "🔇" : "🔊"}
          </button>
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
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    overflow: "hidden",
  },
  phantomLink: {
    position: "fixed",
    top: "3%",
    right: "6%",
    zIndex: 20,
    opacity: 0.85,
  },
  phantomLogo: { width: "40px", height: "40px" },
  communityLink: {
    position: "fixed",
    top: "4%",
    left: "8%",
    fontSize: "14px",
    letterSpacing: "2px",
    color: "rgba(255,255,255,0.55)",
    textDecoration: "none",
    zIndex: 20,
    transition: "opacity 1.6s ease",
  },
  systemWarning: {
    position: "fixed",
    top: "9%",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "13px",
    letterSpacing: "2px",
    transition: "opacity 1.2s ease",
    pointerEvents: "none",
    textAlign: "center",
    maxWidth: "90%",
  },
  videoWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "420px",
    aspectRatio: "16 / 9",
    marginBottom: "6px",
    cursor: "pointer",
  },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  playOverlay: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  audioControls: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    background: "rgba(0,0,0,0.65)",
    padding: "6px 8px",
    borderRadius: "6px",
  },
  muteButton: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "18px",
  },
  timerOverlay: {
    position: "absolute",
    top: "-14px",
    right: "0",
    fontSize: "10px",
    letterSpacing: "2px",
    opacity: 0.35,
  },
  text: {
    fontSize: "14px",
    letterSpacing: "2px",
    opacity: 0.6,
    textAlign: "center",
    marginTop: "4px",
  },
  microText: {
    fontSize: "12px",
    letterSpacing: "2px",
    transition: "opacity 1.4s ease",
    height: "18px",
    marginBottom: "6px",
    textAlign: "center",
  },
  button: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff",
    padding: "10px 16px",
    letterSpacing: "2px",
    fontSize: "12px",
    marginTop: "4px",
  },
}

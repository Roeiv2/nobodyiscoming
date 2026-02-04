import { useEffect, useState } from "react"
import Desktop from "./layouts/Desktop"
import Mobile from "./layouts/Mobile"

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(max-width: 767px)").matches
  })

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const listener = () => setIsMobile(media.matches)

    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [])

  return isMobile
}

export default function App() {
  const isMobile = useIsMobile()
  return isMobile ? <Mobile /> : <Desktop />
}

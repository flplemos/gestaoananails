import { createContext, useContext, useEffect, useState } from 'react'
import { THEMES } from '../lib/themes'

const KEY = 'ananails:theme'
const ThemeContext = createContext(null)

function readTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (THEMES.some((t) => t.id === saved)) return saved
  } catch {
    /* ignore */
  }
  return 'noite'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const current = THEMES.find((t) => t.id === theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', current.bg)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export const useTheme = () => useContext(ThemeContext)

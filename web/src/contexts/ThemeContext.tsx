import { createContext, useContext, useState, useEffect } from 'react'

export type ThemeName = 'indigo' | 'violet' | 'emerald' | 'orange'

interface ThemeContextValue {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'indigo',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem('novastack-theme') as ThemeName) || 'indigo'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('novastack-theme', theme)
  }, [theme])

  // Apply saved theme immediately on mount
  useEffect(() => {
    const saved = localStorage.getItem('novastack-theme') || 'indigo'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

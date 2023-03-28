import { createContext, useEffect, useState } from "react";

export interface ThemeInterface {
  theme?: boolean;
  setTheme: () => void;
}

export const ThemeContext = createContext<ThemeInterface | null>(null);

export function ThemeProvider(props: React.PropsWithChildren) {
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>();

  function setThemeHandler() {
    const html = document.querySelector("html");
    setIsDarkTheme((prev) => !prev);
    html?.classList.toggle("dark");
  }

  useEffect(() => {
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");

    if (prefersDarkMode.matches) {
      setThemeHandler();
    }

    function handleChange() {
      setThemeHandler();
    }

    prefersDarkMode.addEventListener("change", handleChange);

    return () => {
      prefersDarkMode.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme: isDarkTheme, setTheme: setThemeHandler }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
}

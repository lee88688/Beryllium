import useMediaQuery from "@mui/material/useMediaQuery";
import { ThemeMode } from "y/utils/constants";
import { useAtom } from "jotai";
import { themeModeAtom } from "y/store/theme";

export function usePreferredThemeMode() {
  const mediaQueryDark = useMediaQuery("(prefers-color-scheme: dark)");
  const mediaQueryThemeMode = mediaQueryDark ? ThemeMode.Dark : ThemeMode.Light;

  const [themeMode] = useAtom(themeModeAtom);

  return themeMode === ThemeMode.Auto ? mediaQueryThemeMode : themeMode;
}

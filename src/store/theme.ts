import { atom, getDefaultStore } from "jotai";
import { ThemeLocalName, ThemeMode } from "y/utils/constants";

export const themeModeAtom = atom<ThemeMode>(
  typeof window === "undefined"
    ? ThemeMode.Auto
    : ((localStorage.getItem(ThemeLocalName) ??
        ThemeMode.Auto) as ThemeMode.Auto),
);

if (typeof window !== "undefined") {
  const store = getDefaultStore();
  window.addEventListener("storage", (event) => {
    if (event.key !== ThemeLocalName || event.oldValue === event.newValue)
      return;

    store.set(themeModeAtom, event.newValue as ThemeMode);
  });

  store.sub(themeModeAtom, () => {
    const themeMode = store.get(themeModeAtom);
    localStorage.setItem(ThemeLocalName, themeMode);
  });
}

"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import NoSsr from "@mui/material/NoSsr";
import CssBaseline from "@mui/material/CssBaseline";
import { type PropsWithChildren, useMemo } from "react";
import { usePreferredThemeMode } from "y/hooks/usePreferredThemeMode";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// this error may keep an eye on it
// Detected multiple Jotai instances. It may cause unexpected behavior with the default store. https://github.com/pmndrs/jotai/discussions/2044
// when all pages move to app router, this error may go away.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export default function AppProvider(props: PropsWithChildren) {
  const themeMode = usePreferredThemeMode();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
        },
      }),
    [themeMode],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppRouterCacheProvider options={{ key: "css" }}>
            <NoSsr>{props.children}</NoSsr>
          </AppRouterCacheProvider>
        </ThemeProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  );
}

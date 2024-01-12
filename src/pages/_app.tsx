import { type AppType } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Script from "next/script";
import "y/styles/globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import CssBaseline from "@mui/material/CssBaseline";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useMemo } from "react";
import { usePreferredThemeMode } from "y/hooks/usePreferredThemeMode";
import NoSsr from "@mui/material/NoSsr";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// https://mui.com/material-ui/guides/server-rendering/
const emotionCache = createCache({ key: "css" });

const App: AppType = ({ Component, pageProps }) => {
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
        <CacheProvider value={emotionCache}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {process.env.NODE_ENV === "development" && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
            <NoSsr>
              <Component {...pageProps} />
            </NoSsr>
          </ThemeProvider>
        </CacheProvider>
      </SnackbarProvider>
      {process.env.NODE_ENV === "development" && (
        <Script
          src="//cdn.jsdelivr.net/npm/eruda"
          onLoad={() => {
            window.eruda.init();
          }}
        />
      )}
    </QueryClientProvider>
  );
};

export default App;

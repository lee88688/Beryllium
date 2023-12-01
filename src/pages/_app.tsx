import { type AppType } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import "y/styles/globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import CssBaseline from "@mui/material/CssBaseline";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

// https://mui.com/material-ui/guides/server-rendering/
const emotionCache = createCache({ key: "css" });

const App: AppType = ({ Component, pageProps }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <CacheProvider value={emotionCache}>
          <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            {process.env.NODE_ENV === "development" && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
            <Component {...pageProps} />
          </ThemeProvider>
        </CacheProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  );
};

export default App;

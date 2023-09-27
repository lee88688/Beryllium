import { type AppType } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

import "y/styles/globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const queryClient = new QueryClient();
// https://mui.com/material-ui/guides/server-rendering/
const emotionCache = createCache({ key: "css" });

const App: AppType = ({ Component, pageProps }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <CacheProvider value={emotionCache}>
          <Component {...pageProps} />
        </CacheProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  );
};

export default App;

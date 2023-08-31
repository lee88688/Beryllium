import { type AppType } from "next/app";
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import "y/styles/globals.css";

const queryClient = new QueryClient()

const App: AppType = ({ Component, pageProps }) => {
  return <QueryClientProvider client={queryClient}>
    <Component {...pageProps} />
  </QueryClientProvider>
};

export default App;

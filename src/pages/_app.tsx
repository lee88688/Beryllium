import { type AppType } from "next/app";
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import "y/styles/globals.css";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const queryClient = new QueryClient()

const App: AppType = ({ Component, pageProps }) => {
  return <QueryClientProvider client={queryClient}>
    <Component {...pageProps} />
  </QueryClientProvider>
};

export default App;

import "reset-css";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import "../i18n";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

// export default appWithTranslation(MyApp);
export default MyApp;

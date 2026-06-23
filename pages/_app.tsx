import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Space_Grotesk } from "@next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={spaceGrotesk.className}>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;

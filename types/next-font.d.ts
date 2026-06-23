// Next 13.0.2 ships next/font without bundled types in next-env.d.ts.
// Minimal declaration so the Google font loader is typed.
declare module "@next/font/google" {
  interface NextFont {
    className: string;
    style: { fontFamily: string };
    variable: string;
  }
  interface FontOptions {
    subsets?: string[];
    weight?: string | string[];
    style?: string | string[];
    display?: "auto" | "block" | "swap" | "fallback" | "optional";
    variable?: string;
    preload?: boolean;
  }
  export function Space_Grotesk(options?: FontOptions): NextFont;
}

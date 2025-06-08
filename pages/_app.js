// ABOUTME: Next.js App component wrapper for global settings and providers
// ABOUTME: Handles global CSS imports and page initialization

import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
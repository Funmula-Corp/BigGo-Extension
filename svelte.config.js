export default {
  compilerOptions: {
    css: "injected"
  },
  warningFilter: (warning) => {
    // Suppress a11y warnings — this is a browser extension widget, not a web page
    if (warning.code?.startsWith("a11y")) return false
    return true
  }
}

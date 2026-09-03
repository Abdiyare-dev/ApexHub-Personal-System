export default function manifest() {
  return {
    name: "ApexHub Personal System",
    short_name: "ApexHub",
    description: "Personal development system — tasks, finance, goals & roadmaps",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#0F172A",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  }
}

// Each auth page (login, forgot-password, update-password) renders its own
// full-screen `.login-wrapper` — centered, themed, with its own ApexHub
// branding. This layout deliberately stays a pass-through: an extra shell
// here would shrink-wrap those pages (body is `display: flex`) and pin them
// to the left of the viewport.
export default function AuthLayout({ children }) {
  return children
}

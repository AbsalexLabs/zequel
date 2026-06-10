const PLATFORM_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || "http://localhost:3001"
export const platformUrl = (path = "/") =>
  `${PLATFORM_URL}${path.startsWith("/") ? path : `/${path}`}`
export const AUTH_LINKS = {
  login: platformUrl("/login"),
  signup: platformUrl("/signup"),
}

import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

/**
 * Metadatos de la aplicación para SEO y redes sociales
 */
export const metadata: Metadata = {
  title: 'SkillsForge - Plataforma de Talleres Profesionales',
  description: 'SkillsForge - Plataforma integral para la gestión y participación en talleres de formación profesional. Desarrolla tus habilidades técnicas y blandas.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

/**
 * Layout raíz de la aplicación Next.js
 * Configura las fuentes tipográficas y estructura HTML básica
 * 
 * @param children - Componentes hijos que se renderizan en cada página
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={GeistSans.className}>{children}</body>
    </html>
  )
}

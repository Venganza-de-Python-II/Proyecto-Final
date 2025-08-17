"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, ExternalLink } from "lucide-react"
import { obtenerTokenEstudiante, limpiarTokenEstudiante } from "@/lib/api"
import { useEffect, useState } from "react"

/**
 * Barra de navegación principal de SkillsForge
 */
export function Navbar() {
  const [estudiante, setEstudiante] = useState<boolean>(false)
  useEffect(() => {
    setEstudiante(!!obtenerTokenEstudiante())
  }, [])

  return (
    <header className="w-full border-b border-white/10 bg-[#0b0e13] text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-purple-500 to-cyan-400 rounded-md p-2">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-lg">SkillsForge</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/estudiantes/talleres" className="hover:underline">
            Talleres
          </Link>
          <Link href="/estudiantes/mis-registros" className="hover:underline">
            Mis Registros
          </Link>
          <Link href="/admin" className="hover:underline">
            Admin
          </Link>
          <a href="/#api-docs" className="hover:underline">
            API Docs
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {!estudiante ? (
            <>
              <Link href="/estudiantes/login">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:text-white">Estudiantes</Button>
              </Link>
              <Link href="/admin/login">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
                  Administradores
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/estudiantes/mis-registros">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
                  Mi Panel
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
                onClick={() => {
                  limpiarTokenEstudiante()
                  setEstudiante(false)
                }}
              >
                Salir
              </Button>
            </>
          )}

          <a href="https://github.com/vercel" target="_blank" rel="noreferrer" className="hidden sm:inline-flex">
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white [&>svg]:text-white hover:[&>svg]:text-white">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </header>
  )
}

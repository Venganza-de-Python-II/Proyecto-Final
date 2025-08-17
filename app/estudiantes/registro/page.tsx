"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiFetch, guardarTokenEstudiante } from "@/lib/api"
import { Eye, EyeOff, Copy, Wand2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"

function generarContrasena(longitud = 14, usarSimbolos = true) {
  const letras = "abcdefghijklmnopqrstuvwxyz"
  const mayus = letras.toUpperCase()
  const numeros = "0123456789"
  const simbolos = "!@#$%^&*()-_=+[]{};:,.?/"
  const conjuntos = [letras, mayus, numeros, ...(usarSimbolos ? [simbolos] : [])]
  const obligatorio = conjuntos.map((set) => set[Math.floor(Math.random() * set.length)])
  const pool = conjuntos.join("")
  const restante = longitud - obligatorio.length
  const aleatorios = new Uint32Array(restante)
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) window.crypto.getRandomValues(aleatorios)
  else for (let i = 0; i < restante; i++) aleatorios[i] = Math.floor(Math.random() * pool.length)
  const otros = Array.from(aleatorios, (n) => pool[n % pool.length])
  const base = [...obligatorio, ...otros]
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[base[i], base[j]] = [base[j], base[i]]
  }
  return base.join("")
}

function puntuarContrasena(valor: string) {
  let score = 0
  if (valor.length >= 8) score += 20
  if (valor.length >= 12) score += 20
  if (/[a-z]/.test(valor)) score += 15
  if (/[A-Z]/.test(valor)) score += 15
  if (/\d/.test(valor)) score += 15
  if (/[^A-Za-z0-9]/.test(valor)) score += 15
  return Math.min(score, 100)
}

export default function RegistroEstudiante() {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [mostrar, setMostrar] = useState(false)
  const [cargando, setCargando] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/"

  const fuerza = useMemo(() => puntuarContrasena(contrasena), [contrasena])
  const etiquetaFuerza = useMemo(() => (fuerza < 40 ? "Débil" : fuerza < 70 ? "Media" : "Fuerte"), [fuerza])

  useEffect(() => {
    if (!contrasena) setContrasena(generarContrasena(14, true))
  }, [])
  
  async function copiar() {
    try {
      await navigator.clipboard.writeText(contrasena)
      toast({ title: "Copiado", description: "Contraseña copiada al portapapeles." })
    } catch {
      toast({ title: "No se pudo copiar", description: "Copia manualmente la contraseña.", variant: "destructive" })
    }
  }

  function generar() {
    const pwd = generarContrasena(14, true)
    setContrasena(pwd)
    toast({ title: "Contraseña generada", description: "Copia o ajusta tu contraseña antes de registrar." })
  }

  async function registrar() {
    if (!nombre.trim() || !email.trim() || !contrasena) {
      toast({ title: "Campos requeridos", description: "Completa nombre, email y contraseña.", variant: "destructive" })
      return
    }
    setCargando(true)
    try {
      const data = await apiFetch("/auth/estudiantes/registro", {
        metodo: "POST",
        cuerpo: { nombre, email, contrasena },
      })
      guardarTokenEstudiante(data.token)
      toast({ title: "Cuenta creada", description: "Registro exitoso. Sesión iniciada." })
      router.push(next)
    } catch (e: any) {
      let msg = e?.message || "Error desconocido"
      if (/email.*(uso|existe)|correo.*(uso|existe)/i.test(msg)) {
        msg = "Este correo ya está en uso."
      } else if (/usuario.*(uso|existe)/i.test(msg)) {
        msg = "Este usuario ya está en uso."
      }
      toast({ title: "No se pudo registrar", description: msg, variant: "destructive" })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white">
      <Navbar />
      <main className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Crear cuenta de estudiante</CardTitle>
            <CardDescription className="text-white/85">
              Regístrate para poder inscribirte a talleres y administrar tus inscripciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre" className="text-white/90">Nombre completo</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="bg-black/30 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-white/90">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="bg-black/30 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contrasena" className="text-white/90">Contraseña</Label>
              <div className="flex gap-2">
                <Input
                  id="contrasena"
                  type={mostrar ? "text" : "password"}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••••"
                  className="bg-black/30 border-white/20 text-white placeholder:text-white/60"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                  onClick={() => setMostrar((s) => !s)}
                  aria-label="Alternar visibilidad"
                >
                  {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                  onClick={copiar}
                  aria-label="Copiar contraseña"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                  onClick={generar}
                  aria-label="Generar contraseña"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={fuerza} className="w-full bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-indigo-600"/>
                <span className="text-sm text-white/85 w-14 text-right">{etiquetaFuerza}</span>
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              disabled={cargando}
              onClick={registrar}
            >
              {cargando ? "Creando cuenta..." : "Registrarme"}
            </Button>
          </CardContent>
        </Card>
      </main>
      <Toaster />
    </div>
  )
}

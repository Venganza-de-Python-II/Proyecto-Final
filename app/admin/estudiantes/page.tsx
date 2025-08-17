'use client'

import { useEffect, useState } from 'react'
import type { Estudiante } from '@/types'
import { apiFetch, obtenerTokenAdmin } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'

export default function GestionEstudiantes() {
  const [lista, setLista] = useState<Estudiante[]>([])
  const [q, setQ] = useState('')
  const [cargando, setCargando] = useState(true)
  const token = obtenerTokenAdmin()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!token) {
      router.replace('/admin/login')
      return
    }
    cargar()
  }, [token, q])

  async function cargar() {
    setCargando(true)
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : ''
      const data = await apiFetch(`/students${params}`, { token })
      setLista(data)
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'No se pudo cargar estudiantes',
        variant: 'destructive'
      })
    } finally {
      setCargando(false)
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar estudiante y sus inscripciones?')) return
    try {
      await apiFetch(`/students/${id}`, { metodo: 'DELETE', token })
      setLista(prev => prev.filter(x => x._id !== id))
      toast({ title: 'Estudiante eliminado', description: 'La acción se realizó correctamente.' })
    } catch (e: any) {
      toast({
        title: 'No se pudo eliminar',
        description: e.message || 'Intente nuevamente.',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white">
      <Navbar />
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Gestión de Estudiantes</h1>
            <p className="text-white/80">Administra cuentas de estudiantes y su información.</p>
          </div>
            <Link href="/admin" className="underline text-sm text-white/90">
              Volver
            </Link>
        </div>

        <Card className="mt-6 bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Buscar Estudiantes</CardTitle>
            <CardDescription className="text-white/80">Encuentra estudiantes por nombre o email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative w-full">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                <Input
                  className="pl-9 bg-black/30 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Buscar por nombre o email..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Button
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
                type="button"
                onClick={cargar}
                disabled={cargando}
              >
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Lista de Estudiantes</CardTitle>
            <CardDescription className="text-white/80">{lista.length} resultados</CardDescription>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <p className="text-sm text-white/80">Cargando...</p>
            ) : lista.length === 0 ? (
              <p className="text-sm text-white/80">Sin resultados.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {lista.map(e => (
                  <li key={e._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{e.nombre}</div>
                      <div className="text-sm text-white/80">{e.email}</div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => eliminar(e._id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
      {/* Toast del portal */}
      <Toaster />
    </div>
  )
}

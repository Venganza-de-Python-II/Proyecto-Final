/*Gestión de estudiantes*/

/*
Verifica si el administrador tiene token, si no lo redirige al login.

Permite buscar estudiantes por nombre o email.

Muestra la lista de estudiantes desde la API.

Permite eliminarlos con confirmación.

Notifica al usuario mediante toasts.
*/

'use client' //Indica que este componente se ejecuta en el cliente

import { useEffect, useState } from 'react' //hooks de React para manejar estado y efectos secundarios.
import type { Estudiante } from '@/types' //Llama al código que define un estudiante.
import { apiFetch, obtenerTokenAdmin } from '@/lib/api' //función personalizada para hacer peticiones a la API. y obtiene el token de autenticación del administrador.
import { useRouter } from 'next/navigation' //hook de Next.js para redirigir.

/*
  Se importan componentes de UI (Cards, Botones, Input).
  Iconos de Lucide React (Trash2, Search).
  useToast y Toaster → sistema de notificaciones emergentes.
  Navbar → barra de navegación reutilizable.
*/
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card' 
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'

//Componente principal que renderiza la interfaz de administración de estudiantes.
export default function GestionEstudiantes() {
  const [lista, setLista] = useState<Estudiante[]>([]) //lista de estudiantes obtenidos de la API.
  const [q, setQ] = useState('') //cadena de búsqueda (nombre/email).
  const [cargando, setCargando] = useState(true) //bandera de estado para mostrar “Cargando…”.
  const token = obtenerTokenAdmin() //token de autenticación del administrador.
  const router = useRouter() //navegación programática (redirigir).
  const { toast } = useToast() //mostrar notificaciones.

  //useEffect (control de acceso + carga de datos)
  useEffect(() => {
    if (!token) {
      router.replace('/admin/login')
      return
    }
    cargar()
  }, [token, q])
/*
  Si no hay token, se redirige al login de admin.
  Cada vez que cambie el token o el término de búsqueda (q), se ejecuta cargar().
*/


  //Función para obtener estudiantes
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
/*
  Muestra estado de cargando.
  Llama a la API /students con un parámetro de búsqueda opcional.
  Actualiza el estado lista con los estudiantes obtenidos.
  En caso de error, muestra un toast de error.
*/

  //Función para eliminar estudiantes
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
/*
  Pide confirmación al usuario.
  Llama a la API para borrar el estudiante.
  Actualiza la lista local eliminando al estudiante borrado.
  Muestra un toast de éxito o error.
*/

  //Renderizado de la interfaz jsx
  return (
    <div className="min-h-screen bg-[#0b0e13] text-white">
      <Navbar /> {/*Fondo oscuro, texto blanco, incluye la barra de navegación.*/}
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

        {/*Busqueda de esyudiantes*/}
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
        {/*
          Permite buscar estudiantes por nombre o correo.
  
          El campo está enlazado con el estado q.
          
          El botón ejecuta cargar().
        */}

        {/*Lista de estudiantes*/}
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
        {/*
          Muestra el estado de carga, lista vacía o estudiantes.
          Cada estudiante muestra:
          Nombre y correo.
          Botón para eliminar.
        */}

        {/*Renderiza los mensajes emergentes de éxito/error.*/
      </section>
      {/* Toast del portal */}
      <Toaster />
    </div>
  )
}

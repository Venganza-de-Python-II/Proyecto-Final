"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { obtenerCategorias } from "@/lib/api"
import { Filter } from "lucide-react"

/**
 * Propiedades del componente FiltrosTalleres
 */
type Props = {
  /** Callback ejecutado cuando se aplican los filtros */
  onChange?: (f: { q: string; categoria: string }) => void
  /** Valores iniciales para los filtros */
  valores?: { q?: string; categoria?: string }
}

/**
 * Componente de filtros para la búsqueda de talleres
 * Permite filtrar por texto libre y por categoría
 * Carga dinámicamente las categorías disponibles desde la API
 */
export function FiltrosTalleres({ onChange = () => {}, valores = {} }: Props) {
  /** Estado local para el término de búsqueda */
  const [q, setQ] = useState(valores.q || "")
  /** Estado local para la categoría seleccionada */
  const [categoria, setCategoria] = useState(valores.categoria || "todas")
  /** Lista de categorías disponibles cargadas desde la API */
  const [cats, setCats] = useState<string[]>([])

  /**
   * Efecto para cargar las categorías disponibles al montar el componente
   */
  useEffect(() => {
    obtenerCategorias()
      .then(setCats)
      .catch(() => setCats([]))
  }, [])

  return (
    <div className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-emerald-400" />
        <h3 className="font-semibold">Filtros de Búsqueda</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label className="text-white/90">Búsqueda</Label>
          <Input
            className="bg-black/30 border-white/20 text-white placeholder:text-white/50"
            placeholder="Buscar talleres, instructores..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-white/90">Categoría</Label>
          <Select value={categoria} onValueChange={(v) => setCategoria(v)}>
            <SelectTrigger className="bg-black/30 border-white/20 text-white">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent className="bg-[#0b0e13] text-white border-white/10">
              <SelectItem value="todas">Todas</SelectItem>
              {cats.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid items-end">
          <Button
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
            onClick={() => onChange({ q, categoria: categoria === "todas" ? "" : categoria })}
          >
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  )
}

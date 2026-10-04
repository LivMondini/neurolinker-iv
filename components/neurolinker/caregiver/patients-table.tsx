"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { UserRound, Plus, Search, KeyRound, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import type { EngagementLevel, PatientSummary } from "@/lib/neurolinker-data"
import { addPaciente, redefinirPin, rowToPatient } from "@/lib/supabase"

const engagementClassName: Record<EngagementLevel, string> = {
  Alto: "border-emerald-200 bg-emerald-100/60 text-emerald-800 hover:bg-emerald-100/60",
  Médio: "border-amber-200 bg-amber-100/60 text-amber-800 hover:bg-amber-100/60",
  Baixo: "border-rose-200 bg-rose-100/60 text-rose-800 hover:bg-rose-100/60",
}

interface Props {
  patients: PatientSummary[]
  activePatientId?: string
  onSelectPatient: (id: string) => void
  onAddPatient: (patient: PatientSummary) => void
  onAccessPatient: (id: string) => void
}

export function PatientsTable({
  patients,
  activePatientId,
  onSelectPatient,
  onAddPatient,
  onAccessPatient,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [stage, setStage] = useState("Inicial")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  // PIN recém-gerado: mostrado uma única vez, nunca mais legível (no banco só existe o hash).
  const [created, setCreated] = useState<{ name: string; pin: string; novo: boolean } | null>(null)
  // Redefinição de PIN
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState("")

  async function handleReset() {
    if (!resetTarget) return
    setResetting(true)
    setResetError("")
    try {
      const pin = await redefinirPin(resetTarget.id)
      setCreated({ name: resetTarget.name, pin, novo: true })
      setResetTarget(null)
    } catch (err) {
      console.error(err)
      setResetError("Não foi possível gerar um novo PIN. Tente novamente.")
    } finally {
      setResetting(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !age) return

    setSaving(true)
    setErrorMessage("")
    try {
      const { paciente, pin } = await addPaciente({
        name: name.trim(),
        age: Number(age),
        stage: `Estágio ${stage}`,
        avatarUrl: avatarUrl.trim() || undefined,
      })
      const patient = rowToPatient(paciente)
      onAddPatient(patient)
      onSelectPatient(patient.id)

      setOpen(false)
      setCreated({ name: patient.name, pin, novo: false })
      setName("")
      setAge("")
      setStage("Inicial")
      setAvatarUrl("")
    } catch (err) {
      console.error(err)
      setErrorMessage("Não foi possível cadastrar o paciente. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const query = search.trim().toLowerCase()
    return !query || patient.name.toLowerCase().includes(query) || patient.stage.toLowerCase().includes(query)
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Pacientes recentes</CardTitle>
          <CardDescription>
            Acompanhe e gerencie o status e o engajamento diário de cada paciente.
          </CardDescription>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-[#0284c7] hover:bg-[#0284c7]/90">
          <Plus data-icon="inline-start" />
          Cadastrar novo paciente
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou estágio..."
            className="pl-9"
            aria-label="Buscar pacientes"
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Estágio</TableHead>
                <TableHead>Última atividade</TableHead>
                <TableHead>Engajamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    {patients.length === 0
                      ? "Você ainda não cadastrou nenhum paciente."
                      : <>Nenhum paciente encontrado para &quot;{search}&quot;.</>}
                  </TableCell>
                </TableRow>
              )}

              {filteredPatients.map((patient) => (
                <TableRow key={patient.id} className={patient.id === activePatientId ? "bg-[#0284c7]/5" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarImage src={patient.avatarUrl} alt={patient.name} />
                        <AvatarFallback>
                          {patient.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.age} anos</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{patient.stage}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{patient.lastActivity}</TableCell>
                  <TableCell>
                    <div className="flex min-w-24 items-center gap-2">
                      <Progress value={patient.engagementScore} className="h-2" />
                      <span className="text-xs font-medium">{patient.engagementScore}%</span>
                    </div>
                    <Badge className={`mt-1 text-[10px] ${engagementClassName[patient.engagement]}`}>
                      {patient.engagement}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        patient.status === "Ativo"
                          ? "border-emerald-200 bg-emerald-100/60 text-emerald-800 hover:bg-emerald-100/60"
                          : patient.status === "Em avaliação"
                            ? "border-amber-200 bg-amber-100/60 text-amber-800 hover:bg-amber-100/60"
                            : "border-rose-200 bg-rose-100/60 text-rose-800 hover:bg-rose-100/60"
                      }
                    >
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onSelectPatient(patient.id)}>
                        Gerenciar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResetError("")
                          setResetTarget({ id: patient.id, name: patient.name })
                        }}
                      >
                        <RefreshCw data-icon="inline-start" />
                        Novo PIN
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onAccessPatient(patient.id)}>
                        <ExternalLink data-icon="inline-start" />
                        Acessar conta
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Cadastro */}
      <Dialog open={open} onOpenChange={(value) => !saving && setOpen(value)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar novo paciente</DialogTitle>
            <DialogDescription>
              Adicione os dados básicos para criar um novo Baú do Paciente. O PIN de acesso é gerado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="patient-name">Nome completo</FieldLabel>
                <Input
                  id="patient-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Rosa Pereira"
                  required
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="patient-age">Idade</FieldLabel>
                  <Input
                    id="patient-age"
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="78"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="patient-stage">Estágio da doença</FieldLabel>
                  <select
                    id="patient-stage"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option>Inicial</option>
                    <option>Moderado</option>
                    <option>Avançado</option>
                  </select>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="patient-avatar">Foto ou avatar (URL opcional)</FieldLabel>
                <Input
                  id="patient-avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            </FieldGroup>

            {errorMessage && <p className="mt-4 text-sm font-medium text-red-600">{errorMessage}</p>}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#0284c7] hover:bg-[#0284c7]/90">
                {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserRound data-icon="inline-start" />}
                Criar paciente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação para gerar novo PIN */}
      <Dialog open={resetTarget !== null} onOpenChange={(value) => !resetting && !value && setResetTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar novo PIN?</DialogTitle>
            <DialogDescription>
              O PIN atual de {resetTarget?.name} deixará de funcionar imediatamente. O novo PIN será mostrado uma única vez.
            </DialogDescription>
          </DialogHeader>
          {resetError && <p className="text-sm font-medium text-red-600">{resetError}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={resetting} onClick={() => setResetTarget(null)}>
              Cancelar
            </Button>
            <Button disabled={resetting} onClick={handleReset} className="bg-[#0284c7] hover:bg-[#0284c7]/90">
              {resetting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Gerar novo PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN gerado: aparece uma única vez */}
      <Dialog open={created !== null} onOpenChange={(value) => !value && setCreated(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{created?.novo ? "Novo PIN gerado" : "Paciente cadastrado"}</DialogTitle>
            <DialogDescription>
              Anote o PIN de {created?.name} agora. Por segurança, ele não poderá ser mostrado de novo.{created?.novo && " O PIN anterior deixou de funcionar."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-3 rounded-xl bg-amber-50 py-6">
            <KeyRound className="size-6 text-amber-700" />
            <span className="font-mono text-4xl font-semibold tracking-[0.3em] text-amber-900">
              {created?.pin}
            </span>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreated(null)} className="bg-[#0284c7] hover:bg-[#0284c7]/90">
              Anotei o PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
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
import { UserRound, Plus, Search, KeyRound, ExternalLink } from "lucide-react"
import type { EngagementLevel, PatientSummary } from "@/lib/neurolinker-data"

const engagementClassName: Record<EngagementLevel, string> = {
  Alto: "border-emerald-200 bg-emerald-100/60 text-emerald-800 hover:bg-emerald-100/60",
  Médio: "border-amber-200 bg-amber-100/60 text-amber-800 hover:bg-amber-100/60",
  Baixo: "border-rose-200 bg-rose-100/60 text-rose-800 hover:bg-rose-100/60",
}
interface Props { patients: PatientSummary[]; activePatientId?: string; onSelectPatient: (id: string) => void; onAddPatient: (patient: PatientSummary) => void; onAccessPatient: (id: string) => void }

export function PatientsTable({ patients, activePatientId, onSelectPatient, onAddPatient, onAccessPatient }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [stage, setStage] = useState("Inicial")
  const [avatarUrl, setAvatarUrl] = useState("")
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !age) return
    const patient: PatientSummary = { id: `patient-${Date.now()}`, name: name.trim(), age: Number(age), pin: "123456", stage: `Estágio ${stage}`, avatarUrl: avatarUrl || "/placeholder-user.jpg", lastActivity: "Ainda sem atividade", engagement: "Médio", engagementScore: 0, status: "Ativo" }
    onAddPatient(patient); onSelectPatient(patient.id); setOpen(false); setName(""); setAge(""); setStage("Inicial"); setAvatarUrl("")
  }
  const filteredPatients = patients.filter((patient) => { const query = search.trim().toLowerCase(); return !query || patient.name.toLowerCase().includes(query) || patient.stage.toLowerCase().includes(query) })
  return <Card>
    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>Pacientes recentes</CardTitle><CardDescription>Acompanhe e gerencie o status e o engajamento diário de cada paciente.</CardDescription></div><Button onClick={() => setOpen(true)} className="bg-[#0284c7] hover:bg-[#0284c7]/90"><Plus data-icon="inline-start" />Cadastrar novo paciente</Button></CardHeader>
    <CardContent className="flex flex-col gap-4"><div className="relative max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou estágio..." className="pl-9" aria-label="Buscar pacientes" /></div>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Estágio</TableHead><TableHead>Última atividade</TableHead><TableHead>Engajamento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{filteredPatients.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Nenhum paciente encontrado para &quot;{search}&quot;.</TableCell></TableRow>}{filteredPatients.map((patient) => <TableRow key={patient.id} className={patient.id === activePatientId ? "bg-[#0284c7]/5" : ""}><TableCell><div className="flex items-center gap-3"><Avatar className="size-9"><AvatarImage src={patient.avatarUrl} alt={patient.name} /><AvatarFallback>{patient.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback></Avatar><div><p className="font-medium text-foreground">{patient.name}</p><p className="text-xs text-muted-foreground">{patient.age} anos</p><Badge className="mt-1 bg-amber-100 text-[10px] text-amber-800 hover:bg-amber-100"><KeyRound className="mr-1 inline size-3" />Código: {patient.pin}</Badge></div></div></TableCell><TableCell className="text-muted-foreground">{patient.stage}</TableCell><TableCell className="text-sm text-muted-foreground">{patient.lastActivity}</TableCell><TableCell><div className="flex min-w-24 items-center gap-2"><Progress value={patient.engagementScore} className="h-2" /><span className="text-xs font-medium">{patient.engagementScore}%</span></div><Badge className={`mt-1 text-[10px] ${engagementClassName[patient.engagement]}`}>{patient.engagement}</Badge></TableCell><TableCell><Badge className={patient.status === "Ativo" ? "border-emerald-200 bg-emerald-100/60 text-emerald-800 hover:bg-emerald-100/60" : patient.status === "Em avaliação" ? "border-amber-200 bg-amber-100/60 text-amber-800 hover:bg-amber-100/60" : "border-rose-200 bg-rose-100/60 text-rose-800 hover:bg-rose-100/60"}>{patient.status}</Badge></TableCell><TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => onSelectPatient(patient.id)}>Gerenciar</Button><Button size="sm" variant="outline" onClick={() => onAccessPatient(patient.id)}><ExternalLink data-icon="inline-start" />Acessar conta</Button></div></TableCell></TableRow>)}</TableBody></Table></div>
    </CardContent>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Cadastrar novo paciente</DialogTitle><DialogDescription>Adicione os dados básicos para criar um novo Baú do Paciente.</DialogDescription></DialogHeader><form onSubmit={handleSubmit}><FieldGroup className="gap-4"><Field><FieldLabel htmlFor="patient-name">Nome completo</FieldLabel><Input id="patient-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Rosa Pereira" required /></Field><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field><FieldLabel htmlFor="patient-age">Idade</FieldLabel><Input id="patient-age" type="number" min="1" max="120" value={age} onChange={(e) => setAge(e.target.value)} placeholder="78" required /></Field><Field><FieldLabel htmlFor="patient-stage">Estágio da doença</FieldLabel><select id="patient-stage" value={stage} onChange={(e) => setStage(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>Inicial</option><option>Moderado</option><option>Avançado</option></select></Field></div><Field><FieldLabel htmlFor="patient-avatar">Foto ou avatar (URL opcional)</FieldLabel><Input id="patient-avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." /></Field></FieldGroup><DialogFooter className="mt-6"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" className="bg-[#0284c7] hover:bg-[#0284c7]/90"><UserRound data-icon="inline-start" />Criar paciente</Button></DialogFooter></form></DialogContent></Dialog>
  </Card>
}

// O código 123456 é o acesso de demonstração exibido para facilitar testes assistidos.

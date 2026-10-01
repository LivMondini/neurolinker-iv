"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { patients, type EngagementLevel } from "@/lib/neurolinker-data"

const engagementVariant: Record<EngagementLevel, "default" | "secondary" | "outline"> = {
  Alto: "default",
  Médio: "secondary",
  Baixo: "outline",
}

export function PatientsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pacientes recentes</CardTitle>
        <CardDescription>Acompanhe o status e o engajamento diário de cada paciente.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Estágio</TableHead>
              <TableHead>Última atividade</TableHead>
              <TableHead>Engajamento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarImage src={patient.avatarUrl || "/placeholder.svg"} alt={patient.name} />
                      <AvatarFallback>
                        {patient.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">{patient.age} anos</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{patient.stage}</TableCell>
                <TableCell className="text-muted-foreground">{patient.lastActivity}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={patient.engagementScore} className="h-2 w-20" />
                    <Badge variant={engagementVariant[patient.engagement]}>{patient.engagement}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={patient.status === "Ativo" ? "default" : "secondary"}>{patient.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

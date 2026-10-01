"use client"

import { Card } from "@/components/ui/card"
import { Users } from "lucide-react"
import { familyMembers } from "@/lib/neurolinker-data"

export function WhoIsWho() {
  return (
    <Card className="flex flex-col gap-6 rounded-3xl border-2 border-sky-200 bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <Users className="size-6" />
        </div>
        <h2 className="text-2xl font-semibold text-[#2d2a26]">Quem é Quem</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {familyMembers.map((member) => (
          <div
            key={member.id}
            className="flex flex-col items-center gap-3 rounded-2xl bg-sky-50 p-5 text-center transition-transform hover:-translate-y-1"
          >
            <img
              src={member.photoUrl || "/placeholder.svg"}
              alt={`Foto de ${member.name}, ${member.relationship}`}
              className="size-24 rounded-full border-4 border-white object-cover shadow-md"
            />
            <div>
              <p className="text-lg font-semibold text-[#2d2a26]">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.relationship}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

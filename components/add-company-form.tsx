"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface AddCompanyFormProps {
  nodeId: string
  onAddCompany: (nodeId: string, status: "waiting" | "dropped", company: string, comment: string) => void
  defaultStatus?: "waiting" | "dropped"
}

export default function AddCompanyForm({ nodeId, onAddCompany, defaultStatus = "waiting" }: AddCompanyFormProps) {
  const [company, setCompany] = useState("")
  const [comment, setComment] = useState("")
  const [status, setStatus] = useState<"waiting" | "dropped">(defaultStatus)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (company.trim() === "") return

    onAddCompany(nodeId, status, company, comment)

    // Reset form
    setCompany("")
    setComment("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company-name">Название компании</Label>
        <Input
          id="company-name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Введите название компании"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company-comment">Комментарий</Label>
        <Textarea
          id="company-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Введите комментарий"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Статус</Label>
        <RadioGroup
          value={status}
          onValueChange={(value) => setStatus(value as "waiting" | "dropped")}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="waiting" id="waiting" />
            <Label htmlFor="waiting">Ожидает</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dropped" id="dropped" />
            <Label htmlFor="dropped">Выбыли</Label>
          </div>
        </RadioGroup>
      </div>

      <Button type="submit" className="w-full">
        Добавить компанию
      </Button>
    </form>
  )
}

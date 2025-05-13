"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AddCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCompany: (name: string, comment: string) => void
}

export default function AddCompanyModal({ isOpen, onClose, onAddCompany }: AddCompanyModalProps) {
  const [company, setCompany] = useState("")
  const [comment, setComment] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (company.trim() === "") return

    onAddCompany(company, comment)

    // Reset form
    setCompany("")
    setComment("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить новую компанию</DialogTitle>
        </DialogHeader>
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit">Добавить</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

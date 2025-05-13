"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Save, X } from "lucide-react"

interface NodeDetailsTableProps {
  nodeId: string
  userCompanies?: Record<
    string,
    {
      waiting: { companies: string[]; comments: string[] }
      dropped: { companies: string[]; comments: string[] }
    }
  >
  onUpdateCompany?: (
    nodeId: string,
    status: "waiting" | "dropped",
    index: number,
    company: string,
    comment: string,
  ) => void
}

export default function NodeDetailsTable({ nodeId, userCompanies = {}, onUpdateCompany }: NodeDetailsTableProps) {
  const [editingRow, setEditingRow] = useState<{
    index: number
    status: "waiting" | "dropped"
    company: string
    comment: string
  } | null>(null)

  // Merge mock data with user-added companies
  const userData = userCompanies[nodeId] || {
    waiting: { companies: [], comments: [] },
    dropped: { companies: [], comments: [] },
  }

  const mergedData = {
    waiting: {
      companies: [...userData.waiting.companies],
      comments: [...userData.waiting.comments],
    },
    dropped: {
      companies: [...userData.dropped.companies],
      comments: [...userData.dropped.comments],
    },
  }

  const handleEdit = (index: number, status: "waiting" | "dropped", company: string, comment: string) => {
    setEditingRow({ index, status, company, comment })
  }

  const handleSave = () => {
    if (editingRow && onUpdateCompany) {
      onUpdateCompany(nodeId, editingRow.status, editingRow.index, editingRow.company, editingRow.comment)
      setEditingRow(null)
    }
  }

  const handleCancel = () => {
    setEditingRow(null)
  }

  const handleChange = (field: "company" | "comment", value: string) => {
    if (editingRow) {
      setEditingRow({
        ...editingRow,
        [field]: value,
      })
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/4">Ожидает</TableHead>
            <TableHead className="w-1/4">Комментарий</TableHead>
            <TableHead className="w-1/4">Выбыли</TableHead>
            <TableHead className="w-1/4">Комментарий</TableHead>
            <TableHead className="w-[100px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renderTableRows(mergedData, editingRow, handleEdit, handleSave, handleCancel, handleChange)}
        </TableBody>
      </Table>
    </div>
  )
}

function renderTableRows(
  data: CompanyData,
  editingRow: {
    index: number
    status: "waiting" | "dropped"
    company: string
    comment: string
  } | null,
  onEdit: (index: number, status: "waiting" | "dropped", company: string, comment: string) => void,
  onSave: () => void,
  onCancel: () => void,
  onChange: (field: "company" | "comment", value: string) => void,
) {
  const maxRows = Math.max(data.waiting.companies.length, data.dropped.companies.length)
  const rows = []

  for (let i = 0; i < maxRows; i++) {
    const waitingCompany = data.waiting.companies[i] || ""
    const waitingComment = data.waiting.comments[i] || ""
    const droppedCompany = data.dropped.companies[i] || ""
    const droppedComment = data.dropped.comments[i] || ""

    const isEditingWaiting = editingRow?.status === "waiting" && editingRow?.index === i
    const isEditingDropped = editingRow?.status === "dropped" && editingRow?.index === i

    rows.push(
      <TableRow key={i}>
        <TableCell>
          {isEditingWaiting ? (
            <Input
              value={editingRow.company}
              onChange={(e) => onChange("company", e.target.value)}
              className="w-full"
            />
          ) : (
            waitingCompany
          )}
        </TableCell>
        <TableCell>
          {isEditingWaiting ? (
            <Textarea
              value={editingRow.comment}
              onChange={(e) => onChange("comment", e.target.value)}
              className="w-full"
              rows={2}
            />
          ) : (
            waitingComment
          )}
        </TableCell>
        <TableCell>
          {isEditingDropped ? (
            <Input
              value={editingRow.company}
              onChange={(e) => onChange("company", e.target.value)}
              className="w-full"
            />
          ) : (
            droppedCompany
          )}
        </TableCell>
        <TableCell>
          {isEditingDropped ? (
            <Textarea
              value={editingRow.comment}
              onChange={(e) => onChange("comment", e.target.value)}
              className="w-full"
              rows={2}
            />
          ) : (
            droppedComment
          )}
        </TableCell>
        <TableCell>
          {editingRow && (isEditingWaiting || isEditingDropped) ? (
            <div className="flex space-x-1">
              <Button variant="outline" size="icon" onClick={onSave} title="Сохранить">
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={onCancel} title="Отменить">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex space-x-1">
              {waitingCompany && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(i, "waiting", waitingCompany, waitingComment)}
                  title="Редактировать ожидающую компанию"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {droppedCompany && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(i, "dropped", droppedCompany, droppedComment)}
                  title="Редактировать выбывшую компанию"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </TableCell>
      </TableRow>,
    )
  }

  return rows
}

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Save, X, Trash, ArrowDown, ArrowUp, ArrowRight } from "lucide-react"

interface NodeModalProps {
  isOpen: boolean
  onClose: () => void
  nodeId: string | null
  nodeTitle: string
  userCompanies: Record<
    string,
    {
      waiting: { companies: string[]; comments: string[] }
      dropped: { companies: string[]; comments: string[] }
    }
  >
  onUpdateCompany: (
    nodeId: string,
    status: "waiting" | "dropped",
    index: number,
    company: string,
    comment: string,
  ) => void
  onAddCompany: (nodeId: string, status: "waiting" | "dropped", company: string, comment: string) => void
  onDeleteCompany: (nodeId: string, status: "waiting" | "dropped", index: number) => void
  onMoveCompany: (
    fromNodeId: string,
    toNodeId: string,
    fromStatus: "waiting" | "dropped",
    toStatus: "waiting" | "dropped",
    index: number,
  ) => void
  getNextNodes: (nodeId: string) => string[]
}

export default function NodeModal({
  isOpen,
  onClose,
  nodeId,
  nodeTitle,
  userCompanies,
  onUpdateCompany,
  onAddCompany,
  onDeleteCompany,
  onMoveCompany,
  getNextNodes,
}: NodeModalProps) {
  const [editingRow, setEditingRow] = useState<{
    index: number
    status: "waiting" | "dropped"
    company: string
    comment: string
  } | null>(null)

  const [activeTab, setActiveTab] = useState<"waiting" | "dropped">("waiting")

  if (!nodeId) return null

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
    if (editingRow && nodeId) {
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

  const handleDelete = (status: "waiting" | "dropped", index: number) => {
    if (nodeId) {
      onDeleteCompany(nodeId, status, index)
    }
  }

  const handleStatusChange = (status: "waiting" | "dropped", index: number) => {
    if (nodeId) {
      const newStatus = status === "waiting" ? "dropped" : "waiting"
      onMoveCompany(nodeId, nodeId, status, newStatus, index)
    }
  }

  const handleMoveToNextNode = (status: "waiting" | "dropped", index: number, nextNodeId: string) => {
    if (nodeId) {
      onMoveCompany(nodeId, nextNodeId, status, "waiting", index)
    }
  }

  const nextNodes = nodeId ? getNextNodes(nodeId) : []

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Детали этапа: {nodeTitle}</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="waiting"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "waiting" | "dropped")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="waiting">Ожидает ({mergedData.waiting.companies.length})</TabsTrigger>
            <TabsTrigger value="dropped">Выбыли ({mergedData.dropped.companies.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="waiting" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Компания</TableHead>
                  <TableHead>Комментарий</TableHead>
                  <TableHead className="w-[180px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedData.waiting.companies.map((company, index) => {
                  const comment = mergedData.waiting.comments[index] || ""
                  const isEditing = editingRow?.status === "waiting" && editingRow?.index === index

                  return (
                    <TableRow key={`waiting-${index}`}>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingRow.company}
                            onChange={(e) => handleChange("company", e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          company
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Textarea
                            value={editingRow.comment}
                            onChange={(e) => handleChange("comment", e.target.value)}
                            className="w-full"
                            rows={2}
                          />
                        ) : (
                          comment
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {isEditing ? (
                            <>
                              <Button variant="outline" size="icon" onClick={handleSave} title="Сохранить">
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={handleCancel} title="Отменить">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(index, "waiting", company, comment)}
                                title="Редактировать"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDelete("waiting", index)}
                                title="Удалить"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleStatusChange("waiting", index)}
                                title="Переместить в Выбыли"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              {nextNodes.length > 0 && (
                                <div className="relative group">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    title={
                                      nextNodes.length === 1
                                        ? `Переместить на этап "${getNodeTitle(nextNodes[0])}"`
                                        : "Переместить на следующий этап"
                                    }
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                  {nextNodes.length > 1 && (
                                    <div className="absolute right-0 top-9 mt-1 bg-white dark:bg-black shadow-md rounded-md p-1 hidden group-hover:block z-10">
                                      {nextNodes.map((nextNodeId) => (
                                        <Button
                                          key={nextNodeId}
                                          variant="ghost"
                                          size="sm"
                                          className="w-full justify-start"
                                          onClick={() => handleMoveToNextNode("waiting", index, nextNodeId)}
                                        >
                                          {getNodeTitle(nextNodeId)}
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                  {nextNodes.length === 1 && (
                                    <div
                                      className="absolute left-0 top-0 w-full h-full cursor-pointer"
                                      onClick={() => handleMoveToNextNode("waiting", index, nextNodes[0])}
                                    ></div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {mergedData.waiting.companies.length === 0 && (
              <div className="text-center py-4 text-gray-500">Нет компаний в ожидании</div>
            )}
          </TabsContent>

          <TabsContent value="dropped" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Компания</TableHead>
                  <TableHead>Комментарий</TableHead>
                  <TableHead className="w-[180px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedData.dropped.companies.map((company, index) => {
                  const comment = mergedData.dropped.comments[index] || ""
                  const isEditing = editingRow?.status === "dropped" && editingRow?.index === index

                  return (
                    <TableRow key={`dropped-${index}`}>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingRow.company}
                            onChange={(e) => handleChange("company", e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          company
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Textarea
                            value={editingRow.comment}
                            onChange={(e) => handleChange("comment", e.target.value)}
                            className="w-full"
                            rows={2}
                          />
                        ) : (
                          comment
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {isEditing ? (
                            <>
                              <Button variant="outline" size="icon" onClick={handleSave} title="Сохранить">
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={handleCancel} title="Отменить">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(index, "dropped", company, comment)}
                                title="Редактировать"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDelete("dropped", index)}
                                title="Удалить"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleStatusChange("dropped", index)}
                                title="Переместить в Ожидает"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {mergedData.dropped.companies.length === 0 && (
              <div className="text-center py-4 text-gray-500">Нет выбывших компаний</div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function getNodeTitle(nodeId: string): string {
  const nodeTitles: Record<string, string> = {
    selected: "Выбрали",
    collecting: "Собираем КП",
    submitted: "Подали КП",
    won: "Выграли КП",
    waiting: "Ожидаем фидбека",
    preparation: "Подготовка к старту",
    mvp: "Делаем MVP",
    delivery: "Сдача MVP",
    support: "Техподдержка",
  }

  return nodeTitles[nodeId] || nodeId
}

"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash, ArrowDown, ArrowUp, ArrowRight, ExternalLink, History } from "lucide-react"
import CompanyDetailsModal from "./company-details-modal"
import Link from "next/link"

interface CompanyWithId {
  id: number;
  name: string;
  comment: string;
  deadline_date?: string | null;
}

// Интерфейс для выбранной компании
interface SelectedCompany {
  id: number;
  name: string;
  comment: string;
  status: "waiting" | "dropped";
  index: number; // Индекс компании обязателен
  deadline_date?: string | null;
}

// Интерфейс для содержимого таблицы
interface TableContentProps {
  status: "waiting" | "dropped";
  companies: CompanyWithId[];
  deadlineDates: Record<number, string | null>;
  formatDate: (dateString: string | null | undefined) => string;
  handleOpenCompanyDetails: (index: number, status: "waiting" | "dropped") => void;
  handleDelete: (status: "waiting" | "dropped", index: number) => void;
  handleStatusChange: (status: "waiting" | "dropped", index: number) => void;
  handleMoveToNextNode?: (status: "waiting" | "dropped", index: number, nextNodeId: string) => void;
  nextNodes?: string[];
  getNodeTitle?: (nodeId: string) => string;
}

// Компонент для отображения содержимого таблицы
function TableContent({
  status,
  companies,
  deadlineDates,
  formatDate,
  handleOpenCompanyDetails,
  handleDelete,
  handleStatusChange,
  handleMoveToNextNode,
  nextNodes = [],
  getNodeTitle = (id) => id
}: TableContentProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Компания</TableHead>
          <TableHead>Комментарий</TableHead>
          <TableHead>Срок подачи КП</TableHead>
          <TableHead className="w-[220px]">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map((company, index) => {
          const comment = company.comment || "";

          return (
            <TableRow key={`${status}-${index}`}>
              <TableCell>{company.name}</TableCell>
              <TableCell>{comment}</TableCell>
              <TableCell>{formatDate(deadlineDates[company.id])}</TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleOpenCompanyDetails(index, status)}
                    title="Полное редактирование"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Link href={`/company-history?id=${company.id}&name=${encodeURIComponent(company.name)}`} passHref>
                    <Button
                      variant="outline"
                      size="icon"
                      title="История изменений"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(status, index)}
                    title="Удалить"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleStatusChange(status, index)}
                    title={status === "waiting" ? "Переместить в Выбыли" : "Переместить в Ожидает"}
                  >
                    {status === "waiting" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                  </Button>
                  {status === "waiting" && nextNodes && nextNodes.length > 0 && (
                    <div className="relative group">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={nextNodes.length === 1 && handleMoveToNextNode ?
                          () => handleMoveToNextNode(status, index, nextNodes[0]) :
                          undefined}
                        title={
                          nextNodes.length === 1
                            ? `Переместить на этап "${getNodeTitle(nextNodes[0])}"`
                            : "Переместить на следующий этап"
                        }
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      {nextNodes.length > 1 && handleMoveToNextNode && (
                        <div className="absolute right-0 top-9 mt-1 bg-white dark:bg-black shadow-md rounded-md p-1 hidden group-hover:block z-10">
                          {nextNodes.map((nextNodeId) => (
                            <Button
                              key={nextNodeId}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => handleMoveToNextNode(status, index, nextNodeId)}
                            >
                              {getNodeTitle(nextNodeId)}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

interface NodeModalProps {
  isOpen: boolean
  onClose: () => void
  nodeId: string | null
  nodeTitle: string
  userCompanies: Record<
    string,
    {
      waiting: { companies: CompanyWithId[] }
      dropped: { companies: CompanyWithId[] }
    }
  >
  onUpdateCompany: (
    nodeId: string,
    status: "waiting" | "dropped",
    index: number,
    name: string,
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    tkpLink?: string | null,
    deadlineDate?: string | null,
    filesToUpload?: { file: File, description: string }[]
  ) => Promise<void>
  onAddCompany: (
    nodeId: string,
    status: "waiting" | "dropped",
    name: string,
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    tkpLink?: string | null,
    deadlineDate?: string | null,
    filesToUpload?: { file: File, description: string }[]
  ) => void
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
  const [activeTab, setActiveTab] = useState<"waiting" | "dropped">("waiting")
  const [companyDetailsModalOpen, setCompanyDetailsModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<SelectedCompany | null>(null)
  const [deadlineDates, setDeadlineDates] = useState<Record<number, string | null>>({})

  if (!nodeId) return null

  const userData = userCompanies[nodeId] || {
    waiting: { companies: [] },
    dropped: { companies: [] },
  }

  // Используем useMemo для предотвращения создания нового объекта при каждом рендере
  const mergedData = useMemo(() => ({
    waiting: {
      companies: [...(userData.waiting.companies || [])],
    },
    dropped: {
      companies: [...(userData.dropped.companies || [])],
    },
  }), [userData]);

  // Функция для форматирования даты
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    } catch {
      return dateString || "-";
    }
  };

  // Загрузка дат для компаний текущего узла
  useEffect(() => {
    const fetchCompanyDates = async () => {
      const dates: Record<number, string | null> = {};

      // Собираем все ID компаний в текущем узле
      const companyIds = [
        ...(userData.waiting.companies || []).map(c => c.id),
        ...(userData.dropped.companies || []).map(c => c.id)
      ];

      // Запрашиваем данные для каждой компании
      for (const id of companyIds) {
        try {
          const response = await fetch(`/api/companies/${id}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              dates[id] = result.data.deadline_date;
            }
          }
        } catch (error) {
          console.error(`Ошибка получения данных для компании ${id}:`, error);
        }
      }

      setDeadlineDates(dates);
    };

    if (isOpen && nodeId) {
      fetchCompanyDates();
    }
  }, [isOpen, nodeId, userData]); // Заменяем mergedData на userData

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

  const handleOpenCompanyDetails = (index: number, status: "waiting" | "dropped") => {
    if (nodeId) {
      const company = mergedData[status].companies[index];
      setSelectedCompany({
        id: company.id,
        name: company.name,
        comment: company.comment,
        status,
        index,
        deadline_date: deadlineDates[company.id]
      });
      setCompanyDetailsModalOpen(true);
    }
  }

  const handleCloseCompanyDetails = () => {
    setCompanyDetailsModalOpen(false);
    setSelectedCompany(null);
  }

  const nextNodes = nodeId ? getNextNodes(nodeId) : []

  return (
    <>
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
              <TableContent
                status="waiting"
                companies={mergedData.waiting.companies}
                deadlineDates={deadlineDates}
                formatDate={formatDate}
                handleOpenCompanyDetails={handleOpenCompanyDetails}
                handleDelete={handleDelete}
                handleStatusChange={handleStatusChange}
                handleMoveToNextNode={handleMoveToNextNode}
                nextNodes={nextNodes}
                getNodeTitle={getNodeTitle}
              />

              {mergedData.waiting.companies.length === 0 && (
                <div className="py-24 text-center text-gray-500">
                  Нет компаний в статусе "Ожидает"
                </div>
              )}
            </TabsContent>

            <TabsContent value="dropped" className="mt-4">
              <TableContent
                status="dropped"
                companies={mergedData.dropped.companies}
                deadlineDates={deadlineDates}
                formatDate={formatDate}
                handleOpenCompanyDetails={handleOpenCompanyDetails}
                handleDelete={handleDelete}
                handleStatusChange={handleStatusChange}
              />

              {mergedData.dropped.companies.length === 0 && (
                <div className="py-24 text-center text-gray-500">
                  Нет компаний в статусе "Выбыли"
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {selectedCompany && nodeId && (
        <CompanyDetailsModal
          isOpen={companyDetailsModalOpen}
          onClose={handleCloseCompanyDetails}
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
          companyComment={selectedCompany.comment}
          nodeId={nodeId}
          status={selectedCompany.status}
          index={selectedCompany.index}
          onUpdateCompany={onUpdateCompany}
        />
      )}
    </>
  )
}

function getNodeTitle(nodeId: string): string {
  const nodeTitles: Record<string, string> = {
    selected: "Выбрали",
    collecting: "Собираем КП",
    submitted: "Подали КП",
    won: "Выграли КП",
    // waiting: "Ожидаем фидбека",
    preparation: "Подготовка к старту",
    mvp: "Делаем MVP",
    delivery: "Сдача MVP",
    support: "Техподдержка",
  };

  return nodeTitles[nodeId] || nodeId;
}

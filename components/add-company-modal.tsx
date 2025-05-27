"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Link, ExternalLink, FileDigit, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CompanyFileUploader from "./CompanyFileUploader"

interface FileToUpload {
  file: File;
  description: string;
}

interface AddCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCompany: (
    name: string,
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    tkpLink?: string | null,
    deadlineDate?: string | null,
    filesToUpload?: FileToUpload[]
  ) => void
}

/**
 * Модальное окно для добавления новой компании
 * Включает поля для имени, комментария, ссылок на документы и загрузки файлов
 */
export default function AddCompanyModal({ isOpen, onClose, onAddCompany }: AddCompanyModalProps) {
  const [company, setCompany] = useState("")
  const [comment, setComment] = useState("")
  const [docLink, setDocLink] = useState<string>("")
  const [tenderLink, setTenderLink] = useState<string>("")
  const [tkpLink, setTkpLink] = useState<string>("")
  const [deadlineDate, setDeadlineDate] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("info")
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);

  // Валидация URL
  const isValidUrl = (url: string) => {
    if (!url) return true; // Пустая строка разрешена

    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (company.trim() === "") return

    // Проверка валидности URL
    if (!isValidUrl(docLink)) {
      setError('Ссылка на документ ТЗ некорректна');
      return;
    }

    if (!isValidUrl(tenderLink)) {
      setError('Ссылка на тендер некорректна');
      return;
    }
    
    if (!isValidUrl(tkpLink)) {
      setError('Ссылка на ТКП некорректна');
      return;
    }

    onAddCompany(
      company,
      comment,
      docLink.trim() ? docLink.trim() : null,
      tenderLink.trim() ? tenderLink.trim() : null,
      tkpLink.trim() ? tkpLink.trim() : null,
      deadlineDate.trim() ? deadlineDate.trim() : null,
      filesToUpload.length > 0 ? filesToUpload : undefined
    )

    // Reset form
    setCompany("")
    setComment("")
    setDocLink("")
    setTenderLink("")
    setTkpLink("")
    setDeadlineDate("")
    setFilesToUpload([])
  }

  // Обработчик выбора файлов
  const handleFileSelect = (files: FileToUpload[]) => {
    setFilesToUpload(files);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить новую компанию</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Основная информация</TabsTrigger>
            <TabsTrigger value="links">Ссылки</TabsTrigger>
            <TabsTrigger value="files">Файлы</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 py-4">
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
              <Label htmlFor="deadline-date">Срок подачи КП</Label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <Calendar className="h-4 w-4" />
                </span>
                <Input
                  id="deadline-date"
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="rounded-l-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Укажите конечный срок подачи коммерческого предложения
              </p>
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
          </TabsContent>

          <TabsContent value="links" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doc-link">Ссылка на ТЗ (Яндекс/Google Документ)</Label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <Link className="h-4 w-4" />
                </span>
                <Input
                  id="doc-link"
                  value={docLink}
                  onChange={(e) => setDocLink(e.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                  className="rounded-l-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Укажите ссылку на документ с техническим заданием
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tender-link">Ссылка на тендер</Label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <ExternalLink className="h-4 w-4" />
                </span>
                <Input
                  id="tender-link"
                  value={tenderLink}
                  onChange={(e) => setTenderLink(e.target.value)}
                  placeholder="https://zakupki.gov.ru/..."
                  className="rounded-l-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Укажите ссылку на сайт, где был найден тендер
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tkp-link">ТКП Яндекс Диск</Label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <FileDigit className="h-4 w-4" />
                </span>
                <Input
                  id="tkp-link"
                  value={tkpLink}
                  onChange={(e) => setTkpLink(e.target.value)}
                  placeholder="https://disk.yandex.ru/d/..."
                  className="rounded-l-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Укажите ссылку на ТКП в Яндекс Диске
              </p>
            </div>

            {/* Предпросмотр ссылок если они заполнены */}
            <div className="mt-4 space-y-2">
              {docLink && (
                <div className="flex items-center space-x-2">
                  <Link className="h-4 w-4 text-blue-500" />
                  <a
                    href={docLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Открыть документ ТЗ в новой вкладке
                  </a>
                </div>
              )}

              {tenderLink && (
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                  <a
                    href={tenderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Открыть страницу тендера в новой вкладке
                  </a>
                </div>
              )}
              
              {tkpLink && (
                <div className="flex items-center space-x-2">
                  <FileDigit className="h-4 w-4 text-blue-500" />
                  <a
                    href={tkpLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Открыть ТКП в Яндекс Диске
                  </a>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4 py-4">
            <CompanyFileUploader onFileSelect={handleFileSelect} />
          </TabsContent>
        </Tabs>

        {error && (
          <div className="text-sm text-red-600 mt-2">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>Добавить</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

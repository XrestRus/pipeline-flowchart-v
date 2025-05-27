"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Link, ExternalLink, FileDigit, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CompanyFileUploader from "./CompanyFileUploader"

interface FileToUpload {
  file: File;
  description: string;
}

interface AddCompanyFormProps {
  nodeId: string
  onAddCompany: (
    nodeId: string, 
    status: "waiting" | "dropped", 
    name: string, 
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    tkpLink?: string | null,
    deadlineDate?: string | null,
    filesToUpload?: FileToUpload[]
  ) => void
  defaultStatus?: "waiting" | "dropped"
}

/**
 * Компонент формы для добавления новой компании
 * Позволяет указать имя, комментарий, статус, ссылки на документы и загрузить файлы
 */
export default function AddCompanyForm({ nodeId, onAddCompany, defaultStatus = "waiting" }: AddCompanyFormProps) {
  const [name, setName] = useState("")
  const [comment, setComment] = useState("")
  const [status, setStatus] = useState<"waiting" | "dropped">(defaultStatus)
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

    if (name.trim() === "") return

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
      nodeId, 
      status, 
      name, 
      comment, 
      docLink.trim() ? docLink.trim() : null, 
      tenderLink.trim() ? tenderLink.trim() : null,
      tkpLink.trim() ? tkpLink.trim() : null,
      deadlineDate.trim() ? deadlineDate.trim() : null,
      filesToUpload.length > 0 ? filesToUpload : undefined
    )

    // Reset form
    setName("")
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
              value={name}
              onChange={(e) => setName(e.target.value)}
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
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full">
        Добавить компанию
      </Button>
    </form>
  )
}

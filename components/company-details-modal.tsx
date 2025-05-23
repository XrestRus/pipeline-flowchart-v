/**
 * Компонент модального окна для отображения и редактирования деталей компании
 * Включает работу с файлами и ссылками на документы
 */
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import CompanyFilesManager from "./CompanyFilesManager"
import CompanyLinksManager from "./CompanyLinksManager"
import CompanyFileUploader from "./CompanyFileUploader"

interface FileToUpload {
  file: File;
  description: string;
}

interface CompanyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
  companyComment: string;
  nodeId: string;
  status: "waiting" | "dropped";
  index: number;
  onUpdateCompany: (
    nodeId: string,
    status: "waiting" | "dropped",
    index: number,
    name: string,
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    filesToUpload?: FileToUpload[]
  ) => Promise<void>;
}

export default function CompanyDetailsModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  companyComment,
  nodeId,
  status,
  index,
  onUpdateCompany,
}: CompanyDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Информация о компании
  const [name, setName] = useState(companyName);
  const [comment, setComment] = useState(companyComment);
  const [docLink, setDocLink] = useState<string | null>(null);
  const [tenderLink, setTenderLink] = useState<string | null>(null);
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);
  
  // Загрузка дополнительных данных о компании
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!companyId) return;
      
      try {
        const response = await fetch(`/api/companies/${companyId}`);
        if (!response.ok) {
          throw new Error("Не удалось загрузить данные о компании");
        }
        
        const data = await response.json();
        if (data.success && data.data) {
          const company = data.data;
          setName(company.name);
          setComment(company.comment || "");
          setDocLink(company.doc_link);
          setTenderLink(company.tender_link);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных о компании:", error);
        setError("Не удалось загрузить дополнительные данные о компании");
      }
    };
    
    if (isOpen && companyId) {
      setName(companyName);
      setComment(companyComment);
      fetchCompanyDetails();
      
      // Сбрасываем состояние при открытии
      setFilesToUpload([]);
    }
  }, [isOpen, companyId, companyName, companyComment]);
  
  // Обработчик сохранения изменений
  const handleSaveChanges = async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await onUpdateCompany(
        nodeId, 
        status, 
        index,
        name, 
        comment, 
        docLink, 
        tenderLink,
        filesToUpload.length > 0 ? filesToUpload : undefined
      );
      
      // Закрываем модальное окно после успешного сохранения
      onClose();
    } catch (error: any) {
      console.error("Ошибка сохранения данных компании:", error);
      setError(error.message || "Не удалось сохранить изменения");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Обработчик обновления ссылок
  const handleUpdateLinks = async (newDocLink: string | null, newTenderLink: string | null) => {
    if (!companyId) return;
    
    setDocLink(newDocLink);
    setTenderLink(newTenderLink);
    
    try {
      await onUpdateCompany(
        nodeId, 
        status, 
        index,
        name, 
        comment, 
        newDocLink, 
        newTenderLink
      );
      return Promise.resolve();
    } catch (error: any) {
      console.error("Ошибка сохранения ссылок:", error);
      return Promise.reject(error);
    }
  };
  
  // Обработчик выбора файлов
  const handleFileSelect = (files: FileToUpload[]) => {
    setFilesToUpload(files);
  };
  
  if (!companyId) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Детали компании: {companyName}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Информация</TabsTrigger>
            <TabsTrigger value="links">Ссылки</TabsTrigger>
            <TabsTrigger value="files">Файлы</TabsTrigger>
          </TabsList>
          
          {/* Вкладка с основной информацией */}
          <TabsContent value="info" className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="company-name" className="block text-sm font-medium">
                Название компании
              </label>
              <Input
                id="company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите название компании"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="company-comment" className="block text-sm font-medium">
                Комментарий
              </label>
              <Textarea
                id="company-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Введите комментарий"
                rows={5}
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleSaveChanges}
                disabled={isLoading}
                className="ml-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить изменения"
                )}
              </Button>
            </div>
          </TabsContent>
          
          {/* Вкладка со ссылками */}
          <TabsContent value="links">
            <CompanyLinksManager 
              companyId={companyId}
              docLink={docLink}
              tenderLink={tenderLink}
              onUpdate={handleUpdateLinks}
            />
          </TabsContent>
          
          {/* Вкладка с файлами и загрузкой */}
          <TabsContent value="files" className="space-y-8">
            {/* Существующие файлы */}
            <CompanyFilesManager companyId={companyId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 
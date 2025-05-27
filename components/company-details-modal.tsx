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
import { Loader2, Calendar } from "lucide-react"
import CompanyFilesManager from "./CompanyFilesManager"
import CompanyLinksManager from "./CompanyLinksManager"
import CompanyFileUploader from "./CompanyFileUploader"

// Функция для форматирования даты в формат YYYY-MM-DD для input[type="date"]
const formatDateForInput = (dateString: string | null): string => {
  if (!dateString) return '';
  
  try {
    // Обрабатываем случай, когда дата приходит в формате ISO (2023-06-15T00:00:00.000Z)
    // или в локальном формате (2023-06-15)
    let date: Date;
    
    if (dateString.includes('T')) {
      // ISO формат
      date = new Date(dateString);
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Уже в правильном формате YYYY-MM-DD
      return dateString;
    } else {
      // Другие форматы
      date = new Date(dateString);
    }
    
    // Проверяем, является ли дата валидной
    if (isNaN(date.getTime())) {
      console.error('Невалидная дата:', dateString);
      return '';
    }
    
    // Получаем год, месяц и день в формате YYYY-MM-DD
    // Используем UTC чтобы избежать проблем с часовыми поясами
    const year = date.getUTCFullYear();
    // getMonth() возвращает 0-11, поэтому добавляем 1
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day}`;
    console.log(`Форматирование даты: ${dateString} -> ${formattedDate}`);
    
    return formattedDate;
  } catch (error) {
    console.error('Ошибка форматирования даты:', error, 'для значения:', dateString);
    return '';
  }
};

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
    tkpLink?: string | null,
    deadlineDate?: string | null,
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
  const [tkpLink, setTkpLink] = useState<string | null>(null);
  const [deadlineDate, setDeadlineDate] = useState<string | null>(null);
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
          setTkpLink(company.tkp_link);
          
          // Логирование значения deadline_date для отладки
          console.log('Получена дата с сервера:', company.deadline_date);
          
          // Установка deadline_date
          setDeadlineDate(company.deadline_date);
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
    
    // Подробное логирование для отладки
    console.log('Сохраняемая дата (deadlineDate):', deadlineDate);
    console.log('Тип данных deadlineDate:', typeof deadlineDate);
    
    try {
      // Форматируем deadlineDate в правильный формат для БД
      let formattedDeadlineDate = deadlineDate;
      
      // Если дата выбрана, форматируем её
      if (deadlineDate) {
        // Убедимся, что дата имеет формат YYYY-MM-DD для MySQL DATE
        if (deadlineDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedDeadlineDate = deadlineDate;
        } else {
          try {
            // Создаем объект Date и форматируем в YYYY-MM-DD
            const date = new Date(deadlineDate);
            if (!isNaN(date.getTime())) {
              formattedDeadlineDate = formatDateForInput(deadlineDate);
            }
          } catch (e) {
            console.error('Ошибка форматирования даты при сохранении:', e);
          }
        }
      }
      
      // Логируем запрос, который будем отправлять
      console.log('Запрос на обновление компании:', {
        nodeId, 
        status, 
        index,
        name, 
        comment, 
        docLink, 
        tenderLink,
        tkpLink,
        deadlineDate: formattedDeadlineDate,
        formattedDate: formattedDeadlineDate,
        filesToUpload: filesToUpload.length > 0 ? `${filesToUpload.length} файлов` : undefined
      });
      
      await onUpdateCompany(
        nodeId, 
        status, 
        index,
        name, 
        comment, 
        docLink, 
        tenderLink,
        tkpLink,
        formattedDeadlineDate,
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
  const handleUpdateLinks = async (newDocLink: string | null, newTenderLink: string | null, newTkpLink: string | null) => {
    if (!companyId) return;
    
    setDocLink(newDocLink);
    setTenderLink(newTenderLink);
    setTkpLink(newTkpLink);
    
    try {
      await onUpdateCompany(
        nodeId, 
        status, 
        index,
        name, 
        comment, 
        newDocLink, 
        newTenderLink,
        newTkpLink,
        deadlineDate
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
              <label htmlFor="deadline-date" className="block text-sm font-medium">
                Срок подачи КП
              </label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <Calendar className="h-4 w-4" />
                </span>
                <Input
                  id="deadline-date"
                  type="date"
                  value={formatDateForInput(deadlineDate)}
                  onChange={(e) => setDeadlineDate(e.target.value || null)}
                  className="rounded-l-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Укажите конечный срок подачи коммерческого предложения
              </p>
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
              tkpLink={tkpLink}
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
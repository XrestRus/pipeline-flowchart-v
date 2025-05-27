/**
 * Универсальная форма компании для добавления и редактирования
 * Поддерживает работу с основной информацией, ссылками и файлами
 */
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Calendar, Link, ExternalLink, FileDigit } from "lucide-react"
import CompanyFiles from "./CompanyFiles"
import { toast } from "sonner"

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

interface CompanyFormProps {
  // Общие пропсы
  isOpen: boolean;
  onClose: () => void;
  
  // Режим работы
  mode: "add" | "edit";
  
  // Для режима добавления
  onAddCompany?: (
    name: string,
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    tkpLink?: string | null,
    deadlineDate?: string | null,
    filesToUpload?: FileToUpload[],
    status?: "waiting" | "dropped"
  ) => Promise<void>;
  
  // Для режима редактирования
  companyId?: number;
  companyName?: string;
  companyComment?: string;
  nodeId?: string;
  status?: "waiting" | "dropped";
  index?: number;
  deadlineDate?: string | null;
  docLink?: string | null;
  tenderLink?: string | null;
  tkpLink?: string | null;
  onUpdateCompany?: (
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
  
  // Опциональные настройки
  showStatusSelector?: boolean;
  defaultStatus?: "waiting" | "dropped";
}

/**
 * Универсальная форма для добавления и редактирования компаний
 */
export default function CompanyForm({
  isOpen,
  onClose,
  mode,
  onAddCompany,
  companyId,
  companyName = "",
  companyComment = "",
  nodeId,
  status = "waiting",
  index,
  deadlineDate: initialDeadlineDate,
  docLink: initialDocLink,
  tenderLink: initialTenderLink,
  tkpLink: initialTkpLink,
  onUpdateCompany,
  showStatusSelector = false,
  defaultStatus = "waiting"
}: CompanyFormProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние формы
  const [name, setName] = useState(companyName);
  const [comment, setComment] = useState(companyComment);
  const [companyStatus, setCompanyStatus] = useState<"waiting" | "dropped">(status || defaultStatus);
  const [docLink, setDocLink] = useState<string>("");
  const [tenderLink, setTenderLink] = useState<string>("");
  const [tkpLink, setTkpLink] = useState<string>("");
  const [deadlineDate, setDeadlineDate] = useState<string>("");
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);

  // Загрузка данных для режима редактирования
  useEffect(() => {
    if (mode === "edit" && isOpen) {
      // Используем данные, переданные через пропсы, вместо API запроса
      setName(companyName);
      setComment(companyComment);
      setDocLink(initialDocLink || "");
      setTenderLink(initialTenderLink || "");
      setTkpLink(initialTkpLink || "");
      setDeadlineDate(initialDeadlineDate || "");
      setFilesToUpload([]);
      setError(null);
    } else if (mode === "add" && isOpen) {
      // Сброс формы для режима добавления
      setName("");
      setComment("");
      setCompanyStatus(defaultStatus);
      setDocLink("");
      setTenderLink("");
      setTkpLink("");
      setDeadlineDate("");
      setFilesToUpload([]);
      setError(null);
    }
  }, [isOpen, mode, companyName, companyComment, initialDeadlineDate, initialDocLink, initialTenderLink, initialTkpLink, defaultStatus]);

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

  // Обработчик сохранения
  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    if (name.trim() === "") {
      setError("Название компании обязательно");
      setIsLoading(false);
      return;
    }

    // Проверка валидности URL
    if (!isValidUrl(docLink)) {
      setError('Ссылка на документ ТЗ некорректна');
      setIsLoading(false);
      return;
    }
    
    if (!isValidUrl(tenderLink)) {
      setError('Ссылка на тендер некорректна');
      setIsLoading(false);
      return;
    }
    
    if (!isValidUrl(tkpLink)) {
      setError('Ссылка на ТКП некорректна');
      setIsLoading(false);
      return;
    }

    try {
      // Форматируем дату
      let formattedDeadlineDate = deadlineDate;
      if (deadlineDate) {
        if (deadlineDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedDeadlineDate = deadlineDate;
        } else {
          try {
            const date = new Date(deadlineDate);
            if (!isNaN(date.getTime())) {
              formattedDeadlineDate = formatDateForInput(deadlineDate);
            }
          } catch (e) {
            console.error('Ошибка форматирования даты при сохранении:', e);
          }
        }
      }

      if (mode === "add" && onAddCompany) {
        await onAddCompany(
          name,
          comment,
          docLink.trim() ? docLink.trim() : null,
          tenderLink.trim() ? tenderLink.trim() : null,
          tkpLink.trim() ? tkpLink.trim() : null,
          formattedDeadlineDate || null,
          filesToUpload.length > 0 ? filesToUpload : undefined,
          showStatusSelector ? companyStatus : undefined
        );
        toast.success(`Компания "${name}" успешно добавлена`);
      } else if (mode === "edit" && onUpdateCompany && nodeId !== undefined && index !== undefined) {
        await onUpdateCompany(
          nodeId,
          status,
          index,
          name,
          comment,
          docLink.trim() ? docLink.trim() : null,
          tenderLink.trim() ? tenderLink.trim() : null,
          tkpLink.trim() ? tkpLink.trim() : null,
          formattedDeadlineDate || null,
          filesToUpload.length > 0 ? filesToUpload : undefined
        );
        toast.success(`Данные компании "${name}" успешно сохранены`);
      }

      onClose();
    } catch (error: any) {
      console.error("Ошибка сохранения:", error);
      const errorMessage = error.message || "Не удалось сохранить данные";
      setError(errorMessage);
      toast.error(`Ошибка сохранения: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик выбора файлов
  const handleFileSelect = (files: FileToUpload[]) => {
    setFilesToUpload(files);
  };

  const title = mode === "add" ? "Добавить новую компанию" : `Детали компании: ${companyName}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {/* Добавьте описание для формы, если оно необходимо */}
          </DialogDescription>
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
              <div className="relative">
                <input
                  key={`deadline-${mode}-${isOpen}`}
                  id="deadline-date"
                  type="date"
                  value={formatDateForInput(deadlineDate)}
                  onChange={(e) => setDeadlineDate(e.target.value || "")}
                  onClick={(e) => {
                    // Программно открываем календарь при клике на любое место input'а
                    e.currentTarget.showPicker?.();
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent"
                  style={{
                    colorScheme: 'light'
                  }}
                />
                <Calendar 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 cursor-pointer" 
                  onClick={() => {
                    // Открываем календарь при клике на иконку
                    const input = document.getElementById('deadline-date') as HTMLInputElement;
                    input?.showPicker?.();
                  }}
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
                rows={mode === "edit" ? 5 : 3}
              />
            </div>

            {/* Показываем селектор статуса только для режима добавления и если это разрешено */}
            {mode === "add" && showStatusSelector && (
              <div className="space-y-2">
                <Label>Статус</Label>
                <RadioGroup
                  value={companyStatus}
                  onValueChange={(value) => setCompanyStatus(value as "waiting" | "dropped")}
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
            )}

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="ml-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "add" ? "Добавление..." : "Сохранение..."}
                  </>
                ) : (
                  mode === "add" ? "Добавить компанию" : "Сохранить изменения"
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Вкладка со ссылками */}
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

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="ml-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "add" ? "Добавление..." : "Сохранение..."}
                  </>
                ) : (
                  mode === "add" ? "Добавить компанию" : "Сохранить изменения"
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Вкладка с файлами */}
          <TabsContent value="files" className="space-y-8">
            <CompanyFiles
              mode={mode === "edit" ? "manage" : "upload"}
              companyId={mode === "edit" ? companyId : undefined}
              onFileSelect={mode === "add" ? handleFileSelect : undefined}
              title={mode === "edit" ? "Управление файлами" : "Загрузка файлов"}
            />

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="ml-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "add" ? "Добавление..." : "Сохранение..."}
                  </>
                ) : (
                  mode === "add" ? "Добавить компанию" : "Сохранить изменения"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 
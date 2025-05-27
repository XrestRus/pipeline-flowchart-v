/**
 * Унифицированный компонент для работы с файлами компании
 * Объединяет функциональность загрузки, просмотра и управления файлами
 */
'use client';

import { useState, useEffect } from 'react';
import { Trash, Upload, FileIcon, FileText, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ExistingFile {
  id: number;
  original_filename: string;
  file_type: string;
  file_size: number;
  description: string;
  created_at: string;
  uploader_name?: string;
}

interface FileToUpload {
  file: File;
  description: string;
}

interface CompanyFilesProps {
  // Для существующих компаний (режим управления файлами)
  companyId?: number;

  // Для новых компаний (режим подготовки файлов к загрузке)
  onFileSelect?: (files: FileToUpload[]) => void;

  // Режим работы
  mode: "manage" | "upload";

  // Заголовок секции
  title?: string;
}

/**
 * Унифицированный компонент для работы с файлами компании
 */
export default function CompanyFiles({
  companyId,
  onFileSelect,
  mode,
  title
}: CompanyFilesProps) {
  // Состояние для существующих файлов
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);

  // Состояние для новых файлов (для загрузки)
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);

  // Общие состояния
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDescription, setCurrentDescription] = useState('');

  // Загрузка существующих файлов для режима управления
  useEffect(() => {
    if (mode === "manage" && companyId) {
      fetchExistingFiles();
    }
  }, [mode, companyId]);

  // Загрузка списка существующих файлов
  const fetchExistingFiles = async () => {
    if (!companyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/companies/${companyId}/files`);

      if (!response.ok) {
        throw new Error('Не удалось загрузить файлы');
      }

      const data = await response.json();
      setExistingFiles(data.data || []);
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      setError('Не удалось загрузить файлы. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  // Форматирование размера файла
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Байт';
    const k = 1024;
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Валидация файла
  const validateFile = (file: File): string | null => {
    // Проверка типа файла
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'Поддерживаются только файлы PDF, Word и Excel';
    }

    // Проверка размера файла (максимум 10 МБ)
    if (file.size > 10 * 1024 * 1024) {
      return 'Размер файла не должен превышать 10 МБ';
    }

    return null;
  };

  // Обработка выбора файла
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
  };

  // Добавление файла в список (для режима upload)
  const handleAddFileToList = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    const file = fileInput.files[0];
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    const newFile = { file, description: currentDescription };
    const updatedFiles = [...filesToUpload, newFile];

    setFilesToUpload(updatedFiles);

    // Очищаем поля формы
    fileInput.value = '';
    setCurrentDescription('');
    setError(null);

    // Передаем обновленный список файлов родительскому компоненту
    if (onFileSelect) {
      onFileSelect(updatedFiles);
    }
  };

  // Загрузка файла на сервер (для режима manage)
  const handleUploadFile = async () => {
    if (!companyId) return;

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    const file = fileInput.files[0];
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', currentDescription);

    try {
      // Получаем токен из cookie для авторизации
      const token = document.cookie.split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      const response = await fetch(`/api/companies/${companyId}/files`, {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {},
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки файла');
      }

      // Очищаем форму
      setCurrentDescription('');
      fileInput.value = '';

      // Обновляем список файлов
      fetchExistingFiles();
      toast.success(`Файл "${file.name}" успешно загружен`);
    } catch (error: any) {
      console.error('Ошибка загрузки файла:', error);
      const errorMessage = error.message || 'Не удалось загрузить файл. Попробуйте позже.';
      setError(errorMessage);
      toast.error(`Ошибка загрузки файла: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Удаление файла из списка (для режима upload)
  const handleRemoveFileFromList = (index: number) => {
    const updatedFiles = [...filesToUpload];
    updatedFiles.splice(index, 1);
    setFilesToUpload(updatedFiles);

    // Передаем обновленный список файлов родительскому компоненту
    if (onFileSelect) {
      onFileSelect(updatedFiles);
    }
  };

  // Удаление существующего файла (для режима manage)
  const handleDeleteExistingFile = async (fileId: number) => {
    if (!companyId) return;

    if (!confirm('Вы уверены, что хотите удалить этот файл?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/companies/${companyId}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Не удалось удалить файл');
      }

      // Обновляем список файлов
      fetchExistingFiles();
      toast.success('Файл успешно удален');
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      const errorMessage = 'Не удалось удалить файл. Попробуйте позже.';
      setError(errorMessage);
      toast.error(`Ошибка удаления файла: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Скачивание файла
  const handleDownloadFile = async (fileId: number) => {
    if (!companyId) return;

    try {
      setError(null);
      const downloadUrl = `/api/companies/${companyId}/files/${fileId}/download`;
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Ошибка скачивания файла:', error);
      setError('Не удалось скачать файл. Попробуйте позже.');
    }
  };

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-sm font-medium">{title}</h4>
      )}

      {/* Форма загрузки файла */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="mb-4">
          <Label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
            {mode === "manage" ? "Загрузить новый файл" : "Выбрать файл"} (PDF, Word, Excel)
          </Label>
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="h-14 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            accept=".csv,.pdf,.doc,.docx,.xls,.xlsx"
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="file-description" className="block text-sm font-medium text-gray-700 mb-1">
            Описание файла
          </Label>
          <Input
            id="file-description"
            value={currentDescription}
            onChange={(e) => setCurrentDescription(e.target.value)}
            placeholder="Например: Техническое задание"
          />
        </div>

        <Button
          type="button"
          onClick={mode === "manage" ? handleUploadFile : handleAddFileToList}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {mode === "manage" ? "Загрузить файл" : "Добавить файл в список"}
        </Button>

        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Список существующих файлов (для режима manage) */}
      {mode === "manage" && existingFiles.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">Загруженные файлы:</h5>
          <div className="space-y-2">
            {existingFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div className="flex items-center space-x-3">
                  <FileIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{file.original_filename}</p>
                    {file.description && (
                      <p className="text-xs text-gray-500">{file.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                      {file.uploader_name && ` • ${file.uploader_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadFile(file.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteExistingFile(file.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={isLoading}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Список файлов для загрузки (для режима upload) */}
      {mode === "upload" && filesToUpload.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">Выбранные файлы:</h5>
          <div className="space-y-2">
            {filesToUpload.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{item.file.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500">{item.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatFileSize(item.file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFileFromList(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Файлы будут загружены после создания компании
          </p>
        </div>
      )}

      {/* Сообщение о загрузке */}
      {isLoading && (
        <div className="text-center text-sm text-gray-500">
          Загрузка...
        </div>
      )}

      {/* Сообщение об отсутствии файлов */}
      {mode === "manage" && !isLoading && existingFiles.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-4">
          Файлы не загружены
        </div>
      )}
    </div>
  );
}

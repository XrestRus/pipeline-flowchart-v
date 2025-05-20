/**
 * Компонент для управления файлами компании
 * Позволяет загружать, просматривать и удалять файлы
 */
'use client';

import { useState, useEffect } from 'react';
import { Trash, Upload, FileIcon, FileText, Download } from 'lucide-react';

interface File {
  id: number;
  original_filename: string;
  file_type: string;
  file_size: number;
  description: string;
  created_at: string;
  uploader_name?: string;
}

interface CompanyFilesManagerProps {
  companyId: number;
}

export default function CompanyFilesManager({ companyId }: CompanyFilesManagerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Загрузка списка файлов
  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/companies/${companyId}/files`);

      if (!response.ok) {
        throw new Error('Не удалось загрузить файлы');
      }

      const data = await response.json();
      setFiles(data.data || []);
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      setError('Не удалось загрузить файлы. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка файлов при монтировании компонента
  useEffect(() => {
    if (companyId) {
      fetchFiles();
    }
  }, [companyId]);

  // Форматирование размера файла
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Байт';
    const k = 1024;
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Обработка выбора файла
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(null);
      setUploadProgress(0);
    }
  };

  // Загрузка файла на сервер
  const handleFileUpload = async (event: React.FormEvent) => {
    event.preventDefault();

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    const files = fileInput.files;

    if (!files || files.length === 0) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    const file = files[0];

    // Проверка типа файла
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Поддерживаются только файлы PDF, Word и Excel');
      return;
    }

    // Проверка размера файла (максимум 10 МБ)
    if (file.size > 10 * 1024 * 1024) {
      setError('Размер файла не должен превышать 10 МБ');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);

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
      setDescription('');
      fileInput.value = '';

      // Обновляем список файлов
      fetchFiles();
    } catch (error: any) {
      console.error('Ошибка загрузки файла:', error);
      setError(error.message || 'Не удалось загрузить файл. Попробуйте позже.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Удаление файла
  const handleDeleteFile = async (fileId: number) => {
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
      fetchFiles();
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      setError('Не удалось удалить файл. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  // Скачивание файла
  const handleDownloadFile = async (fileId: number) => {
    try {
      setError(null);

      // Создаем ссылку для скачивания
      const downloadUrl = `/api/companies/${companyId}/files/${fileId}/download`;

      // Открываем ссылку в новой вкладке для скачивания
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Ошибка скачивания файла:', error);
      setError('Не удалось скачать файл. Попробуйте позже.');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <h3 className="text-lg font-medium mb-4">Файлы ТЗ и документация</h3>

      {/* Форма загрузки файла */}
      <form onSubmit={handleFileUpload} className="mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="mb-4">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
            Загрузить файл (PDF, Word, Excel)
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            accept=".csv,.pdf,.doc,.docx,.xls,.xlsx"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Описание файла
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            placeholder="Например: Техническое задание"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Загрузка...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Загрузить файл
            </>
          )}
        </button>

        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </form>

      {/* Список файлов */}
      {isLoading && files.length === 0 ? (
        <div className="py-4 text-center text-gray-500">Загрузка...</div>
      ) : files.length === 0 ? (
        <div className="py-4 text-center text-gray-500">Файлы не загружены</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Файл</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Размер</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Загружен</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {file.original_filename}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {file.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(file.file_size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {new Date(file.created_at).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {file.uploader_name || 'Система'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDownloadFile(file.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Скачать файл"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-600 hover:text-red-900 mr-3"
                      title="Удалить файл"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

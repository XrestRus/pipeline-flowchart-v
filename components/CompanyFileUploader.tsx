/**
 * Компонент для загрузки файлов компании, используемый при создании новой компании
 * Позволяет выбрать файл для последующей загрузки после создания компании
 */
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileToUpload {
  file: File;
  description: string;
}

interface CompanyFileUploaderProps {
  onFileSelect: (files: FileToUpload[]) => void;
}

export default function CompanyFileUploader({ onFileSelect }: CompanyFileUploaderProps) {
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);
  const [currentDescription, setCurrentDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Обработка выбора файла
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

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

    setError(null);
  };

  // Добавление файла в список для загрузки
  const handleAddFile = () => {
    const fileInput = document.getElementById('file-upload-new') as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    const file = fileInput.files[0];

    // Проверки уже выполнены в handleFileChange, здесь просто добавляем файл
    setFilesToUpload(prev => [
      ...prev,
      { file, description: currentDescription }
    ]);

    // Очищаем поля формы
    fileInput.value = '';
    setCurrentDescription('');

    // Передаем обновленный список файлов родительскому компоненту
    onFileSelect([...filesToUpload, { file, description: currentDescription }]);
  };

  // Удаление файла из списка
  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...filesToUpload];
    updatedFiles.splice(index, 1);
    setFilesToUpload(updatedFiles);

    // Передаем обновленный список файлов родительскому компоненту
    onFileSelect(updatedFiles);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="mb-4">
          <Label htmlFor="file-upload-new" className="block text-sm font-medium text-gray-700 mb-1">
            Загрузить файл (PDF, Word, Excel)
          </Label>
          <Input
            id="file-upload-new"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500"
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
          onClick={handleAddFile}
          variant="outline"
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Добавить файл в список
        </Button>

        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Список выбранных файлов */}
      {filesToUpload.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Выбранные файлы:</h4>
          <ul className="space-y-2">
            {filesToUpload.map((item, index) => (
              <li key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">
                    {item.file.name}
                    {item.description && <span className="text-gray-500 ml-2">({item.description})</span>}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Удалить
                </Button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Файлы будут загружены после создания компании
          </p>
        </div>
      )}
    </div>
  );
}

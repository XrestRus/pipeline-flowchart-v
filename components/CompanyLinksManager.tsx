/**
 * Компонент для управления ссылками компании
 * Позволяет добавлять и редактировать ссылки на ТЗ и тендеры
 */
'use client';

import { useState, useEffect } from 'react';
import { Link, ExternalLink, FileDigit } from 'lucide-react';
import { toast } from 'sonner';

interface CompanyLinksManagerProps {
  companyId: number;
  docLink?: string | null;
  tenderLink?: string | null;
  tkpLink?: string | null;
  onUpdate: (docLink: string | null, tenderLink: string | null, tkpLink: string | null) => Promise<void>;
}

export default function CompanyLinksManager({ 
  companyId, 
  docLink: initialDocLink, 
  tenderLink: initialTenderLink,
  tkpLink: initialTkpLink,
  onUpdate 
}: CompanyLinksManagerProps) {
  const [docLink, setDocLink] = useState(initialDocLink || '');
  const [tenderLink, setTenderLink] = useState(initialTenderLink || '');
  const [tkpLink, setTkpLink] = useState(initialTkpLink || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Обновление локальных состояний при изменении props
  useEffect(() => {
    setDocLink(initialDocLink || '');
    setTenderLink(initialTenderLink || '');
    setTkpLink(initialTkpLink || '');
  }, [initialDocLink, initialTenderLink, initialTkpLink]);

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

  // Сохранение ссылок
  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Передаем null вместо пустой строки
      await onUpdate(
        docLink.trim() ? docLink.trim() : null, 
        tenderLink.trim() ? tenderLink.trim() : null,
        tkpLink.trim() ? tkpLink.trim() : null
      );
      
      // Уведомление будет показано в родительском компоненте
      
    } catch (error: any) {
      console.error('Ошибка сохранения ссылок:', error);
      const errorMessage = error.message || 'Не удалось сохранить ссылки. Попробуйте позже.';
      setError(errorMessage);
      // Уведомление об ошибке будет показано в родительском компоненте
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <h3 className="text-lg font-medium mb-4">Ссылки на документы</h3>
      
      <form onSubmit={handleSaveLinks} className="space-y-4">
        <div>
          <label htmlFor="doc-link" className="block text-sm font-medium text-gray-700 mb-1">
            Ссылка на ТЗ (Яндекс/Google Документ)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              <Link className="h-4 w-4" />
            </span>
            <input
              type="text"
              id="doc-link"
              value={docLink}
              onChange={(e) => setDocLink(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-r-md border-gray-300 p-2 border"
              placeholder="https://docs.google.com/document/d/..."
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Укажите ссылку на документ с техническим заданием
          </p>
        </div>
        
        <div>
          <label htmlFor="tender-link" className="block text-sm font-medium text-gray-700 mb-1">
            Ссылка на тендер
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              <ExternalLink className="h-4 w-4" />
            </span>
            <input
              type="text"
              id="tender-link"
              value={tenderLink}
              onChange={(e) => setTenderLink(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-r-md border-gray-300 p-2 border"
              placeholder="https://zakupki.gov.ru/..."
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Укажите ссылку на сайт, где был найден тендер
          </p>
        </div>
        
        <div>
          <label htmlFor="tkp-link" className="block text-sm font-medium text-gray-700 mb-1">
            ТКП Яндекс Диск
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              <FileDigit className="h-4 w-4" />
            </span>
            <input
              type="text"
              id="tkp-link"
              value={tkpLink}
              onChange={(e) => setTkpLink(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-r-md border-gray-300 p-2 border"
              placeholder="https://disk.yandex.ru/d/..."
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Укажите ссылку на ТКП в Яндекс Диске
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить ссылки'}
          </button>
        </div>
        
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mt-2 text-sm text-green-600">
            {success}
          </div>
        )}
      </form>
      
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
    </div>
  );
} 
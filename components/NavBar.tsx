/**
 * Компонент навигационной панели 
 * Отображает основное меню и функции авторизации
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { triggerAddCompanyModal } from '@/hooks/useAddCompanyModal';

type User = {
  id: number;
  username: string;
  fullName?: string;
  role: string;
};

/**
 * Свойства компонента NavBar
 */
interface NavBarProps {
  onAddCompanyClick?: () => void;
}

/**
 * Компонент навигационной панели
 */
export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  
  // Функция для получения данных пользователя
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me', {
        // Добавляем cache: 'no-store', чтобы не кэшировать запрос
        cache: 'no-store',
        // Добавляем случайный параметр, чтобы избежать кэширования
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Вызываем функцию получения данных пользователя при монтировании компонента
  useEffect(() => {
    fetchUserData();
  }, []);
  
  // Вызываем функцию получения данных при смене пути (навигации)
  useEffect(() => {
    fetchUserData();
  }, [pathname]);
  
  // Устанавливаем интервал для периодического обновления данных пользователя
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchUserData();
    }, 30000); // Проверяем каждые 30 секунд
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Добавляем прослушивание события успешного входа
  useEffect(() => {
    const handleLoginSuccess = () => {
      // При успешном входе сразу обновляем данные пользователя
      fetchUserData();
    };
    
    // Добавляем слушатель события
    window.addEventListener('user-login-success', handleLoginSuccess);
    
    // Убираем слушатель при размонтировании компонента
    return () => {
      window.removeEventListener('user-login-success', handleLoginSuccess);
    };
  }, []);
  
  // Обработчик выхода из системы
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (res.ok) {
        setUser(null);
        // Принудительно обновляем данные пользователя после выхода
        await fetchUserData();
        router.push('/login');
      }
    } catch (error) {
      console.error('Ошибка при выходе из системы:', error);
    }
  };

  // Обработчик открытия модального окна добавления компании
  const handleAddCompanyClick = () => {
    triggerAddCompanyModal();
  };
  
  return (
    <nav className="bg-gray-800 text-white fixed top-0 left-0 right-0 z-10 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-white text-xl font-bold">
              Pipeline Flowchart
            </Link>
            
            <div className="hidden md:block ml-10">
              <div className="flex space-x-4">
                <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-gray-700">
                  Главная
                </Link>
              </div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {loading ? (
                <span className="text-sm">Загрузка...</span>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleAddCompanyClick}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" /> Добавить компанию
                  </Button>
                  <span className="text-sm">
                    {user.fullName || user.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Войти
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Открыть меню</span>
              {/* Иконка меню - можно заменить на любую другую */}
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Мобильное меню */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-gray-800 shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700">
              Главная
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
            {user ? (
              <div className="flex flex-col px-5 space-y-3">
                <Button
                  onClick={handleAddCompanyClick}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4" /> Добавить компанию
                </Button>
                <span className="block px-3 py-2 text-base font-medium">
                  {user.fullName || user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <div className="px-5">
                <Link
                  href="/login"
                  className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Войти
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 
/**
 * Страница администрирования пользователей
 * Доступна только для пользователей с ролью admin
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserTable from "@/components/users/UserTable";
import UserFormModal from "@/components/users/UserFormModal";
import DeleteUserDialog from "@/components/users/DeleteUserDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw } from "lucide-react";

// Тип для пользователя
type User = {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
};

export default function UsersAdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Состояния для модальных окон
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Загрузка данных о текущем пользователе
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Получаем информацию о текущем пользователе
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.error) {
          toast.error('Ошибка авторизации');
          router.push('/login');
          return;
        }

        if (data.user.role !== 'admin') {
          toast.error('Доступ запрещен');
          router.push('/');
          return;
        }

        setIsAdmin(true);
        loadUsers();
      } catch (error) {
        console.error('Ошибка проверки пользователя:', error);
        toast.error('Ошибка авторизации');
        router.push('/login');
      }
    };

    checkUser();
  }, [router]);

  // Загрузка списка пользователей
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');

      if (!response.ok) {
        throw new Error('Не удалось загрузить пользователей');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      toast.error('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  };

  // Обработчики действий с пользователями

  // Открытие формы создания пользователя
  const handleCreate = () => {
    setSelectedUser(null);
    setFormModalOpen(true);
  };

  // Открытие формы редактирования пользователя
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormModalOpen(true);
  };

  // Открытие диалога удаления пользователя
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Создание или обновление пользователя
  const handleSaveUser = async (userData: any) => {
    try {
      if (selectedUser?.id) {
        // Обновление существующего пользователя
        const response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка обновления пользователя');
        }
      } else {
        // Создание нового пользователя
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка создания пользователя');
        }
      }

      // Перезагружаем список пользователей
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Не удалось сохранить пользователя');
      throw error;
    }
  };

  // Удаление пользователя
  const handleConfirmDelete = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка удаления пользователя');
      }

      toast.success('Пользователь успешно удален');
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Не удалось удалить пользователя');
      throw error;
    }
  };

  // Если еще проверяем права доступа, показываем загрузку
  if (!isAdmin && loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Управление пользователями</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={loadUsers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Новый пользователь
          </Button>
        </div>
      </div>

      {/* Таблица пользователей */}
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <UserTable
          users={users}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Модальное окно создания/редактирования пользователя */}
      <UserFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        user={selectedUser || undefined}
        onSave={handleSaveUser}
      />

      {/* Диалог подтверждения удаления */}
      <DeleteUserDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        user={selectedUser}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

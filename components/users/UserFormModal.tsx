/**
 * Компонент модального окна для формы создания/редактирования пользователя
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Типы 
type User = {
  id?: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
};

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  onSave: (user: any) => Promise<void>;
};

export default function UserFormModal({ 
  isOpen, 
  onClose, 
  user, 
  onSave 
}: UserFormModalProps) {
  // Режим формы: create или edit
  const isEditMode = Boolean(user?.id);
  
  // Состояние формы
  const [formData, setFormData] = useState<any>({
    username: user?.username || '',
    password: '',
    fullName: user?.full_name || '',
    email: user?.email || '',
    role: user?.role || 'manager',
    isActive: user?.is_active !== undefined ? user.is_active : true
  });
  
  // Состояние отправки формы
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Ошибки валидации
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Обработка изменения полей формы
  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Очищаем ошибку для поля, если она есть
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };
  
  // Валидация формы
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    }
    
    if (!isEditMode && !formData.password.trim()) {
      newErrors.password = 'Пароль обязателен для нового пользователя';
    }
    
    if (!formData.role) {
      newErrors.role = 'Необходимо выбрать роль';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Подготовка данных для отправки
      const userData = {
        ...formData,
      };
      
      // Не отправляем пустой пароль при редактировании
      if (isEditMode && !userData.password) {
        delete userData.password;
      }
      
      // Сохраняем пользователя
      await onSave(userData);
      
      toast.success(
        isEditMode
          ? 'Пользователь успешно обновлен'
          : 'Пользователь успешно создан'
      );
      
      onClose();
    } catch (error: any) {
      toast.error(
        `Ошибка: ${error.message || 'Не удалось сохранить пользователя'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Редактирование пользователя' : 'Новый пользователь'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Имя пользователя */}
          <div className="space-y-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input
              id="username"
              placeholder="username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              disabled={isEditMode || isSubmitting}
              className={errors.username ? 'border-red-300' : ''}
            />
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username}</p>
            )}
          </div>
          
          {/* Пароль (обязателен только для новых пользователей) */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Пароль {isEditMode && '(оставьте пустым, чтобы не менять)'}
            </Label>
            <Input
              type="password"
              id="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={isSubmitting}
              className={errors.password ? 'border-red-300' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>
          
          {/* Полное имя */}
          <div className="space-y-2">
            <Label htmlFor="fullName">ФИО</Label>
            <Input
              id="fullName"
              placeholder="Иванов Иван Иванович"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isSubmitting}
              className={errors.email ? 'border-red-300' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          
          {/* Роль пользователя */}
          <div className="space-y-2">
            <Label htmlFor="role">Роль</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleChange('role', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className={errors.role ? 'border-red-300' : ''}>
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Администратор</SelectItem>
                <SelectItem value="manager">Менеджер</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role}</p>
            )}
          </div>
          
          {/* Статус активности (только для редактирования) */}
          {isEditMode && (
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Активен</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', checked)}
                disabled={isSubmitting}
              />
            </div>
          )}
          
          {/* Кнопки действий */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
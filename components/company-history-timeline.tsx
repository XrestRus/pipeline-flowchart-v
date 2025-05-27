import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Интерфейс для элемента лога компании
 */
interface CompanyLog {
  id: number;
  company_id: number;
  user_id: number | null;
  action: string;
  from_node: string | null;
  to_node: string | null;
  from_status: string | null;
  to_status: string | null;
  comment: string | null;
  created_at: string;
  username: string | null;
  user_full_name: string | null;
}

/**
 * Пропсы для компонента таймлайна истории компании
 */
interface CompanyHistoryTimelineProps {
  logs: CompanyLog[];
}

/**
 * Получение цвета бейджа в зависимости от действия
 */
const getActionColor = (action: string): string => {
  switch (action) {
    case 'create':
      return 'bg-green-100 text-green-800';
    case 'update':
      return 'bg-blue-100 text-blue-800';
    case 'delete':
      return 'bg-red-100 text-red-800';
    case 'restore':
      return 'bg-purple-100 text-purple-800';
    case 'move':
      return 'bg-amber-100 text-amber-800';
    case 'file_upload':
      return 'bg-cyan-100 text-cyan-800';
    case 'file_delete':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Получение текста действия на русском
 */
const getActionText = (action: string): string => {
  switch (action) {
    case 'create':
      return 'Создание';
    case 'update':
      return 'Обновление';
    case 'delete':
      return 'Удаление';
    case 'restore':
      return 'Восстановление';
    case 'move':
      return 'Перемещение';
    case 'file_upload':
      return 'Загрузка файла';
    case 'file_delete':
      return 'Удаление файла';
    default:
      return action;
  }
};

/**
 * Получение русского названия нода
 */
const getNodeName = (nodeId: string): string => {
  const nodeNames: Record<string, string> = {
    'selected': 'Выбраны',
    'collecting': 'Сбор документов',
    'submitted': 'Подана заявка',
    'won': 'Выиграли',
    'waiting': 'Ожидание',
    'preparation': 'Подготовка',
    'mvp': 'MVP',
    'delivery': 'Сдача',
    'support': 'Поддержка'
  };

  return nodeNames[nodeId] || nodeId;
};

/**
 * Получение русского названия статуса
 */
const getStatusName = (status: string): string => {
  const statusNames: Record<string, string> = {
    'waiting': 'Ожидание',
    'dropped': 'Отклонено'
  };

  return statusNames[status] || status;
};

/**
 * Компонент для отображения временной шкалы истории компании
 */
export function CompanyHistoryTimeline({ logs }: CompanyHistoryTimelineProps) {
  return (
    <div className="relative">
      {/* Линия временной шкалы */}
      <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      {/* События */}
      <div className="space-y-8">
        {logs.map((log) => (
          <div key={log.id} className="relative flex gap-6">
            {/* Точка на таймлайне */}
            <div className="flex-none">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center relative z-10">
                <div className="h-2 w-2 rounded-full bg-white"></div>
              </div>
            </div>

            {/* Содержимое события */}
            <div className="flex-grow rounded-md border p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <Badge className={getActionColor(log.action)}>
                  {getActionText(log.action)}
                </Badge>
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(log.created_at), {
                    addSuffix: true,
                    locale: ru
                  })}
                </div>
              </div>

              <div className="text-sm mb-2">
                {log.action === 'move' && (
                  <p>
                    Перемещено из <strong>{getNodeName(log.from_node || '')}</strong> в <strong>{getNodeName(log.to_node || '')}</strong>
                    {(log.from_status || log.to_status) && (
                      <>
                        <br />
                        Статус изменён с <strong>{getStatusName(log.from_status || '')}</strong> на <strong>{getStatusName(log.to_status || '')}</strong>
                      </>
                    )}
                  </p>
                )}

                {log.action === 'update' && (
                  <>
                    {(log.from_node !== log.to_node) && (
                      <p>
                        Изменён этап с <strong>{getNodeName(log.from_node || '')}</strong> на <strong>{getNodeName(log.to_node || '')}</strong>
                      </p>
                    )}
                    {(log.from_status !== log.to_status) && (
                      <p>
                        Изменён статус с <strong>{getStatusName(log.from_status || '')}</strong> на <strong>{getStatusName(log.to_status || '')}</strong>
                      </p>
                    )}
                  </>
                )}

                {log.comment && (
                  <p className="mt-2">{log.comment}</p>
                )}
              </div>

              {log.username && (
                <div className="text-xs text-gray-500 mt-2">
                  Пользователь: {log.user_full_name || log.username}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

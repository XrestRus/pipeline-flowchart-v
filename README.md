# Установка
- `npm i`
- `npm run dev`

# API для работы с компаниями

## Основные эндпоинты
- `GET /api/companies` - получение списка всех активных компаний
- `POST /api/companies` - добавление новой компании
- `GET /api/companies/[id]` - получение информации о конкретной компании
- `PUT /api/companies/[id]` - обновление данных компании
- `DELETE /api/companies/[id]` - мягкое удаление компании (установка метки deleted_at)

## Мягкое удаление
В системе реализовано мягкое удаление компаний вместо физического удаления из базы данных. Это позволяет восстановить случайно удаленные данные.

### Эндпоинты для работы с удаленными компаниями
- `GET /api/companies/deleted` - получение списка мягко удаленных компаний
- `POST /api/companies/[id]/restore` - восстановление мягко удаленной компании

### Параметры фильтрации для GET /api/companies/deleted
- `nodeId` - фильтрация по ID узла (этапу)
- `status` - фильтрация по статусу (waiting/dropped)

### Пример запроса
```typescript
// Получение списка удаленных компаний с этапа "selected"
const response = await fetch("/api/companies/deleted?nodeId=selected");

// Восстановление удаленной компании
await fetch(`/api/companies/${companyId}/restore`, { method: "POST" });
```

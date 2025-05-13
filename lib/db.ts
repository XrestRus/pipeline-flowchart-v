/**
 * Модуль подключения к базе данных
 * Обеспечивает соединение с MariaDB и выполнение запросов
 */
import mysql from 'mysql2/promise';

// Конфигурация подключения
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'pipeline_user',
  password: process.env.DATABASE_PASSWORD || 'pipeline_password',
  database: process.env.DATABASE_NAME || 'pipeline_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Создаем пул соединений
const pool = mysql.createPool(dbConfig);

/**
 * Выполняет SQL-запрос к базе данных
 * @param {string} sql - SQL запрос с параметризованными значениями
 * @param {any[]} params - Параметры для запроса
 * @returns {Promise} - Результат запроса
 */
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error: any) {
    console.error('Ошибка запроса к БД:', error);
    throw new Error(`Ошибка в запросе к базе данных: ${error.message}`);
  }
}

/**
 * Получает список компаний с указанным фильтром
 * @param {string} nodeId - ID узла (этапа)
 * @param {string} status - Статус компании (waiting/dropped)
 * @returns {Promise} - Список компаний
 */
export async function getCompanies(nodeId?: string, status?: string) {
  let sql = 'SELECT * FROM companies WHERE deleted_at IS NULL';
  const params: any[] = [];
  
  // Добавляем фильтры
  if (nodeId || status) {
    sql += ' AND';
    
    if (nodeId) {
      sql += ' node_id = ?';
      params.push(nodeId);
    }
    
    if (nodeId && status) {
      sql += ' AND';
    }
    
    if (status) {
      sql += ' status = ?';
      params.push(status);
    }
  }
  
  sql += ' ORDER BY created_at DESC';
  
  return await query<any[]>(sql, params);
}

/**
 * Добавляет новую компанию в базу данных
 * @param {string} name - Название компании
 * @param {string} nodeId - ID узла (этапа)
 * @param {string} status - Статус компании (waiting/dropped)
 * @param {string} comment - Комментарий к компании
 * @returns {Promise} - Добавленная компания
 */
export async function addCompany(name: string, nodeId: string, status: string, comment: string) {
  const sql = `
    INSERT INTO companies (name, node_id, status, comment)
    VALUES (?, ?, ?, ?)
  `;
  
  const result = await query<any>(sql, [name, nodeId, status, comment]);
  
  // Логируем создание компании - передаем null вместо undefined
  await logCompanyAction(result.insertId, 'create', null, nodeId, null, status, comment);
  
  return {
    id: result.insertId,
    name,
    node_id: nodeId,
    status,
    comment
  };
}

/**
 * Обновляет данные компании
 * @param {number} id - ID компании
 * @param {string} name - Название компании
 * @param {string} nodeId - ID узла (этапа)
 * @param {string} status - Статус компании (waiting/dropped)
 * @param {string} comment - Комментарий к компании
 * @param {string} fromNode - Предыдущий узел 
 * @param {string} fromStatus - Предыдущий статус
 * @returns {Promise} - Обновленная компания
 */
export async function updateCompany(
  id: number,
  name: string,
  nodeId: string,
  status: string,
  comment: string,
  fromNode?: string,
  fromStatus?: string
) {
  try {
    // Сначала проверяем, существует ли компания
    const checkCompany = await query<any[]>('SELECT * FROM companies WHERE id = ?', [id]);
    
    if (!checkCompany || checkCompany.length === 0) {
      throw new Error(`Company with ID ${id} does not exist`);
    }
    
    // Обновляем компанию
    const sql = `
      UPDATE companies
      SET name = ?, node_id = ?, status = ?, comment = ?
      WHERE id = ?
    `;
    
    await query<any>(sql, [name, nodeId, status, comment, id]);
    
    // Преобразуем undefined в null для MySQL
    const safeFromNode = fromNode === undefined ? null : fromNode;
    const safeFromStatus = fromStatus === undefined ? null : fromStatus;
    
    // Логируем изменение компании
    if (fromNode !== nodeId || fromStatus !== status) {
      await logCompanyAction(id, 'move', safeFromNode, nodeId, safeFromStatus, status, comment);
    } else {
      await logCompanyAction(id, 'update', safeFromNode, nodeId, safeFromStatus, status, comment);
    }
    
    return {
      id,
      name,
      node_id: nodeId,
      status,
      comment
    };
  } catch (error) {
    console.error('Ошибка обновления компании:', error);
    throw error;
  }
}

/**
 * Мягкое удаление компании из базы данных
 * @param {number} id - ID компании
 * @returns {Promise} - Результат удаления
 */
export async function deleteCompany(id: number) {
  const company = await query<any[]>('SELECT * FROM companies WHERE id = ? AND deleted_at IS NULL', [id]);
  
  if (company && company[0]) {
    // Логируем удаление компании (явно передаем null)
    await logCompanyAction(id, 'delete', company[0].node_id, null, company[0].status, null, null);
    
    // Мягкое удаление - устанавливаем deleted_at в текущую дату
    await query('UPDATE companies SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    return { success: true };
  }
  
  return { success: false };
}

/**
 * Восстанавливает мягко удаленную компанию
 * @param {number} id - ID компании
 * @returns {Promise} - Результат восстановления
 */
export async function restoreCompany(id: number) {
  const company = await query<any[]>('SELECT * FROM companies WHERE id = ? AND deleted_at IS NOT NULL', [id]);
  
  if (company && company[0]) {
    // Логируем восстановление компании
    await logCompanyAction(id, 'restore', null, company[0].node_id, null, company[0].status, null);
    
    // Восстанавливаем компанию
    await query('UPDATE companies SET deleted_at = NULL WHERE id = ?', [id]);
    return { success: true, data: company[0] };
  }
  
  return { success: false };
}

/**
 * Записывает лог действия с компанией
 * @param {number} companyId - ID компании
 * @param {string} action - Действие (create/update/delete/move)
 * @param {string|null} fromNode - Предыдущий узел
 * @param {string|null} toNode - Новый узел
 * @param {string|null} fromStatus - Предыдущий статус
 * @param {string|null} toStatus - Новый статус
 * @param {string|null} comment - Комментарий
 * @returns {Promise} - Результат записи лога
 */
export async function logCompanyAction(
  companyId: number,
  action: string,
  fromNode: string | null | undefined,
  toNode: string | null | undefined,
  fromStatus: string | null | undefined,
  toStatus: string | null | undefined,
  comment: string | null | undefined
) {
  // Убедимся, что undefined преобразуется в null
  const safeFromNode = fromNode === undefined ? null : fromNode;
  const safeToNode = toNode === undefined ? null : toNode;
  const safeFromStatus = fromStatus === undefined ? null : fromStatus;
  const safeToStatus = toStatus === undefined ? null : toStatus;
  const safeComment = comment === undefined ? null : comment;
  
  const sql = `
    INSERT INTO company_logs
    (company_id, action, from_node, to_node, from_status, to_status, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  return await query<any>(sql, [companyId, action, safeFromNode, safeToNode, safeFromStatus, safeToStatus, safeComment]);
}

/**
 * Получает список мягко удаленных компаний
 * @param {string} nodeId - ID узла (этапа)
 * @param {string} status - Статус компании (waiting/dropped)
 * @returns {Promise} - Список удаленных компаний
 */
export async function getDeletedCompanies(nodeId?: string, status?: string) {
  let sql = 'SELECT * FROM companies WHERE deleted_at IS NOT NULL';
  const params: any[] = [];
  
  // Добавляем фильтры
  if (nodeId || status) {
    sql += ' AND';
    
    if (nodeId) {
      sql += ' node_id = ?';
      params.push(nodeId);
    }
    
    if (nodeId && status) {
      sql += ' AND';
    }
    
    if (status) {
      sql += ' status = ?';
      params.push(status);
    }
  }
  
  sql += ' ORDER BY deleted_at DESC';
  
  return await query<any[]>(sql, params);
} 
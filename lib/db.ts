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
 * @param {number|null} userId - ID пользователя, выполняющего действие
 * @param {string|null} docLink - Ссылка на ТЗ (яндекс/гугл документ)
 * @param {string|null} tenderLink - Ссылка на сайт с тендером
 * @returns {Promise} - Добавленная компания
 */
export async function addCompany(
  name: string, 
  nodeId: string, 
  status: string, 
  comment: string, 
  userId: number | null = null,
  docLink: string | null = null,
  tenderLink: string | null = null
) {
  const sql = `
    INSERT INTO companies (
      name, node_id, status, comment, doc_link, tender_link
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const result = await query<any>(sql, [name, nodeId, status, comment, docLink, tenderLink]);
  
  // Логируем создание компании - передаем null вместо undefined
  await logCompanyAction(result.insertId, 'create', null, nodeId, null, status, comment, userId);
  
  return {
    id: result.insertId,
    name,
    node_id: nodeId,
    status,
    comment,
    doc_link: docLink,
    tender_link: tenderLink
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
 * @param {number|null} userId - ID пользователя, выполняющего действие
 * @param {string|null} docLink - Ссылка на ТЗ (яндекс/гугл документ)
 * @param {string|null} tenderLink - Ссылка на сайт с тендером
 * @returns {Promise} - Обновленная компания
 */
export async function updateCompany(
  id: number,
  name: string,
  nodeId: string,
  status: string,
  comment: string,
  fromNode?: string,
  fromStatus?: string,
  userId: number | null = null,
  docLink: string | null = null,
  tenderLink: string | null = null
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
      SET name = ?, node_id = ?, status = ?, comment = ?, doc_link = ?, tender_link = ?
      WHERE id = ?
    `;
    
    await query<any>(sql, [name, nodeId, status, comment, docLink, tenderLink, id]);
    
    // Преобразуем undefined в null для MySQL
    const safeFromNode = fromNode === undefined ? null : fromNode;
    const safeFromStatus = fromStatus === undefined ? null : fromStatus;
    
    // Логируем изменение компании
    if (fromNode !== nodeId || fromStatus !== status) {
      await logCompanyAction(id, 'move', safeFromNode, nodeId, safeFromStatus, status, comment, userId);
    } else {
      await logCompanyAction(id, 'update', safeFromNode, nodeId, safeFromStatus, status, comment, userId);
    }
    
    return {
      id,
      name,
      node_id: nodeId,
      status,
      comment,
      doc_link: docLink,
      tender_link: tenderLink
    };
  } catch (error) {
    console.error('Ошибка обновления компании:', error);
    throw error;
  }
}

/**
 * Мягкое удаление компании из базы данных
 * @param {number} id - ID компании
 * @param {number|null} userId - ID пользователя, выполняющего действие
 * @returns {Promise} - Результат удаления
 */
export async function deleteCompany(id: number, userId: number | null = null) {
  const company = await query<any[]>('SELECT * FROM companies WHERE id = ? AND deleted_at IS NULL', [id]);
  
  if (company && company[0]) {
    // Логируем удаление компании (явно передаем null)
    await logCompanyAction(id, 'delete', company[0].node_id, null, company[0].status, null, null, userId);
    
    // Мягкое удаление - устанавливаем deleted_at в текущую дату
    await query('UPDATE companies SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    return { success: true };
  }
  
  return { success: false };
}

/**
 * Восстанавливает мягко удаленную компанию
 * @param {number} id - ID компании
 * @param {number|null} userId - ID пользователя, выполняющего действие
 * @returns {Promise} - Результат восстановления
 */
export async function restoreCompany(id: number, userId: number | null = null) {
  const company = await query<any[]>('SELECT * FROM companies WHERE id = ? AND deleted_at IS NOT NULL', [id]);
  
  if (company && company[0]) {
    // Логируем восстановление компании
    await logCompanyAction(id, 'restore', null, company[0].node_id, null, company[0].status, null, userId);
    
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
 * @param {number|null} userId - ID пользователя, выполнившего действие
 * @returns {Promise} - Результат записи лога
 */
export async function logCompanyAction(
  companyId: number,
  action: string,
  fromNode: string | null | undefined,
  toNode: string | null | undefined,
  fromStatus: string | null | undefined,
  toStatus: string | null | undefined,
  comment: string | null | undefined,
  userId: number | null | undefined = null
) {
  // Убедимся, что undefined преобразуется в null
  const safeFromNode = fromNode === undefined ? null : fromNode;
  const safeToNode = toNode === undefined ? null : toNode;
  const safeFromStatus = fromStatus === undefined ? null : fromStatus;
  const safeToStatus = toStatus === undefined ? null : toStatus;
  const safeComment = comment === undefined ? null : comment;
  const safeUserId = userId === undefined ? null : userId;
  
  const sql = `
    INSERT INTO company_logs
    (company_id, user_id, action, from_node, to_node, from_status, to_status, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  return await query<any>(sql, [companyId, safeUserId, action, safeFromNode, safeToNode, safeFromStatus, safeToStatus, safeComment]);
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

/**
 * Получает пользователя по имени пользователя
 * @param {string} username - Имя пользователя
 * @returns {Promise} - Данные пользователя или null
 */
export async function getUserByUsername(username: string) {
  const sql = 'SELECT * FROM users WHERE username = ? AND is_active = TRUE';
  const users = await query<any[]>(sql, [username]);
  
  return users && users.length > 0 ? users[0] : null;
}

/**
 * Обновляет время последнего входа пользователя
 * @param {number} userId - ID пользователя
 * @returns {Promise} - Результат обновления
 */
export async function updateUserLastLogin(userId: number) {
  const sql = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
  return await query<any>(sql, [userId]);
}

/**
 * Получает пользователя по ID
 * @param {number} id - ID пользователя
 * @returns {Promise} - Данные пользователя или null
 */
export async function getUserById(id: number) {
  const sql = 'SELECT id, username, full_name, email, role, is_active, created_at, updated_at, last_login FROM users WHERE id = ? AND is_active = TRUE';
  const users = await query<any[]>(sql, [id]);
  
  return users && users.length > 0 ? users[0] : null;
}

/**
 * Получает историю изменений компании 
 * @param {number} companyId - ID компании
 * @returns {Promise} - Список логов компании
 */
export async function getCompanyLogs(companyId: number) {
  const sql = `
    SELECT cl.*, 
           u.username, 
           u.full_name as user_full_name 
    FROM company_logs cl
    LEFT JOIN users u ON cl.user_id = u.id
    WHERE company_id = ?
    ORDER BY cl.created_at DESC
  `;

  return await query<any[]>(sql, [companyId]);
}

/**
 * Добавляет файл в базу данных
 * @param {number} companyId - ID компании
 * @param {string} filename - Системное имя файла (UUID)
 * @param {string} originalFilename - Оригинальное имя файла
 * @param {string} filePath - Путь к файлу
 * @param {number} fileSize - Размер файла в байтах
 * @param {string} fileType - MIME-тип файла
 * @param {string|null} description - Описание файла 
 * @param {number|null} uploadedBy - ID пользователя, загрузившего файл
 * @returns {Promise} - Результат добавления файла
 */
export async function addCompanyFile(
  companyId: number,
  filename: string,
  originalFilename: string,
  filePath: string,
  fileSize: number,
  fileType: string,
  description: string | null = null,
  uploadedBy: number | null = null
) {
  const sql = `
    INSERT INTO company_files (
      company_id, filename, original_filename, file_path, file_size, 
      file_type, description, uploaded_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = await query<any>(sql, [
    companyId, filename, originalFilename, filePath, fileSize, 
    fileType, description, uploadedBy
  ]);
  
  // Логируем добавление файла
  await logCompanyAction(
    companyId, 
    'file_upload', 
    null, 
    null, 
    null, 
    null, 
    `Загружен файл: ${originalFilename}`, 
    uploadedBy
  );
  
  return {
    id: result.insertId,
    company_id: companyId,
    filename,
    original_filename: originalFilename,
    file_path: filePath,
    file_size: fileSize,
    file_type: fileType,
    description
  };
}

/**
 * Получает файлы компании
 * @param {number} companyId - ID компании
 * @returns {Promise} - Список файлов компании
 */
export async function getCompanyFiles(companyId: number) {
  const sql = `
    SELECT cf.*, u.username, u.full_name as uploader_name
    FROM company_files cf
    LEFT JOIN users u ON cf.uploaded_by = u.id
    WHERE cf.company_id = ?
    ORDER BY cf.created_at DESC
  `;
  
  return await query<any[]>(sql, [companyId]);
}

/**
 * Получает информацию о файле по ID
 * @param {number} fileId - ID файла
 * @returns {Promise} - Информация о файле
 */
export async function getCompanyFileById(fileId: number) {
  const sql = `
    SELECT cf.*, u.username, u.full_name as uploader_name
    FROM company_files cf
    LEFT JOIN users u ON cf.uploaded_by = u.id
    WHERE cf.id = ?
  `;
  
  const files = await query<any[]>(sql, [fileId]);
  return files && files.length > 0 ? files[0] : null;
}

/**
 * Удаляет файл компании
 * @param {number} fileId - ID файла
 * @param {number|null} userId - ID пользователя, удаляющего файл
 * @returns {Promise} - Результат удаления
 */
export async function deleteCompanyFile(fileId: number, userId: number | null = null) {
  const file = await getCompanyFileById(fileId);
  
  if (!file) {
    return { success: false, error: 'Файл не найден' };
  }
  
  const sql = 'DELETE FROM company_files WHERE id = ?';
  await query<any>(sql, [fileId]);
  
  // Логируем удаление файла
  await logCompanyAction(
    file.company_id, 
    'file_delete', 
    null, 
    null, 
    null, 
    null, 
    `Удален файл: ${file.original_filename}`, 
    userId
  );
  
  return { success: true, data: file };
}

/**
 * Получает список пользователей
 * @returns {Promise} - Список пользователей без паролей
 */
export async function getAllUsers() {
  const sql = `
    SELECT id, username, full_name, email, role, is_active, created_at, updated_at, last_login 
    FROM users 
    ORDER BY id ASC
  `;
  return await query<any[]>(sql);
}

/**
 * Создает нового пользователя
 * @param {string} username - Имя пользователя
 * @param {string} password - Пароль пользователя
 * @param {string} fullName - Полное имя
 * @param {string} email - Email
 * @param {string} role - Роль пользователя (admin/manager)
 * @returns {Promise} - Созданный пользователь
 */
export async function createUser(
  username: string,
  password: string,
  fullName: string,
  email: string,
  role: string
) {
  // Хеширование пароля будет выполняться в маршруте API
  
  const sql = `
    INSERT INTO users (username, password, full_name, email, role)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  const result = await query<any>(sql, [username, password, fullName, email, role]);
  
  return {
    id: result.insertId,
    username,
    full_name: fullName,
    email,
    role,
    is_active: true
  };
}

/**
 * Обновляет данные пользователя
 * @param {number} id - ID пользователя
 * @param {string} fullName - Полное имя
 * @param {string} email - Email
 * @param {string} role - Роль пользователя
 * @param {boolean} isActive - Активен ли пользователь
 * @returns {Promise} - Обновленный пользователь
 */
export async function updateUser(
  id: number,
  fullName: string,
  email: string,
  role: string,
  isActive: boolean
) {
  const sql = `
    UPDATE users 
    SET full_name = ?, email = ?, role = ?, is_active = ?
    WHERE id = ?
  `;
  
  await query<any>(sql, [fullName, email, role, isActive, id]);
  
  return {
    id,
    full_name: fullName,
    email,
    role,
    is_active: isActive
  };
}

/**
 * Изменяет пароль пользователя
 * @param {number} id - ID пользователя
 * @param {string} password - Новый пароль (хешированный)
 * @returns {Promise} - Результат изменения пароля
 */
export async function changeUserPassword(id: number, password: string) {
  const sql = 'UPDATE users SET password = ? WHERE id = ?';
  await query<any>(sql, [password, id]);
  
  return { success: true, message: 'Пароль успешно изменен' };
}

/**
 * Удаляет пользователя (деактивирует, не удаляет физически)
 * @param {number} id - ID пользователя
 * @returns {Promise} - Результат удаления
 */
export async function deleteUser(id: number) {
  const sql = 'UPDATE users SET is_active = FALSE WHERE id = ?';
  await query<any>(sql, [id]);
  
  return { success: true, message: 'Пользователь успешно деактивирован' };
} 
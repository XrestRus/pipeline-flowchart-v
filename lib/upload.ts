/**
 * Модуль для обработки загрузки файлов
 * Обеспечивает функции для работы с загруженными файлами
 */
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';

// Директория для сохранения загруженных файлов
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Максимальный размер файла (10 МБ)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Разрешенные типы файлов
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

/**
 * Инициализирует директорию для загрузки файлов
 */
export async function initUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch (error) {
    // Если директории не существует, создаем её
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Проверяет, является ли тип файла разрешенным
 * @param {string} fileType - MIME-тип файла
 * @returns {boolean} - Результат проверки
 */
export function isAllowedFileType(fileType: string) {
  return ALLOWED_FILE_TYPES.includes(fileType);
}

/**
 * Обрабатывает загрузку файла
 * @param {NextRequest} req - Объект запроса
 * @returns {Promise} - Результат загрузки файла
 */
export async function processFileUpload(req: NextRequest) {
  // Проверяем наличие директории для загрузки
  await initUploadsDir();
  
  // Парсим FormData из запроса
  const formData = await req.formData();
  
  // Получаем файл
  const file = formData.get('file') as File;
  const description = formData.get('description') as string;
  
  if (!file) {
    throw new Error('No file uploaded');
  }
  
  // Проверяем тип файла
  if (!isAllowedFileType(file.type)) {
    throw new Error('File type not allowed');
  }
  
  // Проверяем размер файла
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds limit');
  }
  
  // Создаем уникальное имя файла
  const ext = path.extname(file.name);
  const filename = `${uuidv4()}${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  
  // Читаем содержимое файла и сохраняем его
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  await writeFile(filepath, buffer);
  
  return {
    fields: { description: [description] },
    file: {
      filename,
      originalFilename: file.name,
      filePath: filepath,
      fileSize: file.size,
      fileType: file.type
    }
  };
}

/**
 * Удаляет файл из файловой системы
 * @param {string} filePath - Путь к файлу
 * @returns {Promise} - Результат удаления файла
 */
export async function deleteFile(filePath: string) {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error };
  }
} 
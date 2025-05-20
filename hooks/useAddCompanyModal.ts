/**
 * Хук для управления модальным окном добавления компании через события
 */
import { useEffect } from 'react';

// Имя события
const ADD_COMPANY_EVENT = 'open-add-company-modal';

/**
 * Хук для прослушивания события открытия модального окна добавления компании
 * @param callback Функция, которая будет вызвана при событии
 */
export function useAddCompanyModalListener(callback: () => void) {
  useEffect(() => {
    // Обработчик события
    const handleEvent = () => {
      callback();
    };

    // Добавляем обработчик события
    window.addEventListener(ADD_COMPANY_EVENT, handleEvent);

    // Удаляем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener(ADD_COMPANY_EVENT, handleEvent);
    };
  }, [callback]);
}

/**
 * Функция для вызова события открытия модального окна
 */
export function triggerAddCompanyModal() {
  // Создаем и вызываем пользовательское событие
  const event = new Event(ADD_COMPANY_EVENT);
  window.dispatchEvent(event);
} 
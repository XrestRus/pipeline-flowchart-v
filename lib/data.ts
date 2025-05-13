export interface CompanyData {
  waiting: {
    companies: string[]
    comments: string[]
  }
  dropped: {
    companies: string[]
    comments: string[]
  }
}

export function getNodeData(): Record<string, CompanyData> {
  // Mock data for each node
  return {
    selected: {
      waiting: {
        companies: ["Компания A", "Компания B", "Компания C"],
        comments: ["Ожидает подтверждения", "Требуется уточнение деталей", "Новый клиент"],
      },
      dropped: {
        companies: ["Компания D", "Компания E"],
        comments: ["Выбрали другого подрядчика", "Отложили проект"],
      },
    },
    collecting: {
      waiting: {
        companies: ["Компания F", "Компания G"],
        comments: ["Сбор требований", "Ожидание технического задания"],
      },
      dropped: {
        companies: ["Компания H"],
        comments: ["Бюджетные ограничения"],
      },
    },
    submitted: {
      waiting: {
        companies: ["Компания I", "Компания J", "Компания K"],
        comments: ["На рассмотрении", "Запрошены дополнительные материалы", "Ожидает решения комитета"],
      },
      dropped: {
        companies: ["Компания L", "Компания M"],
        comments: ["Высокая стоимость", "Несоответствие требованиям"],
      },
    },
    won: {
      waiting: {
        companies: ["Компания N", "Компания O"],
        comments: ["Подготовка договора", "Согласование условий"],
      },
      dropped: {
        companies: [],
        comments: [],
      },
    },
    waiting: {
      waiting: {
        companies: ["Компания P", "Компания Q", "Компания R"],
        comments: ["Ожидание решения", "Внутреннее согласование", "Запрос дополнительной информации"],
      },
      dropped: {
        companies: ["Компания S"],
        comments: ["Отмена проекта"],
      },
    },
    preparation: {
      waiting: {
        companies: ["Компания T", "Компания U"],
        comments: ["Формирование команды", "Планирование ресурсов"],
      },
      dropped: {
        companies: [],
        comments: [],
      },
    },
    mvp: {
      waiting: {
        companies: ["Компания V", "Компания W", "Компания X"],
        comments: ["В разработке", "Тестирование", "Доработка функционала"],
      },
      dropped: {
        companies: ["Компания Y"],
        comments: ["Изменение требований"],
      },
    },
    delivery: {
      waiting: {
        companies: ["Компания Z", "Компания AA"],
        comments: ["Финальное тестирование", "Подготовка документации"],
      },
      dropped: {
        companies: [],
        comments: [],
      },
    },
    support: {
      waiting: {
        companies: ["Компания BB", "Компания CC", "Компания DD"],
        comments: ["Регулярное обслуживание", "Обновления", "Расширение функционала"],
      },
      dropped: {
        companies: ["Компания EE"],
        comments: ["Окончание контракта"],
      },
    },
  }
}

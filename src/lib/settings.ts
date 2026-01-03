export const ITEM_PER_PAGE = 10

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  // ✅ Основные роутеры по ролям
  "/admin(.*)": ["admin"],
  "/teacher(.*)": ["teacher"],
  
  // ✅ Управление пользователями
  "/list/teachers": ["admin"],
  
  // ✅ Академическая структура
  "/list/subjects": ["admin"],
  "/list/classes": ["admin"],
  "/list/lessons": ["admin", "teacher"],
  
  // ✅ Система наблюдений (новое)
  "/list/events": ["admin", "teacher"],
  "/list/events/(.*)": ["admin", "teacher"], // Отдельные страницы событий
  "/list/feedback": ["admin", "teacher"],
  "/list/feedback/(.*)": ["admin", "teacher"], // Отдельные страницы feedback
  
  // ✅ Календарь и расписание
  "/calendar": ["admin", "teacher"],
  
  // ✅ Аналитика и отчеты
  "/analytics": ["admin"],
  "/reports": ["admin", "teacher"],
};
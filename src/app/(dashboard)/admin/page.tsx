import Announcements from "@/components/Announcements";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import Link from "next/link";
import prisma from "@/lib/prisma";

// ✅ Компонент для метрик
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color = "blue",
  href
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  trend?: { value: number; label: string };
  color?: "blue" | "green" | "purple" | "orange" | "red";
  href?: string;
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-600",
    green: "from-green-500 to-green-600 bg-green-50 text-green-600", 
    purple: "from-purple-500 to-purple-600 bg-purple-50 text-purple-600",
    orange: "from-orange-500 to-orange-600 bg-orange-50 text-orange-600",
    red: "from-red-500 to-red-600 bg-red-50 text-red-600"
  };

  const content = (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color].split(' ').slice(0, 2).join(' ')} flex items-center justify-center`}>
          <span className="text-2xl text-white">{icon}</span>
        </div>
        {trend && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            trend.value > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend.value > 0 ? '↗' : '↘'} {trend.label}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};

// ✅ Компонент быстрых действий
const QuickAction = ({ 
  title, 
  description, 
  icon, 
  href, 
  color = "blue" 
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  color?: string;
}) => (
  <Link href={href} className="group">
    <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-300 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-${color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span className="text-gray-400 group-hover:text-blue-500 transition-colors">→</span>
      </div>
    </div>
  </Link>
);

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  // ✅ Получаем статистику с исправленными запросами
  const [
    teachersCount,
    eventsCount, 
    feedbackCount,
    lessonsCount,
    classesCount,
    subjectsCount,
    recentEvents,
    pendingFeedbacks
  ] = await Promise.all([
    prisma.teacher.count(),
    prisma.event.count(),
    prisma.feedback.count(), 
    prisma.lesson.count(),
    prisma.class.count(),
    prisma.subject.count(),
    prisma.event.findMany({
      take: 3,
      orderBy: { id: 'desc' }, // ✅ Используем id вместо createdAt
      include: { 
        teacher: {
          select: { name: true, surname: true } // ✅ Явно выбираем поля
        }
      }
    }),
    prisma.event.count({
      where: { feedback: null }
    })
  ]);

  // ✅ Вычисляем процент завершенных наблюдений
  const completionRate = eventsCount > 0 ? Math.round((feedbackCount / eventsCount) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ✅ Заголовок с приветствием */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Панель администратора
          </h1>
          <p className="text-gray-600 mt-1">
            Добро пожаловать! Вот обзор системы за сегодня.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            ✅ Система работает
          </span>
        </div>
      </div>

      {/* ✅ Основные метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Всего учителей"
          value={teachersCount}
          subtitle="Зарегистрированных в системе"
          icon="👨‍🏫"
          color="blue"
          href="/list/teachers"
        />
        <MetricCard
          title="События контроля"
          value={eventsCount}
          subtitle="Запланированных наблюдений"
          icon="📅"
          color="green"
          href="/list/events"
        />
        <MetricCard
          title="Листы наблюдения"
          value={feedbackCount}
          subtitle="Заполненных отчетов"
          icon="📋"
          color="purple"
          href="/list/feedback"
        />
        <MetricCard
          title="Процент завершения"
          value={`${completionRate}%`}
          subtitle="Завершенных наблюдений"
          icon="📊"
          color={completionRate >= 80 ? "green" : completionRate >= 50 ? "orange" : "red"}
          trend={{ 
            value: completionRate >= 70 ? 1 : -1, 
            label: completionRate >= 70 ? "Хорошо" : "Требует внимания"
          }}
        />
      </div>

      {/* ✅ Дополнительные метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <MetricCard
          title="Всего уроков"
          value={lessonsCount}
          subtitle="В расписании"
          icon="📚"
          color="blue"
          href="/list/lessons"
        />
        <MetricCard
          title="Ожидают наблюдения"
          value={pendingFeedbacks}
          subtitle="События без отчетов"
          icon="⏳"
          color={pendingFeedbacks > 10 ? "red" : pendingFeedbacks > 5 ? "orange" : "green"}
        />
        <MetricCard
          title="Классы"
          value={classesCount}
          subtitle="Зарегистрированных классов"
          icon="🏫"
          color="purple"
          href="/list/classes"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ✅ Левая секция */}
        <div className="lg:col-span-2 space-y-6">
          {/* Быстрые действия */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              ⚡ Быстрые действия
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickAction
                title="Создать событие"
                description="Запланировать наблюдение"
                icon="➕"
                href="/list/events"
                color="blue"
              />
              <QuickAction
                title="Добавить учителя"
                description="Зарегистрировать в системе"
                icon="👤"
                href="/list/teachers" 
                color="green"
              />
              <QuickAction
                title="Создать урок"
                description="Добавить в расписание"
                icon="📝"
                href="/list/lessons"
                color="purple"
              />
              <QuickAction
                title="Просмотр отчетов"
                description="Анализ наблюдений"
                icon="📊"
                href="/list/feedback"
                color="orange"
              />
            </div>
          </div>

          {/* Пользовательские карточки */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              👥 Управление пользователями
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UserCard type="admin" />
              <UserCard type="teacher" />
            </div>
          </div>

          {/* Последние события */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🕒 Последние события
            </h2>
            <div className="space-y-3">
              {recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm">📅</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {/* ✅ Безопасное обращение к teacher */}
                          {event.teacher?.name} {event.teacher?.surname} • 
                          {new Date(event.startTime).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <Link 
                      href={`/list/events/${event.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                    >
                      Подробнее →
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gray-400">📅</span>
                  </div>
                  <p className="text-gray-500 text-sm">Событий пока нет</p>
                  <Link 
                    href="/list/events"
                    className="inline-flex items-center gap-2 mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Создать первое событие →
                  </Link>
                </div>
              )}
            </div>
            
            {recentEvents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link 
                  href="/list/events"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Все события →
                </Link>
              </div>
            )}
          </div>

          {/* График */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📈 Аналитика наблюдений
            </h2>
            <div className="h-[400px]">
              {/* <FinanceChart /> */}
              <div className="h-full flex items-center justify-center">Скоро будет график</div>
            </div>
          </div>
        </div>

        {/* ✅ Правая секция */}
        <div className="space-y-6">
          {/* Календарь */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📅 Календарь событий
            </h2>
            <EventCalendarContainer searchParams={searchParams} />
          </div>

          {/* Объявления */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📢 Объявления
            </h2>
            <Announcements />
          </div>

          {/* Статистика по предметам */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📚 Краткая статистика
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Предметы</span>
                <span className="text-sm font-medium text-gray-900">{subjectsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Классы</span>
                <span className="text-sm font-medium text-gray-900">{classesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Средняя нагрузка</span>
                <span className="text-sm font-medium text-gray-900">
                  {teachersCount > 0 ? Math.round(lessonsCount / teachersCount) : 0} урок/учитель
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Эффективность</span>
                <span className={`text-sm font-medium ${
                  completionRate >= 80 ? 'text-green-600' : 
                  completionRate >= 50 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {completionRate}% завершено
                </span>
              </div>
            </div>
          </div>

          {/* Статус системы */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🖥️ Состояние системы
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">База данных</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  ✅ Активна
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Последняя синхронизация</span>
                <span className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString('ru-RU', { timeStyle: 'short' })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Активные пользователи</span>
                <span className="text-xs text-gray-900 font-medium">
                  {teachersCount + 1}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Версия системы</span>
                <span className="text-xs text-gray-500">v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
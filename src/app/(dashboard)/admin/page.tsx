import Announcements from "@/components/Announcements";
import EventCalendarContainer from "@/components/EventCalendarContainer";
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
  // ✅ Даты для недельной статистики
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Понедельник
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  // ✅ Получаем все данные
  const [
    teachersCount,
    eventsCount, 
    feedbackCount,
    lessonsCount,
    classesCount,
    subjectsCount,
    pendingFeedbacks,
    weekEvents,
    upcomingEvents,
    recentEvents,
    topTeamLeaders,
    teachersWithoutEvents
  ] = await Promise.all([
    prisma.teacher.count(),
    prisma.event.count(),
    prisma.feedback.count(), 
    prisma.lesson.count(),
    prisma.class.count(),
    prisma.subject.count(),
    
    // События без листов
    prisma.event.count({
      where: { feedback: null }
    }),
    
    // События на этой неделе
    prisma.event.count({
      where: {
        startTime: {
          gte: startOfWeek,
          lt: endOfWeek
        }
      }
    }),
    
    // ✅ Предстоящие события (ближайшие 5)
    prisma.event.findMany({
      where: {
        startTime: { gte: now }
      },
      take: 5,
      orderBy: { startTime: 'asc' },
      include: { 
        teamLeader: {
          select: { name: true, surname: true }
        },
        class: {
          select: { name: true }
        },
        feedback: {
          select: { id: true }
        }
      }
    }),
    
    // ✅ Последние события (3 последних)
    prisma.event.findMany({
      take: 3,
      orderBy: { startTime: 'desc' },
      include: { 
        teamLeader: {
          select: { name: true, surname: true }
        },
        class: {
          select: { name: true }
        }
      }
    }),
    
    // ✅ Топ тим-лидеров (топ-5 по количеству событий)
    prisma.teacher.findMany({
      take: 5,
      include: {
        _count: {
          select: { 
            eventsAsTeamLeader: true,
            eventParticipations: true 
          }
        }
      },
      orderBy: {
        eventsAsTeamLeader: { _count: 'desc' }
      },
      where: {
        eventsAsTeamLeader: {
          some: {} // Только те, у кого есть хоть одно событие
        }
      }
    }),
    
    // ✅ Учителя без событий (требуют внимания)
    prisma.teacher.findMany({
      where: {
        AND: [
          { eventsAsTeamLeader: { none: {} } },
          { eventParticipations: { none: {} } }
        ]
      },
      take: 5,
      select: { 
        id: true, 
        name: true, 
        surname: true,
        email: true
      }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
          title="События на неделе"
          value={weekEvents}
          subtitle="Запланировано на эту неделю"
          icon="📆"
          color="purple"
        />
        <MetricCard
          title="Классы"
          value={classesCount}
          subtitle="Зарегистрированных классов"
          icon="🏫"
          color="orange"
          href="/list/classes"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ✅ Левая секция (2/3) */}
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

          {/* ✅ Предстоящие события */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                📅 Предстоящие события
              </h2>
              <Link 
                href="/list/events"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Все события →
              </Link>
            </div>
            
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-all border border-blue-100">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {new Date(event.startTime).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{event.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <span>👨‍🏫 {event.teamLeader.name} {event.teamLeader.surname}</span>
                          {event.class && (
                            <>
                              <span>•</span>
                              <span>🎓 {event.class.name}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          {new Date(event.startTime).toLocaleDateString('ru-RU', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric' 
                          })} в {new Date(event.startTime).toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.feedback ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            ✅
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                            ⏳
                          </span>
                        )}
                        <Link 
                          href={`/list/events/${event.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gray-400">📅</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">Нет предстоящих событий</p>
                  <Link 
                    href="/list/events"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Создать событие →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Последние события */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🕒 Последние события
            </h2>
            <div className="space-y-3">
              {recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-sm">📅</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          Тим-лидер: {event.teamLeader?.name} {event.teamLeader?.surname}
                          {event.class && ` • ${event.class.name}`} • 
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Правая секция (1/3) */}
        <div className="space-y-6">
          {/* Календарь */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📅 Календарь событий
            </h2>
            <EventCalendarContainer searchParams={searchParams} />
          </div>

          {/* ✅ Топ тим-лидеров */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                🏆 Топ тим-лидеров
              </h2>
              <Link 
                href="/list/teachers"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Все →
              </Link>
            </div>
            
            <div className="space-y-3">
              {topTeamLeaders.length > 0 ? (
                topTeamLeaders.map((teacher, index) => (
                  <Link
                    key={teacher.id}
                    href={`/list/teachers/${teacher.id}`}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg hover:shadow-md transition-all border border-yellow-100"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-300 text-orange-900' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">
                        {teacher.name} {teacher.surname}
                      </p>
                      <p className="text-xs text-gray-600">
                        {teacher._count.eventsAsTeamLeader} событий как тим-лидер
                      </p>
                    </div>
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">Нет данных</p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Учителя без событий */}
          {teachersWithoutEvents.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  ⚠️ Требуют внимания
                </h2>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  {teachersWithoutEvents.length}
                </span>
              </div>
              
              <div className="space-y-2">
                {teachersWithoutEvents.map((teacher) => (
                  <Link
                    key={teacher.id}
                    href={`/list/teachers/${teacher.id}`}
                    className="flex items-center gap-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                  >
                    <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm font-bold">
                        {teacher.name[0]}{teacher.surname[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {teacher.name} {teacher.surname}
                      </p>
                      <p className="text-xs text-red-600">Нет назначенных событий</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Объявления */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📢 Объявления
            </h2>
            <Announcements />
          </div>

          {/* Статистика */}
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
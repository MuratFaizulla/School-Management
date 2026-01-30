import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Link from "next/link";

// ✅ Компонент для метрик учителя (адаптивный)
const TeacherMetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = "blue",
  href
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color?: "blue" | "green" | "orange" | "purple";
  href?: string;
}) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600", 
    purple: "bg-purple-50 border-purple-200 text-purple-600"
  };

  const content = (
    <div className={`${colorClasses[color]} border rounded-lg p-3 md:p-4 hover:shadow-md transition-all duration-300`}>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="text-xl md:text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xl md:text-2xl font-bold truncate">{value}</p>
          <p className="text-xs md:text-sm font-medium truncate">{title}</p>
          <p className="text-xs opacity-75 truncate">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};

// ✅ Компонент для событий (адаптивный)
const EventCard = ({ event }: { event: any }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 hover:border-gray-300 transition-colors">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 mb-2 truncate">{event.title}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
        
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1 whitespace-nowrap">
            📅 {new Date(event.startTime).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap">
            ⏰ {new Date(event.startTime).toLocaleTimeString('ru-RU', { timeStyle: 'short' })}
          </span>
          {event.class && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              🎓 {event.class.name}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          event.feedback 
            ? 'bg-green-100 text-green-700' 
            : 'bg-orange-100 text-orange-700'
        }`}>
          {event.feedback ? '✅ Завершено' : '⏳ В ожидании'}
        </span>
        
        <Link 
          href={`/list/events/${event.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap"
        >
          Подробнее →
        </Link>
      </div>
    </div>
  </div>
);

const TeacherPage = async () => {
  const { userId } = auth();

  // ✅ Получаем данные учителя
  const [
    teacherData,
    teacherEventsAsLeader,
    teacherLessons,
    recentFeedbacks
  ] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: userId! },
      select: { name: true, surname: true, email: true }
    }),
    
    prisma.event.findMany({
      where: { teamLeaderId: userId! },
      include: { 
        feedback: true,
        class: { select: { name: true } }
      },
      orderBy: { startTime: 'desc' },
      take: 5
    }),
    
    prisma.lesson.findMany({
      where: { teacherId: userId! },
      include: {
        subject: true,
        class: true
      },
      take: 3,
      orderBy: { startTime: 'asc' }
    }),
    
    prisma.feedback.findMany({
      where: {
        event: { teamLeaderId: userId! }
      },
      include: { event: true },
      orderBy: { createdAt: 'desc' },
      take: 3
    })
  ]);

  const allEvents = teacherEventsAsLeader.map(event => ({ ...event, role: 'teamLeader' as const }));
  
  const totalEvents = allEvents.length;
  const completedEvents = allEvents.filter(event => event.feedback).length;
  const pendingEvents = totalEvents - completedEvents;
  const completionRate = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

  const translateDay = (day: string) => {
    const days: Record<string, string> = {
      MONDAY: "Пн",
      TUESDAY: "Вт",
      WEDNESDAY: "Ср",
      THURSDAY: "Чт",
      FRIDAY: "Пт"
    };
    return days[day] || day;
  };

  return (
    <div className="flex-1 p-3 md:p-6 flex gap-4 md:gap-6 flex-col xl:flex-row max-w-7xl mx-auto">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 space-y-4 md:space-y-6">
        {/* ✅ Приветствие (адаптивное) */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6 rounded-xl border border-blue-100">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Добро пожаловать, {teacherData?.name}!
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Здесь вы можете просматривать свое расписание и события контроля.
          </p>
        </div>

        {/* ✅ Метрики (адаптивная сетка) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <TeacherMetricCard
            title="События"
            value={totalEvents}
            subtitle="Как тим-лидер"
            icon="👨‍🏫"
            color="blue"
            href="/list/events"
          />
          <TeacherMetricCard
            title="Завершено"
            value={completedEvents}
            subtitle="С отзывами"
            icon="✅"
            color="green"
          />
          <TeacherMetricCard
            title="В ожидании"
            value={pendingEvents}
            subtitle="Без отзывов"
            icon="⏳"
            color="orange"
          />
          <TeacherMetricCard
            title="Эффективность"
            value={`${completionRate}%`}
            subtitle="Завершения"
            icon="📊"
            color="purple"
          />
        </div>

        {/* ✅ Мои уроки (адаптивное) */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
              📚 Мои уроки
            </h2>
            <Link 
              href={`/list/lessons?search=${encodeURIComponent(teacherData?.name || '')}`}
              className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
            >
              Все →
            </Link>
          </div>
          
          {teacherLessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {teacherLessons.map((lesson) => (
                <div key={lesson.id} className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2 text-sm md:text-base truncate">
                    {lesson.name}
                  </h3>
                  <div className="space-y-1 text-xs md:text-sm text-gray-600">
                    <p className="truncate">
                      <span className="font-medium">Предмет:</span> {lesson.subject.name}
                    </p>
                    <p>
                      <span className="font-medium">Класс:</span> {lesson.class.name}
                    </p>
                    <p>
                      <span className="font-medium">День:</span> {translateDay(lesson.day)}
                    </p>
                    <p className="text-xs">
                      {lesson.startTime.toLocaleTimeString('ru-RU', { timeStyle: 'short' })} - 
                      {lesson.endTime.toLocaleTimeString('ru-RU', { timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <span className="text-xl md:text-2xl text-gray-400">📚</span>
              </div>
              <p className="text-gray-500 text-sm">Уроков пока не назначено</p>
            </div>
          )}
        </div>

        {/* ✅ События контроля (адаптивное) */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="hidden sm:inline">👨‍🏫 Мои события</span>
              <span className="sm:hidden">👨‍🏫 События</span>
            </h2>
            <Link 
              href="/list/events"
              className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
            >
              Все →
            </Link>
          </div>
          
          {allEvents.length > 0 ? (
            <div className="space-y-3">
              {allEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <span className="text-xl md:text-2xl text-gray-400">📅</span>
              </div>
              <p className="text-gray-500 text-sm">События контроля пока не запланированы</p>
            </div>
          )}
        </div>

        {/* ✅ Расписание (скрываем на мобильных) */}
        <div className="hidden md:block bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            📅 Мое расписание
          </h2>
          <BigCalendarContainer type="teacherId" id={userId!} />
        </div>
      </div>
      
      {/* ✅ RIGHT (адаптивная боковая панель) */}
      <div className="w-full xl:w-1/3 space-y-4 md:space-y-6">
        {/* Объявления */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            📢 Объявления
          </h2>
          <Announcements />
        </div>

        {/* ✅ Последние обратные связи */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
              💬 <span className="hidden sm:inline">Последние отзывы</span>
              <span className="sm:hidden">Отзывы</span>
            </h2>
            <Link 
              href="/list/feedback"
              className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
            >
              Все →
            </Link>
          </div>
          
          {recentFeedbacks.length > 0 ? (
            <div className="space-y-3">
              {recentFeedbacks.map((feedback) => (
                <div key={feedback.id} className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                      {feedback.event.title}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {feedback.createdAt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Наблюдатель:</span> {feedback.observerName}
                  </p>
                  {(feedback.recommendationsTable1 || feedback.recommendationsTable2 || feedback.recommendationsTable3) && (
                    <p className="text-xs text-gray-600 bg-white p-2 rounded border line-clamp-3">
                      <span className="font-medium">Рекомендации:</span> {
                        [
                          feedback.recommendationsTable1,
                          feedback.recommendationsTable2,
                          feedback.recommendationsTable3
                        ].filter(Boolean).join(' ')
                      }
                    </p>
                  )}
                  <Link 
                    href={`/list/events/${feedback.eventId}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium mt-2"
                  >
                    Подробнее →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg md:text-xl text-gray-400">💬</span>
              </div>
              <p className="text-gray-500 text-sm">Отзывов пока нет</p>
            </div>
          )}
        </div>

        {/* ✅ Быстрые действия (адаптивное) */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            ⚡ <span className="hidden sm:inline">Быстрые действия</span>
            <span className="sm:hidden">Действия</span>
          </h2>
          <div className="space-y-2 md:space-y-3">
            <Link 
              href="/list/events"
              className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <span className="text-lg md:text-xl">📅</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 group-hover:text-blue-700 text-sm md:text-base truncate">
                  Мои события
                </p>
                <p className="text-xs text-gray-600 hidden sm:block">События контроля</p>
              </div>
            </Link>
            
            <Link 
              href={`/list/lessons?search=${encodeURIComponent(teacherData?.name || '')}`}
              className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <span className="text-lg md:text-xl">📚</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 group-hover:text-green-700 text-sm md:text-base truncate">
                  Мои уроки
                </p>
                <p className="text-xs text-gray-600 hidden sm:block">Расписание</p>
              </div>
            </Link>
            
            <Link 
              href="/list/feedback"
              className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <span className="text-lg md:text-xl">📋</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 group-hover:text-purple-700 text-sm md:text-base truncate">
                  Обратная связь
                </p>
                <p className="text-xs text-gray-600 hidden sm:block">Листы наблюдений</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPage;
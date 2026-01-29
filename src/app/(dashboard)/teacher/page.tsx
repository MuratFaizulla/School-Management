import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Link from "next/link";
import FormContainer from "@/components/FormContainer";

// ✅ Компонент для метрик учителя
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
    <div className={`${colorClasses[color]} border rounded-lg p-4 hover:shadow-md transition-all duration-300`}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs opacity-75">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};

// ✅ Компонент для списка событий (только тим-лидер)
const EventCard = ({ event }: { event: any }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-medium text-gray-900">{event.title}</h3>
          {/* 🔒 Убрали badge роли - теперь только тим-лидер */}
        </div>
        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            📅 {new Date(event.startTime).toLocaleDateString('ru-RU')}
          </span>
          <span className="flex items-center gap-1">
            ⏰ {new Date(event.startTime).toLocaleTimeString('ru-RU', { timeStyle: 'short' })}
          </span>
          {event.class && (
            <span className="flex items-center gap-1">
              🎓 {event.class.name}
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            event.feedback 
              ? 'bg-green-100 text-green-700' 
              : 'bg-orange-100 text-orange-700'
          }`}>
            {event.feedback ? '✅ Завершено' : '⏳ В ожидании'}
          </span>
        </div>
      </div>
      
      <Link 
        href={`/list/events/${event.id}`}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-4"
      >
        Подробнее →
      </Link>
    </div>
  </div>
);

const TeacherPage = async () => {
  const { userId } = auth();

  // ✅ Получаем данные учителя
  const [
    teacherData,
    teacherEventsAsLeader,
    // teacherEventsAsParticipant, // 🔒 Закомментировано - учитель видит только события где он тим-лидер
    teacherLessons,
    recentFeedbacks
  ] = await Promise.all([
    // Информация об учителе
    prisma.teacher.findUnique({
      where: { id: userId! },
      select: { name: true, surname: true, email: true }
    }),
    
    // ✅ События где учитель - тим-лидер
    prisma.event.findMany({
      where: { teamLeaderId: userId! },
      include: { 
        feedback: true,
        class: {
          select: { name: true }
        }
      },
      orderBy: { startTime: 'desc' },
      take: 5 // ✅ Увеличил до 5, так как больше не объединяем с участниками
    }),
    
    // 🔒 ЗАКОММЕНТИРОВАНО - учитель не должен видеть события где он участник
    // prisma.event.findMany({
    //   where: {
    //     participants: {
    //       some: {
    //         teacherId: userId!
    //       }
    //     }
    //   },
    //   include: { 
    //     feedback: true,
    //     class: {
    //       select: { name: true }
    //     }
    //   },
    //   orderBy: { startTime: 'desc' },
    //   take: 3
    // }),
    
    // Уроки учителя
    prisma.lesson.findMany({
      where: { teacherId: userId! },
      include: {
        subject: true,
        class: true
      },
      take: 3
    }),
    
    // ✅ Последние обратные связи (только где учитель тим-лидер)
    prisma.feedback.findMany({
      where: {
        event: {
          teamLeaderId: userId! // 🔒 Только тим-лидер
          // 🔒 ЗАКОММЕНТИРОВАНО - убрали OR с участниками
          // OR: [
          //   { teamLeaderId: userId! },
          //   { 
          //     participants: {
          //       some: { teacherId: userId! }
          //     }
          //   }
          // ]
        }
      },
      include: {
        event: true
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })
  ]);

  // ✅ Только события как тим-лидер (без участников)
  const allEvents = teacherEventsAsLeader.map(event => ({ ...event, role: 'teamLeader' as const }));
  
  // 🔒 ЗАКОММЕНТИРОВАНО - объединение с участниками
  // const allEvents = [
  //   ...teacherEventsAsLeader.map(event => ({ ...event, role: 'teamLeader' as const })),
  //   ...teacherEventsAsParticipant.map(event => ({ ...event, role: 'participant' as const })),
  // ].sort((a, b) => b.startTime.getTime() - a.startTime.getTime()).slice(0, 5);

  // ✅ Вычисляем статистику
  const totalEvents = allEvents.length;
  const completedEvents = allEvents.filter(event => event.feedback).length;
  const pendingEvents = totalEvents - completedEvents;
  const completionRate = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

  return (
    <div className="flex-1 p-4 md:p-6 flex gap-6 flex-col xl:flex-row max-w-7xl mx-auto">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 space-y-6">
        {/* ✅ Приветствие */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Добро пожаловать, {teacherData?.name} {teacherData?.surname}!
          </h1>
          <p className="text-gray-600">
            Здесь вы можете просматривать свое расписание, события контроля и обратную связь.
          </p>
        </div>

        {/* ✅ Метрики учителя */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TeacherMetricCard
            title="Мои события"
            value={totalEvents}
            subtitle="Как тим-лидер"
            icon="👨‍🏫"
            color="blue"
            href="/list/events"
          />
          <TeacherMetricCard
            title="Завершено"
            value={completedEvents}
            subtitle="С обратной связью"
            icon="✅"
            color="green"
          />
          <TeacherMetricCard
            title="В ожидании"
            value={pendingEvents}
            subtitle="Без обратной связи"
            icon="⏳"
            color="orange"
          />
          <TeacherMetricCard
            title="Эффективность"
            value={`${completionRate}%`}
            subtitle="Процент завершения"
            icon="📊"
            color="purple"
          />
        </div>

        {/* ✅ Мои уроки */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              📚 Мои уроки
            </h2>
            <Link 
              href={`/list/lessons?search=${encodeURIComponent(teacherData?.name || '')}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Все уроки →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherLessons.map((lesson) => (
              <div key={lesson.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">{lesson.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Предмет:</span> {lesson.subject.name}</p>
                  <p><span className="font-medium">Класс:</span> {lesson.class.name}</p>
                  <p><span className="font-medium">День:</span> {
                    lesson.day === "MONDAY" ? "Понедельник" :
                    lesson.day === "TUESDAY" ? "Вторник" :
                    lesson.day === "WEDNESDAY" ? "Среда" :
                    lesson.day === "THURSDAY" ? "Четверг" : "Пятница"
                  }</p>
                  <p><span className="font-medium">Время:</span> {
                    `${lesson.startTime.toLocaleTimeString('ru-RU', { timeStyle: 'short' })} - ${lesson.endTime.toLocaleTimeString('ru-RU', { timeStyle: 'short' })}`
                  }</p>
                </div>
              </div>
            ))}
          </div>
          
          {teacherLessons.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">📚</span>
              </div>
              <p className="text-gray-500 text-sm">Уроков пока не назначено</p>
            </div>
          )}
        </div>

        {/* ✅ События контроля (только где тим-лидер) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              👨‍🏫 Мои события (тим-лидер)
            </h2>
            <Link 
              href="/list/events"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Все события →
            </Link>
          </div>
          
          <div className="space-y-3">
            {allEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          
          {allEvents.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">📅</span>
              </div>
              <p className="text-gray-500 text-sm">События контроля пока не запланированы</p>
            </div>
          )}
        </div>

        {/* ✅ Расписание */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            📅 Мое расписание
          </h2>
          <BigCalendarContainer type="teacherId" id={userId!} />
        </div>
      </div>
      
      {/* ✅ RIGHT */}
      <div className="w-full xl:w-1/3 space-y-6">
        {/* Объявления */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            📢 Объявления
          </h2>
          <Announcements />
        </div>

        {/* ✅ Последние обратные связи */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              💬 Последние отзывы
            </h2>
            <Link 
              href="/list/feedback"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Все отзывы →
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentFeedbacks.map((feedback) => (
              <div key={feedback.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">{feedback.event.title}</h3>
                  <span className="text-xs text-gray-500">
                    {feedback.createdAt.toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Наблюдатель:</span> {feedback.observerName}
                </p>
                {/* ✅ Показываем любые доступные рекомендации */}
                {(feedback.recommendationsTable1 || feedback.recommendationsTable2 || feedback.recommendationsTable3) && (
                  <p className="text-xs text-gray-600 bg-white p-2 rounded border">
                    <span className="font-medium">Рекомендации:</span> {
                      (() => {
                        const allRecommendations = [
                          feedback.recommendationsTable1,
                          feedback.recommendationsTable2,
                          feedback.recommendationsTable3
                        ].filter(Boolean).join(' ');
                        
                        return allRecommendations.length > 100 
                          ? `${allRecommendations.substring(0, 100)}...` 
                          : allRecommendations;
                      })()
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
          
          {recentFeedbacks.length === 0 && (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl text-gray-400">💬</span>
              </div>
              <p className="text-gray-500 text-sm">Отзывов пока нет</p>
            </div>
          )}
        </div>

        {/* ✅ Быстрые действия */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            ⚡ Быстрые действия
          </h2>
          <div className="space-y-3">
            <Link 
              href="/list/events"
              className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <span className="text-xl">📅</span>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-blue-700">Мои события</p>
                <p className="text-xs text-gray-600">Просмотр всех событий контроля</p>
              </div>
            </Link>
            
            <Link 
              href={`/list/lessons?search=${encodeURIComponent(teacherData?.name || '')}`}
              className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <span className="text-xl">📚</span>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-green-700">Мои уроки</p>
                <p className="text-xs text-gray-600">Просмотр расписания уроков</p>
              </div>
            </Link>
            
            <Link 
              href="/list/feedback"
              className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <span className="text-xl">📋</span>
              <div>
                <p className="font-medium text-gray-900 group-hover:text-purple-700">Обратная связь</p>
                <p className="text-xs text-gray-600">Листы наблюдений</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPage;
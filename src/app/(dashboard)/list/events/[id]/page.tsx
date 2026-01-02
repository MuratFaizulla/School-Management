import FormContainer from "@/components/FormContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

const SingleEventPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // ✅ Упрощенная типизация - используем Prisma generated типы
  const event = await prisma.event.findUnique({
    where: { id: parseInt(id) },
    include: {
      lesson: {
        include: {
          subject: true,
          class: true,
        }
      },
      teacher: true,
      feedback: true, // ✅ Prisma автоматически знает все поля
    },
  });

  if (!event) return notFound();

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* TOP CARD */}
      <div className="bg-lamaSky py-6 px-4 rounded-md flex flex-col gap-4">
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{event.title}</h1>
            {role === "admin" && (
              <FormContainer table="event" type="update" data={event} />
            )}
          </div>
          
          {/* Описание */}
          <div className="bg-white p-4 rounded-md">
            <h2 className="font-semibold text-lg mb-2">Описание</h2>
            <p className="text-gray-600">{event.description}</p>
          </div>

          {/* Основная информация */}
          <div className="bg-white p-4 rounded-md">
            <h2 className="font-semibold text-lg mb-3">Основная информация</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-gray-500">Тип контролирующего</span>
                <span className="text-base">
                  {event.controllerType === "DIRECTOR" && "Директор"}
                  {event.controllerType === "DEPUTY" && "Завуч/Заместитель"}
                  {event.controllerType === "METHODIST" && "Методист"}
                  {event.controllerType === "INSPECTOR" && "Инспектор"}
                  {event.controllerType === "ADMIN" && "Администратор"}
                  {event.controllerType === "TEACHER" && "Учитель"}
                </span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="font-medium text-gray-500">Время начала</span>
                <span className="text-base">
                  {event.startTime.toLocaleString("ru-RU", { 
                    dateStyle: "full",
                    timeStyle: "short",
                    hour12: false 
                  })}
                </span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="font-medium text-gray-500">Время окончания</span>
                <span className="text-base">
                  {event.endTime.toLocaleString("ru-RU", { 
                    dateStyle: "full",
                    timeStyle: "short",
                    hour12: false 
                  })}
                </span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="font-medium text-gray-500">Продолжительность</span>
                <span className="text-base">
                  {Math.round((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60))} минут
                </span>
              </div>
            </div>
          </div>

          {/* Информация об учителе */}
          {event.teacher && (
            <div className="bg-white p-4 rounded-md">
              <h2 className="font-semibold text-lg mb-3">Учитель (кого контролируют)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500">ФИО</span>
                  <span className="text-base">
                    {event.teacher.name} {event.teacher.surname}
                  </span>
                </div>
                
                {event.teacher.email && (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-500">Email</span>
                    <span className="text-base">{event.teacher.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Информация об уроке */}
          {event.lesson && (
            <div className="bg-white p-4 rounded-md">
              <h2 className="font-semibold text-lg mb-3">Информация об уроке</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500">Название урока</span>
                  <span className="text-base">{event.lesson.name}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500">Предмет</span>
                  <span className="text-base">{event.lesson.subject.name}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500">Класс</span>
                  <span className="text-base">{event.lesson.class.name}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500">День недели</span>
                  <span className="text-base">
                    {event.lesson.day === "MONDAY" && "Понедельник"}
                    {event.lesson.day === "TUESDAY" && "Вторник"}
                    {event.lesson.day === "WEDNESDAY" && "Среда"}
                    {event.lesson.day === "THURSDAY" && "Четверг"}
                    {event.lesson.day === "FRIDAY" && "Пятница"}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-500">Время урока</span>
                  <span className="text-base">
                    {event.lesson.startTime.toLocaleTimeString("ru-RU", { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })}
                    {" - "}
                    {event.lesson.endTime.toLocaleTimeString("ru-RU", { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Лист наблюдения (Feedback) - ПОЛНЫЙ */}
          {event.feedback ? (
            <div className="bg-white p-4 rounded-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Лист наблюдения</h2>
                {role === "admin" && (
                  <FormContainer table="feedback" type="update" data={event.feedback} />
                )}
              </div>
              
              {/* Основная информация */}
              <div className="mb-6">
                <h3 className="font-medium text-blue-800 mb-3">Основная информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-500">ФИО наблюдателя</span>
                    <span className="text-base">{event.feedback.observerName}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-500">Дата наблюдения</span>
                    <span className="text-base">
                      {event.feedback.observationDate.toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-500">Время наблюдения</span>
                    <span className="text-base">{event.feedback.observationTime}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-500">Предмет</span>
                    <span className="text-base">{event.feedback.subject}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-500">Параллель</span>
                    <span className="text-base">{event.feedback.grade}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-500">Количество учителей</span>
                    <span className="text-base">{event.feedback.presentTeachersCount}</span>
                  </div>
                </div>
              </div>

              {/* ТАБЛИЦА 1: Вопросы для наблюдения */}
              <div className="mb-6">
                <h3 className="font-medium text-blue-800 mb-3">Вопросы для наблюдения</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: "hasTeamLeader", label: "Имеется ли в группе тим-лидер?" },
                    { key: "hasAgenda", label: "Определена ли повестка заседания?" },
                    { key: "isProcessDocumented", label: "Фиксируется ли процесс планирования?" },
                    { key: "teachersShowInterest", label: "Проявляют ли учителя интерес при планировании?" },
                    { key: "teachersGiveSuggestions", label: "Активно ли вносят предложения?" },
                    { key: "effectiveCollaboration", label: "Эффективно ли сотрудничают?" },
                    { key: "analyzePreviousLessons", label: "Проводится ли анализ предыдущих уроков?" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-sm ${
                        (event.feedback as any)[item.key] 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`}>
                        {(event.feedback as any)[item.key] ? '✓' : '✗'}
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ТАБЛИЦА 2: Исходные данные при планировании */}
              <div className="mb-6">
                <h3 className="font-medium text-green-800 mb-3">Исходные данные при планировании</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: "useLessonReflection", label: "Рефлексия урока" },
                    { key: "useStudentAchievements", label: "Учебные достижения учащихся" },
                    { key: "useExternalAssessment", label: "Аналитический отчет от ЦПИ" },
                    { key: "usePedagogicalDecisions", label: "Рекомендации педсовета" },
                    { key: "useLessonVisitResults", label: "Результаты посещения уроков" },
                    { key: "useStudentFeedback", label: "Обратная связь от учащихся" },
                    { key: "useOtherData", label: "Прочее" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-sm ${
                        (event.feedback as any)[item.key] 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`}>
                        {(event.feedback as any)[item.key] ? '✓' : '✗'}
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
                
                {event.feedback.otherDataDescription && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <span className="font-medium text-gray-500 block mb-1">Описание прочих данных:</span>
                    <span className="text-sm">{event.feedback.otherDataDescription}</span>
                  </div>
                )}
              </div>

              {/* ТАБЛИЦА 3: В процессе планирования */}
              <div className="mb-6">
                <h3 className="font-medium text-yellow-800 mb-3">В процессе планирования учителя параллели</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: "discussGoalsAlignment", label: "Обсуждают соответствие цели стандартам" },
                    { key: "adaptLearningGoals", label: "Адаптируют цели к уроку (40 мин)" },
                    { key: "selectAppropriateResources", label: "Выбирают подходящие ресурсы" },
                    { key: "selectDifferentiatedStrategies", label: "Подбирают стратегии для разных потребностей" },
                    { key: "selectEngagingTasks", label: "Подбирают интересные задания" },
                    { key: "discussDescriptors", label: "Обсуждают дескрипторы" },
                    { key: "allocateTime", label: "Распределяют время" },
                    { key: "selectFormativeAssessment", label: "Выбирают формы оценивания" },
                    { key: "planReflection", label: "Планируют рефлексию" },
                    { key: "useICTTools", label: "Предусматривают ИКТ" },
                    { key: "defineHomework", label: "Определяют домашнее задание" },
                    { key: "considerSafety", label: "Предусматривают безопасность" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-sm ${
                        (event.feedback as any)[item.key] 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`}>
                        {(event.feedback as any)[item.key] ? '✓' : '✗'}
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ТАБЛИЦА 4: Комментарии и рекомендации */}
              <div className="mb-4">
                <h3 className="font-medium text-purple-800 mb-3">Комментарии и рекомендации</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.feedback.comments && (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-500">Комментарии</span>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md text-sm">
                        {event.feedback.comments}
                      </p>
                    </div>
                  )}
                  
                  {event.feedback.recommendations && (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-500">Рекомендации</span>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md text-sm">
                        {event.feedback.recommendations}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 border-t pt-2">
                Создано: {event.feedback.createdAt.toLocaleString("ru-RU", {
                  dateStyle: "long",
                  timeStyle: "short"
                })}
              </div>
            </div>
          ) : (
            /* Если нет feedback - показываем кнопку создания */
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <p className="text-yellow-800 font-medium">
                    📋 Лист наблюдения еще не заполнен
                  </p>
                  <p className="text-yellow-600 text-sm">
                    Создайте лист наблюдения для этого события контроля
                  </p>
                </div>
                {role === "admin" && (
                  <FormContainer 
                    table="feedback" 
                    type="create" 
                    data={{ eventId: event.id }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CALENDAR */}
      {/* <div className="bg-white rounded-md p-4 h-[600px]">
        <h2 className="text-xl font-semibold mb-4">Календарь событий</h2>
        <EventCalendarContainer searchParams={{ date: undefined }} />
      </div> */}
    </div>
  );
};

export default SingleEventPage;
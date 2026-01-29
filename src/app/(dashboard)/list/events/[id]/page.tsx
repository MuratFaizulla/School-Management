import FormContainer from "@/components/FormContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";

const SingleEventPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const event = await prisma.event.findUnique({
    where: { id: parseInt(id) },
    include: {
      teamLeader: true,
      class: true,
      participants: {
        include: {
          teacher: true
        }
      },
      feedback: true,
    },
  });

  if (!event) return notFound();

  const translateControllerType = (type: string) => {
    const translations: { [key: string]: string } = {
      DIRECTOR: "Директор",
      DEPUTY_UC: "Завуч по УР",
      DEPUTY_VP: "Завуч по ВР",
      DEPUTY_NMR: "Завуч по НМР",
      DEPUTY_VS: "Завуч по ВС",
    };
    return translations[type] || type;
  };

  // ✅ Компонент для отображения чекбоксов
  const CheckboxGrid = ({ 
    title, 
    items, 
    feedback, 
    colorClass = "blue" 
  }: { 
    title: string; 
    items: Array<{key: string, label: string}>; 
    feedback: any;
    colorClass?: string;
  }) => (
    <div className="mb-6">
      <h3 className={`font-medium text-${colorClass}-800 mb-3 flex items-center gap-2`}>
        <span className={`w-6 h-6 bg-${colorClass}-100 rounded-full flex items-center justify-center text-${colorClass}-600 text-sm`}>
          ✓
        </span>
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const isChecked = feedback[item.key];
          return (
            <div key={item.key} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <span className={`w-5 h-5 rounded flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5 ${
                isChecked ? 'bg-green-500' : 'bg-red-400'
              }`}>
                {isChecked ? '✓' : '✗'}
              </span>
              <span className="text-sm leading-tight">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ✅ Компонент информационных карточек
  const InfoCard = ({ 
    title, 
    children, 
    icon,
    className = ""
  }: { 
    title: string; 
    children: React.ReactNode; 
    icon?: string;
    className?: string;
  }) => (
    <div className={`bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 ${className}`}>
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-800">
        {icon && <span className="text-2xl">{icon}</span>}
        {title}
      </h2>
      {children}
    </div>
  );

  // ✅ Компонент для информационных полей
  const InfoField = ({ 
    label, 
    value,
    className = ""
  }: { 
    label: string; 
    value: string | number;
    className?: string;
  }) => (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="font-medium text-gray-500 text-sm">{label}</span>
      <span className="text-base text-gray-900">{value}</span>
    </div>
  );

  return (
    <div className="flex-1 p-3 md:p-6 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* ✅ Хлебные крошки */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link href="/list/events" className="hover:text-blue-600 transition-colors">
          События
        </Link>
        <span>→</span>
        <span className="font-medium text-gray-900">{event.title}</span>
      </nav>

      {/* ✅ Заголовок события */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-6 md:py-8 px-4 md:px-6 rounded-xl border border-blue-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                📅 {event.startTime.toLocaleDateString("ru-RU", { dateStyle: "full" })}
              </span>
              <span className="inline-flex items-center gap-1">
                ⏰ {event.startTime.toLocaleTimeString("ru-RU", { timeStyle: "short" })} - 
                {event.endTime.toLocaleTimeString("ru-RU", { timeStyle: "short" })}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                👤 {translateControllerType(event.controllerType)}
              </span>
              {event.class && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  🎓 {event.class.name}
                </span>
              )}
            </div>
          </div>
          {role === "admin" && (
            <div className="flex items-center gap-2">
              <FormContainer table="event" type="update" data={event} />
            </div>
          )}
        </div>
      </div>

      {/* ✅ Основной контент */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка */}
        <div className="lg:col-span-2 space-y-6">
          {/* Описание */}
          <InfoCard title="Описание события" icon="📝">
            <p className="text-gray-700 leading-relaxed">{event.description}</p>
          </InfoCard>

          {/* Основная информация */}
          <InfoCard title="Детали события" icon="ℹ️">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField 
                label="Время начала" 
                value={event.startTime.toLocaleString("ru-RU", { 
                  dateStyle: "long",
                  timeStyle: "short"
                })}
              />
              <InfoField 
                label="Время окончания" 
                value={event.endTime.toLocaleString("ru-RU", { 
                  dateStyle: "long",
                  timeStyle: "short"
                })}
              />
              <InfoField 
                label="Продолжительность" 
                value={`${Math.round((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60))} минут`}
              />
              <InfoField 
                label="ID события" 
                value={`#${event.id}`}
              />
            </div>
          </InfoCard>

          {/* Информация о тим-лидере */}
          {event.teamLeader && (
            <InfoCard title="Тим-лидер" icon="👨‍🏫">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField 
                  label="ФИО" 
                  value={`${event.teamLeader.name} ${event.teamLeader.surname}`}
                />
                {event.teamLeader.email && (
                  <InfoField 
                    label="Email" 
                    value={event.teamLeader.email}
                  />
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link 
                  href={`/list/teachers/${event.teamLeader.id}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
                >
                  Перейти к профилю тим-лидера →
                </Link>
              </div>
            </InfoCard>
          )}

          {/* Участники контроля */}
          {event.participants.length > 0 && (
            <InfoCard title="Участники контроля" icon="👥">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.participants.map((participant) => (
                  <div 
                    key={participant.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium text-sm">
                      {participant.teacher.name[0]}{participant.teacher.surname[0]}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {participant.teacher.name} {participant.teacher.surname}
                      </span>
                      {participant.teacher.email && (
                        <span className="text-xs text-gray-500">{participant.teacher.email}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Всего участников: <span className="font-medium">{event.participants.length}</span>
                </p>
              </div>
            </InfoCard>
          )}

          {/* Информация о классе */}
          {event.class && (
            <InfoCard title="Информация о классе" icon="🎓">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField 
                  label="Класс" 
                  value={event.class.name}
                />
                <InfoField 
                  label="Параллель" 
                  value={`${event.class.gradeLevel} класс`}
                />
                <InfoField 
                  label="Вместимость" 
                  value={`${event.class.capacity} учеников`}
                />
                {event.class.supervisorId && (
                  <InfoField 
                    label="Классный руководитель" 
                    value="Есть"
                  />
                )}
              </div>
            </InfoCard>
          )}
        </div>

        {/* Правая колонка */}
        <div className="space-y-6">
          {/* Статус листа наблюдения */}
          <div className={`p-4 rounded-xl border ${
            event.feedback 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                event.feedback ? 'bg-green-500' : 'bg-yellow-500'
              }`}>
                {event.feedback ? '✅' : '⏳'}
              </span>
              <div className="flex-1">
                <h3 className={`font-medium ${
                  event.feedback ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {event.feedback ? 'Лист наблюдения создан' : 'Лист наблюдения не создан'}
                </h3>
                <p className={`text-sm mt-1 ${
                  event.feedback ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {event.feedback 
                    ? 'Наблюдение проведено и задокументировано'
                    : 'Создайте лист наблюдения для документирования результатов'
                  }
                </p>
                {role === "admin" && (
                  <div className="mt-3">
                    {event.feedback ? (
                      <FormContainer 
                        table="feedback" 
                        type="update" 
                        data={event.feedback}
                      />
                    ) : (
                      <FormContainer 
                        table="feedback" 
                        type="create" 
                        data={{ eventId: event.id }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Быстрая информация */}
          <InfoCard title="Быстрая информация" icon="⚡">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Статус</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  event.feedback 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {event.feedback ? 'Завершен' : 'В ожидании'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Участников</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {event.participants.length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Класс привязан</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  event.class 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {event.class ? 'Да' : 'Нет'}
                </span>
              </div>
              {event.feedback && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Дата создания листа</span>
                  <span className="text-xs text-gray-500">
                    {event.feedback.createdAt.toLocaleDateString("ru-RU")}
                  </span>
                </div>
              )}
            </div>
          </InfoCard>
        </div>
      </div>

      {/* ✅ Лист наблюдения - полная версия */}
      {event.feedback && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              📋 Лист наблюдения
            </h2>
            {role === "admin" && (
              <FormContainer table="feedback" type="update" data={event.feedback} />
            )}
          </div>
          
          {/* Основная информация feedback */}
          <div className="mb-8">
            <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">ℹ️</span>
              Основная информация
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoField 
                label="ФИО наблюдателя" 
                value={event.feedback.observerName}
              />
              <InfoField 
                label="Дата наблюдения" 
                value={event.feedback.observationDate.toLocaleDateString("ru-RU")}
              />
              <InfoField 
                label="Время наблюдения" 
                value={event.feedback.observationTime}
              />
              <InfoField 
                label="Предмет" 
                value={event.feedback.subject}
              />
              <InfoField 
                label="Параллель" 
                value={event.feedback.grade}
              />
            </div>
          </div>

          {/* Таблица 1: Чекбоксы */}
          <CheckboxGrid
            title="Таблица 1: Вопросы для наблюдения"
            colorClass="blue"
            feedback={event.feedback}
            items={[
              { key: "hasTeamLeader", label: "Имеется ли в группе тим-лидер?" },
              { key: "hasAgenda", label: "Определена ли повестка заседания?" },
              { key: "isProcessDocumented", label: "Фиксируется ли процесс планирования?" },
              { key: "teachersShowInterest", label: "Проявляют ли учителя интерес при планировании?" },
              { key: "teachersGiveSuggestions", label: "Активно ли вносят предложения?" },
              { key: "effectiveCollaboration", label: "Эффективно ли сотрудничают?" },
              { key: "analyzePreviousLessons", label: "Проводится ли анализ предыдущих уроков?" },
            ]}
          />

          {/* Комментарии и рекомендации Таблица 1 */}
          {(event.feedback.commentsTable1 || event.feedback.recommendationsTable1) && (
            <div className="mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {event.feedback.commentsTable1 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-700 mb-2 text-sm">Комментарии (Таблица 1)</h4>
                    <p className="text-blue-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {event.feedback.commentsTable1}
                    </p>
                  </div>
                )}
                
                {event.feedback.recommendationsTable1 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-700 mb-2 text-sm">Рекомендации (Таблица 1)</h4>
                    <p className="text-blue-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {event.feedback.recommendationsTable1}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Таблица 2: Чекбоксы */}
          <CheckboxGrid
            title="Таблица 2: Исходные данные при планировании"
            colorClass="green"
            feedback={event.feedback}
            items={[
              { key: "useLessonReflection", label: "Рефлексия урока" },
              { key: "useStudentAchievements", label: "Учебные достижения учащихся" },
              { key: "useExternalAssessment", label: "Аналитический отчет от ЦПИ" },
              { key: "usePedagogicalDecisions", label: "Рекомендации педсовета" },
              { key: "useLessonVisitResults", label: "Результаты посещения уроков" },
              { key: "useStudentFeedback", label: "Обратная связь от учащихся" },
              { key: "useOtherData", label: "Прочее" },
            ]}
          />

          {event.feedback.otherDataDescription && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <span className="font-medium text-green-800 block mb-2">Описание прочих данных:</span>
              <p className="text-green-700 text-sm">{event.feedback.otherDataDescription}</p>
            </div>
          )}

          {/* Комментарии и рекомендации Таблица 2 */}
          {(event.feedback.commentsTable2 || event.feedback.recommendationsTable2) && (
            <div className="mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {event.feedback.commentsTable2 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-700 mb-2 text-sm">Комментарии (Таблица 2)</h4>
                    <p className="text-green-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {event.feedback.commentsTable2}
                    </p>
                  </div>
                )}
                
                {event.feedback.recommendationsTable2 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-700 mb-2 text-sm">Рекомендации (Таблица 2)</h4>
                    <p className="text-green-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {event.feedback.recommendationsTable2}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Таблица 3: Чекбоксы */}
          <CheckboxGrid
            title="Таблица 3: В процессе планирования"
            colorClass="yellow"
            feedback={event.feedback}
            items={[
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
            ]}
          />

          {/* Комментарии и рекомендации Таблица 3 */}
          {(event.feedback.commentsTable3 || event.feedback.recommendationsTable3) && (
            <div className="mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {event.feedback.commentsTable3 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-700 mb-2 text-sm">Комментарии (Таблица 3)</h4>
                    <p className="text-yellow-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {event.feedback.commentsTable3}
                    </p>
                  </div>
                )}
                
                {event.feedback.recommendationsTable3 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-700 mb-2 text-sm">Рекомендации (Таблица 3)</h4>
                    <p className="text-yellow-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {event.feedback.recommendationsTable3}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-400 border-t pt-4">
            Лист наблюдения создан: {event.feedback.createdAt.toLocaleString("ru-RU", {
              dateStyle: "long",
              timeStyle: "short"
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleEventPage;
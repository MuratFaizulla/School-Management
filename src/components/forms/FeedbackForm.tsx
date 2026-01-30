"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { feedbackSchema, FeedbackSchema } from "@/lib/formValidationSchemas";
import { createFeedback, updateFeedback } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const FeedbackForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const { events } = relatedData || { events: [] };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FeedbackSchema>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      eventId: data?.eventId || undefined,
    }
  });

  const [state, formAction] = useFormState(
    type === "create" ? createFeedback : updateFeedback,
    {
      success: false,
      error: false,
      message: "",
    }
  );

  const selectedEventId = watch('eventId');

  // ✅ Автозаполнение при первой загрузке если eventId передан
  useEffect(() => {
    if (type === "create" && data?.eventId && events?.length > 0) {
      const selectedEvent = events.find((event: any) => event.id == data.eventId);
      
      if (selectedEvent) {
        const eventDate = new Date(selectedEvent.startTime);
        
        (setValue as any)('observationDate', eventDate.toISOString().split('T')[0]);
        
        const timeString = eventDate.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        (setValue as any)('observationTime', timeString);
        
        toast.info(`Автозаполнение для события: ${selectedEvent.title}`);
      }
    }
  }, [type, data?.eventId, events, setValue]);

  // ✅ Автоматическое заполнение данных из события при изменении выбора
  useEffect(() => {
    if (selectedEventId && events?.length > 0 && !data?.eventId) { // Только если событие выбрано вручную
      const selectedEvent = events.find((event: any) => event.id == selectedEventId);
      
      if (selectedEvent) {
        const eventDate = new Date(selectedEvent.startTime);
        
        // Заполняем дату наблюдения
        (setValue as any)('observationDate', eventDate.toISOString().split('T')[0]);
        
        // Заполняем время наблюдения
        const timeString = eventDate.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        (setValue as any)('observationTime', timeString);
        
        toast.success(`Данные заполнены из события: ${selectedEvent.title}`);
      }
    }
  }, [selectedEventId, events, setValue, data?.eventId]);

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Лист наблюдения был ${type === "create" ? "создан" : "обновлен"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold sticky top-0 bg-white p-2 border-b">
        {type === "create" ? "Создать лист наблюдения" : "Обновить лист наблюдения"}
      </h1>

      {/* Информация о связанном событии для update */}
      {type === "update" && data?.event && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Связанное событие</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Событие:</strong> {data.event.title}</p>
            <p><strong>Описание:</strong> {data.event.description}</p>
            <p><strong>Время:</strong> {new Date(data.event.startTime).toLocaleString('ru-RU')}</p>
            <p><strong>Класс:</strong> {data.event.class?.name}</p>
            <p><strong>Тим-лидер:</strong> {data.event.teamLeader?.name} {data.event.teamLeader?.surname}</p>
            {data.event.participants?.length > 0 && (
              <div>
                <strong>Участники:</strong>
                <ul className="ml-4 mt-1">
                  {data.event.participants.map((p: any) => (
                    <li key={p.id}>• {p.teacher.name} {p.teacher.surname}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ Выбор события - только для создания */}
      {type === "create" && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <h3 className="font-medium text-purple-800 mb-3">Событие для наблюдения</h3>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">
              Выберите событие контроля (остальные поля заполнятся автоматически)
            </label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
              {...register("eventId")}
              disabled={!!data?.eventId} // ✅ Блокируем если событие уже выбрано
            >
              <option value="">Выберите событие</option>
              {events?.map((event: any) => {
                const eventDate = new Date(event.startTime);
                const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
                const eventDay = dayNames[eventDate.getDay()];
                
                const eventStartTime = eventDate.toLocaleTimeString('ru-RU', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
                const eventEndTime = new Date(event.endTime).toLocaleTimeString('ru-RU', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
                
                // ✅ Строим текст: Событие - Класс - Тим-лидер (день, время)
                const optionText = `${event.title} - ${event.class?.name || 'без класса'} - ${event.teamLeader.name} ${event.teamLeader.surname} (${eventDay}, ${eventStartTime}-${eventEndTime})`;
                
                return (
                  <option value={event.id} key={event.id}>
                    {optionText}
                  </option>
                );
              })}
            </select>
            {errors.eventId?.message && (
              <p className="text-xs text-red-400">
                {errors.eventId.message.toString()}
              </p>
            )}
            
            {/* ✅ Подсказка если событие уже выбрано */}
            {data?.eventId && (
              <div className="bg-blue-100 p-3 rounded-md border border-blue-200 mt-2">
                <p className="text-sm text-blue-800">
                  🔒 Событие уже выбрано и не может быть изменено
                </p>
              </div>
            )}
            
            {selectedEventId && !data?.eventId && (
              <div className="bg-white p-3 rounded-md border border-purple-200 mt-2">
                <p className="text-sm text-purple-700">
                  ✅ Событие выбрано - дата и класс заполнятся автоматически
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-medium mb-4 text-blue-800">Основная информация</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <InputField
              label="ФИО наблюдателя"
              name="observerName"
              defaultValue={data?.observerName}
              register={register}
              error={errors?.observerName}
            />
          </div>
          
          <InputField
            label="Дата наблюдения"
            name="observationDate"
            type="date"
            defaultValue={data?.observationDate ? new Date(data.observationDate).toISOString().split('T')[0] : ""}
            register={register}
            error={errors?.observationDate}
          />
          
          <InputField
            label="Время наблюдения"
            name="observationTime"
            defaultValue={data?.observationTime}
            register={register}
            error={errors?.observationTime}
          />

          {/* ✅ Для обновления - скрытые поля */}
          {type === "update" && (
            <InputField
              label="Event ID"
              name="eventId"
              defaultValue={data?.eventId}
              register={register}
              error={errors?.eventId}
              hidden
            />
          )}

          {/* Скрытое поле ID для обновления */}
          {data && (
            <InputField
              label="Id"
              name="id"
              defaultValue={data?.id}
              register={register}
              error={errors?.id}
              hidden
            />
          )}
        </div>
      </div>

      {/* ТАБЛИЦА 1: Вопросы для наблюдения */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-medium mb-4 text-blue-800">Таблица 1: Вопросы для наблюдения</h2>
        <div className="grid grid-cols-1 gap-3">
          {[
            { key: "hasTeamLeader", label: "Имеется ли в группе тим-лидер?" },
            { key: "hasAgenda", label: "Определена ли повестка заседания?" },
            { key: "isProcessDocumented", label: "Фиксируется ли процесс планирования?" },
            { key: "teachersShowInterest", label: "Проявляют ли учителя интерес при планировании?" },
            { key: "teachersGiveSuggestions", label: "Активно ли вносят предложения?" },
            { key: "effectiveCollaboration", label: "Эффективно ли сотрудничают?" },
            { key: "analyzePreviousLessons", label: "Проводится ли анализ предыдущих уроков?" },
          ].map((item) => (
            <div key={item.key} className="flex items-start gap-3 p-3 bg-white rounded-md border border-blue-200">
              <input
                type="checkbox"
                {...register(item.key as any)}
                defaultChecked={data?.[item.key] || false}
                className="w-5 h-5 text-blue-600 rounded mt-0.5 flex-shrink-0"
              />
              <label className="text-sm leading-tight cursor-pointer">{item.label}</label>
            </div>
          ))}
        </div>
        
        {/* ✅ Комментарии и рекомендации для Таблицы 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-blue-700 font-medium">Комментарии (Таблица 1)</label>
            <textarea
              {...register("commentsTable1")}
              defaultValue={data?.commentsTable1 || ""}
              rows={3}
              className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm resize-none w-full"
              placeholder="Комментарии по наблюдению..."
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm text-blue-700 font-medium">Рекомендации (Таблица 1)</label>
            <textarea
              {...register("recommendationsTable1")}
              defaultValue={data?.recommendationsTable1 || ""}
              rows={3}
              className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm resize-none w-full"
              placeholder="Рекомендации..."
            />
          </div>
        </div>
      </div>

      {/* ТАБЛИЦА 2: Исходные данные при планировании */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h2 className="text-lg font-medium mb-4 text-green-800">Таблица 2: Исходные данные при планировании</h2>
        <div className="grid grid-cols-1 gap-3">
          {[
            { key: "useLessonReflection", label: "Рефлексия урока" },
            { key: "useStudentAchievements", label: "Учебные достижения учащихся" },
            { key: "useExternalAssessment", label: "Аналитический отчет от ЦПИ" },
            { key: "usePedagogicalDecisions", label: "Рекомендации педсовета" },
            { key: "useLessonVisitResults", label: "Результаты посещения уроков" },
            { key: "useStudentFeedback", label: "Обратная связь от учащихся" },
            { key: "useOtherData", label: "Прочее" },
          ].map((item) => (
            <div key={item.key} className="flex items-start gap-3 p-3 bg-white rounded-md border border-green-200">
              <input
                type="checkbox"
                {...register(item.key as any)}
                defaultChecked={data?.[item.key] || false}
                className="w-5 h-5 text-green-600 rounded mt-0.5 flex-shrink-0"
              />
              <label className="text-sm leading-tight cursor-pointer">{item.label}</label>
            </div>
          ))}
        </div>
        
        {/* Описание прочих данных */}
        <div className="mt-4">
          <InputField
            label="Описание прочих данных (если выбрано 'Прочее')"
            name="otherDataDescription"
            defaultValue={data?.otherDataDescription}
            register={register}
            error={errors?.otherDataDescription}
          />
        </div>
        
        {/* ✅ Комментарии и рекомендации для Таблицы 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-green-700 font-medium">Комментарии (Таблица 2)</label>
            <textarea
              {...register("commentsTable2")}
              defaultValue={data?.commentsTable2 || ""}
              rows={3}
              className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm resize-none w-full"
              placeholder="Комментарии..."
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm text-green-700 font-medium">Рекомендации (Таблица 2)</label>
            <textarea
              {...register("recommendationsTable2")}
              defaultValue={data?.recommendationsTable2 || ""}
              rows={3}
              className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm resize-none w-full"
              placeholder="Рекомендации..."
            />
          </div>
        </div>
      </div>

      {/* ТАБЛИЦА 3: В процессе планирования */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-lg font-medium mb-4 text-yellow-800">Таблица 3: В процессе планирования</h2>
        <div className="grid grid-cols-1 gap-3">
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
            <div key={item.key} className="flex items-start gap-3 p-3 bg-white rounded-md border border-yellow-200">
              <input
                type="checkbox"
                {...register(item.key as any)}
                defaultChecked={data?.[item.key] || false}
                className="w-5 h-5 text-yellow-600 rounded mt-0.5 flex-shrink-0"
              />
              <label className="text-sm leading-tight cursor-pointer">{item.label}</label>
            </div>
          ))}
        </div>
        
        {/* ✅ Комментарии и рекомендации для Таблицы 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-yellow-700 font-medium">Комментарии (Таблица 3)</label>
            <textarea
              {...register("commentsTable3")}
              defaultValue={data?.commentsTable3 || ""}
              rows={3}
              className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm resize-none w-full"
              placeholder="Комментарии..."
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm text-yellow-700 font-medium">Рекомендации (Таблица 3)</label>
            <textarea
              {...register("recommendationsTable3")}
              defaultValue={data?.recommendationsTable3 || ""}
              rows={3}
              className="ring-[1.5px] ring-gray-300 p-3 rounded-md text-sm resize-none w-full"
              placeholder="Рекомендации..."
            />
          </div>
        </div>
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-sm">❌</span>
            <span className="text-red-700 text-sm font-medium">
              {state.message || "Что-то пошло не так!"}
            </span>
          </div>
        </div>
      )}

      <button 
        type="submit"
        className="bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition-colors sticky bottom-0 bg-opacity-95 backdrop-blur font-medium"
      >
        {type === "create" ? "Создать лист наблюдения" : "Обновить лист наблюдения"}
      </button>
    </form>
  );
};

export default FeedbackForm;
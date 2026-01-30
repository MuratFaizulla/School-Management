"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { eventSchema, EventSchema } from "@/lib/formValidationSchemas";
import { createEvent, updateEvent } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

// ✅ Расписание уроков
const lessonTimes = [
 { lesson: 1, start: "08:30", end: "09:10", label: "1-й урок" },
  { lesson: 2, start: "09:25", end: "10:05", label: "2-й урок" },
  { lesson: 3, start: "10:20", end: "11:00", label: "3-й урок" },
  { lesson: 4, start: "11:05", end: "11:45", label: "4-й урок" },
  { lesson: 5, start: "12:10", end: "12:50", label: "5-й урок" },
  { lesson: 6, start: "13:15", end: "13:55", label: "6-й урок" },
  { lesson: 7, start: "14:00", end: "14:40", label: "7-й урок" },
  { lesson: 8, start: "14:55", end: "15:35", label: "8-й урок" },
    { lesson: 9, start: "15:50", end: "16:30", label: "9-й урок" },
  { lesson: 10, start: "16:35", end: "17:15", label: "10-й урок" },
];

const EventForm = ({
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
  const router = useRouter();
  const { teachers, classes } = relatedData || { teachers: [], classes: [] };

  // ✅ Состояние для выбранных участников
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    data?.participants?.map((p: any) => p.teacherId) || []
  );

  // ✅ Состояние для выбора времени
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [isCustomTime, setIsCustomTime] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      teamLeaderId: data?.teamLeaderId || "",
      classId: data?.classId || undefined,
    }
  });

  const [state, formAction] = useFormState(
    type === "create" ? createEvent : updateEvent,
    {
      success: false,
      error: false,
      message: "",
    }
  );

  const selectedTeamLeaderId = watch("teamLeaderId");

  // ✅ Функция для форматирования времени
  const formatForDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // ✅ Функция для получения текущей даты
  const getCurrentDateTime = () => {
    const now = new Date();
    return formatForDateTimeLocal(now);
  };

  // ✅ Функция для определения урока по времени
  const getLessonNumberFromTime = (dateTimeInput: any) => {
    if (!dateTimeInput) return null;
    
    try {
      const date = new Date(dateTimeInput);
      
      if (isNaN(date.getTime())) {
        return null;
      }
      
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      const lesson = lessonTimes.find(l => l.start === timeString);
      return lesson ? lesson.lesson : null;
    } catch (error) {
      console.log('Error parsing time:', error);
      return null;
    }
  };

  // ✅ Инициализация при редактировании
  useEffect(() => {
    if (data && type === "update") {
      const lessonNum = getLessonNumberFromTime(data.startTime);
      if (lessonNum) {
        setSelectedLesson(lessonNum);
        setIsCustomTime(false);
      } else {
        setIsCustomTime(true);
      }
    }
  }, [data, type]);

  // ✅ Функция для установки времени урока
  const handleLessonSelect = (lessonNumber: number) => {
    setSelectedLesson(lessonNumber);
    setIsCustomTime(false);
    
    const lesson = lessonTimes.find(l => l.lesson === lessonNumber);
    if (lesson) {
      const existingStartTime = getValues('startTime');
      const baseDate = existingStartTime ? new Date(existingStartTime) : new Date();
      
      const startDateTime = new Date(baseDate);
      const endDateTime = new Date(baseDate);
      
      const [startHour, startMin] = lesson.start.split(':');
      const [endHour, endMin] = lesson.end.split(':');
      
      startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
      endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
      
      setValue('startTime', formatForDateTimeLocal(startDateTime) as any);
      setValue('endTime', formatForDateTimeLocal(endDateTime) as any);
    }
  };

  // ✅ Обработчик изменения участников
  const handleParticipantToggle = (teacherId: string) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(teacherId)) {
        return prev.filter((id) => id !== teacherId);
      } else {
        return [...prev, teacherId];
      }
    });
  };

  // ✅ Добавить всех участников
  const handleSelectAll = () => {
    const allTeacherIds = teachers
      .filter((t: any) => t.id !== selectedTeamLeaderId)
      .map((t: any) => t.id);
    setSelectedParticipants(allTeacherIds);
  };

  // ✅ Убрать всех участников
  const handleDeselectAll = () => {
    setSelectedParticipants([]);
  };

  // ✅ Обновляем скрытое поле с участниками
  useEffect(() => {
    setValue("participants", selectedParticipants);
  }, [selectedParticipants, setValue]);

  const onSubmit = handleSubmit((data) => {
    console.log("Submitting data:", data);
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      toast.success(`Событие было ${type === "create" ? "создано" : "обновлено"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const goToEventPage = () => {
    if (data?.id) {
      setOpen(false);
      router.push(`/list/events/${data.id}`);
    }
  };

  // ✅ Фильтруем учителей: убираем тим-лидера из списка участников
  const availableParticipants = teachers.filter(
    (t: any) => t.id !== selectedTeamLeaderId
  );

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form className="flex flex-col gap-6" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold sticky top-0 bg-white p-2 border-b">
          {type === "create" ? "Создать новое событие" : "Обновить событие"}
        </h1>

        {/* Скрытый ID */}
        {data && (
          <input type="hidden" {...register("id")} value={data?.id} />
        )}

        {/* Основная информация */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-medium text-blue-800 mb-3">
            Основная информация
          </h2>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Название события"
                name="title"
                defaultValue={data?.title}
                register={register}
                error={errors?.title}
              />

              <InputField
                label="Описание события"
                name="description"
                defaultValue={data?.description}
                register={register}
                error={errors?.description}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Тип контроля</label>
                <select
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                  {...register("controllerType")}
                  defaultValue={data?.controllerType || ""}
                >
                  <option value="">Выберите тип</option>
                  <option value="DIRECTOR">Директор</option>
                  <option value="DEPUTY_UC">Заместитель директора по УР</option>
                  <option value="DEPUTY_VP">Заместитель директора по ВР</option>
                  <option value="DEPUTY_NMR">Заместитель директора по НМР</option>
                  <option value="DEPUTY_VS">Заместитель директора по ВС</option>
                </select>
                {errors.controllerType?.message && (
                  <p className="text-xs text-red-400">
                    {errors.controllerType.message.toString()}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500">Класс</label>
                <select
                  className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                  {...register("classId")}
                  defaultValue={data?.classId || ""}
                >
                  <option value="">Выберите класс</option>
                  {classes?.map(
                    (classItem: { id: number; name: string; gradeLevel: number }) => (
                      <option value={classItem.id} key={classItem.id}>
                        {classItem.name} ({classItem.gradeLevel} класс)
                      </option>
                    )
                  )}
                </select>
                {errors.classId?.message && (
                  <p className="text-xs text-red-400">
                    {errors.classId.message.toString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Тим-лидер */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-medium text-blue-800 mb-3">Тим-лидер</h2>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">
              Руководитель группы учителей
            </label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("teamLeaderId")}
              defaultValue={data?.teamLeaderId || ""}
            >
              <option value="">Выберите тим-лидера</option>
              {teachers?.map(
                (teacher: { id: string; name: string; surname: string }) => (
                  <option value={teacher.id} key={teacher.id}>
                    {teacher.name} {teacher.surname}
                  </option>
                )
              )}
            </select>
            {errors.teamLeaderId?.message && (
              <p className="text-xs text-red-400">
                {errors.teamLeaderId.message.toString()}
              </p>
            )}
          </div>
        </div>

        {/* Участники контроля */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-green-800">
              Участники контроля ({selectedParticipants.length})
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                disabled={!selectedTeamLeaderId || availableParticipants.length === 0}
              >
                Выбрать всех
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                disabled={selectedParticipants.length === 0}
              >
                Очистить
              </button>
            </div>
          </div>

          {!selectedTeamLeaderId ? (
            <div className="bg-yellow-100 border border-yellow-300 p-3 rounded-md">
              <p className="text-xs text-yellow-800">
                💡 Сначала выберите тим-лидера
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {availableParticipants.length === 0 ? (
                <div className="col-span-2 bg-yellow-100 border border-yellow-300 p-3 rounded-md">
                  <p className="text-xs text-yellow-800">
                    Нет доступных участников (все учителя либо являются тим-лидером)
                  </p>
                </div>
              ) : (
                availableParticipants.map(
                  (teacher: { id: string; name: string; surname: string }) => (
                    <label
                      key={teacher.id}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedParticipants.includes(teacher.id)
                          ? "bg-green-200 border border-green-400"
                          : "bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(teacher.id)}
                        onChange={() => handleParticipantToggle(teacher.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        {teacher.name} {teacher.surname}
                      </span>
                    </label>
                  )
                )
              )}
            </div>
          )}

          {/* Скрытое поле для participants */}
          <input
            type="hidden"
            {...register("participants")}
            value={JSON.stringify(selectedParticipants)}
          />

          {errors.participants?.message && (
            <p className="text-xs text-red-400 mt-2">
              {errors.participants.message.toString()}
            </p>
          )}
        </div>

        {/* Время события */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="font-medium text-purple-800 mb-3">Время события</h2>
          
          {/* ✅ Переключатель режимов */}
          <div className="flex justify-center gap-4 mb-4">
            <button
              type="button"
              onClick={() => {
                setIsCustomTime(false);
                setSelectedLesson(null);
              }}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                !isCustomTime 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white text-purple-500 border border-purple-500'
              }`}
            >
              📚 Выбрать по расписанию уроков
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCustomTime(true);
                setSelectedLesson(null);
              }}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                isCustomTime 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white text-purple-500 border border-purple-500'
              }`}
            >
              🕒 Указать время вручную
            </button>
          </div>

          {!isCustomTime ? (
            /* ✅ Выбор по номеру урока */
            <div>
              <label className="text-sm font-medium text-purple-700 mb-3 block">
                Выберите номер урока:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {lessonTimes.map((lesson) => (
                  <button
                    key={lesson.lesson}
                    type="button"
                    onClick={() => handleLessonSelect(lesson.lesson)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      selectedLesson === lesson.lesson
                        ? 'border-purple-500 bg-purple-100 text-purple-800'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold">{lesson.label}</div>
                    <div className="text-xs text-gray-600">
                      {lesson.start} - {lesson.end}
                    </div>
                  </button>
                ))}
              </div>

              {/* ✅ Скрытые поля времени (заполняются автоматически) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Время начала"
                  name="startTime"
                  defaultValue={
                    data?.startTime
                      ? formatForDateTimeLocal(new Date(data.startTime))
                      : getCurrentDateTime()
                  }
                  register={register}
                  error={errors?.startTime}
                  type="datetime-local"
                />

                <InputField
                  label="Время окончания"
                  name="endTime"
                  defaultValue={
                    data?.endTime
                      ? formatForDateTimeLocal(new Date(data.endTime))
                      : ""
                  }
                  register={register}
                  error={errors?.endTime}
                  type="datetime-local"
                />
              </div>

              {selectedLesson && (
                <div className="bg-white p-3 rounded-md border border-purple-200 mt-3">
                  <div className="text-sm">
                    <span className="font-medium text-purple-600">
                      Выбран: {lessonTimes.find(l => l.lesson === selectedLesson)?.label}
                    </span>
                    <span className="ml-2 text-gray-600">
                      ({lessonTimes.find(l => l.lesson === selectedLesson)?.start} - {lessonTimes.find(l => l.lesson === selectedLesson)?.end})
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ✅ Ручной ввод времени */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Время начала"
                name="startTime"
                defaultValue={
                  data?.startTime
                    ? formatForDateTimeLocal(new Date(data.startTime))
                    : getCurrentDateTime()
                }
                register={register}
                error={errors?.startTime}
                type="datetime-local"
              />

              <InputField
                label="Время окончания"
                name="endTime"
                defaultValue={
                  data?.endTime
                    ? formatForDateTimeLocal(new Date(data.endTime))
                    : ""
                }
                register={register}
                error={errors?.endTime}
                type="datetime-local"
              />
            </div>
          )}
        </div>

        {/* Информация о листе наблюдения для существующих событий */}
        {type === "update" && data && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h2 className="font-medium text-yellow-800 mb-3">
              Лист наблюдения
            </h2>
            {data.feedback ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">
                    ✓
                  </span>
                  <span className="text-green-700 font-medium">
                    Лист наблюдения создан
                  </span>
                </div>

                <div className="bg-white p-3 rounded-md text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500">Наблюдатель:</span>
                      <span className="ml-1">{data.feedback.observerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Дата:</span>
                      <span className="ml-1">
                        {new Date(
                          data.feedback.observationDate
                        ).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={goToEventPage}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Посмотреть полный лист
                  </button>
                  <button
                    type="button"
                    onClick={goToEventPage}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  >
                    Редактировать лист
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm">
                    !
                  </span>
                  <span className="text-yellow-700 font-medium">
                    Лист наблюдения не создан
                  </span>
                </div>

                <p className="text-yellow-600 text-sm">
                  После обновления события вы сможете создать лист наблюдения
                  для детального контроля.
                </p>

                <button
                  type="button"
                  onClick={goToEventPage}
                  className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                >
                  Создать лист наблюдения
                </button>
              </div>
            )}
          </div>
        )}

        {state.error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md">
            <span className="text-red-500 text-sm">
              {state.message || "Что-то пошло не так!"}
            </span>
          </div>
        )}

        <div className="flex gap-3 sticky bottom-0 bg-white p-2 border-t">
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition-colors font-medium"
          >
            {type === "create" ? "Создать событие" : "Обновить событие"}
          </button>

          {type === "update" && data && (
            <button
              type="button"
              onClick={goToEventPage}
              className="px-6 bg-gray-500 text-white p-3 rounded-md hover:bg-gray-600 transition-colors font-medium"
            >
              К событию
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EventForm;
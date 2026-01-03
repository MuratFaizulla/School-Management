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
  const { teachers, lessons } = relatedData || { teachers: [], lessons: [] };

  const [useManualTime, setUseManualTime] = useState(false);
  const [filteredLessons, setFilteredLessons] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createEvent : updateEvent,
    {
      success: false,
      error: false,
      message: "",
    }
  );

  // Отслеживаем выбранного учителя и урок
  const selectedTeacherId = watch("teacherId");
  const selectedLessonId = watch("lessonId");

  // ✅ Функция для форматирования времени
  const formatForDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // ✅ Функция для применения времени урока к выбранной дате
  const applyLessonTimeToDate = (lessonDateTime: Date, targetDate?: Date) => {
    const baseDate = targetDate || new Date();
    const resultDate = new Date(baseDate);

    resultDate.setHours(lessonDateTime.getHours());
    resultDate.setMinutes(lessonDateTime.getMinutes());
    resultDate.setSeconds(0);
    resultDate.setMilliseconds(0);

    return resultDate;
  };

  // ✅ Исправленная фильтрация уроков по учителю
  useEffect(() => {
    if (selectedTeacherId && lessons?.length > 0) {
      const teacherLessons = lessons.filter(
        (lesson: any) => lesson.teacherId === selectedTeacherId
      );

      setFilteredLessons(teacherLessons);
      // ✅ Используем правильный тип для lessonId
      setValue("lessonId", undefined as any); // или null

      if (teacherLessons.length === 0) {
        toast.info("У выбранного учителя пока нет созданных уроков");
      }
    } else {
      setFilteredLessons([]);
      // ✅ Используем правильный тип для lessonId
      setValue("lessonId", undefined as any); // или null
    }
  }, [selectedTeacherId, lessons, setValue]);

  // ✅ Простое решение с подавлением TypeScript ошибок
  useEffect(() => {
    if (selectedLessonId && !useManualTime && filteredLessons.length > 0) {
      const selectedLesson: any = filteredLessons.find(
        (lesson: any) => lesson.id == selectedLessonId
      );

      if (selectedLesson) {
        const currentStartTime = getValues("startTime");
        const currentDate = currentStartTime
          ? new Date(currentStartTime)
          : new Date();

        // ✅ Используем any для подавления ошибок типизации
        const lessonStartTime = new Date(selectedLesson.startTime as string);
        const lessonEndTime = new Date(selectedLesson.endTime as string);

        const newStartTime = applyLessonTimeToDate(
          lessonStartTime,
          currentDate
        );
        const newEndTime = applyLessonTimeToDate(lessonEndTime, currentDate);

        setValue("startTime", formatForDateTimeLocal(newStartTime) as any);
        setValue("endTime", formatForDateTimeLocal(newEndTime) as any);

        toast.success(`Время установлено из урока`);
      }
    }
  }, [selectedLessonId, useManualTime, filteredLessons, setValue, getValues]);
  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      toast(`Событие было ${type === "create" ? "создано" : "обновлено"}!`);
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

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form className="flex flex-col gap-6" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold sticky top-0 bg-white p-2 border-b">
          {type === "create" ? "Создать новое событие" : "Обновить событие"}
        </h1>

        {/* Основная информация */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className=" font-medium text-blue-800 mb-3">
            Основная информация
          </h2>
          <div className="flex flex-col gap-4">
            {/* Верх: 2 инпута горизонтально */}
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

            {/* Низ: скрытый ID */}
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

        {/* Участники события */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-medium text-blue-800 mb-3">Участники события</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Кто контролирует</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("controllerType")}
                defaultValue={data?.controllerType || ""}
              >
                <option value="">Выберите тип</option>
                <option value="DIRECTOR">Директор</option>
                <option value="DEPUTY">Завуч/Заместитель</option>
                <option value="METHODIST">Методист</option>
                <option value="INSPECTOR">Инспектор</option>
                <option value="ADMIN">Администратор</option>
                <option value="TEACHER">Учитель (взаимопосещение)</option>
              </select>
              {errors.controllerType?.message && (
                <p className="text-xs text-red-400">
                  {errors.controllerType.message.toString()}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">
                Учитель (кого контролируют)
              </label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("teacherId")}
                defaultValue={data?.teacherId || ""}
              >
                <option value="">Выберите учителя</option>
                {teachers?.map(
                  (teacher: { id: string; name: string; surname: string }) => (
                    <option value={teacher.id} key={teacher.id}>
                      {teacher.name} {teacher.surname}
                    </option>
                  )
                )}
              </select>
              {errors.teacherId?.message && (
                <p className="text-xs text-red-400">
                  {errors.teacherId.message.toString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Урок для контроля */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="font-medium text-green-800 mb-3">Урок для контроля</h2>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">
              Урок (необязательно)
              {selectedTeacherId && (
                <span className="text-green-600 ml-1">
                  - показаны уроки выбранного учителя
                </span>
              )}
            </label>

            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("lessonId")}
              defaultValue={data?.lessonId || ""}
              disabled={!selectedTeacherId}
            >
              <option value="">
                {!selectedTeacherId
                  ? "Сначала выберите учителя"
                  : "Не выбран - общий контроль"}
              </option>

              {filteredLessons?.map((lesson: any) => (
                <option value={lesson.id} key={lesson.id}>
                  {lesson.name} - {lesson.class?.name} - {lesson.subject?.name}{" "}
                  (
                  {new Date(lesson.startTime).toLocaleString("ru-RU", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(lesson.endTime).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  )
                </option>
              ))}
            </select>

            {errors.lessonId?.message && (
              <p className="text-xs text-red-400">
                {errors.lessonId.message.toString()}
              </p>
            )}

            {selectedTeacherId && (
              <div className="bg-white p-3 rounded-md border border-green-200 mt-2">
                <div className="text-sm text-green-700">
                  📚 Найдено уроков этого учителя:{" "}
                  <span className="font-medium">{filteredLessons.length}</span>
                  {filteredLessons.length === 0 && (
                    <span className="text-yellow-600 ml-2">
                      (У этого учителя пока нет созданных уроков)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Время события */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-purple-800">Время события</h2>
            {selectedLessonId && (
              <button
                type="button"
                onClick={() => setUseManualTime(!useManualTime)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  useManualTime
                    ? "bg-purple-500 text-white"
                    : "bg-white text-purple-500 border border-purple-500"
                }`}
              >
                {useManualTime ? "✏️ Ручной ввод" : "⚡ Время из урока"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Время начала"
              name="startTime"
              defaultValue={
                data?.startTime
                  ? formatForDateTimeLocal(new Date(data.startTime))
                  : ""
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

          {/* ✅ Информационные подсказки */}
          {!selectedLessonId && (
            <div className="bg-yellow-100 border border-yellow-300 p-3 rounded-md mt-3">
              <p className="text-xs text-yellow-800">
                💡 Выберите урок для автоматического заполнения времени или
                введите время вручную
              </p>
            </div>
          )}

          {selectedLessonId && !useManualTime && (
            <div className="bg-blue-100 border border-blue-300 p-3 rounded-md mt-3">
              <p className="text-xs text-blue-800">
                ⚡ Время будет автоматически взято из выбранного урока. Дату
                можете изменить в полях выше.
              </p>
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

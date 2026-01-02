"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { lessonSchema, LessonSchema } from "@/lib/formValidationSchemas";
import { createLesson, updateLesson } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

// Расписание уроков
const lessonTimes = [
  { lesson: 1, start: "08:00", end: "08:45", label: "1-й урок" },
  { lesson: 2, start: "08:55", end: "09:40", label: "2-й урок" },
  { lesson: 3, start: "09:50", end: "10:35", label: "3-й урок" },
  { lesson: 4, start: "10:55", end: "11:40", label: "4-й урок" },
  { lesson: 5, start: "11:50", end: "12:35", label: "5-й урок" },
  { lesson: 6, start: "12:55", end: "13:40", label: "6-й урок" },
  { lesson: 7, start: "13:50", end: "14:35", label: "7-й урок" },
  { lesson: 8, start: "14:45", end: "15:30", label: "8-й урок" },
];

const LessonForm = ({
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
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [isCustomTime, setIsCustomTime] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createLesson : updateLesson,
    {
      success: false,
      error: false,
      message: "",
    }
  );

  // ✅ Функция для форматирования даты для datetime-local
  const formatForDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // ✅ Функция для получения текущей даты в правильном формате
  const getCurrentDateTime = () => {
    const now = new Date();
    return formatForDateTimeLocal(now);
  };

  // ✅ Исправленная функция для определения урока по времени
  const getLessonNumberFromTime = (dateTimeInput: any) => {
    if (!dateTimeInput) return null;
    
    try {
      let timeString: string;
      
      // Преобразуем в Date объект
      const date = new Date(dateTimeInput);
      
      // Проверяем, валидная ли дата
      if (isNaN(date.getTime())) {
        return null;
      }
      
      // Получаем время в формате HH:MM
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      timeString = `${hours}:${minutes}`;
      
      const lesson = lessonTimes.find(l => l.start === timeString);
      return lesson ? lesson.lesson : null;
    } catch (error) {
      console.log('Error parsing time:', error);
      return null;
    }
  };

  // Инициализация при редактировании
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

  // ✅ Исправленная функция для установки времени урока
  const handleLessonSelect = (lessonNumber: number) => {
    setSelectedLesson(lessonNumber);
    setIsCustomTime(false);
    
    const lesson = lessonTimes.find(l => l.lesson === lessonNumber);
    if (lesson) {
      // Получаем существующую дату или используем сегодняшнюю
      const existingStartTime = getValues('startTime');
      const baseDate = existingStartTime ? new Date(existingStartTime) : new Date();
      
      // Создаем новые даты с сохранением исходной даты, но новым временем
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

  const onSubmit = handleSubmit((formData) => {
    console.log('Form data:', formData);
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Урок был ${type === "create" ? "создан" : "обновлен"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { subjects, classes, teachers } = relatedData;

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <form className="flex flex-col gap-6" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold sticky top-0 bg-white p-2 border-b">
          {type === "create" ? "Создать новый урок" : "Обновить урок"}
        </h1>

        {/* Основная информация */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-medium text-blue-800 mb-3">Основная информация</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <InputField
                label="Название урока"
                name="name"
                defaultValue={data?.name}
                register={register}
                error={errors?.name}
              />
            </div>

            {/* Скрытое поле для ID */}
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

        {/* Время урока */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-medium text-blue-800 mb-3">Время урока</h2>
          
          {/* Переключатель режимов */}
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => {
                setIsCustomTime(false);
                setSelectedLesson(null);
              }}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                !isCustomTime 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-blue-500 border border-blue-500'
              }`}
            >
              📚 Выбрать урок по расписанию
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCustomTime(true);
                setSelectedLesson(null);
              }}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                isCustomTime 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-blue-500 border border-blue-500'
              }`}
            >
              🕒 Указать время вручную
            </button>
          </div>

          {!isCustomTime ? (
            /* Выбор по номеру урока */
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
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
                        ? 'border-blue-500 bg-blue-100 text-blue-800'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold">{lesson.label}</div>
                    <div className="text-xs text-gray-600">
                      {lesson.start} - {lesson.end}
                    </div>
                  </button>
                ))}
              </div>

              {/* Поля времени - видимые только при ручном режиме */}
              <div className="grid grid-cols-2 gap-4">
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
                <div className="bg-white p-3 rounded-md border mt-3">
                  <div className="text-sm">
                    <span className="font-medium text-blue-600">
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
            /* Ручной ввод времени */
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

        {/* Участники урока */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="font-medium text-green-800 mb-3">Участники урока</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* День недели */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">День недели</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("day")}
                defaultValue={data?.day || ""}
              >
                <option value="">Выберите день</option>
                <option value="MONDAY">Понедельник</option>
                <option value="TUESDAY">Вторник</option>
                <option value="WEDNESDAY">Среда</option>
                <option value="THURSDAY">Четверг</option>
                <option value="FRIDAY">Пятница</option>
              </select>
              {errors.day?.message && (
                <p className="text-xs text-red-400">
                  {errors.day.message.toString()}
                </p>
              )}
            </div>
            
            {/* Предмет */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Предмет</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("subjectId")}
                defaultValue={data?.subjectId || ""}
              >
                <option value="">Выберите предмет</option>
                {subjects?.map((subject: { id: number; name: string }) => (
                  <option value={subject.id} key={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {errors.subjectId?.message && (
                <p className="text-xs text-red-400">
                  {errors.subjectId.message.toString()}
                </p>
              )}
            </div>
            
            {/* Класс */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Класс</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("classId")}
                defaultValue={data?.classId || ""}
              >
                <option value="">Выберите класс</option>
                {classes?.map((classItem: { id: number; name: string }) => (
                  <option value={classItem.id} key={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
              {errors.classId?.message && (
                <p className="text-xs text-red-400">
                  {errors.classId.message.toString()}
                </p>
              )}
            </div>
            
            {/* Учитель */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Учитель</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("teacherId")}
                defaultValue={data?.teacherId || ""}
              >
                <option value="">Выберите учителя</option>
                {teachers?.map((teacher: { id: string; name: string; surname: string }) => (
                  <option value={teacher.id} key={teacher.id}>
                    {teacher.name} {teacher.surname}
                  </option>
                ))}
              </select>
              {errors.teacherId?.message && (
                <p className="text-xs text-red-400">
                  {errors.teacherId.message.toString()}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {state.error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md">
            <span className="text-red-500 text-sm">
              {state.message || "Что-то пошло не так!"}
            </span>
          </div>
        )}
        
        <button 
          type="submit"
          className="bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition-colors font-medium sticky bottom-0 bg-opacity-95 backdrop-blur"
        >
          {type === "create" ? "Создать урок" : "Обновить урок"}
        </button>
      </form>
    </div>
  );
};

export default LessonForm;
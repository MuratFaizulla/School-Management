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
  const [showFeedbackSection, setShowFeedbackSection] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
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

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      toast(`Событие было ${type === "create" ? "создано" : "обновлено"}!`);
      
      // Если это создание события, предложить создать лист наблюдения
      if (type === "create") {
        setTimeout(() => {
          const createFeedback = window.confirm(
            "Событие создано! Хотите создать лист наблюдения для этого события?"
          );
          if (createFeedback) {
            setShowFeedbackSection(true);
          } else {
            setOpen(false);
            router.refresh();
          }
        }, 1000);
      } else {
        setOpen(false);
        router.refresh();
      }
    }
  }, [state, router, type, setOpen]);

  const { teachers, lessons } = relatedData;

  // Функция для перехода к странице события
  const goToEventPage = () => {
    if (data?.id) {
      setOpen(false);
      router.push(`/list/events/${data.id}`);
    }
  };

  // Функция для создания feedback
  const createFeedbackHandler = () => {
    setOpen(false);
    // Здесь можно открыть FeedbackForm или перейти на страницу события
    if (data?.id) {
      router.push(`/list/events/${data.id}`);
      setTimeout(() => {
        toast("Прокрутите вниз, чтобы создать лист наблюдения!");
      }, 500);
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
          <h2 className="font-medium text-blue-800 mb-3">Основная информация</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Название события"
              name="title"
              // placeholder="Контроль урока математики"
              defaultValue={data?.title}
              register={register}
              error={errors?.title}
            />
            
            <InputField
              label="Описание события"
              name="description"
              // placeholder="Плановый контроль директора Иванова И.И."
              defaultValue={data?.description}
              register={register}
              error={errors?.description}
            />
            
            <InputField
              label="Время начала"
              name="startTime"
              defaultValue={
                data?.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : ""
              }
              register={register}
              error={errors?.startTime}
              type="datetime-local"
            />
            
            <InputField
              label="Время окончания"
              name="endTime"
              defaultValue={
                data?.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : ""
              }
              register={register}
              error={errors?.endTime}
              type="datetime-local"
            />

            {/* Скрытое поле для ID при обновлении */}
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
            {/* Тип контролирующего */}
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

            {/* Учитель */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Учитель (кого контролируют)</label>
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

        {/* Дополнительная информация */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="font-medium text-green-800 mb-3">Дополнительная информация</h2>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-500">Урок для контроля (необязательно)</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("lessonId")}
              defaultValue={data?.lessonId || ""}
            >
              <option value="">Не выбран - общий контроль</option>
              {lessons?.map((lesson: any) => (
                <option value={lesson.id} key={lesson.id}>
                  {lesson.name} - {lesson.class?.name} ({
                    new Date(lesson.startTime).toLocaleString('ru-RU', {
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  } - {
                    new Date(lesson.endTime).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  })
                </option>
              ))}
            </select>
            {errors.lessonId?.message && (
              <p className="text-xs text-red-400">
                {errors.lessonId.message.toString()}
              </p>
            )}
          </div>
        </div>

        {/* Информация о листе наблюдения для существующих событий */}
        {type === "update" && data && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h2 className="font-medium text-yellow-800 mb-3">Лист наблюдения</h2>
            {data.feedback ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">✓</span>
                  <span className="text-green-700 font-medium">Лист наблюдения создан</span>
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
                        {new Date(data.feedback.observationDate).toLocaleDateString('ru-RU')}
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
                  <span className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm">!</span>
                  <span className="text-yellow-700 font-medium">Лист наблюдения не создан</span>
                </div>
                
                <p className="text-yellow-600 text-sm">
                  После обновления события вы сможете создать лист наблюдения для детального контроля.
                </p>
                
                <button 
                  type="button"
                  onClick={createFeedbackHandler}
                  className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                >
                  Создать лист наблюдения
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ошибки */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md">
            <span className="text-red-500 text-sm">
              {state.message || "Что-то пошло не так!"}
            </span>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3 sticky bottom-0 bg-white p-2 border-t">
          <button 
            type="submit"
            className="flex-1 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            {type === "create" ? "Создать событие" : "Обновить событие"}
          </button>
          
          {type === "update" && data && (
            <button 
              type="button"
              onClick={goToEventPage}
              className="px-4 bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600 transition-colors"
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
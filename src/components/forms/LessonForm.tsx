"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { lessonSchema, LessonSchema } from "@/lib/formValidationSchemas";
import { createLesson, updateLesson } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

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
  const {
    register,
    handleSubmit,
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

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data);
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
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Создать новый урок" : "Обновить урок"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Название урока"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
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
        
        {/* День недели */}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
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
        <div className="flex flex-col gap-2 w-full md:w-1/4">
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
        <div className="flex flex-col gap-2 w-full md:w-1/4">
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
        <div className="flex flex-col gap-2 w-full md:w-1/4">
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
      
      {state.error && (
        <span className="text-red-500">
          {state.message || "Что-то пошло не так!"}
        </span>
      )}
      
      <button 
        type="submit"
        className="bg-blue-400 text-white p-2 rounded-md hover:bg-blue-500 transition-colors"
      >
        {type === "create" ? "Создать" : "Обновить"}
      </button>
    </form>
  );
};

export default LessonForm;
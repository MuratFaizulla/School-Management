"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect } from "react";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const TeacherForm = ({
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
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createTeacher : updateTeacher,
    {
      success: false,
      error: false,
      message: "",
    }
  );

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction(data); // ✅ Убрали img
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Учитель был ${type === "create" ? "создан" : "обновлен"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { subjects } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Создать нового учителя" : "Обновить учителя"}
      </h1>
      
      <span className="text-xs text-gray-400 font-medium">
        Информация для входа
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Логин"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        {/* Пароль только при создании или при желании изменить */}
        {(type === "create" || type === "update") && (
          <InputField
            label={type === "create" ? "Пароль" : "Новый пароль (оставьте пустым если не нужно менять)"}
            name="password"
            type="password"
            // placeholder={type === "update" ? "Оставьте пустым если не меняете" : ""}
            register={register}
            error={errors?.password}
          />
        )}
      </div>
      
      <span className="text-xs text-gray-400 font-medium">
        Персональная информация
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Имя"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Фамилия"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors.surname}
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
        
        {/* Множественный выбор предметов */}
        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="text-xs text-gray-500">Предметы</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full min-h-[120px]"
            {...register("subjects")}
            defaultValue={data?.subjects?.map((subject: any) => subject.id.toString()) || []}
          >
            {subjects?.map((subject: { id: number; name: string }) => (
              <option value={subject.id} key={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400">
            Удерживайте Ctrl (Cmd) для выбора нескольких предметов
          </p>
          {errors.subjects?.message && (
            <p className="text-xs text-red-400">
              {errors.subjects.message.toString()}
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

export default TeacherForm;
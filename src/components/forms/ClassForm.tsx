"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { classSchema, ClassSchema } from "@/lib/formValidationSchemas";
import { createClass, updateClass } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ClassForm = ({
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
  } = useForm<ClassSchema>({
    resolver: zodResolver(classSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createClass : updateClass,
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
      toast(`Класс был ${type === "create" ? "создан" : "обновлен"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { teachers } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Создать новый класс" : "Обновить класс"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Название класса"
          name="name"
          // placeholder="9А, 10Б и т.д."
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        
        <InputField
          label="Вместимость"
          name="capacity"
          type="number"
          defaultValue={data?.capacity}
          register={register}
          error={errors?.capacity}
        />
        
        <InputField
          label="Номер параллели"
          name="gradeLevel"
          type="number"
          defaultValue={data?.gradeLevel}
          register={register}
          error={errors?.gradeLevel}
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
        
        {/* Выбор классного руководителя */}
        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Классный руководитель</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("supervisorId")}
            defaultValue={data?.supervisorId || ""}
          >
            <option value="">Выберите классного руководителя</option>
            {teachers?.map(
              (teacher: { id: string; name: string; surname: string }) => (
                <option value={teacher.id} key={teacher.id}>
                  {teacher.name + " " + teacher.surname}
                </option>
              )
            )}
          </select>
          {errors.supervisorId?.message && (
            <p className="text-xs text-red-400">
              {errors.supervisorId.message.toString()}
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

export default ClassForm;
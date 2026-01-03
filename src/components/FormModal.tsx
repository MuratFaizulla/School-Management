"use client";

import {
  deleteClass,
  deleteEvent,
  deleteFeedback,
  deleteLesson,
  deleteSubject,
  deleteTeacher,
} from "@/lib/actions";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";

const deleteActionMap = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  lesson:deleteLesson,
  event: deleteEvent,
  feedback: deleteFeedback, // ✅ Добавляем

  
// TODO: OTHER DELETE ACTIONS

};

// USE LAZY LOADING

// import TeacherForm from "./forms/TeacherForm";
// import StudentForm from "./forms/StudentForm";

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Загрузка...</h1>,
});
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => <h1>Загрузка...</h1>,
});
const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => <h1>Загрузка...</h1>,
});
const LessonForm = dynamic(() => import("./forms/LessonForm"), {
  loading: () => <h1>Загрузка...</h1>,
});

const EventForm = dynamic(() => import("./forms/EventForm"), {
  loading: () => <h1>Загрузка...</h1>,
});
const FeedbackForm = dynamic(() => import("./forms/FeedbackForm"), {
  loading: () => <h1>Загрузка...</h1>,
});
// TODO: OTHER FORMS

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element;
} = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  lesson: (setOpen, type, data, relatedData) => (
    <LessonForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  event: (setOpen, type, data, relatedData) => (
    <EventForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  feedback: (setOpen, type, data, relatedData) => (
    <FeedbackForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />  
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: any }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
      ? "bg-lamaSky"
      : "bg-lamaPurple";

  const [open, setOpen] = useState(false);

  const Form = () => {
    const [state, formAction] = useFormState(deleteActionMap[table], {
      success: false,
      error: false,
    });

    const router = useRouter();

    useEffect(() => {
      if (state.success) {
        toast(`${table} Успешно удалено!`, { type: "success" });
        setOpen(false);
        router.refresh();
      }
    }, [state, router]);

    return type === "delete" && id ? (
      <form action={formAction} className="p-4 flex flex-col gap-4">
        <input type="text | number" name="id" defaultValue={id} hidden />
        <span className="text-center font-medium">
          Все данные будут потеряны. Вы уверены, что хотите удалить это? {table}?
        </span>
        <button className="bg-red-700 text-white py-2 px-4 rounded-md border-none w-max self-center">
          Удалить
        </button>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table](setOpen, type, data, relatedData)
    ) : (
      "Form not found!"
    );
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>
    {open && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        setOpen(false);
      }
    }}
  >
    <div 
      className="bg-white rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ✅ Контент с кастомным скрытием scrollbar */}
      <div 
        className="max-h-[90vh] p-4 overflow-auto"
        style={{
          scrollbarWidth: 'none', /* Firefox */
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <Form />
      </div>
      
      <div
        className="absolute top-4 right-4 cursor-pointer z-10 w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full"
        onClick={() => setOpen(false)}
      >
        <Image src="/close.png" alt="Закрыть" width={12} height={12} />
      </div>
    </div>
  </div>
)}
    </>
  );
};

export default FormModal;
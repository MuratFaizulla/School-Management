import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table: "teacher" | "subject" | "class" | "lesson" | "event" | "feedback";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: subjectTeachers };
        break;

      case "class":
        const classTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: classTeachers };
        break;

      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { subjects: teacherSubjects };
        break;

      case "lesson":
        const lessonSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        const lessonClasses = await prisma.class.findMany({
          select: { id: true, name: true },
        });
        const lessonTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = {
          subjects: lessonSubjects,
          classes: lessonClasses,
          teachers: lessonTeachers,
        };
        break;

      // ✅ Исправленный case "event"
     case "event":
  const eventTeachers = await prisma.teacher.findMany({
    select: { id: true, name: true, surname: true },
    orderBy: [{ surname: 'asc' }, { name: 'asc' }]
  });
  const eventClasses = await prisma.class.findMany({
    select: { id: true, name: true, gradeLevel: true },
    orderBy: { name: 'asc' }
  });
  relatedData = {
    teachers: eventTeachers,  // ✅ Для тим-лидера и участников
    classes: eventClasses,     // ✅ Для выбора класса
  };
  break;

      // case "feedback":
      //   const feedbackEvents = await prisma.event.findMany({
      //     where: {
      //       feedback: null, // Только события без обратной связи
      //     },
      //     select: {
      //       id: true,
      //       title: true,
      //       startTime: true,
      //       teacher: {
      //         select: { name: true, surname: true },
      //       },
      //     },
      //   });
      //   relatedData = {
      //     events: feedbackEvents,
      //   };
      //   break;

case "feedback":
  const feedbackEvents = await prisma.event.findMany({
    where: {
      feedback: null, // Только события без обратной связи
    },
    include: {
      teamLeader: {                    // ✅ Тим-лидер
        select: { id: true, name: true, surname: true },
      },
      participants: {                  // ✅ Участники через промежуточную таблицу
        include: {
          teacher: {
            select: { id: true, name: true, surname: true }
          }
        }
      },
      class: {                         // ✅ Класс
        select: { id: true, name: true }
      }
    },
    orderBy: { startTime: 'desc' }
  });

      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
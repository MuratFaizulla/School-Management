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

      case "event":
        // ✅ Для Event нужны: учителя (тим-лидер + участники) и классы
        const eventTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
          orderBy: [
            { surname: 'asc' },
            { name: 'asc' }
          ]
        });
        const eventClasses = await prisma.class.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });
        relatedData = {
          teachers: eventTeachers,
          classes: eventClasses,
        };
        break;

      case "feedback":
        // ✅ Для Feedback загружаем события с новой структурой
        const feedbackEvents = await prisma.event.findMany({
          where: {
            feedback: null, // Только события без обратной связи
          },
          include: {
            teamLeader: {
              select: { id: true, name: true, surname: true },
            },
            participants: {
              include: {
                teacher: {
                  select: { id: true, name: true, surname: true }
                }
              }
            },
            class: {
              select: { id: true, name: true }
            }
          },
          orderBy: { startTime: 'desc' }
        });
        relatedData = {
          events: feedbackEvents,
        };
        break;

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
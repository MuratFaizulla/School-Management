import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleTeacherPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const teacher:
    | (Teacher & {
        _count: {
          subjects: number;
          lessons: number;
          classes: number;
          events: number;
        };
        events: {
          id: number;
          title: string;
          startTime: Date;
          controllerType: string;
          feedback?: { id: number } | null;
        }[];
      })
    | null = await prisma.teacher.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          subjects: true,
          lessons: true,
          classes: true,
          events: true, // События где этот учитель контролируется
        },
      },
      events: {
        take: 5, // Последние 5 событий
        orderBy: { startTime: "desc" },
        select: {
          id: true,
          title: true,
          startTime: true,
          controllerType: true,
          feedback: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!teacher) {
    return notFound();
  }

  // Подсчет статистики обратной связи
  const eventsWithFeedback = teacher.events.filter((event) => event.feedback);
  const feedbackRate =
    teacher.events.length > 0
      ? Math.round((eventsWithFeedback.length / teacher.events.length) * 100)
      : 0;

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <div className="w-36 h-36 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-4xl text-blue-600">
                  {teacher.name.charAt(0)}
                  {teacher.surname.charAt(0)}
                </span>
              </div>
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {teacher.name} {teacher.surname}
                </h1>
                {role === "admin" && (
                  <FormContainer table="teacher" type="update" data={teacher} />
                )}
              </div>
              <p className="text-sm text-gray-600">
                Учитель с опытом работы в образовательной сфере. Ведет уроки и
                участвует в образовательном процессе школы.
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/2 lg:w-full 2xl:w-1/2 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{teacher.email || "Не указан"}</span>
                </div>
                <div className="w-full md:w-1/2 lg:w-full 2xl:w-1/2 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>ID: {teacher.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD - Предметы */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">
                  {teacher._count.subjects}
                </h1>
                <span className="text-sm text-gray-400">Предметы</span>
              </div>
            </div>

            {/* CARD - Уроки */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">
                  {teacher._count.lessons}
                </h1>
                <span className="text-sm text-gray-400">Уроки</span>
              </div>
            </div>

            {/* CARD - Классы */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">
                  {teacher._count.classes}
                </h1>
                <span className="text-sm text-gray-400">Классы</span>
              </div>
            </div>

            {/* CARD - События контроля */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">
                  {teacher._count.events}
                </h1>
                <span className="text-sm text-gray-400">События контроля</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1 className="text-lg font-semibold mb-4">Расписание учителя</h1>
          <BigCalendarContainer type="teacherId" id={teacher.id} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* События контроля */}
        <div className="bg-white p-4 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold">События контроля</h1>
            <span className="text-sm text-gray-500">
              Заполнено: {feedbackRate}%
            </span>
          </div>

          {teacher.events.length > 0 ? (
            <div className="space-y-3">
              {teacher.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/list/events/${event.id}`}
                  className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{event.title}</div>
                      <div className="text-xs text-gray-500">
                        {event.startTime.toLocaleDateString("ru-RU")}
                      </div>
                      <div className="text-xs text-blue-600">
                        {event.controllerType === "DIRECTOR" && "Директор"}
                        {event.controllerType === "DEPUTY" && "Завуч"}
                        {event.controllerType === "METHODIST" && "Методист"}
                        {event.controllerType === "INSPECTOR" && "Инспектор"}
                        {event.controllerType === "ADMIN" && "Администратор"}
                        {event.controllerType === "TEACHER" && "Учитель"}
                      </div>
                    </div>
                    <div className="text-xs">
                      {event.feedback ? (
                        <span className="text-green-600">✓ Есть лист</span>
                      ) : (
                        <span className="text-yellow-600">⏳ Нет листа</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Событий контроля пока нет</p>
          )}
        </div>

        {/* Быстрые ссылки */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-lg font-semibold mb-4">Быстрые ссылки</h1>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <Link
              className="p-3 rounded-md bg-lamaSkyLight hover:bg-blue-200 transition-colors"
              href={`/list/classes?supervisorId=${teacher.id}`}
            >
              📚 Классы учителя
            </Link>
            {/* <Link
              className="p-3 rounded-md bg-lamaPurpleLight hover:bg-purple-200 transition-colors"
              href={`/list/students?teacherId=${teacher.id}`}
            >
              👥 Ученики учителя
            </Link> */}
            <Link
              className="p-3 rounded-md bg-lamaYellowLight hover:bg-yellow-200 transition-colors"
              href={`/list/lessons?teacherId=${teacher.id}`}
            >
              📖 Уроки учителя
            </Link>
            <Link
              className="p-3 rounded-md bg-green-50 hover:bg-green-200 transition-colors"
              href={`/list/events?teacherId=${teacher.id}`}
            >
              🎯 События контроля
            </Link>
          </div>
        </div>

        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;

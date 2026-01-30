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
          eventsAsTeamLeader: number;
          eventParticipations: number;
        };
        eventsAsTeamLeader: {
          id: number;
          title: string;
          startTime: Date;
          controllerType: string;
          class: { name: string } | null;
          feedback?: { id: number } | null;
        }[];
        eventParticipations: {
          event: {
            id: number;
            title: string;
            startTime: Date;
            controllerType: string;
            class: { name: string } | null;
            feedback?: { id: number } | null;
          };
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
          eventsAsTeamLeader: true,
          eventParticipations: true,
        },
      },
      eventsAsTeamLeader: {
        take: 3,
        orderBy: { startTime: "desc" },
        select: {
          id: true,
          title: true,
          startTime: true,
          controllerType: true,
          class: {
            select: { name: true },
          },
          feedback: {
            select: { id: true },
          },
        },
      },
      eventParticipations: {
        take: 3,
        orderBy: {
          event: {
            startTime: "desc",
          },
        },
        select: {
          event: {
            select: {
              id: true,
              title: true,
              startTime: true,
              controllerType: true,
              class: {
                select: { name: true },
              },
              feedback: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!teacher) {
    return notFound();
  }

  const allEvents = [
    ...teacher.eventsAsTeamLeader.map(event => ({ ...event, role: 'teamLeader' as const })),
    ...teacher.eventParticipations.map(p => ({ ...p.event, role: 'participant' as const })),
  ].sort((a, b) => b.startTime.getTime() - a.startTime.getTime()).slice(0, 5);

  const totalEvents = teacher._count.eventsAsTeamLeader + teacher._count.eventParticipations;

  const eventsWithFeedback = allEvents.filter((event) => event.feedback);
  const feedbackRate =
    allEvents.length > 0
      ? Math.round((eventsWithFeedback.length / allEvents.length) * 100)
      : 0;

  const translateControllerType = (type: string) => {
    const translations: { [key: string]: string } = {
      DIRECTOR: "Директор",
      DEPUTY_UC: "Завуч по УР",
      DEPUTY_VP: "Завуч по ВР",
      DEPUTY_NMR: "Завуч по НМР",
      DEPUTY_VS: "Завуч по ВС",
    };
    return translations[type] || type;
  };

  return (
    <div className="flex-1 p-2 sm:p-4 flex flex-col gap-3 sm:gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-4 px-3 sm:py-6 sm:px-4 rounded-md flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Avatar - centered on mobile */}
            <div className="flex justify-center sm:w-1/3">
              <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-4xl text-blue-600">
                  {teacher.name.charAt(0)}
                  {teacher.surname.charAt(0)}
                </span>
              </div>
            </div>
            
            {/* Info - full width on mobile */}
            <div className="flex-1 sm:w-2/3 flex flex-col justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-lg sm:text-xl font-semibold text-center sm:text-left">
                  {teacher.name} {teacher.surname}
                </h1>
                {role === "admin" && (
                  <div className="flex justify-center sm:justify-start">
                    <FormContainer table="teacher" type="update" data={teacher} />
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Учитель с опытом работы в образовательной сфере. Ведет уроки и
                участвует в образовательном процессе школы.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-medium">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span className="truncate">{teacher.email || "Не указан"}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>ID: {teacher.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SMALL CARDS - 2 columns on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {/* CARD - Предметы */}
            <div className="bg-white p-3 sm:p-4 rounded-md flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
              <Image
                src="/singleBranch.png"
                alt=""
                width={20}
                height={20}
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
              <div className="text-center sm:text-left">
                <h1 className="text-lg sm:text-xl font-semibold">
                  {teacher._count.subjects}
                </h1>
                <span className="text-xs sm:text-sm text-gray-400">Предметы</span>
              </div>
            </div>

            {/* CARD - Уроки */}
            <div className="bg-white p-3 sm:p-4 rounded-md flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
              <Image
                src="/singleLesson.png"
                alt=""
                width={20}
                height={20}
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
              <div className="text-center sm:text-left">
                <h1 className="text-lg sm:text-xl font-semibold">
                  {teacher._count.lessons}
                </h1>
                <span className="text-xs sm:text-sm text-gray-400">Уроки</span>
              </div>
            </div>

            {/* CARD - Классы */}
            <div className="bg-white p-3 sm:p-4 rounded-md flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
              <Image
                src="/singleClass.png"
                alt=""
                width={20}
                height={20}
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
              <div className="text-center sm:text-left">
                <h1 className="text-lg sm:text-xl font-semibold">
                  {teacher._count.classes}
                </h1>
                <span className="text-xs sm:text-sm text-gray-400">Классы</span>
              </div>
            </div>

            {/* CARD - События контроля */}
            <div className="bg-white p-3 sm:p-4 rounded-md flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={20}
                height={20}
                className="w-5 h-5 sm:w-6 sm:h-6"
              />
              <div className="text-center sm:text-left">
                <h1 className="text-lg sm:text-xl font-semibold">
                  {totalEvents}
                </h1>
                <span className="text-xs sm:text-sm text-gray-400">События</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM - Calendar with adjusted height for mobile */}
        <div className="mt-3 sm:mt-4 bg-white rounded-md p-3 sm:p-4 h-[500px] sm:h-[600px] lg:h-[800px]">
          <h1 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Расписание учителя</h1>
          <BigCalendarContainer type="teacherId" id={teacher.id} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-3 sm:gap-4">
        {/* Статистика участия */}
        <div className="bg-white p-3 sm:p-4 rounded-md">
          <h1 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Статистика участия</h1>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-md">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Тим-лидер</div>
                <div className="text-xl sm:text-2xl font-semibold text-blue-600">
                  {teacher._count.eventsAsTeamLeader}
                </div>
              </div>
              <div className="text-2xl sm:text-3xl">👨‍🏫</div>
            </div>
            
            <div className="flex items-center justify-between p-2 sm:p-3 bg-purple-50 rounded-md">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Участник</div>
                <div className="text-xl sm:text-2xl font-semibold text-purple-600">
                  {teacher._count.eventParticipations}
                </div>
              </div>
              <div className="text-2xl sm:text-3xl">👥</div>
            </div>
            
            <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-md">
              <div>
                <div className="text-xs sm:text-sm text-gray-600">Заполнено листов</div>
                <div className="text-xl sm:text-2xl font-semibold text-green-600">
                  {feedbackRate}%
                </div>
              </div>
              <div className="text-2xl sm:text-3xl">📋</div>
            </div>
          </div>
        </div>

        {/* События контроля */}
        <div className="bg-white p-3 sm:p-4 rounded-md">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-base sm:text-lg font-semibold">Последние события</h1>
            <Link 
              href={`/list/events?teamLeaderId=${teacher.id}`}
              className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
            >
              Все →
            </Link>
          </div>

          {allEvents.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {allEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/list/events/${event.id}`}
                  className="block p-2 sm:p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                          event.role === 'teamLeader' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {event.role === 'teamLeader' ? '👨‍🏫 Лидер' : '👥 Участник'}
                        </span>
                      </div>
                      <div className="font-medium text-xs sm:text-sm line-clamp-2 sm:truncate">
                        {event.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="whitespace-nowrap">
                          {event.startTime.toLocaleDateString("ru-RU")}
                        </span>
                        {event.class && (
                          <>
                            <span>•</span>
                            <span className="truncate">{event.class.name}</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-blue-600 mt-1 truncate">
                        {translateControllerType(event.controllerType)}
                      </div>
                    </div>
                    <div className="text-xs flex-shrink-0 self-start">
                      {event.feedback ? (
                        <span className="text-green-600 whitespace-nowrap">✓ Есть</span>
                      ) : (
                        <span className="text-yellow-600 whitespace-nowrap">⏳ Нет</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-xs sm:text-sm">Событий контроля пока нет</p>
          )}
        </div>

        {/* Быстрые ссылки */}
        <div className="bg-white p-3 sm:p-4 rounded-md">
          <h1 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Быстрые ссылки</h1>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <Link
              className="p-2 sm:p-3 rounded-md bg-lamaSkyLight hover:bg-blue-200 transition-colors"
              href={`/list/classes?supervisorId=${teacher.id}`}
            >
              📚 Классы учителя
            </Link>
            <Link
              className="p-2 sm:p-3 rounded-md bg-lamaYellowLight hover:bg-yellow-200 transition-colors"
              href={`/list/lessons?teacherId=${teacher.id}`}
            >
              📖 Уроки учителя
            </Link>
            <Link
              className="p-2 sm:p-3 rounded-md bg-blue-50 hover:bg-blue-200 transition-colors"
              href={`/list/events?teamLeaderId=${teacher.id}`}
            >
              👨‍🏫 События как тим-лидер
            </Link>
            <Link
              className="p-2 sm:p-3 rounded-md bg-purple-50 hover:bg-purple-200 transition-colors"
              href={`/list/events`}
            >
              🎯 Все события контроля
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
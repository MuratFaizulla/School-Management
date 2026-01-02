import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Event, Prisma, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import Link from "next/link";

// ✅ Добавляем feedback в тип
type EventListType = Event & { 
  teacher: Teacher;
  feedback?: { id: number } | null;
};

const EventListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const columns = [
    { header: "Название события", accessor: "title" },
    { header: "Учитель", accessor: "teacherName" },
    { header: "Тип контроля", accessor: "controllerType", className: "hidden lg:table-cell" },
    { header: "Дата", accessor: "date", className: "hidden md:table-cell" },
    { header: "Время", accessor: "time", className: "hidden md:table-cell" },
    { header: "Статус", accessor: "status", className: "hidden lg:table-cell" },
    ...(role === "admin" ? [{ header: "Действия", accessor: "action" }] : []),
  ];

  // Функция для перевода типа контролера
  const translateControllerType = (type: string) => {
    const translations: { [key: string]: string } = {
      DIRECTOR: "Директор",
      DEPUTY: "Завуч",
      METHODIST: "Методист",
      INSPECTOR: "Инспектор",
      ADMIN: "Админ",
      TEACHER: "Учитель",
    };
    return translations[type] || type;
  };

  const renderRow = (item: EventListType) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <span className="font-medium">{item.title}</span>
          <span className="text-xs text-gray-500 truncate max-w-[200px]">
            {item.description}
          </span>
        </div>
      </td>
      
      <td>
        {item.teacher ? (
          <div className="flex flex-col">
            <span className="font-medium">
              {item.teacher.name} {item.teacher.surname}
            </span>
            {item.teacher.email && (
              <span className="text-xs text-gray-500">{item.teacher.email}</span>
            )}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      <td className="hidden lg:table-cell">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
          {translateControllerType(item.controllerType)}
        </span>
      </td>
      
      <td className="hidden md:table-cell">
        {item.startTime.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </td>
      
      <td className="hidden md:table-cell">
        <div className="text-xs">
          <div>
            {item.startTime.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className="text-gray-500">
            {item.endTime.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </td>

      <td className="hidden lg:table-cell">
        {item.feedback ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            📋 Есть лист
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            ⏳ Нет листа
          </span>
        )}
      </td>
      
      <td>
        <div className="flex items-center gap-2">
          {/* Кнопка просмотра */}
          <Link href={`/list/events/${item.id}`}>
            <button 
              className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky hover:bg-blue-400 transition-colors"
              title="Посмотреть событие"
            >
              <Image src="/view.png" alt="Посмотреть" width={16} height={16} />
            </button>
          </Link>
          
          {/* Кнопки админа */}
          {role === "admin" && (
            <>
              <FormContainer table="event" type="update" data={item} />
              <FormContainer table="event" type="delete" id={item.id} />
              
              {/* Быстрая кнопка создания feedback */}
              {!item.feedback && (
                <FormContainer 
                  table="feedback" 
                  type="create" 
                  data={{ eventId: item.id }}
                />
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Расширенный поиск
  const query: Prisma.EventWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value && value !== "") {
        switch (key) {
          case "search":
            query.OR = [
              { title: { contains: value, mode: "insensitive" } },
              { description: { contains: value, mode: "insensitive" } },
              { teacher: { name: { contains: value, mode: "insensitive" } } },
              { teacher: { surname: { contains: value, mode: "insensitive" } } },
            ];
            break;
          case "controllerType":
            query.controllerType = value as any;
            break;
          case "teacherId":
            query.teacherId = value;
            break;
          case "hasFeedback":
            if (value === "true") {
              query.feedback = { isNot: null };
            } else if (value === "false") {
              query.feedback = null;
            }
            break;
        }
      }
    }
  }

  // Ролевая фильтрация
  if (role === "teacher") {
    query.OR = [
      { teacherId: currentUserId! },
      {
        lesson: {
          teacherId: currentUserId!,
        },
      },
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.event.findMany({
      where: query,
      include: { 
        teacher: true,
        feedback: { select: { id: true } }, // ✅ Включаем feedback для статуса
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { startTime: "desc" }, // ✅ Сначала новые события
    }),
    prisma.event.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Все события</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="Фильтр" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="Сортировка" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="event" type="create" />}
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="flex gap-4 my-4">
        <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-md text-sm">
          <span className="font-medium text-blue-800">Всего событий: </span>
          <span className="text-blue-600">{count}</span>
        </div>
        <div className="bg-green-50 border border-green-200 px-3 py-2 rounded-md text-sm">
          <span className="font-medium text-green-800">С листами: </span>
          <span className="text-green-600">
            {data.filter(item => item.feedback).length}
          </span>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-md text-sm">
          <span className="font-medium text-yellow-800">Без листов: </span>
          <span className="text-yellow-600">
            {data.filter(item => !item.feedback).length}
          </span>
        </div>
      </div>

      {/* LIST */}
      {data.length > 0 ? (
        <Table columns={columns} renderRow={renderRow} data={data} />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">Событий не найдено</p>
          {role === "admin" && (
            <FormContainer table="event" type="create" />
          )}
        </div>
      )}

      {/* PAGINATION */}
      <Pagination page={p} count={count} />

      {/* CALENDAR */}
      {/* <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Календарь событий</h2>
        <EventCalendarContainer searchParams={searchParams} />
      </div> */}
    </div>
  );
};

export default EventListPage;
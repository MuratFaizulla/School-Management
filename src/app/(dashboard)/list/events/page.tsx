import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Event, Prisma, Teacher, Class } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

type EventListType = Event & { 
  teamLeader: Teacher;
  class: Class | null;
  participants: { teacher: Teacher }[];
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
    { header: "Тим-лидер", accessor: "teamLeader" },
    { header: "Класс", accessor: "class", className: "hidden lg:table-cell" },
    { header: "Участников", accessor: "participants", className: "hidden xl:table-cell" },
    { header: "Тип контроля", accessor: "controllerType", className: "hidden lg:table-cell" },
    { header: "Дата", accessor: "date", className: "hidden md:table-cell" },
    { header: "Время", accessor: "time", className: "hidden md:table-cell" },
    { header: "Статус", accessor: "status", className: "hidden lg:table-cell" },
    ...(role === "admin" ? [{ header: "Действия", accessor: "action" }] : []),
  ];

  const translateControllerType = (type: string) => {
    const translations: { [key: string]: string } = {
      DIRECTOR: "Директор",
      DEPUTY_UC: "Завуч УР",
      DEPUTY_VP: "Завуч ВР",
      DEPUTY_NMR: "Завуч НМР",
      DEPUTY_VS: "Завуч ВС",
    };
    return translations[type] || type;
  };

  // ✅ Мобильная карточка события
  const MobileEventCard = ({ item }: { item: EventListType }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
      {/* Заголовок */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
        </div>
        <div className="ml-2 flex gap-1">
          <Link href={`/list/events/${item.id}`}>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200">
              <Image src="/view.png" alt="Посмотреть" width={14} height={14} />
            </button>
          </Link>
          {role === "admin" && (
            <FormContainer table="event" type="update" data={item} />
          )}
        </div>
      </div>

      {/* Основная информация */}
      <div className="space-y-2">
        {/* Тим-лидер */}
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-600 min-w-fit">Тим-лидер:</span>
          <span className="text-sm font-medium">
            {item.teamLeader ? `${item.teamLeader.name} ${item.teamLeader.surname}` : "-"}
          </span>
        </div>

        {/* Класс и участники */}
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-100 px-2 py-1 rounded text-green-600 min-w-fit">Класс:</span>
          <span className="text-sm font-medium">
            {item.class?.name || "-"}
          </span>
          <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-600 ml-auto">
            👥 {item.participants.length} участн.
          </span>
        </div>

        {/* Дата и время */}
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 min-w-fit">Время:</span>
          <span className="text-sm">
            {item.startTime.toLocaleDateString("ru-RU")} в{" "}
            {item.startTime.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Тип контроля и статус */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">Контроль:</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              {translateControllerType(item.controllerType)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {item.feedback ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                📋 Есть лист
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                  ⏳ Нет листа
                </span>
                {role === "admin" && (
                  <FormContainer 
                    table="feedback" 
                    type="create" 
                    data={{ eventId: item.id }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Действия админа */}
      {role === "admin" && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <FormContainer table="event" type="delete" id={item.id} />
          <span className="text-xs text-gray-400 ml-auto">ID: {item.id}</span>
        </div>
      )}
    </div>
  );

  // Десктопная таблица
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
        {item.teamLeader ? (
          <div className="flex flex-col">
            <span className="font-medium">
              {item.teamLeader.name} {item.teamLeader.surname}
            </span>
            {item.teamLeader.email && (
              <span className="text-xs text-gray-500">{item.teamLeader.email}</span>
            )}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      <td className="hidden lg:table-cell">
        {item.class ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            {item.class.name}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>

      <td className="hidden xl:table-cell">
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
            👥 {item.participants.length}
          </span>
          {item.participants.length > 0 && (
            <div className="group relative">
              <button className="text-blue-500 hover:text-blue-700 text-xs">ℹ️</button>
              <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-white border border-gray-200 rounded-md shadow-lg right-0 top-6">
                <div className="text-xs space-y-1">
                  <div className="font-medium text-gray-700 mb-1">Участники:</div>
                  {item.participants.map((p) => (
                    <div key={p.teacher.id} className="text-gray-600">
                      • {p.teacher.name} {p.teacher.surname}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
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
          <Link href={`/list/events/${item.id}`}>
            <button 
              className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky hover:bg-blue-400 transition-colors"
              title="Посмотреть событие"
            >
              <Image src="/view.png" alt="Посмотреть" width={16} height={16} />
            </button>
          </Link>
          
          {role === "admin" && (
            <>
              <FormContainer table="event" type="update" data={item} />
              <FormContainer table="event" type="delete" id={item.id} />
              
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

  // ✅ Запрос данных с новой структурой
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.EventWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value && value !== "") {
        switch (key) {
          case "search":
            query.OR = [
              { title: { contains: value, mode: "insensitive" } },
              { description: { contains: value, mode: "insensitive" } },
              { teamLeader: { name: { contains: value, mode: "insensitive" } } },
              { teamLeader: { surname: { contains: value, mode: "insensitive" } } },
            ];
            break;
          case "controllerType":
            query.controllerType = value as any;
            break;
          case "teamLeaderId":
            query.teamLeaderId = value;
            break;
          case "classId":
            query.classId = parseInt(value);
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

  // ✅ Для учителя: показываем события где он тим-лидер или участник
  if (role === "teacher") {
    query.OR = [
      { teamLeaderId: currentUserId! }, // Тим-лидер
      { 
        participants: { 
          some: { 
            teacherId: currentUserId! 
          } 
        } 
      }, // Участник
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.event.findMany({
      where: query,
      include: { 
        teamLeader: true,
        class: true,
        participants: {
          include: {
            teacher: true
          }
        },
        feedback: { select: { id: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { startTime: "desc" },
    }),
    prisma.event.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-3 md:p-4 rounded-md flex-1 m-2 md:m-4 mt-0">
      {/* ✅ Адаптивный заголовок */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <h1 className="text-lg md:text-xl font-semibold">Все события</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <TableSearch />
          <div className="flex items-center gap-2 justify-end">
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

      {/* ✅ Адаптивная статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 mb-4">
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

      {/* ✅ Адаптивный список */}
      {data.length > 0 ? (
        <>
          {/* Десктопная таблица */}
          <div className="hidden md:block">
            <Table columns={columns} renderRow={renderRow} data={data} />
          </div>

          {/* Мобильные карточки */}
          <div className="md:hidden">
            {data.map((item) => (
              <MobileEventCard key={item.id} item={item} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="mb-4">
            <Image src="/noData.png" alt="Нет данных" width={64} height={64} className="mx-auto opacity-50" />
          </div>
          <p className="text-gray-400 mb-4">Событий не найдено</p>
          {role === "admin" && (
            <FormContainer table="event" type="create" />
          )}
        </div>
      )}

      {/* ✅ Адаптивная пагинация */}
      <div className="mt-4">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default EventListPage;
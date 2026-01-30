import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Class, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";

type TeacherList = Teacher & { 
  subjects: Subject[];
  classes: Class[];
  _count?: {
    eventsAsTeamLeader: number;
  };
};

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  
  const columns = [
    {
      header: "№",
      accessor: "index",
      className: "w-12 text-center",
    },
    {
      header: "Информация",
      accessor: "info",
    },
    {
      header: "ID учителя",
      accessor: "teacherId",
      className: "hidden md:table-cell",
    },
    {
      header: "Предметы",
      accessor: "subjects",
      className: "hidden lg:table-cell",
    },
    {
      header: "События",
      accessor: "events",
      className: "hidden xl:table-cell text-center",
    },
    ...(role === "admin"
      ? [
          {
            header: "Действия",
            accessor: "action",
          },
        ]
      : []),
  ];

  // ✅ Мобильная карточка учителя
  const MobileTeacherCard = ({ item, index }: { item: TeacherList; index: number }) => {
    const rowNumber = (p - 1) * ITEM_PER_PAGE + index + 1;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
        {/* Заголовок */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
              {item.name[0]}{item.surname[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">#{rowNumber}</span>
                <h3 className="font-semibold text-gray-900 truncate">
                  {item.name} {item.surname}
                </h3>
              </div>
              <p className="text-xs text-gray-500 truncate">{item.email}</p>
            </div>
          </div>
          <div className="ml-2 flex gap-1 flex-shrink-0">
            <Link href={`/list/teachers/${item.id}`}>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200">
                <Image src="/view.png" alt="Просмотр" width={14} height={14} />
              </button>
            </Link>
            {role === "admin" && (
              <FormContainer table="teacher" type="delete" id={item.id} />
            )}
          </div>
        </div>

        {/* Основная информация */}
        <div className="space-y-2">
          {/* ID */}
          <div className="flex items-center gap-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 min-w-fit">ID:</span>
            <span className="text-sm font-mono text-gray-700">{item.username}</span>
          </div>

          {/* Предметы */}
          {item.subjects.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-600 min-w-fit">Предметы:</span>
              <div className="flex flex-wrap gap-1 flex-1">
                {item.subjects.slice(0, 3).map((subject) => (
                  <span
                    key={subject.id}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200"
                  >
                    {subject.name}
                  </span>
                ))}
                {item.subjects.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    +{item.subjects.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* События */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-600">События как тим-лидер:</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              🎯 {item._count?.eventsAsTeamLeader || 0}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.TeacherWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.lessons = {
              some: {
                classId: parseInt(value),
              },
            };
            break;
          case "search":
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { surname: { contains: value, mode: "insensitive" } },
              { email: { contains: value, mode: "insensitive" } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.teacher.findMany({
      where: query,
      include: {
        subjects: true,
        classes: true,
        _count: {
          select: {
            eventsAsTeamLeader: true,
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: [
        { surname: 'asc' },
        { name: 'asc' }
      ],
    }),
    prisma.teacher.count({ where: query }),
  ]);

  const renderRow = (item: TeacherList, index: number) => {
    const rowNumber = (p - 1) * ITEM_PER_PAGE + index + 1;
    
    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight transition-colors"
      >
        <td className="text-center font-medium text-gray-600">{rowNumber}</td>
        
        <td className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
            {item.name[0]}{item.surname[0]}
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-gray-900">
              {item.name} {item.surname}
            </h3>
            <p className="text-xs text-gray-500">{item.email}</p>
          </div>
        </td>
        
        <td className="hidden md:table-cell">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
            {item.username}
          </span>
        </td>
        
        <td className="hidden lg:table-cell">
          {item.subjects.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {item.subjects.slice(0, 3).map((subject) => (
                <span
                  key={subject.id}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                >
                  {subject.name}
                </span>
              ))}
              {item.subjects.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  +{item.subjects.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 text-xs italic">Нет предметов</span>
          )}
        </td>
        
        <td className="hidden xl:table-cell text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              🎯 {item._count?.eventsAsTeamLeader || 0}
            </span>
          </div>
        </td>
        
        <td>
          <div className="flex items-center gap-2">
            <Link href={`/list/teachers/${item.id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky hover:bg-blue-300 transition-colors">
                <Image src="/view.png" alt="Просмотр" width={16} height={16} />
              </button>
            </Link>
            {role === "admin" && (
              <FormContainer table="teacher" type="delete" id={item.id} />
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-3 md:p-4 rounded-md flex-1 m-2 md:m-4 mt-0">
      {/* TOP - Адаптивный заголовок */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">Все учителя</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Всего: <span className="font-medium">{count}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <TableSearch />
          <div className="flex items-center gap-2 justify-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-yellow-400 transition-colors">
              <Image src="/filter.png" alt="Фильтр" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-yellow-400 transition-colors">
              <Image src="/sort.png" alt="Сортировка" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormContainer table="teacher" type="create" />
            )}
          </div>
        </div>
      </div>
      
      {/* LIST - Адаптивный список */}
      {data.length > 0 ? (
        <>
          {/* Десктопная таблица */}
          <div className="hidden md:block">
            <Table columns={columns} renderRow={renderRow} data={data} />
          </div>

          {/* Мобильные карточки */}
          <div className="md:hidden">
            {data.map((item, index) => (
              <MobileTeacherCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-gray-400">👨‍🏫</span>
          </div>
          <p className="text-gray-400 mb-4">Учителей не найдено</p>
          {role === "admin" && (
            <FormContainer table="teacher" type="create" />
          )}
        </div>
      )}
      
      {/* PAGINATION - Адаптивная пагинация */}
      <div className="mt-4">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default TeacherListPage;
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Lesson, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type LessonList = Lesson & { 
  subject: Subject;
  class: Class;
  teacher: Teacher;
};

const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    {
      header: "Название урока",
      accessor: "name",
    },
    {
      header: "Предмет",
      accessor: "subject",
    },
    {
      header: "Класс",
      accessor: "class",
    },
    {
      header: "День недели",
      accessor: "day",
      className: "hidden md:table-cell",
    },
    {
      header: "Время",
      accessor: "time",
      className: "hidden md:table-cell",
    },
    {
      header: "Учитель",
      accessor: "teacher",
      className: "hidden lg:table-cell",
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

  // Функция для перевода дней недели
  const translateDay = (day: string) => {
    const dayTranslations: { [key: string]: string } = {
      MONDAY: "Понедельник",
      TUESDAY: "Вторник", 
      WEDNESDAY: "Среда",
      THURSDAY: "Четверг",
      FRIDAY: "Пятница",
    };
    return dayTranslations[day] || day;
  };

  // Функция для форматирования времени
  const formatTime = (startTime: Date, endTime: Date) => {
    const start = new Date(startTime).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const end = new Date(endTime).toLocaleTimeString('ru-RU', {
      hour: '2-digit', 
      minute: '2-digit'
    });
    return `${start} - ${end}`;
  };

  const renderRow = (item: LessonList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 font-medium">{item.name}</td>
      <td>{item.subject.name}</td>
      <td>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
          {item.class.name}
        </span>
      </td>
      <td className="hidden md:table-cell">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
          {translateDay(item.day)}
        </span>
      </td>
      <td className="hidden md:table-cell">
        <span className="text-xs text-gray-600">
          {formatTime(item.startTime, item.endTime)}
        </span>
      </td>
      <td className="hidden lg:table-cell">
        {item.teacher.name} {item.teacher.surname}
      </td>
      {role === "admin" && (
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="lesson" type="update" data={item} />
            <FormContainer table="lesson" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.LessonWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.classId = parseInt(value);
            break;
          case "teacherId":
            query.teacherId = value;
            break;
          case "subjectId":
            query.subjectId = parseInt(value);
            break;
          case "day":
            query.day = value as any;
            break;
          case "search":
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { subject: { name: { contains: value, mode: "insensitive" } } },
              { teacher: { name: { contains: value, mode: "insensitive" } } },
              { teacher: { surname: { contains: value, mode: "insensitive" } } },
              { class: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.lesson.findMany({
      where: query,
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
        teacher: { select: { name: true, surname: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: [
        { day: "asc" },
        { startTime: "asc" }
      ],
    }),
    prisma.lesson.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Все уроки</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="lesson" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default LessonListPage;
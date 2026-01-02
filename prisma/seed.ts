import { Day, PrismaClient, ControllerType } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ADMIN - Администраторы системы
  await prisma.admin.create({
    data: {
      id: "admin",
      username: "admin1",
    },
  });
  await prisma.admin.create({
    data: {
      id: "admin2",
      username: "admin2",
    },
  });

  // GRADE - Параллели (1-11 классы)
  for (let i = 1; i <= 11; i++) {
    await prisma.grade.create({
      data: {
        level: i,
      },
    });
  }

  // CLASS - Классы (1А-11Б)
  const classNames = ["А", "Б", "В"];
  for (let i = 1; i <= 11; i++) {
    for (let j = 0; j < (i <= 6 ? 2 : 1); j++) {
      await prisma.class.create({
        data: {
          name: `${i}${classNames[j]}`,
          gradeId: i,
          capacity: Math.floor(Math.random() * (25 - 20 + 1)) + 20,
        },
      });
    }
  }

  // SUBJECT - Предметы
  const subjectData = [
    { name: "Математика" },
    { name: "Русский язык" },
    { name: "Английский язык" },
    { name: "История" },
    { name: "География" },
    { name: "Физика" },
    { name: "Химия" },
    { name: "Биология" },
    { name: "Информатика" },
    { name: "Литература" },
    { name: "Физкультура" },
    { name: "Музыка" },
  ];

  for (const subject of subjectData) {
    await prisma.subject.create({ data: subject });
  }

  // TEACHER - Учителя
  const teacherNames = [
    { name: "Айгуль", surname: "Нурланова" },
    { name: "Ерлан", surname: "Сапаров" },
    { name: "Динара", surname: "Жанбулатова" },
    { name: "Асан", surname: "Мухамедов" },
    { name: "Гульнара", surname: "Касымова" },
    { name: "Бахыт", surname: "Жумабаев" },
    { name: "Алия", surname: "Досанова" },
    { name: "Нурлан", surname: "Абдуллаев" },
    { name: "Сауле", surname: "Кенжебаева" },
    { name: "Ербол", surname: "Искаков" },
    { name: "Жанна", surname: "Алимбаева" },
    { name: "Кайрат", surname: "Токтаров" },
    { name: "Мадина", surname: "Султанова" },
    { name: "Талгат", surname: "Бекболатов" },
    { name: "Асель", surname: "Ахметова" },
  ];

  for (let i = 0; i < teacherNames.length; i++) {
    await prisma.teacher.create({
      data: {
        id: `teacher${i + 1}`,
        username: `teacher${i + 1}`,
        name: teacherNames[i].name,
        surname: teacherNames[i].surname,
        email: `${teacherNames[i].name.toLowerCase()}${i + 1}@school.kz`,
        subjects: { connect: [{ id: (i % 12) + 1 }] },
        classes: { connect: [{ id: (i % 17) + 1 }] },
      },
    });
  }

  // LESSON - Уроки в расписании
  const days = [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY];
  const lessonTimes = [
    { start: 8, end: 9 },   // 1 урок: 8:00-8:40
    { start: 9, end: 10 },  // 2 урок: 9:00-9:40
    { start: 10, end: 11 }, // 3 урок: 10:00-10:40
    { start: 11, end: 12 }, // 4 урок: 11:00-11:40
    { start: 13, end: 14 }, // 5 урок: 13:00-13:40
    { start: 14, end: 15 }, // 6 урок: 14:00-14:40
  ];

  let lessonId = 1;
  for (let classId = 1; classId <= 17; classId++) {
    for (const day of days) {
      for (let lessonNum = 0; lessonNum < 5; lessonNum++) {
        const subjectId = ((classId + lessonNum) % 12) + 1;
        const teacherId = ((classId + lessonNum) % 15) + 1;
        const time = lessonTimes[lessonNum];

        await prisma.lesson.create({
          data: {
            name: `Урок ${lessonId}`,
            day: day,
            startTime: new Date(new Date().setHours(time.start, 0, 0, 0)),
            endTime: new Date(new Date().setHours(time.end, 0, 0, 0)),
            subjectId: subjectId,
            classId: classId,
            teacherId: `teacher${teacherId}`,
          },
        });
        lessonId++;
      }
    }
  }

  // EVENT - События контроля уроков
  const controllerTypes = [
    ControllerType.DIRECTOR,
    ControllerType.DEPUTY,
    ControllerType.METHODIST,
    ControllerType.INSPECTOR,
    ControllerType.ADMIN,
  ];

  for (let i = 1; i <= 20; i++) {
    const randomLesson = Math.floor(Math.random() * 425) + 1;
    const lesson = await prisma.lesson.findUnique({
      where: { id: randomLesson },
    });

    if (lesson) {
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() + Math.floor(Math.random() * 30));

      await prisma.event.create({
        data: {
          title: `Контроль урока #${i}`,
          description: `Плановое посещение урока для контроля качества преподавания`,
          startTime: new Date(randomDate.setHours(lesson.startTime.getHours(), 0, 0, 0)),
          endTime: new Date(randomDate.setHours(lesson.endTime.getHours(), 0, 0, 0)),
          controllerType: controllerTypes[i % 5],
          controllerId: `admin${(i % 2) + 1}`,
          teacherId: lesson.teacherId,
          lessonId: lesson.id,
          classId: lesson.classId,
        },
      });
    }
  }

  // FEEDBACK - Обратная связь после контроля (для половины событий)
  const events = await prisma.event.findMany({
    take: 10,
  });

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    await prisma.feedback.create({
      data: {
        observerName: `Наблюдатель ${i + 1}`,
        observationDate: event.startTime,
        observationTime: `${event.startTime.getHours()}:00 - ${event.endTime.getHours()}:00`,
        subject: "Математика",
        grade: "9А",
        presentTeachersCount: Math.floor(Math.random() * 3) + 3,

        // Таблица 1: Вопросы для наблюдения
        hasTeamLeader: Math.random() > 0.3,
        hasAgenda: Math.random() > 0.2,
        isProcessDocumented: Math.random() > 0.4,
        teachersShowInterest: Math.random() > 0.2,
        teachersGiveSuggestions: Math.random() > 0.3,
        effectiveCollaboration: Math.random() > 0.3,
        analyzePreviousLessons: Math.random() > 0.4,

        // Таблица 2: Исходные данные
        useLessonReflection: Math.random() > 0.3,
        useStudentAchievements: Math.random() > 0.2,
        useExternalAssessment: Math.random() > 0.5,
        usePedagogicalDecisions: Math.random() > 0.4,
        useLessonVisitResults: Math.random() > 0.3,
        useStudentFeedback: Math.random() > 0.4,
        useOtherData: Math.random() > 0.7,
        otherDataDescription: Math.random() > 0.5 ? "Данные мониторинга успеваемости" : null,

        // Таблица 3: Процесс планирования
        discussGoalsAlignment: Math.random() > 0.2,
        adaptLearningGoals: Math.random() > 0.3,
        selectAppropriateResources: Math.random() > 0.2,
        selectDifferentiatedStrategies: Math.random() > 0.4,
        selectEngagingTasks: Math.random() > 0.3,
        discussDescriptors: Math.random() > 0.4,
        allocateTime: Math.random() > 0.2,
        selectFormativeAssessment: Math.random() > 0.3,
        planReflection: Math.random() > 0.4,
        useICTTools: Math.random() > 0.3,
        defineHomework: Math.random() > 0.2,
        considerSafety: Math.random() > 0.1,

        // Таблица 4: Комментарии
        comments: `Урок проведен на хорошем уровне. Учитель продемонстрировал профессиональные навыки.`,
        recommendations: `Рекомендуется больше использовать интерактивные методы обучения.`,

        eventId: event.id,
      },
    });
  }

  // ANNOUNCEMENT - Объявления
  const announcements = [
    {
      title: "Родительское собрание",
      description: "Приглашаем всех родителей на общешкольное собрание 25 декабря в 18:00",
      classId: null,
    },
    {
      title: "Контрольная работа по математике",
      description: "30 декабря состоится контрольная работа по математике за 1 полугодие",
      classId: 1,
    },
    {
      title: "Новогодний утренник",
      description: "28 декабря в актовом зале состоится новогодний утренник",
      classId: 2,
    },
    {
      title: "Каникулы",
      description: "Зимние каникулы с 1 по 10 января. Начало занятий 11 января.",
      classId: null,
    },
  ];

  for (const announcement of announcements) {
    await prisma.announcement.create({
      data: {
        title: announcement.title,
        description: announcement.description,
        date: new Date(),
        classId: announcement.classId,
      },
    });
  }

  console.log("✅ База данных успешно заполнена тестовыми данными!");
  console.log("📊 Создано:");
  console.log("   - Администраторов: 2");
  console.log("   - Параллелей: 11");
  console.log("   - Классов: 17");
  console.log("   - Предметов: 12");
  console.log("   - Учителей: 15");
  console.log("   - Уроков: ~425");
  console.log("   - События контроля: 20");
  console.log("   - Feedbacks: 10");
  console.log("   - Объявлений: 4");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Ошибка при заполнении базы данных:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
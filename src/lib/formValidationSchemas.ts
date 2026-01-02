import { Day } from "@prisma/client";
import { z } from "zod";
import { ControllerType } from "@prisma/client"; // ✅ Импортируем enum из Prisma


// // SUBJECT SCHEMA
export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string()
    .min(1, { message: "Subject name is required!" })
    .max(50, { message: "Subject name must be at most 50 characters!" }),
   teachers: z.array(z.string()), //teacher ids // Сделать optional если не обязательно
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

// CLASS SCHEMA
export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string()
    .min(1, { message: "Название класса обязательно!" })
    .max(10, { message: "Название класса должно быть не более 10 символов!" })
    .regex(/^\d{1,2}[А-Я]$/, { message: "Название должно быть в формате 9А, 10Б и т.д." }),
  capacity: z.coerce.number()
    .min(1, { message: "Вместимость класса обязательна!" })
    .max(20, { message: "Максимальная вместимость 20 учеников!" }),
  gradeLevel: z.coerce.number() // ✅ Исправлено с gradeId на gradeLevel
    .min(1, { message: "Номер параллели обязателен!" })
    .max(11, { message: "Максимальный класс - 11!" }),
  supervisorId: z.string().optional().or(z.literal("")),
});

export type ClassSchema = z.infer<typeof classSchema>;


// TEACHER SCHEMA
export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Логин должен содержать минимум 3 символа!" })
    .max(20, { message: "Логин должен содержать максимум 20 символов!" }),
  password: z
    .string()
    .min(8, { message: "Пароль должен содержать минимум 8 символов!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "Имя обязательно!" }),
  surname: z.string().min(1, { message: "Фамилия обязательна!" }),
  email: z
    .string()
    .email({ message: "Неверный формат email!" })
    .optional()
    .or(z.literal("")),

  subjects: z.array(z.string()).optional(), // subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;





// LESSON SCHEMA
export const lessonSchema = z
  .object({
    id: z.coerce.number().optional(),
    name: z.string().min(1, {
      message: "Название урока обязательно!",
    }),
    day: z.nativeEnum(Day, { // ✅ Используем Prisma enum вместо дублирования
      errorMap: () => ({ message: "День недели обязателен!" }),
    }),
    startTime: z.coerce.date({
      required_error: "Время начала обязательно!",
    }),
    endTime: z.coerce.date({
      required_error: "Время окончания обязательно!",
    }),
    subjectId: z.coerce.number({
      required_error: "Предмет обязателен!",
    }),
    classId: z.coerce.number({
      required_error: "Класс обязателен!",
    }),
    teacherId: z
      .string()
      .min(1, { message: "Учитель обязателен!" }),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "Время окончания должно быть позже времени начала!",
    path: ["endTime"],
  });

export type LessonSchema = z.infer<typeof lessonSchema>;





// EVENT SCHEMA  
export const eventSchema = z
  .object({
    id: z.coerce.number().optional(),
    title: z.string().min(1, {
      message: "Название события обязательно!",
    }),
    description: z.string().min(1, {
      message: "Описание события обязательно!",
    }),
    startTime: z.coerce.date({
      required_error: "Время начала обязательно!",
    }),
    endTime: z.coerce.date({
      required_error: "Время окончания обязательно!",
    }),
    controllerType: z.nativeEnum(ControllerType, {
      errorMap: () => ({ message: "Тип контролирующего обязателен!" }),
    }),
    // ❌ Убрали controllerId и classId
    teacherId: z
      .string()
      .min(1, { message: "Учитель обязателен!" }),
    lessonId: z.coerce.number().optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "Время окончания должно быть позже времени начала!",
    path: ["endTime"],
  });

export type EventSchema = z.infer<typeof eventSchema>;






// FEEDBACK SCHEMA
export const feedbackSchema = z.object({
  id: z.coerce.number().optional(),
  
  // Основная информация
  observerName: z.string().min(1, {
    message: "ФИО наблюдателя обязательно!",
  }),
  observationDate: z.coerce.date({
    required_error: "Дата наблюдения обязательна!",
  }),
  observationTime: z.string().min(1, {
    message: "Время наблюдения обязательно!",
  }),
  subject: z.string().min(1, {
    message: "Предмет обязателен!",
  }),
  grade: z.string().min(1, {
    message: "Параллель обязательна!",
  }),
  presentTeachersCount: z.coerce.number().min(1, {
    message: "Количество учителей должно быть больше 0!",
  }),

  // ТАБЛИЦА 1: Вопросы для наблюдения
  hasTeamLeader: z.boolean(),
  hasAgenda: z.boolean(),
  isProcessDocumented: z.boolean(),
  teachersShowInterest: z.boolean(),
  teachersGiveSuggestions: z.boolean(),
  effectiveCollaboration: z.boolean(),
  analyzePreviousLessons: z.boolean(),

  // ТАБЛИЦА 2: Исходные данные при планировании
  useLessonReflection: z.boolean(),
  useStudentAchievements: z.boolean(),
  useExternalAssessment: z.boolean(),
  usePedagogicalDecisions: z.boolean(),
  useLessonVisitResults: z.boolean(),
  useStudentFeedback: z.boolean(),
  useOtherData: z.boolean(),
  otherDataDescription: z.string().optional(),

  // ТАБЛИЦА 3: В процессе планирования
  discussGoalsAlignment: z.boolean(),
  adaptLearningGoals: z.boolean(),
  selectAppropriateResources: z.boolean(),
  selectDifferentiatedStrategies: z.boolean(),
  selectEngagingTasks: z.boolean(),
  discussDescriptors: z.boolean(),
  allocateTime: z.boolean(),
  selectFormativeAssessment: z.boolean(),
  planReflection: z.boolean(),
  useICTTools: z.boolean(),
  defineHomework: z.boolean(),
  considerSafety: z.boolean(),

  // ТАБЛИЦА 4: Текстовые поля
  comments: z.string().optional(),
  recommendations: z.string().optional(),

  // Связь с событием
  eventId: z.coerce.number({
    required_error: "Событие обязательно!",
  }),
});

export type FeedbackSchema = z.infer<typeof feedbackSchema>;
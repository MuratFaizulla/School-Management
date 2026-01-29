import { Day } from '@prisma/client';
"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  SubjectSchema,
  TeacherSchema,
  LessonSchema,
  EventSchema,
  FeedbackSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean };

// SUBJECT ACTIONS

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2002') {
      return { 
        success: false, 
        error: true, 
        message: "Предмет с таким названием уже существует!" 
      };
    }
    
    if (err.code === 'P2025') {
      return { 
        success: false, 
        error: true, 
        message: "Один из выбранных учителей не найден!" 
      };
    }
    
    return { 
      success: false, 
      error: true, 
      message: `Ошибка создания предмета: ${err.message}` 
    };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  if (!data.id) {
    return { success: false, error: true, message: "ID предмета не указан!" };
  }
  
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2025') {
      return { 
        success: false, 
        error: true, 
        message: "Предмет не найден!" 
      };
    }
    
    if (err.code === 'P2002') {
      return { 
        success: false, 
        error: true, 
        message: "Предмет с таким названием уже существует!" 
      };
    }
    
    return { 
      success: false, 
      error: true, 
      message: `Ошибка обновления предмета: ${err.message}` 
    };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2025') {
      return { 
        success: false, 
        error: true, 
        message: "Предмет не найден!" 
      };
    }
    
    if (err.code === 'P2003') {
      return { 
        success: false, 
        error: true, 
        message: "Нельзя удалить предмет, который используется в уроках!" 
      };
    }
    
    return { 
      success: false, 
      error: true, 
      message: `Ошибка удаления предмета: ${err.message}` 
    };
  }
};

// CLASS ACTIONS
export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data: {
        name: data.name,
        gradeLevel: data.gradeLevel,
        capacity: data.capacity,
        supervisorId: data.supervisorId || null,
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2002') {
      return { 
        success: false, 
        error: true, 
        message: "Класс с таким названием уже существует!" 
      };
    }
    
    if (err.code === 'P2003') {
      return { 
        success: false, 
        error: true, 
        message: "Выбранный классный руководитель не найден!" 
      };
    }
    
    return { 
      success: false, 
      error: true, 
      message: `Ошибка создания класса: ${err.message}` 
    };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  if (!data.id) {
    return { success: false, error: true, message: "ID класса не указан!" };
  }
  
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        gradeLevel: data.gradeLevel,
        capacity: data.capacity,
        supervisorId: data.supervisorId || null,
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2025') {
      return { 
        success: false, 
        error: true, 
        message: "Класс не найден!" 
      };
    }
    
    if (err.code === 'P2002') {
      return { 
        success: false, 
        error: true, 
        message: "Класс с таким названием уже существует!" 
      };
    }
    
    if (err.code === 'P2003') {
      return { 
        success: false, 
        error: true, 
        message: "Выбранный классный руководитель не найден!" 
      };
    }
    
    return { 
      success: false, 
      error: true, 
      message: `Ошибка обновления класса: ${err.message}` 
    };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2025') {
      return { 
        success: false, 
        error: true, 
        message: "Класс не найден!" 
      };
    }
    
    if (err.code === 'P2003') {
      return { 
        success: false, 
        error: true, 
        message: "Нельзя удалить класс, у которого есть уроки или события!" 
      };
    }
    
    return { 
      success: false, 
      error: true, 
      message: `Ошибка удаления класса: ${err.message}` 
    };
  }
};


// TEACHER ACTIONS

// export const createTeacher = async (
//   currentState: CurrentState,
//   data: TeacherSchema
// ) => {
//   try {
//     const user = await clerkClient.users.createUser({
//       username: data.username,
//       password: data.password,
//       firstName: data.name,
//       lastName: data.surname,
//       publicMetadata: { role: "teacher" }
//     });

//     await prisma.teacher.create({
//       data: {
//         id: user.id,
//         username: data.username,
//         name: data.name,
//         surname: data.surname,
//         email: data.email || null,
//         // ❌ Убрали: phone, address, img, bloodType, sex, birthday
//         subjects: {
//           connect: data.subjects?.map((subjectId: string) => ({
//             id: parseInt(subjectId),
//           })),
//         },
//       },
//     });

//     return { success: true, error: false };
//   } catch (err: any) {
//     console.log(err);
    
//     if (err.message?.includes('username')) {
//       return { 
//         success: false, 
//         error: true, 
//         message: "Пользователь с таким логином уже существует!" 
//       };
//     }
    
//     if (err.message?.includes('email')) {
//       return { 
//         success: false, 
//         error: true, 
//         message: "Пользователь с таким email уже существует!" 
//       };
//     }
    
//     if (err.code === 'P2002') {
//       return { 
//         success: false, 
//         error: true, 
//         message: "Учитель с такими данными уже существует!" 
//       };
//     }
    
//     return { 
//       success: false, 
//       error: true, 
//       message: `Ошибка создания учителя: ${err.message}` 
//     };
//   }
// };

// export const updateTeacher = async (
//   currentState: CurrentState,
//   data: TeacherSchema
// ) => {
//   if (!data.id) {
//     return { success: false, error: true, message: "ID учителя не указан!" };
//   }
  
//   try {
//     const user = await clerkClient.users.updateUser(data.id, {
//       username: data.username,
//       ...(data.password !== "" && { password: data.password }),
//       firstName: data.name,
//       lastName: data.surname,
//     });

//     await prisma.teacher.update({
//       where: {
//         id: data.id,
//       },
//       data: {
//         username: data.username,
//         name: data.name,
//         surname: data.surname,
//         email: data.email || null,
//         // ❌ Убрали: password, phone, address, img, bloodType, sex, birthday
//         subjects: {
//           set: data.subjects?.map((subjectId: string) => ({
//             id: parseInt(subjectId),
//           })),
//         },
//       },
//     });
    
//     return { success: true, error: false };
//   } catch (err: any) {
//     console.log(err);
    
//     if (err.code === 'P2025') {
//       return { 
//         success: false, 
//         error: true, 
//         message: "Учитель не найден!" 
//       };
//     }
    
//     if (err.code === 'P2002') {
//       return { 
//         success: false, 
//         error: true, 
//         message: "Такой логин или email уже существует!" 
//       };
//     }
    
//     return { 
//       success: false, 
//       error: true, 
//       message: `Ошибка обновления: ${err.message}` 
//     };
//   }
// };

// export const deleteTeacher = async (
//   currentState: CurrentState,
//   data: FormData
// ) => {
//   const id = data.get("id") as string;
//   try {
//     await clerkClient.users.deleteUser(id);

//     await prisma.teacher.delete({
//       where: {
//         id: id,
//       },
//     });

//     return { success: true, error: false };
//   } catch (err: any) {
//     console.log(err);
    
//     if (err.code === 'P2025') {
//       return { 
//         success: false, 
//         error: true, 
//         message: "Учитель не найден!" 
//       };
//     }
    
//     if (err.code === 'P2003') {
//       return { 
//         success: false, 
//         error: true, 
//         message: "Нельзя удалить учителя, у которого есть уроки или классы!" 
//       };
//     }
    
//     return { 
//       success: false, 
//       error: true, 
//       message: `Ошибка удаления: ${err.message}` 
//     };
//   }
// };




// LESSON ACTIONS

export const createLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  try {
    await prisma.lesson.create({
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,   // ✅ Упрощено - прямое указание ID
        classId: data.classId,       // ✅ Упрощено
        teacherId: data.teacherId,   // ✅ Упрощено
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2003') {
      if (err.meta?.field_name?.includes('subjectId')) {
        return {
          success: false,
          error: true,
          message: "Выбранный предмет не найден!"
        };
      }
      if (err.meta?.field_name?.includes('classId')) {
        return {
          success: false,
          error: true,
          message: "Выбранный класс не найден!"
        };
      }
      if (err.meta?.field_name?.includes('teacherId')) {
        return {
          success: false,
          error: true,
          message: "Выбранный учитель не найден!"
        };
      }
    }
    
    if (err.code === 'P2002') {
      return {
        success: false,
        error: true,
        message: "Урок с такими параметрами уже существует!"
      };
    }
    
    return {
      success: false,
      error: true,
      message: `Ошибка создания урока: ${err.message}`
    };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  if (!data.id) {
    return { success: false, error: true, message: "ID урока не указан!" };
  }
  
  try {
    await prisma.lesson.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2025') {
      return {
        success: false,
        error: true,
        message: "Урок не найден!"
      };
    }
    
    if (err.code === 'P2003') {
      return {
        success: false,
        error: true,
        message: "Ошибка связи: проверьте выбранный предмет, класс или учителя!"
      };
    }
    
    return {
      success: false,
      error: true,
      message: `Ошибка обновления урока: ${err.message}`
    };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.lesson.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2025') {
      return {
        success: false,
        error: true,
        message: "Урок не найден!"
      };
    }
    
    if (err.code === 'P2003') {
      return {
        success: false,
        error: true,
        message: "Нельзя удалить урок, для которого есть события контроля!"
      };
    }
    
    return {
      success: false,
      error: true,
      message: `Ошибка удаления урока: ${err.message}`
    };
  }
};



// EVENT ACTIONS
// export const createEvent = async (
//   currentState: CurrentState,
//   data: EventSchema
// ) => {
//   try {
//     await prisma.event.create({
//       data: {
//         title: data.title,
//         description: data.description,
//         startTime: data.startTime,
//         endTime: data.endTime,
//         controllerType: data.controllerType,
//         teacherId: data.teacherId,
//         lessonId: data.lessonId || null,
//         // ❌ Убрали controllerId и classId
//       },
//     });

//     return { success: true, error: false };
//   } catch (err: any) {
//     console.log(err);
    
//     if (err.code === 'P2003') {
//       if (err.meta?.field_name?.includes('teacherId')) {
//         return {
//           success: false,
//           error: true,
//           message: "Выбранный учитель не найден!"
//         };
//       }
//       if (err.meta?.field_name?.includes('lessonId')) {
//         return {
//           success: false,
//           error: true,
//           message: "Выбранный урок не найден!"
//         };
//       }
//       // ❌ Убрали обработку controllerId и classId
//     }
    
//     return {
//       success: false,
//       error: true,
//       message: `Ошибка создания события: ${err.message}`
//     };
//   }
// };

// export const updateEvent = async (
//   currentState: CurrentState,
//   data: EventSchema
// ) => {
//   if (!data.id) {
//     return { success: false, error: true, message: "ID события не указан!" };
//   }
  
//   try {
//     await prisma.event.update({
//       where: {
//         id: data.id,
//       },
//       data: {
//         title: data.title,
//         description: data.description,
//         startTime: data.startTime,
//         endTime: data.endTime,
//         controllerType: data.controllerType,
//         teacherId: data.teacherId,
//         lessonId: data.lessonId || null,
//         // ❌ Убрали controllerId и classId
//       },
//     });

//     return { success: true, error: false };
//   } catch (err: any) {
//     console.log(err);
    
//     if (err.code === 'P2025') {
//       return {
//         success: false,
//         error: true,
//         message: "Событие не найдено!"
//       };
//     }
    
//     if (err.code === 'P2003') {
//       return {
//         success: false,
//         error: true,
//         message: "Ошибка связи: проверьте выбранного учителя или урок!"
//       };
//     }
    
//     return {
//       success: false,
//       error: true,
//       message: `Ошибка обновления события: ${err.message}`
//     };
//   }
// };

// export const deleteEvent = async (
//   currentState: CurrentState,
//   data: FormData
// ) => {
//   const id = data.get("id") as string;

//   try {
//     await prisma.event.delete({
//       where: {
//         id: parseInt(id),
//       },
//     });

//     return { success: true, error: false };
//   } catch (err: any) {
//     console.log(err);
    
//     if (err.code === 'P2025') {
//       return {
//         success: false,
//         error: true,
//         message: "Событие не найдено!"
//       };
//     }
    
//     if (err.code === 'P2003') {
//       return {
//         success: false,
//         error: true,
//         message: "Нельзя удалить событие, для которого есть обратная связь!"
//       };
//     }
    
//     return {
//       success: false,
//       error: true,
//       message: `Ошибка удаления события: ${err.message}`
//     };
//   }
// };








// FEEDBACK ACTIONS

// export const createFeedback = async (
//   currentState: CurrentState,
//   data: FeedbackSchema
// ) => {
//   try {
//     await prisma.feedback.create({
//       data: {
//         observerName: data.observerName,
//         observationDate: data.observationDate,
//         observationTime: data.observationTime,
//         subject: data.subject,
//         grade: data.grade,
//         presentTeachersCount: data.presentTeachersCount,
        
//         // Таблица 1
//         hasTeamLeader: data.hasTeamLeader,
//         hasAgenda: data.hasAgenda,
//         isProcessDocumented: data.isProcessDocumented,
//         teachersShowInterest: data.teachersShowInterest,
//         teachersGiveSuggestions: data.teachersGiveSuggestions,
//         effectiveCollaboration: data.effectiveCollaboration,
//         analyzePreviousLessons: data.analyzePreviousLessons,
        
//         // Таблица 2
//         useLessonReflection: data.useLessonReflection,
//         useStudentAchievements: data.useStudentAchievements,
//         useExternalAssessment: data.useExternalAssessment,
//         usePedagogicalDecisions: data.usePedagogicalDecisions,
//         useLessonVisitResults: data.useLessonVisitResults,
//         useStudentFeedback: data.useStudentFeedback,
//         useOtherData: data.useOtherData,
//         otherDataDescription: data.otherDataDescription || null,
        
//         // Таблица 3
//         discussGoalsAlignment: data.discussGoalsAlignment,
//         adaptLearningGoals: data.adaptLearningGoals,
//         selectAppropriateResources: data.selectAppropriateResources,
//         selectDifferentiatedStrategies: data.selectDifferentiatedStrategies,
//         selectEngagingTasks: data.selectEngagingTasks,
//         discussDescriptors: data.discussDescriptors,
//         allocateTime: data.allocateTime,
//         selectFormativeAssessment: data.selectFormativeAssessment,
//         planReflection: data.planReflection,
//         useICTTools: data.useICTTools,
//         defineHomework: data.defineHomework,
//         considerSafety: data.considerSafety,
        
//         // Текстовые поля
//         comments: data.comments || null,
//         recommendations: data.recommendations || null,
        
//         // Связь с событием
//         eventId: data.eventId,
//       },
//     });

//     return { success: true, error: false };
//   } catch (err: any) {
//     console.log(err);
    
//     if (err.code === 'P2003') {
//       return {
//         success: false,
//         error: true,
//         message: "Выбранное событие не найдено!"
//       };
//     }
    
//     if (err.code === 'P2002') {
//       return {
//         success: false,
//         error: true,
//         message: "Обратная связь для этого события уже существует!"
//       };
//     }
    
//     return {
//       success: false,
//       error: true,
//       message: `Ошибка создания обратной связи: ${err.message}`
//     };
//   }
// };

// export const updateFeedback = async (
//   currentState: CurrentState,
//   data: FeedbackSchema
// ) => {
//   if (!data.id) {
//     return { success: false, error: true, message: "ID обратной связи не указан!" };
//   }
  
//   try {
//     await prisma.feedback.update({
//       where: { id: data.id },
//       data: {
//         observerName: data.observerName,
//         observationDate: data.observationDate,
//         observationTime: data.observationTime,
//         subject: data.subject,
//         grade: data.grade,
//         presentTeachersCount: data.presentTeachersCount,
        
//         // ТАБЛИЦА 1
//         hasTeamLeader: data.hasTeamLeader,
//         hasAgenda: data.hasAgenda,
//         isProcessDocumented: data.isProcessDocumented,
//         teachersShowInterest: data.teachersShowInterest,
//         teachersGiveSuggestions: data.teachersGiveSuggestions,
//         effectiveCollaboration: data.effectiveCollaboration,
//         analyzePreviousLessons: data.analyzePreviousLessons,
        
//         // ТАБЛИЦА 2
//         useLessonReflection: data.useLessonReflection,
//         useStudentAchievements: data.useStudentAchievements,
//         useExternalAssessment: data.useExternalAssessment,
//         usePedagogicalDecisions: data.usePedagogicalDecisions,
//         useLessonVisitResults: data.useLessonVisitResults,
//         useStudentFeedback: data.useStudentFeedback,
//         useOtherData: data.useOtherData,
//         otherDataDescription: data.otherDataDescription || null,
        
//         // ТАБЛИЦА 3
//         discussGoalsAlignment: data.discussGoalsAlignment,
//         adaptLearningGoals: data.adaptLearningGoals,
//         selectAppropriateResources: data.selectAppropriateResources,
//         selectDifferentiatedStrategies: data.selectDifferentiatedStrategies,
//         selectEngagingTasks: data.selectEngagingTasks,
//         discussDescriptors: data.discussDescriptors,
//         allocateTime: data.allocateTime,
//         selectFormativeAssessment: data.selectFormativeAssessment,
//         planReflection: data.planReflection,
//         useICTTools: data.useICTTools,
//         defineHomework: data.defineHomework,
//         considerSafety: data.considerSafety,
        
//         // ТАБЛИЦА 4
//         comments: data.comments || null,
//         recommendations: data.recommendations || null,
        
//         // ❌ УБРАЛИ eventId - он не должен обновляться!
//         // eventId: data.eventId, // <-- ЭТА СТРОКА ВЫЗЫВАЛА ОШИБКУ
//       },
//     });

//     return { success: true, error: false };
//   } catch (err: any) {
//     console.log(err);
    
//     if (err.code === 'P2025') {
//       return {
//         success: false,
//         error: true,
//         message: "Обратная связь не найдена!"
//       };
//     }
    
//     if (err.code === 'P2003') {
//       return {
//         success: false,
//         error: true,
//         message: "Ошибка связи с событием!"
//       };
//     }
    
//     return {
//       success: false,
//       error: true,
//       message: `Ошибка обновления обратной связи: ${err.message}`
//     };
//   }
// };
// export const deleteFeedback = async (
//   currentState: CurrentState,
//   data: FormData
// ) => {
//   const id = data.get("id") as string;

//   try {
//     await prisma.feedback.delete({
//       where: { id: parseInt(id) },
//     });

//     return { success: true, error: false };
//   } catch (err: any) {
//     console.log(err);
    
//     if (err.code === 'P2025') {
//       return {
//         success: false,
//         error: true,
//         message: "Обратная связь не найдена!"
//       };
//     }
    
//     return {
//       success: false,
//       error: true,
//       message: `Ошибка удаления обратной связи: ${err.message}`
//     };
//   }
// };





// ==============================================
// EVENT ACTIONS
// ==============================================

export const createEvent = async (
  currentState: CurrentState,
  data: EventSchema
) => {
  try {
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        controllerType: data.controllerType,
        // Тим-лидер
        teamLeaderId: data.teamLeaderId,
        // Класс
        classId: data.classId,
        // Участники (создаем связи через промежуточную таблицу)
        participants: {
          create: data.participants.map((teacherId) => ({
            teacherId: teacherId,
          })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2003') {
      if (err.meta?.field_name?.includes('teamLeaderId')) {
        return {
          success: false,
          error: true,
          message: "Выбранный тим-лидер не найден!"
        };
      }
      if (err.meta?.field_name?.includes('classId')) {
        return {
          success: false,
          error: true,
          message: "Выбранный класс не найден!"
        };
      }
      if (err.meta?.field_name?.includes('teacherId')) {
        return {
          success: false,
          error: true,
          message: "Один из выбранных участников не найден!"
        };
      }
    }
    
    return {
      success: false,
      error: true,
      message: `Ошибка создания события: ${err.message}`
    };
  }
};

export const updateEvent = async (
  currentState: CurrentState,
  data: EventSchema
) => {
  if (!data.id) {
    return { success: false, error: true, message: "ID события не указан!" };
  }
  
  try {
    await prisma.event.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        controllerType: data.controllerType,
        teamLeaderId: data.teamLeaderId,
        classId: data.classId,
        // Обновляем участников: удаляем старые и создаем новые
        participants: {
          deleteMany: {}, // Удаляем все старые связи
          create: data.participants.map((teacherId) => ({
            teacherId: teacherId,
          })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2025') {
      return {
        success: false,
        error: true,
        message: "Событие не найдено!"
      };
    }
    
    if (err.code === 'P2003') {
      return {
        success: false,
        error: true,
        message: "Ошибка связи: проверьте выбранного тим-лидера, участников или класс!"
      };
    }
    
    return {
      success: false,
      error: true,
      message: `Ошибка обновления события: ${err.message}`
    };
  }
};

export const deleteEvent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.event.delete({
      where: {
        id: parseInt(id),
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2025') {
      return {
        success: false,
        error: true,
        message: "Событие не найдено!"
      };
    }
    
    if (err.code === 'P2003') {
      return {
        success: false,
        error: true,
        message: "Нельзя удалить событие, для которого есть обратная связь!"
      };
    }
    
    return {
      success: false,
      error: true,
      message: `Ошибка удаления события: ${err.message}`
    };
  }
};

// ==============================================
// FEEDBACK ACTIONS
// ==============================================

export const createFeedback = async (
  currentState: CurrentState,
  data: FeedbackSchema
) => {
  try {
    await prisma.feedback.create({
      data: {
        observerName: data.observerName,
        observationDate: data.observationDate,
        observationTime: data.observationTime,
        subject: data.subject,
        grade: data.grade,
        
        // Таблица 1
        hasTeamLeader: data.hasTeamLeader,
        hasAgenda: data.hasAgenda,
        isProcessDocumented: data.isProcessDocumented,
        teachersShowInterest: data.teachersShowInterest,
        teachersGiveSuggestions: data.teachersGiveSuggestions,
        effectiveCollaboration: data.effectiveCollaboration,
        analyzePreviousLessons: data.analyzePreviousLessons,
        commentsTable1: data.commentsTable1 || null,
        recommendationsTable1: data.recommendationsTable1 || null,
        
        // Таблица 2
        useLessonReflection: data.useLessonReflection,
        useStudentAchievements: data.useStudentAchievements,
        useExternalAssessment: data.useExternalAssessment,
        usePedagogicalDecisions: data.usePedagogicalDecisions,
        useLessonVisitResults: data.useLessonVisitResults,
        useStudentFeedback: data.useStudentFeedback,
        useOtherData: data.useOtherData,
        otherDataDescription: data.otherDataDescription || null,
        commentsTable2: data.commentsTable2 || null,
        recommendationsTable2: data.recommendationsTable2 || null,
        
        // Таблица 3
        discussGoalsAlignment: data.discussGoalsAlignment,
        adaptLearningGoals: data.adaptLearningGoals,
        selectAppropriateResources: data.selectAppropriateResources,
        selectDifferentiatedStrategies: data.selectDifferentiatedStrategies,
        selectEngagingTasks: data.selectEngagingTasks,
        discussDescriptors: data.discussDescriptors,
        allocateTime: data.allocateTime,
        selectFormativeAssessment: data.selectFormativeAssessment,
        planReflection: data.planReflection,
        useICTTools: data.useICTTools,
        defineHomework: data.defineHomework,
        considerSafety: data.considerSafety,
        commentsTable3: data.commentsTable3 || null,
        recommendationsTable3: data.recommendationsTable3 || null,
        
        // Связь с событием
        eventId: data.eventId,
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2003') {
      return {
        success: false,
        error: true,
        message: "Выбранное событие не найдено!"
      };
    }
    
    if (err.code === 'P2002') {
      return {
        success: false,
        error: true,
        message: "Обратная связь для этого события уже существует!"
      };
    }
    
    return {
      success: false,
      error: true,
      message: `Ошибка создания обратной связи: ${err.message}`
    };
  }
};

export const updateFeedback = async (
  currentState: CurrentState,
  data: FeedbackSchema
) => {
  if (!data.id) {
    return { success: false, error: true, message: "ID обратной связи не указан!" };
  }
  
  try {
    await prisma.feedback.update({
      where: { id: data.id },
      data: {
        observerName: data.observerName,
        observationDate: data.observationDate,
        observationTime: data.observationTime,
        subject: data.subject,
        grade: data.grade,
        
        // ТАБЛИЦА 1
        hasTeamLeader: data.hasTeamLeader,
        hasAgenda: data.hasAgenda,
        isProcessDocumented: data.isProcessDocumented,
        teachersShowInterest: data.teachersShowInterest,
        teachersGiveSuggestions: data.teachersGiveSuggestions,
        effectiveCollaboration: data.effectiveCollaboration,
        analyzePreviousLessons: data.analyzePreviousLessons,
        commentsTable1: data.commentsTable1 || null,
        recommendationsTable1: data.recommendationsTable1 || null,
        
        // ТАБЛИЦА 2
        useLessonReflection: data.useLessonReflection,
        useStudentAchievements: data.useStudentAchievements,
        useExternalAssessment: data.useExternalAssessment,
        usePedagogicalDecisions: data.usePedagogicalDecisions,
        useLessonVisitResults: data.useLessonVisitResults,
        useStudentFeedback: data.useStudentFeedback,
        useOtherData: data.useOtherData,
        otherDataDescription: data.otherDataDescription || null,
        commentsTable2: data.commentsTable2 || null,
        recommendationsTable2: data.recommendationsTable2 || null,
        
        // ТАБЛИЦА 3
        discussGoalsAlignment: data.discussGoalsAlignment,
        adaptLearningGoals: data.adaptLearningGoals,
        selectAppropriateResources: data.selectAppropriateResources,
        selectDifferentiatedStrategies: data.selectDifferentiatedStrategies,
        selectEngagingTasks: data.selectEngagingTasks,
        discussDescriptors: data.discussDescriptors,
        allocateTime: data.allocateTime,
        selectFormativeAssessment: data.selectFormativeAssessment,
        planReflection: data.planReflection,
        useICTTools: data.useICTTools,
        defineHomework: data.defineHomework,
        considerSafety: data.considerSafety,
        commentsTable3: data.commentsTable3 || null,
        recommendationsTable3: data.recommendationsTable3 || null,
        
        // ❌ eventId НЕ обновляется!
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2025') {
      return {
        success: false,
        error: true,
        message: "Обратная связь не найдена!"
      };
    }
    
    return {
      success: false,
      error: true,
      message: `Ошибка обновления обратной связи: ${err.message}`
    };
  }
};

export const deleteFeedback = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  try {
    await prisma.feedback.delete({
      where: { id: parseInt(id) },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2025') {
      return {
        success: false,
        error: true,
        message: "Обратная связь не найдена!"
      };
    }
    
    return {
      success: false,
      error: true,
      message: `Ошибка удаления обратной связи: ${err.message}`
    };
  }
};

// ==============================================
// TEACHER ACTIONS
// ==============================================

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "teacher" }
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.message?.includes('username')) {
      return { 
        success: false, 
        error: true, 
        message: "Пользователь с таким логином уже существует!" 
      };
    }
    
    if (err.message?.includes('email')) {
      return { 
        success: false, 
        error: true, 
        message: "Пользователь с таким email уже существует!" 
      };
    }
    
    if (err.code === 'P2002') {
      return { 
        success: false, 
        error: true, 
        message: "Учитель с такими данными уже существует!" 
      };
    }
    
    return { 
      success: false, 
      error: true, 
      message: `Ошибка создания учителя: ${err.message}` 
    };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true, message: "ID учителя не указан!" };
  }
  
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2025') {
      return { 
        success: false, 
        error: true, 
        message: "Учитель не найден!" 
      };
    }
    
    if (err.code === 'P2002') {
      return { 
        success: false, 
        error: true, 
        message: "Такой логин или email уже существует!" 
      };
    }
    
    return { 
      success: false, 
      error: true, 
      message: `Ошибка обновления: ${err.message}` 
    };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await clerkClient.users.deleteUser(id);

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    
    if (err.code === 'P2025') {
      return { 
        success: false, 
        error: true, 
        message: "Учитель не найден!" 
      };
    }
    
    if (err.code === 'P2003') {
      return { 
        success: false, 
        error: true, 
        message: "Нельзя удалить учителя, у которого есть уроки или классы!" 
      };
    }
    
    return { 
      success: false, 
      error: true, 
      message: `Ошибка удаления: ${err.message}` 
    };
  }
};
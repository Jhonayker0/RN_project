import { useCallback, useEffect, useMemo, useState } from "react";
import { Course, CourseRepository, robleCourseRepository } from "../../index";
import {
  robleActivityService,
  ActivityRecord,
} from "../../../core/services/robleActivityService";
import {
  robleCategoryService,
  CategoryRecord,
} from "../../../core/services/robleCategoryService";
import type { UserRecord } from "../../../core/services/robleUserService";

export type CourseDetailTab = "activities" | "students" | "categories" | "info";

export interface UseCourseDetailControllerOptions {
  repository?: CourseRepository;
  currentUserId?: string | null;
}

interface ActivityStats {
  total: number;
  pending: number;
  overdue: number;
}

export function useCourseDetailController(
  courseId: string,
  options: UseCourseDetailControllerOptions = {}
) {
  const { repository = robleCourseRepository, currentUserId = null } = options;

  const [course, setCourse] = useState<Course | null>(null);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [students, setStudents] = useState<UserRecord[]>([]);

  const [activeTab, setActiveTab] = useState<CourseDetailTab>("activities");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourse = useCallback(async () => {
    const result = await repository.getById(courseId, {
      currentUserId,
    });
    setCourse(result);
    if (!result) {
      throw new Error("Curso no encontrado");
    }
    return result;
  }, [courseId, currentUserId, repository]);

  const loadActivities = useCallback(async () => {
    if (!courseId) return [] as ActivityRecord[];
    const data = await robleActivityService.getActivitiesByCourse(courseId);
    setActivities(data);
    return data;
  }, [courseId]);

  const loadCategories = useCallback(async () => {
    if (!courseId) return [] as CategoryRecord[];
    const data = await robleCategoryService.getCategoriesByCourse(courseId);
    setCategories(data);
    return data;
  }, [courseId]);

  const loadStudents = useCallback(async () => {
    if (!courseId) return [] as UserRecord[];
    const data = await repository.getUsersByCourse(courseId);
    setStudents(data);
    return data;
  }, [courseId, repository]);

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loadCourse();
      await Promise.all([loadActivities(), loadCategories(), loadStudents()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [loadActivities, loadCategories, loadCourse, loadStudents]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await loadCourse();
      await Promise.all([loadActivities(), loadCategories(), loadStudents()]);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return null;
    } finally {
      setRefreshing(false);
    }
  }, [loadActivities, loadCategories, loadCourse, loadStudents]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const changeTab = useCallback((tab: CourseDetailTab) => {
    setActiveTab(tab);
  }, []);

  const activityStats = useMemo<ActivityStats>(() => {
    if (!activities.length) {
      return { total: 0, pending: 0, overdue: 0 };
    }

    let pending = 0;
    let overdue = 0;
    const now = Date.now();

    activities.forEach((activity) => {
      const dueRaw = activity["due_date"] ?? activity["dueDate"];
      if (!dueRaw) {
        pending += 1;
        return;
      }
      const dueDate = new Date(dueRaw).getTime();
      if (Number.isNaN(dueDate)) {
        pending += 1;
      } else if (dueDate < now) {
        overdue += 1;
      } else {
        pending += 1;
      }
    });

    return {
      total: activities.length,
      pending,
      overdue,
    };
  }, [activities]);

  const isProfessor = useMemo(() => course?.role === "Profesor", [course]);

  const courseCode = useMemo(() => course?.id ?? courseId, [course, courseId]);

  const deleteCourse = useCallback(async () => {
    const identifier = course?.id ?? courseId;
    if (!identifier) {
      throw new Error("No se pudo determinar el curso a eliminar.");
    }

    console.log('[useCourseDetailController] Eliminando curso:', identifier);
    
    setDeleting(true);
    try {
      await repository.delete(identifier);
      console.log('[useCourseDetailController] Curso eliminado, limpiando estado...');
      setCourse(null);
      setActivities([]);
      setCategories([]);
      setStudents([]);
    } catch (error) {
      console.error('[useCourseDetailController] Error eliminando curso:', error);
      throw error;
    } finally {
      setDeleting(false);
    }
  }, [course?.id, courseId, repository]);

  return {
    course,
    activities,
    categories,
    students,
    activityStats,
    activeTab,
    changeTab,
    isProfessor,
    isLoading,
    isRefreshing,
    refresh,
    error,
    courseCode,
    deleteCourse,
    isDeleting,
  };
}

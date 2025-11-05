import { useState, useCallback, useEffect } from "react";
import { robleActivityService } from "../../../core/services/robleActivityService";
import { robleCategoryService } from "../../../core/services/robleCategoryService";

// Hook para manejar actividades y categorías de un curso
export interface ActivityData {
  title: string;
  description?: string;
  due_date?: Date;
  course_id: string;
  category_id?: string;
}

export function useActivitiesController(courseId: string) {
  const [activities, setActivities] = useState<Record<string, any>[]>([]);
  const [categories, setCategories] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    if (!courseId) return;

    try {
      const data = await robleActivityService.getActivitiesByCourse(courseId);
      setActivities(data);
    } catch (err) {
      console.warn("Error cargando actividades:", err);
    }
  }, [courseId]);

  const loadCategories = useCallback(async () => {
    if (!courseId) return;

    try {
      const data = await robleCategoryService.getCategoriesByCourse(courseId);
      setCategories(data);
    } catch (err) {
      console.warn("Error cargando categorías:", err);
    }
  }, [courseId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([loadActivities(), loadCategories()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [loadActivities, loadCategories]);

  const createActivity = useCallback(
    async (data: ActivityData) => {
      setIsCreating(true);
      try {
        await robleActivityService.createActivity(data);
        await loadActivities();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(message);
      } finally {
        setIsCreating(false);
      }
    },
    [loadActivities]
  );

  const updateActivity = useCallback(
    async (
      activityId: string,
      data: {
        title?: string;
        description?: string;
        due_date?: Date;
        category_id?: string;
      }
    ) => {
      try {
        await robleActivityService.updateActivity(activityId, data);
        await loadActivities();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(message);
      }
    },
    [loadActivities]
  );

  const deleteActivity = useCallback(
    async (activityId: string) => {
      try {
        await robleActivityService.deleteActivity(activityId);
        await loadActivities();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(message);
      }
    },
    [loadActivities]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    activities,
    categories,
    isLoading,
    isCreating,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    refresh: loadData,
  };
}

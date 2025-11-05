import { useState, useCallback, useEffect } from "react";
import { robleCategoryService } from "../../../core/services/robleCategoryService";

// Hook para manejar el detalle de una categoría
export interface CategoryDetail {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  capacity?: number;
  course_id: string;
  group_count?: number;
  activity_count?: number;
}

export function useCategoryDetailController(categoryId: string) {
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategory = useCallback(async () => {
    if (!categoryId) {
      setError("ID de categoría inválido");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await robleCategoryService.getCategoryById(categoryId);
      
      if (!data) {
        setError("Categoría no encontrada");
        setCategory(null);
      } else {
        setCategory(data as CategoryDetail);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setCategory(null);
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]);

  const deleteCategory = useCallback(async () => {
    if (!categoryId) {
      throw new Error("ID de categoría inválido");
    }

    setIsDeleting(true);
    try {
      await robleCategoryService.deleteCategory(categoryId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(message);
    } finally {
      setIsDeleting(false);
    }
  }, [categoryId]);

  useEffect(() => {
    void loadCategory();
  }, [loadCategory]);

  return {
    category,
    isLoading,
    isDeleting,
    error,
    deleteCategory,
    refresh: loadCategory,
  };
}

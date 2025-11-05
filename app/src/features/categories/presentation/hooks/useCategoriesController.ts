import { useCallback, useEffect, useState } from 'react';
import { robleCategoryService, CategoryRecord } from '../../../core/services/robleCategoryService';

export function useCategoriesController(courseId?: string) {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!courseId) {
      setCategories([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await robleCategoryService.getCategoriesByCourse(courseId);
      setCategories(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const createCategory = useCallback(async (payload: { name: string; type?: string; capacity?: number; description?: string; courseId: string }) => {
    try {
      console.log('[useCategoriesController] Creando categoría con payload:', payload);
      const created = await robleCategoryService.createCategory({
        courseId: payload.courseId,
        name: payload.name,
        type: payload.type,
        capacity: payload.capacity,
        description: payload.description,
      });
      console.log('[useCategoriesController] Categoría creada, recargando lista...');
      await load();
      return created;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('[useCategoriesController] Error creando categoría:', message);
      setError(message);
      return null;
    }
  }, [load]);

  const getById = useCallback(async (id: string) => {
    try {
      return await robleCategoryService.getCategoryById(id);
    } catch {
      return null;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, updates: Record<string, any>) => {
    try {
      console.log('[useCategoriesController] Actualizando categoría:', { id, updates });
      const success = await robleCategoryService.updateCategory({
        categoryId: id,
        name: updates.name,
        type: updates.type,
        capacity: updates.capacity,
        description: updates.description,
      });
      console.log('[useCategoriesController] Categoría actualizada, recargando lista...');
      await load();
      return success;
    } catch (e) {
      console.error('[useCategoriesController] Error actualizando categoría:', e);
      return false;
    }
  }, [load]);

  const removeCategory = useCallback(async (id: string) => {
    console.log('[useCategoriesController] Eliminando categoría:', id);
    try {
      const success = await robleCategoryService.deleteCategory(id);
      console.log('[useCategoriesController] Resultado deleteCategory:', success);
      
      if (!success) {
        throw new Error('La operación de eliminación retornó false');
      }
      
      console.log('[useCategoriesController] Categoría eliminada, recargando lista...');
      await load();
      return true;
    } catch (e) {
      console.error('[useCategoriesController] Error eliminando categoría:', e);
      throw e;
    }
  }, [load]);

  return {
    categories,
    isLoading,
    error,
    refresh,
    createCategory,
    getById,
    updateCategory,
    removeCategory,
  } as const;
}

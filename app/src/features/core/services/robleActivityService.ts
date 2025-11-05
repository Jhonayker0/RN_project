import { robleDatabaseService } from "./robleDatabaseService";

export type ActivityRecord = Record<string, any>;

export class RobleActivityService {
  constructor(private readonly database = robleDatabaseService) {}

  async getActivitiesByCourse(courseId: string): Promise<ActivityRecord[]> {
    try {
      const activities = await this.database.read("activities");
      const filtered = activities.filter(
        (activity) => activity["course_id"] === courseId
      );

      const processed = filtered.map((activity) => {
        const clone: ActivityRecord = { ...activity };
        const dueDateRaw = clone["due_date"];
        if (dueDateRaw) {
          const dueDate = new Date(dueDateRaw);
          if (!Number.isNaN(dueDate.getTime())) {
            clone["due_date_object"] = dueDate;
            clone["formatted_due_date"] = `${dueDate.getDate()}/${
              dueDate.getMonth() + 1
            }/${dueDate.getFullYear()}`;
          } else {
            clone["formatted_due_date"] = "Fecha inválida";
          }
        }
        return clone;
      });

      for (const activity of processed) {
        if (activity["category_id"]) {
          const categoryInfo = await this.getCategoryInfo(
            activity["category_id"]
          );
          if (categoryInfo) {
            activity["category_name"] = categoryInfo["name"];
            activity["category_type"] = categoryInfo["type"];
          }
        }
      }

      processed.sort((a, b) => {
        const dateA = a["due_date_object"] as Date | undefined;
        const dateB = b["due_date_object"] as Date | undefined;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
      });

      return processed;
    } catch (error) {
      console.warn("Error obteniendo actividades del curso", error);
      return [];
    }
  }

  private async getCategoryInfo(
    categoryId: string
  ): Promise<ActivityRecord | null> {
    try {
      const categories = await this.database.read("categories");
      return (
        categories.find((category) => category["_id"] === categoryId) ?? null
      );
    } catch (error) {
      console.warn("Error obteniendo categoría", error);
      return null;
    }
  }

  async getActivityById(activityId: string): Promise<ActivityRecord | null> {
    try {
      const activities = await this.database.read("activities");
      return (
        activities.find((activity) => activity["_id"] === activityId) ?? null
      );
    } catch (error) {
      console.warn("Error obteniendo actividad por id", error);
      return null;
    }
  }

  async getActivityStatsByCourse(
    courseId: string
  ): Promise<Record<string, number>> {
    try {
      const activities = await this.getActivitiesByCourse(courseId);
      const now = new Date();

      let pending = 0;
      let overdue = 0;

      activities.forEach((activity) => {
        const dueDate = activity["due_date_object"] as Date | undefined;
        if (dueDate) {
          if (dueDate < now) {
            overdue += 1;
          } else {
            pending += 1;
          }
        }
      });

      return {
        total: activities.length,
        pending,
        overdue,
      };
    } catch (error) {
      console.warn("Error calculando estadísticas de actividades", error);
      return { total: 0, pending: 0, overdue: 0 };
    }
  }

  async createActivity(data: {
    title: string;
    description?: string;
    due_date?: Date;
    course_id: string;
    category_id?: string;
  }): Promise<void> {
    console.log("[robleActivityService] Creando actividad:", data);

    const payload: Record<string, any> = {
      title: data.title,
      description: data.description ?? null,
      due_date: data.due_date ? data.due_date.toISOString() : null,
      course_id: data.course_id,
      category_id: data.category_id ?? null,
    };

    try {
      await this.database.insert("activities", [payload]);
      console.log("[robleActivityService] Actividad creada exitosamente");
    } catch (error) {
      console.error("[robleActivityService] Error creando actividad:", error);
      throw new Error("No se pudo crear la actividad");
    }
  }

  async updateActivity(
    activityId: string,
    data: {
      title?: string;
      description?: string;
      due_date?: Date;
      category_id?: string;
    }
  ): Promise<void> {
    console.log("[robleActivityService] Actualizando actividad:", activityId, data);

    const payload: Record<string, any> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description ?? null;
    if (data.due_date !== undefined) payload.due_date = data.due_date ? data.due_date.toISOString() : null;
    if (data.category_id !== undefined) payload.category_id = data.category_id ?? null;

    try {
      await this.database.update("activities", activityId, payload);
      console.log("[robleActivityService] Actividad actualizada exitosamente");
    } catch (error) {
      console.error("[robleActivityService] Error actualizando actividad:", error);
      throw new Error("No se pudo actualizar la actividad");
    }
  }

  async deleteActivity(activityId: string): Promise<void> {
    console.log("[robleActivityService] Eliminando actividad:", activityId);

    try {
      await this.database.delete("activities", activityId);
      console.log("[robleActivityService] Actividad eliminada");
    } catch (error) {
      console.error("[robleActivityService] Error eliminando actividad:", error);
      throw new Error("No se pudo eliminar la actividad");
    }
  }
}

export const robleActivityService = new RobleActivityService();

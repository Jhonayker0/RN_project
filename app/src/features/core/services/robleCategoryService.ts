import { robleDatabaseService } from "./robleDatabaseService";

export type CategoryRecord = Record<string, any>;

export class RobleCategoryService {
  constructor(private readonly database = robleDatabaseService) {}

  async getCategoriesByCourse(courseId: string): Promise<CategoryRecord[]> {
    try {
      const categories = await this.database.read("categories");
      if (!categories.length) return [];

      const filtered = categories.filter((category) => {
        const categoryCourseId = (category["course_id"] ?? "")
          .toString()
          .trim();
        return categoryCourseId === courseId.trim();
      });

      const processed: CategoryRecord[] = [];
      for (const category of filtered) {
        const clone: CategoryRecord = { ...category };
        const activityStats = await this.getActivityStatsForCategory(
          category["_id"]
        );
        clone["activity_count"] = activityStats.count;
        clone["pending_activities"] = activityStats.pending;
        clone["overdue_activities"] = activityStats.overdue;

        const groupStats = await this.getGroupStatsForCategory(category["_id"]);
        clone["group_count"] = groupStats.count;
        clone["total_members"] = groupStats.members;

        processed.push(clone);
      }

      processed.sort((a, b) =>
        ((a["name"] ?? "") as string)
          .toString()
          .toLowerCase()
          .localeCompare(((b["name"] ?? "") as string).toString().toLowerCase())
      );

      return processed;
    } catch (error) {
      console.warn("Error obteniendo categorías por curso", error);
      return [];
    }
  }

  private async getGroupStatsForCategory(categoryId: string): Promise<{
    count: number;
    members: number;
  }> {
    try {
      const groups = await this.database.read("groups");
      const categoryGroups = groups.filter(
        (group) => group["category_id"] === categoryId
      );

      let totalMembers = 0;
      for (const group of categoryGroups) {
        const members = await this.getGroupMembers(group["_id"]);
        totalMembers += members.length;
      }

      return { count: categoryGroups.length, members: totalMembers };
    } catch (error) {
      console.warn("Error calculando estadísticas de grupos", error);
      return { count: 0, members: 0 };
    }
  }

  private async getGroupMembers(groupId: string): Promise<CategoryRecord[]> {
    try {
      const members = await this.database.read("group_members");
      return members.filter((member) => member["group_id"] === groupId);
    } catch (error) {
      console.warn("Error obteniendo miembros de grupo", error);
      return [];
    }
  }

  private async getActivityStatsForCategory(categoryId: string): Promise<{
    count: number;
    pending: number;
    overdue: number;
  }> {
    try {
      const activities = await this.database.read("activities");
      const categoryActivities = activities.filter(
        (activity) => activity["category_id"] === categoryId
      );

      const now = new Date();
      let pending = 0;
      let overdue = 0;

      for (const activity of categoryActivities) {
        const dueDateRaw = activity["due_date"];
        if (dueDateRaw) {
          const dueDate = new Date(dueDateRaw);
          if (!Number.isNaN(dueDate.getTime()) && dueDate < now) {
            overdue += 1;
          } else {
            pending += 1;
          }
        } else {
          pending += 1;
        }
      }

      return {
        count: categoryActivities.length,
        pending,
        overdue,
      };
    } catch (error) {
      console.warn("Error calculando estadísticas de actividades", error);
      return { count: 0, pending: 0, overdue: 0 };
    }
  }

  async getCategoryById(categoryId: string): Promise<CategoryRecord | null> {
    try {
      const categories = await this.database.read("categories");
      const category = categories.find((cat) => cat["_id"] === categoryId);
      
      if (!category) return null;

      // Enriquecer con estadísticas de grupos y actividades
      const clone: CategoryRecord = { ...category };

      // Contar grupos
      const groups = await this.database.read("groups");
      const categoryGroups = groups.filter(
        (group) => group["category_id"] === categoryId
      );
      clone["group_count"] = categoryGroups.length;

      // Contar actividades
      const activities = await this.database.read("activities");
      const categoryActivities = activities.filter(
        (activity) => activity["category_id"] === categoryId
      );
      clone["activity_count"] = categoryActivities.length;

      console.log("[robleCategoryService] Category enriched:", {
        id: categoryId,
        name: clone["name"],
        group_count: clone["group_count"],
        activity_count: clone["activity_count"],
      });

      return clone;
    } catch (error) {
      console.warn("Error obteniendo categoría por id", error);
      return null;
    }
  }

  async getActivitiesInCategory(categoryId: string): Promise<CategoryRecord[]> {
    try {
      const activities = await this.database.read("activities");
      const filtered = activities
        .filter((activity) => activity["category_id"] === categoryId)
        .map((activity) => {
          const clone = { ...activity };
          const dueDate = clone["due_date"]
            ? new Date(clone["due_date"])
            : null;
          if (dueDate && !Number.isNaN(dueDate.getTime())) {
            clone["due_date_object"] = dueDate;
            clone["formatted_due_date"] = `${dueDate.getDate()}/${
              dueDate.getMonth() + 1
            }/${dueDate.getFullYear()}`;
          }
          return clone;
        });

      filtered.sort((a, b) => {
        const dateA = a["due_date_object"] as Date | undefined;
        const dateB = b["due_date_object"] as Date | undefined;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
      });

      return filtered;
    } catch (error) {
      console.warn("Error obteniendo actividades de la categoría", error);
      return [];
    }
  }

  async getGroupsInCategory(categoryId: string): Promise<CategoryRecord[]> {
    try {
      const groups = await this.database.read("groups");
      const categoryGroups = groups.filter(
        (group) => group["category_id"] === categoryId
      );

      if (!categoryGroups.length) return [];

      const categories = await this.database.read("categories");
      const parentCategory =
        categories.find((cat) => cat["_id"] === categoryId) ?? {};
      const capacity = (parentCategory["capacity"] as number | undefined) ?? 5;

      const processed: CategoryRecord[] = [];
      for (const group of categoryGroups) {
        const clone: CategoryRecord = { ...group };
        const members = await this.getGroupMembers(group["_id"]);
        clone["members"] = members;
        clone["member_count"] = members.length;

        const memberDetails = members.map((member) => ({
          _id: member["_id"],
          group_id: member["group_id"],
          student_id: member["student_id"],
          student_uuid: member["student_id"],
        }));

        clone["member_details"] = memberDetails;
        clone["capacity"] = capacity;
        clone["capacity_percentage"] = capacity
          ? Math.round((members.length / capacity) * 100)
          : 0;

        processed.push(clone);
      }

      processed.sort((a, b) =>
        ((a["name"] ?? "") as string)
          .toString()
          .toLowerCase()
          .localeCompare(((b["name"] ?? "") as string).toString().toLowerCase())
      );

      return processed;
    } catch (error) {
      console.warn("Error obteniendo grupos de la categoría", error);
      return [];
    }
  }

  async createCategory(options: {
    courseId: string;
    name: string;
    type?: string;
    capacity?: number;
    description?: string;
  }): Promise<CategoryRecord | null> {
    const { courseId, name, type, capacity, description } = options;
    try {
      console.log('[RobleCategoryService] Creando categoría:', { courseId, name, type, capacity, description });
      
      const record: Record<string, any> = {
        course_id: courseId,
        name,
      };
      
      if (type !== undefined) record.type = type;
      if (capacity !== undefined) record.capacity = capacity;
      if (description !== undefined && description) record.description = description;
      
      console.log('[RobleCategoryService] Registro a insertar:', record);
      
      await this.database.insert("categories", [record]);

      console.log('[RobleCategoryService] Categoría insertada, leyendo para confirmar...');
      
      const categories = await this.database.read("categories");
      const created = categories
        .filter(
          (category) =>
            category["course_id"] === courseId && category["name"] === name
        )
        .pop();

      console.log('[RobleCategoryService] Categoría creada:', created);
      
      // Crear grupos automáticamente
      if (created) {
        await this.createGroupsAutomatically(created, courseId);
      }
      
      return created ?? null;
    } catch (error) {
      console.error("[RobleCategoryService] Error creando categoría:", error);
      throw error;
    }
  }

  async updateCategory(options: {
    categoryId: string;
    name?: string;
    type?: string;
    capacity?: number;
    description?: string;
  }): Promise<boolean> {
    const { categoryId, name, type, capacity, description } = options;
    try {
      console.log('[RobleCategoryService] Actualizando categoría:', { categoryId, name, type, capacity, description });
      
      const updates: Record<string, any> = {};
      if (name !== undefined) updates["name"] = name;
      if (type !== undefined) updates["type"] = type;
      if (capacity !== undefined) updates["capacity"] = capacity;
      if (description !== undefined) updates["description"] = description;
      
      console.log('[RobleCategoryService] Updates a aplicar:', updates);
      
      await this.database.update("categories", categoryId, updates);
      
      console.log('[RobleCategoryService] Categoría actualizada exitosamente');
      
      return true;
    } catch (error) {
      console.error("[RobleCategoryService] Error actualizando categoría:", error);
      throw error;
    }
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    try {
      console.log('[RobleCategoryService] Eliminando categoría:', categoryId);
      
      // First delete all groups in this category
      const groups = await this.database.read("groups");
      const categoryGroups = groups.filter(
        (group) => group["category_id"] === categoryId
      );
      
      console.log('[RobleCategoryService] Grupos a eliminar:', categoryGroups.length);
      
      for (const group of categoryGroups) {
        await this.deleteGroup(group["_id"]);
      }

      // Then delete the category itself
      await this.database.delete("categories", categoryId);
      
      console.log('[RobleCategoryService] Categoría eliminada exitosamente');
      
      return true;
    } catch (error) {
      console.error("[RobleCategoryService] Error eliminando categoría:", error);
      throw error;
    }
  }

  async createGroup(options: {
    categoryId: string;
    name: string;
    capacity?: number;
    description?: string;
  }): Promise<CategoryRecord | null> {
    const { categoryId, name, description } = options;
    try {
      await this.database.insert("groups", [
        {
          category_id: categoryId,
          name,
          ...(description ? { description } : {}),
        },
      ]);

      const groups = await this.database.read("groups");
      const created = groups
        .filter(
          (group) =>
            group["category_id"] === categoryId && group["name"] === name
        )
        .pop();

      if (created) {
        await this.assignStudentsIfRandom(categoryId, created["_id"]);
      }

      return created ?? null;
    } catch (error) {
      console.warn("Error creando grupo", error);
      return null;
    }
  }

  async updateGroup(options: {
    groupId: string;
    name?: string;
    capacity?: number;
    description?: string;
  }): Promise<boolean> {
    const { groupId, name, description } = options;
    try {
      const updates: Record<string, any> = {};
      if (name) updates["name"] = name;
      if (description) updates["description"] = description;
      await this.database.update("groups", groupId, updates);
      return true;
    } catch (error) {
      console.warn("Error actualizando grupo", error);
      return false;
    }
  }

  async deleteGroup(groupId: string): Promise<boolean> {
    try {
      console.log('[RobleCategoryService] Eliminando grupo:', groupId);
      
      const members = await this.getGroupMembers(groupId);
      console.log('[RobleCategoryService] Miembros del grupo a eliminar:', members.length);
      
      for (const member of members) {
        await this.database.delete("group_members", member["_id"]);
      }
      
      await this.database.delete("groups", groupId);
      console.log('[RobleCategoryService] Grupo eliminado exitosamente');
      
      return true;
    } catch (error) {
      console.error("[RobleCategoryService] Error eliminando grupo:", error);
      throw error;
    }
  }

  async addStudentToGroup(options: {
    groupId: string;
    studentId: string;
    categoryId: string;
  }): Promise<boolean> {
    const { groupId, studentId, categoryId } = options;
    try {
      const existingMembership = await this.getStudentGroupInCategory(
        studentId,
        categoryId
      );
      if (existingMembership) return false;

      const group = await this.getGroupById(groupId);
      if (!group) return false;

      const categories = await this.database.read("categories");
      const category = categories.find(
        (cat) => cat["_id"] === group["category_id"]
      );
      const capacity = (category?.["capacity"] as number | undefined) ?? 5;

      const members = await this.getGroupMembers(groupId);
      if (members.length >= capacity) return false;

      await this.database.insert("group_members", [
        {
          group_id: groupId,
          student_id: studentId,
        },
      ]);
      return true;
    } catch (error) {
      console.warn("Error añadiendo estudiante al grupo", error);
      return false;
    }
  }

  async removeStudentFromGroup(options: {
    studentId: string;
    categoryId: string;
  }): Promise<boolean> {
    const { studentId, categoryId } = options;
    try {
      const membership = await this.getStudentGroupInCategory(
        studentId,
        categoryId
      );
      if (!membership) return false;
      await this.database.delete("group_members", membership["_id"]);
      return true;
    } catch (error) {
      console.warn("Error removiendo estudiante del grupo", error);
      return false;
    }
  }

  async getAvailableStudents(options: {
    categoryId: string;
    courseId: string;
  }): Promise<CategoryRecord[]> {
    const { categoryId, courseId } = options;
    try {
      const enrollments = await this.database.read("enrollments");
      const courseStudents = enrollments.filter((enrollment) => {
        const courseMatches =
          (enrollment["course_id"] ?? "").toString().trim() === courseId.trim();
        const role = (enrollment["role"] ?? "").toString().toLowerCase();
        return courseMatches && (role === "student" || role === "estudiante");
      });

      const groups = await this.database.read("groups");
      const categoryGroups = groups.filter(
        (group) => group["category_id"] === categoryId
      );

      const occupied = new Set<string>();
      for (const group of categoryGroups) {
        const members = await this.getGroupMembers(group["_id"]);
        members.forEach((member) => occupied.add(member["student_id"]));
      }

      return courseStudents.filter(
        (student) => !occupied.has(student["student_id"])
      );
    } catch (error) {
      console.warn("Error obteniendo estudiantes disponibles", error);
      return [];
    }
  }

  private async getGroupById(groupId: string): Promise<CategoryRecord | null> {
    const groups = await this.database.read("groups");
    return groups.find((group) => group["_id"] === groupId) ?? null;
  }

  private async getStudentGroupInCategory(
    studentId: string,
    categoryId: string
  ): Promise<CategoryRecord | null> {
    const groups = await this.database.read("groups");
    const categoryGroups = groups.filter(
      (group) => group["category_id"] === categoryId
    );
    for (const group of categoryGroups) {
      const members = await this.getGroupMembers(group["_id"]);
      const membership = members.find(
        (member) => member["student_id"] === studentId
      );
      if (membership) return membership;
    }
    return null;
  }

  private async assignStudentsIfRandom(
    categoryId: string,
    groupId: string
  ): Promise<void> {
    const categories = await this.database.read("categories");
    const category = categories.find((cat) => cat["_id"] === categoryId);
    if (!category || category["type"] !== "aleatorio") return;

    const group = await this.getGroupById(groupId);
    if (!group) return;

    const capacity = (category["capacity"] as number | undefined) ?? 5;
    const availableStudents = await this.getAvailableStudents({
      categoryId,
      courseId: category["course_id"],
    });

    const toAssign = availableStudents.slice(0, capacity);
    for (const student of toAssign) {
      await this.addStudentToGroup({
        groupId,
        studentId: student["student_id"],
        categoryId,
      });
    }
  }

  async getCategorySummaryByCourse(
    courseId: string
  ): Promise<Record<string, number>> {
    try {
      const categories = await this.getCategoriesByCourse(courseId);
      return categories.reduce<Record<string, number>>((acc, category) => {
        const type = (category["type"] ?? "sin tipo").toString();
        acc[type] = (acc[type] ?? 0) + 1;
        return acc;
      }, {});
    } catch (error) {
      console.warn("Error resumiendo categorías", error);
      return {};
    }
  }

  /**
   * Crea grupos automáticamente al crear una categoría
   * - Calcula cuántos grupos se necesitan según el número de estudiantes y la capacidad
   * - Si el tipo es "aleatorio", asigna estudiantes aleatoriamente
   * - Si el tipo es "eleccion", deja los grupos vacíos
   */
  private async createGroupsAutomatically(
    category: CategoryRecord,
    courseId: string
  ): Promise<void> {
    try {
      console.log('[RobleCategoryService] Creando grupos automáticamente para categoría:', category["_id"]);
      
      // Obtener estudiantes del curso
      const enrollments = await this.database.read("enrollments");
      const students = enrollments.filter((enrollment) => {
        const courseMatches = (enrollment["course_id"] ?? "").toString().trim() === courseId.trim();
        const role = (enrollment["role"] ?? "").toString().toLowerCase();
        return courseMatches && (role === "student" || role === "estudiante");
      });

      console.log(`[RobleCategoryService] Estudiantes en el curso: ${students.length}`);
      
      const capacity = (category["capacity"] as number) || 5;
      const totalGroups = Math.ceil(students.length / capacity);
      
      console.log(`[RobleCategoryService] Capacidad por grupo: ${capacity}`);
      console.log(`[RobleCategoryService] Grupos a crear: ${totalGroups}`);

      if (totalGroups === 0) {
        console.log('[RobleCategoryService] No hay estudiantes para asignar grupos');
        return;
      }

      // Crear los grupos
      const createdGroups: CategoryRecord[] = [];
      
      for (let i = 1; i <= totalGroups; i++) {
        const groupData = {
          name: `Grupo ${i}`,
          category_id: category["_id"],
        };
        
        await this.database.insert("groups", [groupData]);
        
        // Obtener el grupo recién creado
        const groups = await this.database.read("groups");
        const createdGroup = groups.find(
          (g) => g["name"] === `Grupo ${i}` && g["category_id"] === category["_id"]
        );
        
        if (createdGroup) {
          createdGroups.push(createdGroup);
          console.log(`[RobleCategoryService] Grupo creado: Grupo ${i}`);
        }
      }

      // Asignar estudiantes según el tipo de categoría
      const categoryType = (category["type"] ?? "").toString().toLowerCase();
      
      if (categoryType === "aleatorio") {
        await this.assignStudentsRandomly(students, createdGroups, capacity);
      } else if (categoryType === "eleccion") {
        console.log('[RobleCategoryService] Grupos creados vacíos para elección de estudiantes');
      }
      
    } catch (error) {
      console.error('[RobleCategoryService] Error creando grupos automáticamente:', error);
      // No lanzar error para no bloquear la creación de la categoría
    }
  }

  /**
   * Asigna estudiantes aleatoriamente a los grupos
   */
  private async assignStudentsRandomly(
    students: CategoryRecord[],
    groups: CategoryRecord[],
    capacity: number
  ): Promise<void> {
    try {
      console.log('[RobleCategoryService] Asignando estudiantes aleatoriamente...');
      
      // Mezclar estudiantes aleatoriamente
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
      
      let currentGroupIndex = 0;
      let studentsInCurrentGroup = 0;
      
      for (const student of shuffledStudents) {
        // Si el grupo actual está lleno, pasar al siguiente
        if (studentsInCurrentGroup >= capacity) {
          currentGroupIndex++;
          studentsInCurrentGroup = 0;
        }
        
        // Si no hay más grupos disponibles, salir del bucle
        if (currentGroupIndex >= groups.length) {
          console.log(`[RobleCategoryService] No hay más grupos disponibles para asignar estudiante`);
          break;
        }
        
        const currentGroup = groups[currentGroupIndex];
        
        // Crear membresía de grupo
        const memberData = {
          group_id: currentGroup["_id"],
          student_id: student["uuid"] || student["student_id"],
        };
        
        await this.database.insert("group_members", [memberData]);
        studentsInCurrentGroup++;
        
        console.log(`[RobleCategoryService] Estudiante asignado a ${currentGroup["name"]}`);
      }
      
      console.log('[RobleCategoryService] Asignación aleatoria completada');
    } catch (error) {
      console.error('[RobleCategoryService] Error asignando estudiantes aleatoriamente:', error);
    }
  }
}

export const robleCategoryService = new RobleCategoryService();

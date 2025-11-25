import { robleDatabaseService } from "./robleDatabaseService";
import { robleUserService } from "./robleUserService";

export type GroupRecord = Record<string, any>;
export type GroupMemberRecord = Record<string, any>;

export class RobleGroupService {
  constructor(private readonly database = robleDatabaseService) {}

  async getGroupsByCategory(categoryId: string): Promise<GroupRecord[]> {
    try {
      console.log("[RobleGroupService] Obteniendo grupos de categoría:", categoryId);
      
      const groups = await this.database.read("groups");
      const filteredGroups = groups.filter(
        (group) => group["category_id"] === categoryId
      );

      // Para cada grupo, obtener sus miembros
      const groupsWithMembers = await Promise.all(
        filteredGroups.map(async (group) => {
          const members = await this.getGroupMembers(group["_id"]);
          return {
            ...group,
            members,
            member_count: members.length,
          };
        })
      );

      console.log("[RobleGroupService] Grupos encontrados:", groupsWithMembers.length);
      return groupsWithMembers;
    } catch (error) {
      console.error("[RobleGroupService] Error obteniendo grupos:", error);
      return [];
    }
  }

  async getGroupMembers(groupId: string): Promise<GroupMemberRecord[]> {
    try {
      const allMembers = await this.database.read("group_members");
      const groupMembers = allMembers.filter(
        (member) => member["group_id"] === groupId
      );

      // Enriquecer cada miembro con su información de usuario
      const enrichedMembers = await Promise.all(
        groupMembers.map(async (member) => {
          const userInfo = await this.getMemberInfo(member["student_id"]);
          return {
            ...member,
            group_member_id: member["_id"], // ID del registro en group_members
            _id: member["student_id"], // ID del estudiante
            name: userInfo?.name || "Sin nombre",
            email: userInfo?.email || "",
          };
        })
      );

      console.log(`[RobleGroupService] Miembros del grupo ${groupId}:`, enrichedMembers.length);
      return enrichedMembers;
    } catch (error) {
      console.error("[RobleGroupService] Error obteniendo miembros del grupo:", error);
      return [];
    }
  }

  async getMemberInfo(studentId: string): Promise<Record<string, any> | null> {
    try {
      const userInfo = await robleUserService.getUserById(studentId);
      return userInfo;
    } catch (error) {
      console.error("[RobleGroupService] Error obteniendo info de estudiante:", error);
      return null;
    }
  }

  async joinGroup(groupId: string, studentId: string): Promise<void> {
    console.log("[RobleGroupService] Estudiante uniéndose al grupo:", { groupId, studentId });

    try {
      await this.database.insert("group_members", [
        {
          group_id: groupId,
          student_id: studentId,
        },
      ]);
      console.log("[RobleGroupService] Estudiante unido exitosamente");
    } catch (error) {
      console.error("[RobleGroupService] Error al unirse al grupo:", error);
      throw new Error("No se pudo unir al grupo");
    }
  }

  async leaveGroup(groupId: string, studentId: string): Promise<void> {
    console.log("[RobleGroupService] Estudiante saliendo del grupo:", { groupId, studentId });

    try {
      const allMembers = await this.database.read("group_members");
      const memberToRemove = allMembers.find(
        (member) =>
          member["group_id"] === groupId && member["student_id"] === studentId
      );

      if (memberToRemove) {
        await this.database.delete("group_members", memberToRemove["_id"]);
        console.log("[RobleGroupService] Estudiante removido exitosamente");
      } else {
        throw new Error("No se encontró la membresía");
      }
    } catch (error) {
      console.error("[RobleGroupService] Error al salir del grupo:", error);
      throw new Error("No se pudo salir del grupo");
    }
  }

  async createGroup(groupData: {
    category_id: string;
    name: string;
    description?: string;
  }): Promise<void> {
    console.log("[RobleGroupService] Creando grupo:", groupData);

    try {
      await this.database.insert("groups", [groupData]);
      console.log("[RobleGroupService] Grupo creado exitosamente");
    } catch (error) {
      console.error("[RobleGroupService] Error creando grupo:", error);
      throw new Error("No se pudo crear el grupo");
    }
  }

  async updateGroup(
    groupId: string,
    updates: { name?: string; description?: string }
  ): Promise<void> {
    console.log("[RobleGroupService] Actualizando grupo:", { groupId, updates });

    try {
      await this.database.update("groups", groupId, updates);
      console.log("[RobleGroupService] Grupo actualizado exitosamente");
    } catch (error) {
      console.error("[RobleGroupService] Error actualizando grupo:", error);
      throw new Error("No se pudo actualizar el grupo");
    }
  }

  async deleteGroup(groupId: string): Promise<void> {
    console.log("[RobleGroupService] Eliminando grupo:", groupId);

    try {
      // Primero eliminar todos los miembros del grupo
      const allMembers = await this.database.read("group_members");
      const groupMembers = allMembers.filter(
        (member) => member["group_id"] === groupId
      );
      
      for (const member of groupMembers) {
        await this.database.delete("group_members", member["_id"]);
      }

      // Luego eliminar el grupo
      await this.database.delete("groups", groupId);
      console.log("[RobleGroupService] Grupo eliminado exitosamente");
    } catch (error) {
      console.error("[RobleGroupService] Error eliminando grupo:", error);
      throw new Error("No se pudo eliminar el grupo");
    }
  }

  async removeMemberFromGroup(groupId: string, studentId: string): Promise<void> {
    console.log("[RobleGroupService] Removiendo miembro del grupo:", { groupId, studentId });

    try {
      const allMembers = await this.database.read("group_members");
      const memberToRemove = allMembers.find(
        (member) =>
          member["group_id"] === groupId && member["student_id"] === studentId
      );

      if (memberToRemove) {
        await this.database.delete("group_members", memberToRemove["_id"]);
        console.log("[RobleGroupService] Miembro removido exitosamente");
      } else {
        throw new Error("No se encontró el miembro en el grupo");
      }
    } catch (error) {
      console.error("[RobleGroupService] Error removiendo miembro:", error);
      throw new Error("No se pudo remover el miembro del grupo");
    }
  }

  /**
   * Obtiene estudiantes disponibles para agregar a un grupo
   * Filtra los que ya están en algún grupo de la misma categoría
   */
  async getAvailableStudentsForCategory(
    categoryId: string,
    courseId: string
  ): Promise<GroupMemberRecord[]> {
    console.log("[RobleGroupService] Obteniendo estudiantes disponibles para categoría:", categoryId);

    try {
      // Obtener todos los estudiantes del curso
      const enrollments = await this.database.read("enrollments");
      const courseStudents = enrollments.filter((enrollment) => {
        const courseMatches = (enrollment["course_id"] ?? "").toString().trim() === courseId.trim();
        const role = (enrollment["role"] ?? "").toString().toLowerCase();
        return courseMatches && (role === "student" || role === "estudiante");
      });

      console.log(`[RobleGroupService] Total estudiantes en el curso: ${courseStudents.length}`);

      // Obtener grupos de la categoría
      const groups = await this.database.read("groups");
      const categoryGroups = groups.filter(
        (group) => group["category_id"] === categoryId
      );

      // Obtener IDs de estudiantes ya asignados a grupos de esta categoría
      const assignedStudentIds = new Set<string>();
      
      for (const group of categoryGroups) {
        const allMembers = await this.database.read("group_members");
        const groupMembers = allMembers.filter(
          (member) => member["group_id"] === group["_id"]
        );
        
        groupMembers.forEach((member) => {
          assignedStudentIds.add(member["student_id"]);
        });
      }

      console.log(`[RobleGroupService] Estudiantes ya asignados: ${assignedStudentIds.size}`);

      // Filtrar estudiantes disponibles
      const availableStudents = courseStudents.filter((student) => {
        const studentId = student["student_id"];
        return !assignedStudentIds.has(studentId);
      });

      console.log(`[RobleGroupService] Estudiantes disponibles: ${availableStudents.length}`);

      return availableStudents.map((student) => ({
        student_id: student["student_id"],
        user_id: student["student_id"],
      }));
    } catch (error) {
      console.error("[RobleGroupService] Error obteniendo estudiantes disponibles:", error);
      return [];
    }
  }
}

export const robleGroupService = new RobleGroupService();

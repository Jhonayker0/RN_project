import { RobleConfig } from "../config/robleConfig";
import { robleDatabaseService } from "./robleDatabaseService";
import { robleHttpService } from "./robleHttpService";

export type UserRecord = Record<string, any>;

export class RobleUserService {
  constructor(private readonly database = robleDatabaseService) {}

  async getUserInfo(userId: string): Promise<UserRecord> {
    try {
      const info = await this.getUserRealInfo(userId, "student");
      return info ?? this.createFallbackUser(userId, "student");
    } catch (error) {
      console.warn("Error obteniendo información de usuario", error);
      return this.createFallbackUser(userId, "student");
    }
  }

  async getUserById(userId: string): Promise<UserRecord> {
    return this.getUserInfo(userId);
  }

  async getUsersByCourse(courseId: string): Promise<UserRecord[]> {
    try {
      const enrollments = await this.database.read("enrollments");
      const filtered = enrollments.filter(
        (enrollment) => enrollment["course_id"] === courseId
      );

      const users: UserRecord[] = [];
      for (const enrollment of filtered) {
        const userId = enrollment["student_id"] as string | undefined;
        const role = (enrollment["role"] as string | undefined) ?? "student";
        if (!userId) continue;

        const info = await this.getUserRealInfo(userId, role);
        if (info) {
          users.push(info);
        } else {
          users.push(await this.createFallbackUser(userId, role));
        }
      }

      return users;
    } catch (error) {
      console.warn("Error obteniendo usuarios por curso", error);
      return [];
    }
  }

  private async createFallbackUser(
    uuid: string,
    role: string
  ): Promise<UserRecord> {
    return {
      _id: uuid,
      name: "Usuario",
      email: `${uuid}@uninorte.edu.co`,
      avatarUrl: null,
      role,
    };
  }

  private async getUserInfoFromAuth(userId: string): Promise<{
    name: string;
    email: string;
  } | null> {
    try {
      const { data, status } = await robleHttpService.dio.get(
        `/auth/${RobleConfig.dbName}/user-info/${userId}`
      );
      if (status === 200 && data) {
        return {
          name: data["name"] ?? data["email"] ?? "Usuario",
          email: data["email"] ?? `${userId}@uninorte.edu.co`,
        };
      }
    } catch (error) {
      console.warn("Error consultando auth API", error);
    }
    return null;
  }

  private async getCurrentUserInfo(): Promise<{
    userId: string;
    name: string;
  } | null> {
    try {
      const response = await robleHttpService.dio.get(
        `/auth/${RobleConfig.dbName}/me`
      );
      if (response.status === 200 && response.data) {
        return {
          userId: response.data["uuid"] ?? response.data["id"] ?? "",
          name: response.data["email"] ?? "Usuario",
        };
      }
    } catch (error) {
      console.warn("Error obteniendo usuario actual", error);
    }
    return null;
  }

  private async getUserRealInfo(
    uuid: string,
    role: string
  ): Promise<UserRecord | null> {
    try {
      const current = await this.getCurrentUserInfo();
      if (current && current.userId === uuid) {
        return {
          _id: uuid,
          name: current.name,
          email: `id: ${uuid}`,
          avatarUrl: null,
          role,
        };
      }

      const authInfo = await this.getUserInfoFromAuth(uuid);
      if (authInfo) {
        return {
          _id: uuid,
          name: authInfo.name,
          email: authInfo.email,
          avatarUrl: null,
          role,
        };
      }

      const roleDisplayName = role === "professor" ? "Profesor" : "Estudiante";
      return {
        _id: uuid,
        name: roleDisplayName,
        email: `id: ${uuid}`,
        avatarUrl: null,
        role,
      };
    } catch (error) {
      console.warn("Error obteniendo información real del usuario", error);
      return null;
    }
  }
}

export const robleUserService = new RobleUserService();

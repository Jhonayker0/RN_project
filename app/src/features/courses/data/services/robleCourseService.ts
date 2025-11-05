import { robleDatabaseService } from "../../../core/services/robleDatabaseService";
import {
  robleEnrollmentService,
  RobleEnrollmentService,
} from "./robleEnrollmentService";
import {
  Course,
  mapCourseToRobleRecord,
  mapRobleCourseToDomain,
  RawCourseRecord,
} from "../../domain/models/course";

export interface GetCourseOptions {
  currentUserId?: string | null;
}

const COURSES_TABLE = "courses";
const ENROLLMENTS_TABLE = "enrollments";

type EnrollmentRecord = Record<string, any>;

type EnrollmentCountMap = Map<string, number>;

export class RobleCourseService {
  constructor(
    private readonly database = robleDatabaseService,
    private readonly enrollments: RobleEnrollmentService = robleEnrollmentService
  ) {}

  async getAllCourses(options: GetCourseOptions = {}): Promise<Course[]> {
    const records = await this.database.read(COURSES_TABLE);
    const counts = await this.getEnrollmentCountMap();
    return this.mapRecordsToCourses(records, counts, options.currentUserId);
  }

  async getCoursesByProfessor(
    professorId: string,
    options: GetCourseOptions = {}
  ): Promise<Course[]> {
    const records = await this.database.read(COURSES_TABLE);
    const filtered = records.filter(
      (record) => record["professor_id"] === professorId
    );
    const counts = await this.getEnrollmentCountMap();
    return this.mapRecordsToCourses(
      filtered,
      counts,
      options.currentUserId ?? professorId
    );
  }

  async getCoursesByStudent(
    studentId: string,
    options: GetCourseOptions = {}
  ): Promise<Course[]> {
    const enrollments = await this.database.read(ENROLLMENTS_TABLE);
    const enrolledCourseIds = new Set<string>();

    for (const enrollment of enrollments) {
      if (enrollment["student_id"] === studentId) {
        const courseId = enrollment["course_id"];
        if (typeof courseId === "string") {
          enrolledCourseIds.add(courseId);
        }
      }
    }

    if (!enrolledCourseIds.size) {
      return [];
    }

    const records = await this.database.read(COURSES_TABLE);
    const filtered = records.filter((record) => {
      const id = record["_id"];
      return typeof id === "string" && enrolledCourseIds.has(id);
    });

    const counts = this.buildEnrollmentCountMapFrom(enrollments);
    return this.mapRecordsToCourses(
      filtered,
      counts,
      options.currentUserId ?? studentId
    );
  }

  async getCourseById(
    courseId: string,
    options: GetCourseOptions = {}
  ): Promise<Course | null> {
    const records = await this.database.read(COURSES_TABLE);
    const found = records.find((record) => record["_id"] === courseId);

    if (!found) {
      return null;
    }

    const counts = await this.getEnrollmentCountMap();
    return mapRobleCourseToDomain(found, {
      currentUserId: options.currentUserId,
      enrollmentCount: counts.get(courseId) ?? 0,
    });
  }

  async getCourseByCode(
    code: string,
    options: GetCourseOptions = {}
  ): Promise<Course | null> {
    const records = await this.database.read(COURSES_TABLE);
    const found = records.find((record) => {
      if (typeof record["_id"] === "string" && record["_id"] === code) {
        return true;
      }
      return typeof record["code"] === "string" && record["code"] === code;
    });

    if (!found) {
      return null;
    }

    const counts = await this.getEnrollmentCountMap();
    const courseId =
      typeof found["_id"] === "string" ? found["_id"] : undefined;
    return mapRobleCourseToDomain(found, {
      currentUserId: options.currentUserId,
      enrollmentCount: courseId ? counts.get(courseId) ?? 0 : 0,
    });
  }

  async createCourse(course: Course): Promise<void> {
    const payload = mapCourseToRobleRecord(course);
    await this.database.insert(COURSES_TABLE, [payload]);

    const records = await this.database.read(COURSES_TABLE);
    let created: RawCourseRecord | undefined;

    for (const record of records) {
      if (
        record["professor_id"] === course.professorId &&
        record["title"] === course.title &&
        record["description"] === course.description
      ) {
        created = record;
      }
    }

    const courseId =
      created && typeof created["_id"] === "string" ? created["_id"] : null;
    if (courseId) {
      const alreadyEnrolled = await this.enrollments
        .getCourseIdsByStudent(course.professorId)
        .then((ids) => ids.includes(courseId))
        .catch(() => false);

      if (!alreadyEnrolled) {
        await this.enrollments.enrollStudent(
          course.professorId,
          courseId,
          "professor"
        );
      }
    }
  }

  async updateCourse(courseId: string, course: Course): Promise<void> {
    const updates = mapCourseToRobleRecord(course);
    delete updates["_id"];
    await this.database.update(COURSES_TABLE, courseId, updates);
  }

  async deleteCourse(courseId: string): Promise<void> {
    try {
      console.log('[RobleCourseService] Eliminando curso:', courseId);
      
      // First remove all enrollments
      console.log('[RobleCourseService] Eliminando inscripciones...');
      await this.enrollments.removeEnrollmentsByCourse(courseId);
      
      // Then delete the course
      console.log('[RobleCourseService] Eliminando curso de la base de datos...');
      await this.database.delete(COURSES_TABLE, courseId);
      
      console.log('[RobleCourseService] Curso eliminado exitosamente');
    } catch (error) {
      console.error('[RobleCourseService] Error eliminando curso:', error);
      throw error;
    }
  }

  private mapRecordsToCourses(
    records: RawCourseRecord[],
    counts: EnrollmentCountMap,
    currentUserId?: string | null
  ): Course[] {
    return records.map((record) => {
      const id = typeof record["_id"] === "string" ? record["_id"] : undefined;
      const enrollmentCount = id ? counts.get(id) ?? 0 : 0;
      return mapRobleCourseToDomain(record, {
        currentUserId,
        enrollmentCount,
      });
    });
  }

  private async getEnrollmentCountMap(): Promise<EnrollmentCountMap> {
    const enrollments = await this.database.read(ENROLLMENTS_TABLE);
    return this.buildEnrollmentCountMapFrom(enrollments);
  }

  private buildEnrollmentCountMapFrom(
    enrollments: EnrollmentRecord[]
  ): EnrollmentCountMap {
    const counts: EnrollmentCountMap = new Map();

    for (const enrollment of enrollments) {
      const courseId = enrollment["course_id"];
      if (typeof courseId !== "string") {
        continue;
      }

      const current = counts.get(courseId) ?? 0;
      counts.set(courseId, current + 1);
    }

    return counts;
  }
}

export const robleCourseService = new RobleCourseService();

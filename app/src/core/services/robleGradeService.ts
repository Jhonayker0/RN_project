import { robleDatabaseService } from '../../features/core/services/robleDatabaseService';

export interface Grade {
  _id?: string;
  activity_id: string;
  student_id: string;
  grade: number;
  max_grade: number;
  graded_by: string;
}

export interface SubmissionWithGrades {
  student_id: string;
  student_name?: string;
  student_email?: string;
  average_grade: number | null;
  total_evaluations: number;
  grades_list: Grade[];
}

export class RobleGradeService {
  private tableName = 'grades';

  /**
   * Obtiene todas las calificaciones de una actividad
   */
  async getGradesByActivity(activityId: string): Promise<Grade[]> {
    try {
      console.log(`🔍 Obteniendo calificaciones para actividad: ${activityId}`);
      const allGrades = await robleDatabaseService.read(this.tableName);
      const activityGrades = allGrades.filter(
        (grade: any) => grade.activity_id === activityId
      ) as Grade[];
      console.log(`✅ ${activityGrades.length} calificaciones encontradas`);
      return activityGrades;
    } catch (error) {
      console.error('❌ Error obteniendo calificaciones:', error);
      throw error;
    }
  }

  /**
   * Guarda o actualiza una calificación
   */
  async saveGrade(
    activityId: string,
    studentId: string,
    grade: number,
    maxGrade: number,
    gradedBy: string
  ): Promise<void> {
    try {
      console.log('🔄 Guardando calificación...');
      console.log(`   - Activity: ${activityId}`);
      console.log(`   - Student: ${studentId}`);
      console.log(`   - Grade: ${grade}/${maxGrade}`);
      console.log(`   - Graded by: ${gradedBy}`);

      // Verificar si ya existe una calificación
      const allGrades = await robleDatabaseService.read(this.tableName);
      const existingGrade = allGrades.find(
        (g: any) =>
          g.activity_id === activityId &&
          g.student_id === studentId &&
          g.graded_by === gradedBy
      );

      if (existingGrade) {
        // Actualizar calificación existente
        console.log(`🔄 Actualizando calificación existente: ${existingGrade._id}`);
        await robleDatabaseService.update(this.tableName, existingGrade._id!, {
          grade: grade,
          max_grade: maxGrade,
        });
        console.log('✅ Calificación actualizada');
      } else {
        // Crear nueva calificación
        console.log('➕ Creando nueva calificación');
        const gradeData = {
          activity_id: activityId,
          student_id: studentId,
          grade: grade,
          max_grade: maxGrade,
          graded_by: gradedBy,
        };
        await robleDatabaseService.insert(this.tableName, [gradeData]);
        console.log('✅ Calificación creada');
      }
    } catch (error) {
      console.error('❌ Error guardando calificación:', error);
      throw error;
    }
  }

  /**
   * Obtiene la calificación que un usuario dio a un estudiante en una actividad
   */
  async getMyGradeForStudent(
    activityId: string,
    studentId: string,
    gradedBy: string
  ): Promise<Grade | null> {
    try {
      const allGrades = await robleDatabaseService.read(this.tableName);
      const grade = allGrades.find(
        (g: any) =>
          g.activity_id === activityId &&
          g.student_id === studentId &&
          g.graded_by === gradedBy
      ) as Grade | undefined;
      return grade || null;
    } catch (error) {
      console.error('❌ Error obteniendo mi calificación:', error);
      return null;
    }
  }

  /**
   * Obtiene las calificaciones agregadas por estudiante (para profesor)
   * En un sistema peer-to-peer, los estudiantes se califican entre sí
   */
  async getActivitySubmissionsWithGrades(
    activityId: string
  ): Promise<SubmissionWithGrades[]> {
    try {
      console.log(`📊 Obteniendo grades para actividad: ${activityId}`);

      // Obtener todas las calificaciones de la actividad
      const allGrades = await robleDatabaseService.read(this.tableName);
      const activityGrades = allGrades.filter(
        (grade: any) => grade.activity_id === activityId
      ) as Grade[];

      console.log(`📝 ${activityGrades.length} calificaciones encontradas`);

      if (activityGrades.length === 0) {
        console.log('⚠️ No hay calificaciones para esta actividad');
        return [];
      }

      // Agrupar por estudiante evaluado (student_id)
      const studentGradesMap = new Map<string, Grade[]>();
      
      for (const grade of activityGrades) {
        const studentId = grade.student_id;
        if (!studentGradesMap.has(studentId)) {
          studentGradesMap.set(studentId, []);
        }
        studentGradesMap.get(studentId)!.push(grade);
      }

      console.log(`👥 ${studentGradesMap.size} estudiantes únicos evaluados`);

      // Calcular promedio para cada estudiante
      const submissionsWithGrades: SubmissionWithGrades[] = [];

      for (const [studentId, grades] of studentGradesMap.entries()) {
        const gradeSum = grades.reduce((sum, grade) => sum + grade.grade, 0);
        const averageGrade = gradeSum / grades.length;

        submissionsWithGrades.push({
          student_id: studentId,
          average_grade: averageGrade,
          total_evaluations: grades.length,
          grades_list: grades,
        });
      }

      // Ordenar por promedio (mayor a menor)
      submissionsWithGrades.sort((a, b) => {
        const aGrade = a.average_grade ?? 0;
        const bGrade = b.average_grade ?? 0;
        return bGrade - aGrade;
      });

      console.log(`✅ ${submissionsWithGrades.length} estudiantes con grades procesados`);
      return submissionsWithGrades;
    } catch (error) {
      console.error('❌ Error obteniendo grades:', error);
      throw error;
    }
  }
}

export const robleGradeService = new RobleGradeService();

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  robleGradeService,
  SubmissionWithGrades,
  Grade,
} from '../../../../core/services/robleGradeService';
import { robleUserService } from '../../../core/services/robleUserService';

interface Props {
  visible: boolean;
  onClose: () => void;
  activity: {
    _id: string;
    title: string;
    description?: string;
  };
}

interface EnrichedSubmission extends SubmissionWithGrades {
  student_name: string;
  student_email: string;
}

export function ViewGradesModal({ visible, onClose, activity }: Props) {
  const [submissions, setSubmissions] = useState<EnrichedSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<EnrichedSubmission | null>(
    null
  );

  useEffect(() => {
    if (visible) {
      loadSubmissions();
    }
  }, [visible]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      console.log('📊 Cargando evaluaciones...');
      console.log('Activity ID:', activity._id);

      const submissionsData =
        await robleGradeService.getActivitySubmissionsWithGrades(activity._id);

      console.log('Submissions data:', submissionsData);

      if (submissionsData.length === 0) {
        console.log('⚠️ No hay evaluaciones para esta actividad');
        Alert.alert(
          'Sin evaluaciones',
          'No hay evaluaciones de estudiantes en esta actividad. Los estudiantes deben evaluarse entre sí primero.',
          [{ text: 'OK', onPress: onClose }]
        );
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // Enriquecer con información del usuario
      console.log(`🔄 Enriqueciendo ${submissionsData.length} estudiantes con info de usuario...`);
      const enriched: EnrichedSubmission[] = [];
      
      for (const submission of submissionsData) {
        try {
          console.log(`Obteniendo info para estudiante: ${submission.student_id}`);
          const userInfo = await robleUserService.getUserInfo(submission.student_id);
          enriched.push({
            ...submission,
            student_name: userInfo.name || 'Estudiante',
            student_email: userInfo.email || submission.student_id,
          });
        } catch (userError) {
          console.error(`Error obteniendo info de ${submission.student_id}:`, userError);
          // Agregar con datos por defecto si falla
          enriched.push({
            ...submission,
            student_name: 'Estudiante',
            student_email: submission.student_id,
          });
        }
      }

      setSubmissions(enriched);
      console.log(`✅ ${enriched.length} evaluaciones cargadas correctamente`);
    } catch (error) {
      console.error('❌ Error cargando evaluaciones:', error);
      Alert.alert(
        'Error',
        `No se pudieron cargar las evaluaciones: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        [{ text: 'OK', onPress: onClose }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (averageGrade: number | null): string => {
    if (averageGrade === null) return '#64748b';
    if (averageGrade >= 4.0) return '#10b981';
    if (averageGrade >= 3.0) return '#f59e0b';
    return '#ef4444';
  };

  const showSubmissionDetail = (submission: EnrichedSubmission) => {
    setSelectedSubmission(submission);
  };

  const closeDetail = () => {
    setSelectedSubmission(null);
  };

  const formatStudentId = (studentId: string) => {
    return studentId.length > 16 ? `${studentId.substring(0, 16)}...` : studentId;
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Ver Notas</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          {/* Activity Info */}
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>Actividad: {activity.title}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{submissions.length}</Text>
                <Text style={styles.statLabel}>Estudiantes evaluados</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {submissions.reduce((sum, s) => sum + s.total_evaluations, 0)}
                </Text>
                <Text style={styles.statLabel}>Total evaluaciones</Text>
              </View>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Cargando evaluaciones...</Text>
            </View>
          ) : submissions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Sin evaluaciones</Text>
              <Text style={styles.emptyText}>
                No hay evaluaciones de estudiantes en esta actividad.{'\n'}
                Los estudiantes deben evaluarse entre sí primero.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView}>
              <Text style={styles.sectionTitle}>Estudiantes evaluados:</Text>
              {submissions.map((submission) => {
                const hasGrades = submission.total_evaluations > 0;
                const averageGrade = submission.average_grade;
                const gradeColor = getGradeColor(averageGrade);

                return (
                  <Pressable
                    key={submission.student_id}
                    style={({ pressed }) => [
                      styles.submissionCard,
                      pressed && styles.submissionCardPressed,
                    ]}
                    onPress={() => showSubmissionDetail(submission)}
                  >
                    <View style={[styles.gradeCircle, { backgroundColor: gradeColor }]}>
                      <Text style={styles.gradeText}>
                        {hasGrades ? averageGrade?.toFixed(1) : '?'}
                      </Text>
                    </View>
                    <View style={styles.submissionInfo}>
                      <Text style={styles.studentName}>{submission.student_name}</Text>
                      <Text style={styles.studentId}>
                        ID: {formatStudentId(submission.student_id)}
                      </Text>
                      {hasGrades ? (
                        <>
                          <Text style={[styles.averageText, { color: gradeColor }]}>
                            Promedio: {averageGrade?.toFixed(2)}/5.0
                          </Text>
                          <Text style={styles.evaluationsText}>
                            Evaluaciones: {submission.total_evaluations}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.noGradesText}>Sin evaluaciones</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Close Button */}
          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeFooterButton,
                pressed && styles.closeFooterButtonPressed,
              ]}
            >
              <Text style={styles.closeFooterButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      {selectedSubmission && (
        <Modal
          visible={!!selectedSubmission}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeDetail}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Detalle de Entrega</Text>
              <Pressable onPress={closeDetail} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <ScrollView style={styles.detailScrollView}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Estudiante:</Text>
                <Text style={styles.detailValue}>{selectedSubmission.student_name}</Text>
                <Text style={styles.detailEmail}>{selectedSubmission.student_email}</Text>
              </View>

              {selectedSubmission.total_evaluations > 0 ? (
                <>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>Calificaciones:</Text>
                    <Text style={styles.summaryGrade}>
                      Promedio: {selectedSubmission.average_grade?.toFixed(2)}/5.0
                    </Text>
                    <Text style={styles.summaryEvaluations}>
                      Total evaluaciones: {selectedSubmission.total_evaluations}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>
                      Calificaciones individuales:
                    </Text>
                    {selectedSubmission.grades_list.map((grade, index) => (
                      <View key={index} style={styles.gradeItem}>
                        <Text style={styles.gradeEvaluator}>
                          Evaluador: {formatStudentId(grade.graded_by)}
                        </Text>
                        <View style={styles.gradeBadge}>
                          <Text style={styles.gradeBadgeText}>
                            {grade.grade}/{grade.max_grade}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.noGradesBox}>
                  <Ionicons name="alert-circle-outline" size={48} color="#f59e0b" />
                  <Text style={styles.noGradesTitle}>Sin evaluaciones</Text>
                  <Text style={styles.noGradesDescription}>
                    Esta entrega aún no ha sido evaluada por otros estudiantes.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={closeDetail}
                style={({ pressed }) => [
                  styles.closeFooterButton,
                  pressed && styles.closeFooterButtonPressed,
                ]}
              >
                <Text style={styles.closeFooterButtonText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    padding: 8,
  },
  activityInfo: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  statLabel: {
    fontSize: 12,
    color: '#1e40af',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  submissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  submissionCardPressed: {
    opacity: 0.7,
  },
  gradeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gradeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  submissionInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  averageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  evaluationsText: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 2,
  },
  noGradesText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  closeFooterButton: {
    backgroundColor: '#64748b',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeFooterButtonPressed: {
    opacity: 0.7,
  },
  closeFooterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Detail Modal Styles
  detailScrollView: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  detailEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryBox: {
    backgroundColor: '#dcfce7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 8,
  },
  summaryGrade: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  summaryEvaluations: {
    fontSize: 14,
    color: '#15803d',
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 12,
  },
  gradeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  gradeEvaluator: {
    fontSize: 12,
    color: '#64748b',
  },
  gradeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  noGradesBox: {
    backgroundColor: '#fef3c7',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde047',
    alignItems: 'center',
  },
  noGradesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ca8a04',
    marginTop: 12,
    marginBottom: 8,
  },
  noGradesDescription: {
    fontSize: 14,
    color: '#a16207',
    textAlign: 'center',
  },
});

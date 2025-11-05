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
import { robleGroupService } from '../../../core/services/robleGroupService';
import { robleGradeService, Grade } from '../../../../core/services/robleGradeService';
import { robleUserService } from '../../../core/services/robleUserService';

interface Student {
  _id: string;
  name: string;
  email: string;
  my_grade?: number;
  max_grade: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  activity: {
    _id: string;
    title: string;
    description?: string;
    category_id: string;
    category_name?: string;
  };
  currentUserId: string;
  onSuccess: () => void;
}

export function EvaluatePeersModal({
  visible,
  onClose,
  activity,
  currentUserId,
  onSuccess,
}: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const maxGrade = 5; // Máximo de calificación

  useEffect(() => {
    if (visible) {
      loadStudents();
    }
  }, [visible]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando compañeros para evaluar...');

      // Obtener todos los grupos de la categoría
      const groups = await robleGroupService.getGroupsByCategory(activity.category_id);
      
      // Encontrar el grupo del usuario actual
      let currentUserGroup: any = null;
      let currentUserGroupName = '';
      for (const group of groups) {
        const members = await robleGroupService.getGroupMembers(group._id);
        const isMember = members.some(
          (m: any) => m.student_id === currentUserId
        );
        if (isMember) {
          currentUserGroup = { ...group, members };
          currentUserGroupName = group.name || 'Grupo';
          break;
        }
      }

      if (!currentUserGroup) {
        Alert.alert(
          'No estás en un grupo',
          `Debes estar inscrito en un grupo de la categoría "${activity.category_name}" para evaluar esta actividad.`
        );
        onClose();
        return;
      }

      console.log(`👥 Grupo encontrado: ${currentUserGroupName}`);

      // Obtener compañeros del mismo grupo (excluir al usuario actual)
      const peers = currentUserGroup.members.filter(
        (m: any) => m.student_id !== currentUserId
      );

      console.log(`📝 ${peers.length} compañeros para evaluar`);

      // Enriquecer con información del usuario y calificación existente
      const enrichedStudents: Student[] = [];
      for (const peer of peers) {
        const userInfo = await robleUserService.getUserInfo(peer.student_id);
        
        // Buscar si ya existe una calificación
        const existingGrade = await robleGradeService.getMyGradeForStudent(
          activity._id,
          peer.student_id,
          currentUserId
        );

        enrichedStudents.push({
          _id: peer.student_id,
          name: userInfo.name || 'Estudiante',
          email: userInfo.email || peer.student_id,
          my_grade: existingGrade?.grade,
          max_grade: existingGrade?.max_grade || maxGrade,
        });
      }

      setStudents(enrichedStudents);
    } catch (error) {
      console.error('❌ Error cargando estudiantes:', error);
      Alert.alert('Error', 'No se pudieron cargar los compañeros para evaluar');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateStudent = (student: Student) => {
    Alert.alert(
      'Evaluar Compañero',
      `${student.name}\n${student.email}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '1 ⭐',
          onPress: () => saveGrade(student, 1),
        },
        {
          text: '2 ⭐⭐',
          onPress: () => saveGrade(student, 2),
        },
        {
          text: '3 ⭐⭐⭐',
          onPress: () => saveGrade(student, 3),
        },
        {
          text: '4 ⭐⭐⭐⭐',
          onPress: () => saveGrade(student, 4),
        },
        {
          text: '5 ⭐⭐⭐⭐⭐',
          onPress: () => saveGrade(student, 5),
        },
      ]
    );
  };

  const saveGrade = async (student: Student, grade: number) => {
    try {
      setLoading(true);
      console.log(`💾 Guardando calificación: ${grade}/${maxGrade} para ${student.name}`);

      await robleGradeService.saveGrade(
        activity._id,
        student._id,
        grade,
        maxGrade,
        currentUserId
      );

      Alert.alert('Éxito', 'Calificación enviada correctamente');
      await loadStudents(); // Recargar para mostrar la nueva calificación
      onSuccess();
    } catch (error) {
      console.error('❌ Error guardando calificación:', error);
      Alert.alert('Error', 'No se pudo guardar la calificación');
    } finally {
      setLoading(false);
    }
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Evaluar Compañeros</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </Pressable>
        </View>

        {/* Activity Info */}
        <View style={styles.activityInfo}>
          <Text style={styles.activityTitle}>Actividad: {activity.title}</Text>
          {activity.description && (
            <Text style={styles.activityDescription}>{activity.description}</Text>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Cargando compañeros...</Text>
          </View>
        ) : students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Sin compañeros</Text>
            <Text style={styles.emptyText}>
              No hay compañeros para evaluar en esta actividad
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView}>
            <Text style={styles.sectionTitle}>Compañeros a evaluar:</Text>
            {students.map((student) => {
              const hasGrade = student.my_grade !== undefined;
              return (
                <Pressable
                  key={student._id}
                  style={({ pressed }) => [
                    styles.studentCard,
                    pressed && styles.studentCardPressed,
                  ]}
                  onPress={() => handleEvaluateStudent(student)}
                >
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: hasGrade ? '#10b981' : '#64748b' },
                    ]}
                  >
                    {hasGrade ? (
                      <Ionicons name="checkmark" size={24} color="white" />
                    ) : (
                      <Text style={styles.avatarText}>{getInitial(student.name)}</Text>
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentEmail}>{student.email}</Text>
                    {hasGrade && (
                      <Text style={styles.gradeText}>
                        Mi calificación: {student.my_grade}/{student.max_grade}
                      </Text>
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
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: '#64748b',
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
  studentCard: {
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
  studentCardPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 4,
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
});

import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { robleGroupService } from "../../../core/services/robleGroupService";
import { robleUserService } from "../../../core/services/robleUserService";

interface Student {
  _id: string;
  name: string;
  email: string;
  student_id: string;
}

interface AddStudentToGroupModalProps {
  visible: boolean;
  onClose: () => void;
  group: {
    _id: string;
    name: string;
  };
  category: {
    _id: string;
    course_id: string;
  };
  onSuccess: () => void;
}

export function AddStudentToGroupModal({
  visible,
  onClose,
  group,
  category,
  onSuccess,
}: AddStudentToGroupModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingStudent, setAddingStudent] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadAvailableStudents();
    }
  }, [visible]);

  const loadAvailableStudents = async () => {
    setIsLoading(true);
    try {
      // Obtener estudiantes disponibles (que no estén en ningún grupo de esta categoría)
      const availableStudents = await robleGroupService.getAvailableStudentsForCategory(
        category._id,
        category.course_id
      );

      // Enriquecer con información del usuario
      const enrichedStudents = await Promise.all(
        availableStudents.map(async (student) => {
          const userInfo = await robleUserService.getUserById(student.student_id || student.user_id);
          return {
            _id: student.student_id || student.user_id,
            student_id: student.student_id || student.user_id,
            name: userInfo?.name || "Usuario sin nombre",
            email: userInfo?.email || "",
          };
        })
      );

      setStudents(enrichedStudents);
    } catch (error) {
      console.error("Error cargando estudiantes disponibles:", error);
      Alert.alert("Error", "No se pudieron cargar los estudiantes disponibles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async (student: Student) => {
    setAddingStudent(student._id);
    try {
      await robleGroupService.joinGroup(group._id, student.student_id);
      
      Alert.alert("Éxito", `${student.name} ha sido agregado al grupo`);
      
      // Actualizar lista removiendo el estudiante agregado
      setStudents(students.filter((s) => s._id !== student._id));
      
      onSuccess();
    } catch (error) {
      console.error("Error agregando estudiante:", error);
      Alert.alert("Error", "No se pudo agregar el estudiante al grupo");
    } finally {
      setAddingStudent(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Añadir Estudiante</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Cargando estudiantes...</Text>
            </View>
          ) : students.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>
                No hay estudiantes disponibles
              </Text>
              <Text style={styles.emptySubtext}>
                Todos los estudiantes ya están asignados a un grupo
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView}>
              {students.map((student) => (
                <View key={student._id} style={styles.studentCard}>
                  <View style={styles.studentInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {student.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.studentDetails}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentId}>
                        {student.email || `ID: ${student.student_id}`}
                      </Text>
                    </View>
                  </View>

                  {addingStudent === student._id ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <Pressable
                      style={({ pressed }) => [
                        styles.addButton,
                        pressed && styles.addButtonPressed,
                      ]}
                      onPress={() => handleAddStudent(student)}
                    >
                      <Text style={styles.addButtonText}>Añadir</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    minHeight: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  scrollView: {
    flex: 1,
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
  },
  studentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    marginBottom: 10,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  studentId: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  addButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addButtonPressed: {
    backgroundColor: "#1d4ed8",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});

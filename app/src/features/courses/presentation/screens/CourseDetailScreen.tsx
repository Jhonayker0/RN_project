import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Share,
  Platform,
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../auth";
import { useCourseDetailController } from "../hooks/useCourseDetailController";
import { ActionButton } from "../components/ActionButton";
import { ActivityCard } from "../components/ActivityCard";

export function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { currentUser } = useAuth();

  const effectiveCourseId = useMemo(() => {
    if (!courseId) return "";
    return Array.isArray(courseId) ? courseId[0] : courseId;
  }, [courseId]);

  const controller = useCourseDetailController(effectiveCourseId, {
    currentUserId:
      currentUser?.uuid ?? (currentUser ? String(currentUser.id) : null),
  });

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/" as any);
    }
  };

  useEffect(() => {
    navigation.setOptions?.({
      title: controller.course?.title ?? 'Curso',
      headerRight: () => (
        <Pressable
          onPress={() => controller.refresh()}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.headerButtonPressed,
          ]}
        >
          <Ionicons name="refresh" size={24} color="#2563eb" />
        </Pressable>
      ),
    });
  }, [controller.course?.title, navigation, controller]);

  if (!effectiveCourseId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>No se proporcionó el curso.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (controller.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  if (controller.error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{controller.error}</Text>
          <ActionButton label="Reintentar" onPress={controller.refresh} />
        </View>
      </SafeAreaView>
    );
  }

  if (!controller.course) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Curso no encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCopyCode = async () => {
    const code = controller.courseCode;
    if (!code) {
      Alert.alert("Código no disponible", "Este curso aún no tiene código.");
      return;
    }

    try {
      await Clipboard.setStringAsync(code);
      Alert.alert(
        "Código copiado",
        "Comparte este código con tus estudiantes."
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo copiar el código."
      );
    }
  };

  const handleShareCode = async () => {
    const code = controller.courseCode;
    if (!code) {
      Alert.alert("Código no disponible", "Este curso aún no tiene código.");
      return;
    }

    try {
      await Share.share({
        message: `Únete a mi curso usando el código ${code}.`,
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo compartir el código."
      );
    }
  };

  const handleCreateActivity = () => {
    router.push({
      pathname: "/activities/create",
      params: { courseId: effectiveCourseId },
    } as any);
  };

  const handleCreateCategory = () => {
    // Navegar a crear categoría pasando el courseId
    router.push({
      pathname: "/categories/create",
      params: { courseId: effectiveCourseId },
    } as any);
  };

  const handleCategoryPress = (categoryId: string) => {
    // Navegar a ver detalle de categoría
    router.push({
      pathname: "/categories/detail/[categoryId]",
      params: { categoryId, courseId: effectiveCourseId },
    } as any);
  };

  const handleDeleteCourse = () => {
    Alert.alert(
      "Eliminar curso",
      "¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await controller.deleteCourse();
              Alert.alert(
                "Curso eliminado",
                "El curso se ha eliminado correctamente."
              );
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/" as any);
              }
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "No se pudo eliminar el curso."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={controller.isRefreshing}
            onRefresh={controller.refresh}
            tintColor="#2563eb"
          />
        }
      >
        <View style={styles.navRow}>
          <Pressable onPress={goBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#1f2937" />
            <Text style={styles.backLabel}>Volver</Text>
          </Pressable>
        </View>

        {controller.activeTab === "activities" && (
          <ActivitiesSection
            activities={controller.activities}
            stats={controller.activityStats}
            isProfessor={controller.isProfessor}
            currentUserId={currentUser?.uuid ?? (currentUser ? String(currentUser.id) : '')}
            onCreateActivity={handleCreateActivity}
            onRefresh={controller.refresh}
          />
        )}

        {controller.activeTab === "students" && (
          <StudentsSection
            students={controller.students}
            isProfessor={controller.isProfessor}
            onInvite={handleCopyCode}
            onShare={handleShareCode}
            onRefresh={controller.refresh}
          />
        )}

        {controller.activeTab === "categories" && (
          <CategoriesSection
            categories={controller.categories}
            isProfessor={controller.isProfessor}
            onCreateCategory={handleCreateCategory}
            onCategoryPress={handleCategoryPress}
            onRefresh={controller.refresh}
          />
        )}

        {controller.activeTab === "info" && (
          <InfoSection
            course={controller.course}
            isProfessor={controller.isProfessor}
            onDeleteCourse={handleDeleteCourse}
            isDeleting={controller.isDeleting}
            onCopyCode={handleCopyCode}
            onShareCode={handleShareCode}
            activityStats={controller.activityStats}
            studentsCount={controller.course.studentCount}
            courseCode={controller.courseCode ?? null}
          />
        )}
      </ScrollView>
      <BottomTabBar
        activeTab={controller.activeTab}
        onChange={controller.changeTab}
      />
    </SafeAreaView>
  );
}

type CourseTab = "activities" | "students" | "categories" | "info";

interface BottomTabBarProps {
  activeTab: CourseTab;
  onChange: (tab: CourseTab) => void;
}

function BottomTabBar({ activeTab, onChange }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabs: { key: CourseTab; label: string }[] = [
    { key: "activities", label: "Actividades" },
    { key: "students", label: "Estudiantes" },
    { key: "categories", label: "Categorías" },
    { key: "info", label: "Información" },
  ];

  return (
    <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Text
            key={tab.key}
            style={[
              styles.bottomTabItem,
              isActive ? styles.bottomTabItemActive : null,
            ]}
            onPress={() => onChange(tab.key)}
          >
            {tab.label}
          </Text>
        );
      })}
    </View>
  );
}

interface ActivitiesSectionProps {
  activities: Record<string, any>[];
  stats: { total: number; pending: number; overdue: number };
  isProfessor: boolean;
  currentUserId: string;
  onCreateActivity: () => void;
  onRefresh?: () => void;
}

function ActivitiesSection({
  activities,
  stats,
  isProfessor,
  currentUserId,
  onCreateActivity,
  onRefresh,
}: ActivitiesSectionProps) {
  if (!activities.length) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actividades</Text>
          {onRefresh && (
            <Pressable
              onPress={onRefresh}
              style={({ pressed }) => [
                styles.refreshIconButton,
                pressed && styles.refreshIconButtonPressed,
              ]}
            >
              <Ionicons name="refresh" size={20} color="#2563eb" />
            </Pressable>
          )}
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No hay actividades registradas en este curso.
          </Text>
          {isProfessor ? (
            <ActionButton label="Crear actividad" onPress={onCreateActivity} />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Actividades ({stats.total})</Text>
          <Text style={styles.sectionSubtitle}>
            Pendientes: {stats.pending} · Vencidas: {stats.overdue}
          </Text>
        </View>
        {onRefresh && (
          <Pressable
            onPress={onRefresh}
            style={({ pressed }) => [
              styles.refreshIconButton,
              pressed && styles.refreshIconButtonPressed,
            ]}
          >
            <Ionicons name="refresh" size={20} color="#2563eb" />
          </Pressable>
        )}
      </View>
      {isProfessor ? (
        <ActionButton
          label="Crear nueva actividad"
          onPress={onCreateActivity}
          variant="secondary"
        />
      ) : null}
      <View style={styles.cardList}>
        {activities.map((activity) => {
          const id = (activity["_id"] ?? activity["id"]) as string;
          return (
            <ActivityCard
              key={id}
              activity={activity}
              isProfessor={isProfessor}
              currentUserId={currentUserId}
            />
          );
        })}
      </View>
    </View>
  );
}

interface StudentsSectionProps {
  students: Record<string, any>[];
  isProfessor: boolean;
  onInvite: () => void;
  onShare: () => void;
  onRefresh?: () => void;
}

function StudentsSection({
  students,
  isProfessor,
  onInvite,
  onShare,
  onRefresh,
}: StudentsSectionProps) {
  if (!students.length) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Participantes</Text>
          {onRefresh && (
            <Pressable
              onPress={onRefresh}
              style={({ pressed }) => [
                styles.refreshIconButton,
                pressed && styles.refreshIconButtonPressed,
              ]}
            >
              <Ionicons name="refresh" size={20} color="#2563eb" />
            </Pressable>
          )}
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Aún no hay estudiantes inscritos en este curso.
          </Text>
          {isProfessor ? (
            <View style={styles.emptyStateActions}>
              <ActionButton label="Copiar código" onPress={onInvite} />
              <ActionButton
                label="Compartir"
                onPress={onShare}
                variant="secondary"
              />
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Participantes ({students.length})</Text>
        {onRefresh && (
          <Pressable
            onPress={onRefresh}
            style={({ pressed }) => [
              styles.refreshIconButton,
              pressed && styles.refreshIconButtonPressed,
            ]}
          >
            <Ionicons name="refresh" size={20} color="#2563eb" />
          </Pressable>
        )}
      </View>
      {isProfessor ? (
        <View style={styles.sectionActions}>
          <ActionButton label="Copiar código" onPress={onInvite} />
          <ActionButton
            label="Compartir"
            onPress={onShare}
            variant="secondary"
          />
        </View>
      ) : null}
      <View style={styles.cardList}>
        {students.map((student) => {
          const id = (student["_id"] ??
            student["id"] ??
            Math.random().toString()) as string;
          const name = (student["name"] ??
            student["email"] ??
            "Estudiante") as string;
          const role = (student["role"] ?? "estudiante") as string;

          const initials = name
            .split(" ")
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <View key={id} style={[styles.card, styles.studentCard]}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>{initials || "?"}</Text>
              </View>
              <View style={styles.studentInfo}>
                <View style={styles.studentHeader}>
                  <Text style={styles.cardTitle}>{name}</Text>
                  <View style={styles.roleChip}>
                    <Text style={styles.roleChipText}>
                      {role.toLowerCase() === "profesor"
                        ? "Profesor"
                        : "Estudiante"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>{student["email"] ?? ""}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface CategoriesSectionProps {
  categories: Record<string, any>[];
  isProfessor: boolean;
  onCreateCategory: () => void;
  onCategoryPress?: (categoryId: string) => void;
  onRefresh?: () => void;
}

function CategoriesSection({
  categories,
  isProfessor,
  onCreateCategory,
  onCategoryPress,
  onRefresh,
}: CategoriesSectionProps) {
  if (!categories.length) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          {onRefresh && (
            <Pressable
              onPress={onRefresh}
              style={({ pressed }) => [
                styles.refreshIconButton,
                pressed && styles.refreshIconButtonPressed,
              ]}
            >
              <Ionicons name="refresh" size={20} color="#2563eb" />
            </Pressable>
          )}
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Todavía no se han configurado categorías.
          </Text>
          {isProfessor ? (
            <ActionButton label="Crear categoría" onPress={onCreateCategory} />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categorías ({categories.length})</Text>
        {onRefresh && (
          <Pressable
            onPress={onRefresh}
            style={({ pressed }) => [
              styles.refreshIconButton,
              pressed && styles.refreshIconButtonPressed,
            ]}
          >
            <Ionicons name="refresh" size={20} color="#2563eb" />
          </Pressable>
        )}
      </View>
      {isProfessor ? (
        <ActionButton
          label="Nueva categoría"
          onPress={onCreateCategory}
          variant="secondary"
        />
      ) : null}
      <View style={styles.cardList}>
        {categories.map((category) => {
          const id = (category["_id"] ?? category["id"]) as string;
          const name = (category["name"] ?? "Categoría") as string;
          const type = (category["type"] ?? "Sin tipo") as string;
          const activityCount = category["activity_count"] ?? 0;
          const groupCount = category["group_count"] ?? 0;
          return (
            <Pressable
              key={id}
              style={styles.card}
              onPress={() => onCategoryPress?.(id)}
            >
              <View style={styles.categoryHeader}>
                <Text style={styles.cardTitle}>{name}</Text>
                <View style={styles.categoryTypeChip}>
                  <Text style={styles.categoryTypeText}>{type}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                Actividades: {activityCount} · Grupos: {groupCount}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface InfoSectionProps {
  course: CourseDetail;
  isProfessor: boolean;
  onDeleteCourse: () => void;
  isDeleting: boolean;
  onCopyCode: () => void;
  onShareCode: () => void;
  activityStats: { total: number; pending: number; overdue: number };
  studentsCount: number;
  courseCode: string | null;
}

interface CourseDetail {
  title: string;
  description: string;
  professorId: string;
  role: string;
  createdAt: Date;
  studentCount: number;
  id?: string;
}

function InfoSection({
  course,
  isProfessor,
  onDeleteCourse,
  isDeleting,
  onCopyCode,
  onShareCode,
  activityStats,
  studentsCount,
  courseCode,
}: InfoSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardHeading}>Información del curso</Text>
        <View style={styles.infoFieldGroup}>
          <InfoField label="Nombre" value={course.title} emphasized />
          <InfoField
            label="Descripción"
            value={course.description || "Sin descripción"}
          />
          <InfoField label="Tu rol" value={course.role} />
          <InfoField
            label="Total de estudiantes"
            value={String(studentsCount)}
          />
          <InfoField
            label="Fecha de creación"
            value={formatDate(course.createdAt)}
          />
          <InfoField label="Código" value={courseCode ?? "-"} code />
          <InfoField label="Profesor ID" value={course.professorId} />
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsHeading}>Estadísticas</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total de actividades</Text>
            <Text style={styles.statValue}>{activityStats.total}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Estudiantes inscritos</Text>
            <Text style={styles.statValue}>{studentsCount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.quickActionsHeading}>Acciones rápidas</Text>
        <View style={styles.quickActionsRow}>
          <ActionButton
            label="Copiar código"
            onPress={onCopyCode}
            variant="secondary"
          />
          <ActionButton
            label="Compartir código"
            onPress={onShareCode}
            variant="secondary"
          />
        </View>
      </View>

      {isProfessor ? (
        <View style={styles.deleteBlock}>
          <Text style={styles.deleteHeading}>Administración del curso</Text>
          <ActionButton
            label={isDeleting ? "Eliminando..." : "Eliminar curso"}
            onPress={onDeleteCourse}
            disabled={isDeleting}
            variant="danger"
          />
          <Text style={styles.deleteHint}>
            Esta acción eliminará el curso y sus inscripciones asociadas.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

interface InfoFieldProps {
  label: string;
  value: string;
  emphasized?: boolean;
  code?: boolean;
}

function InfoField({ label, value, emphasized, code }: InfoFieldProps) {
  return (
    <View style={styles.infoField}>
      <Text style={styles.infoFieldLabel}>{label}</Text>
      <Text
        style={[
          styles.infoFieldValue,
          emphasized ? styles.infoFieldValueEmphasized : null,
          code ? styles.infoFieldValueCode : null,
        ]}
        numberOfLines={code ? 1 : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

function formatDate(value: unknown): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value as any);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 24,
    paddingBottom: 140,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  headerButtonPressed: {
    opacity: 0.5,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  backLabel: {
    color: "#1f2937",
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  bottomTabItem: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    color: "#6b7280",
    paddingVertical: 6,
  },
  bottomTabItemActive: {
    color: "#1d4ed8",
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  sectionSubtitle: {
    color: "#4b5563",
  },
  refreshIconButton: {
    padding: 4,
    borderRadius: 8,
  },
  refreshIconButtonPressed: {
    backgroundColor: "#e5e7eb",
  },
  sectionActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 6,
    flexDirection: "column",
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#bfdbfe",
    alignItems: "center",
    justifyContent: "center",
  },
  studentAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  studentInfo: {
    flex: 1,
    gap: 4,
  },
  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  roleChip: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleChipText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  cardMeta: {
    color: "#4b5563",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  emptyStateText: {
    color: "#6b7280",
  },
  emptyStateActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  infoCard: {
    backgroundColor: "#fdf2f8",
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  infoCardHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  infoFieldGroup: {
    gap: 12,
  },
  infoField: {
    gap: 4,
  },
  infoFieldLabel: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoFieldValue: {
    color: "#111827",
    fontSize: 16,
    lineHeight: 22,
  },
  infoFieldValueEmphasized: {
    fontWeight: "700",
    fontSize: 18,
  },
  infoFieldValueCode: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    letterSpacing: 0.6,
  },
  statsCard: {
    backgroundColor: "#eef2ff",
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  statsHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  statItem: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: "#1f2937",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statLabel: {
    color: "#4b5563",
    fontWeight: "600",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  quickActions: {
    backgroundColor: "#ecfeff",
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  quickActionsHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  deleteBlock: {
    marginTop: 24,
    gap: 8,
  },
  deleteHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7f1d1d",
  },
  deleteHint: {
    color: "#6b7280",
    fontSize: 13,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryTypeChip: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTypeText: {
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});

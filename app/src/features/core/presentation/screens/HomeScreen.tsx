import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import {
  useHomeController,
  HomeCourse,
  SortOption,
} from "../controllers/useHomeController";

interface HomeScreenProps {
  currentUserName?: string;
  currentUserId?: string | null;
  onCreateCourse?: () => void;
  onJoinCourse?: () => void;
  onSelectCourse?: (course: HomeCourse) => void;
  onLogout?: () => void;
  refreshTrigger?: number;
}

export function HomeScreen({
  currentUserName,
  currentUserId,
  onCreateCourse,
  onJoinCourse,
  onSelectCourse,
  onLogout,
  refreshTrigger,
}: HomeScreenProps) {
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const controller = useHomeController({
    currentUserName,
    currentUserId,
    onLogout,
  });

  const reloadCourses = controller.reload;

  useFocusEffect(
    useCallback(() => {
      void reloadCourses();
    }, [reloadCourses])
  );

  // Refresh when refreshTrigger changes
  useFocusEffect(
    useCallback(() => {
      if (refreshTrigger && refreshTrigger > 0) {
        void reloadCourses();
      }
    }, [refreshTrigger, reloadCourses])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.appBarRow}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <Text style={styles.userName}>{controller.currentUserName}</Text>
          </View>
          <View style={styles.appBarActions}>
            <Pressable style={styles.iconButton} onPress={onJoinCourse}>
              <Ionicons name="enter-outline" size={20} color="#111827" />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={controller.logout}>
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            </Pressable>
          </View>
        </View>
        <View style={styles.actionsRow}>
          <TextInput
            placeholder="Buscar cursos..."
            value={controller.searchQuery}
            onChangeText={controller.setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#6b7280"
          />
          <Pressable
            onPress={() => setSortVisible(true)}
            style={styles.sortButton}
          >
            <Ionicons name="swap-vertical" size={18} color="#1d4ed8" />
            <Text style={styles.sortLabel}>{controller.sortLabel}</Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterVisible(true)}
            style={styles.filterButton}
          >
            <Ionicons name="filter" size={18} color="#1d4ed8" />
            <Text style={styles.filterLabel}>Filtrar</Text>
          </Pressable>
        </View>
        {controller.activeRoleFilter && (
          <View style={styles.chipRow}>
            <Pressable onPress={controller.clearRoleFilter} style={styles.chip}>
              <Text style={styles.chipText}>
                Filtro: {controller.activeRoleFilterLabel}
              </Text>
              <Ionicons name="close" size={16} color="#1f2937" />
            </Pressable>
          </View>
        )}
      </View>

      {controller.error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color="#b91c1c" />
          <Text style={styles.errorText}>{controller.error}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Tus cursos</Text>
      <FlatList
        data={controller.courses}
        keyExtractor={(course) => `${course.id ?? course.title}`}
        contentContainerStyle={styles.listContent}
        refreshing={controller.isLoading}
        onRefresh={controller.reload}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            {controller.isLoading ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <Text style={styles.emptyStateText}>Sin resultados</Text>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectCourse?.(item)}
            style={({ pressed }) => [
              styles.card,
              pressed ? styles.cardPressed : undefined,
            ]}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="book" size={20} color="#fff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>Rol: {item.role}</Text>
              <Text style={styles.cardMeta}>
                Estudiantes: {item.students ?? 0}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={onCreateCourse}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.fabLabel}>Crear curso</Text>
      </Pressable>

      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setFilterVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar por rol</Text>
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                controller.setRoleFilter("Profesor");
                setFilterVisible(false);
              }}
            >
              <Ionicons name="school" size={20} color="#1f2937" />
              <Text style={styles.modalOptionLabel}>Profesor</Text>
            </Pressable>
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                controller.setRoleFilter("Estudiante");
                setFilterVisible(false);
              }}
            >
              <Ionicons name="person" size={20} color="#1f2937" />
              <Text style={styles.modalOptionLabel}>Estudiante</Text>
            </Pressable>
            {controller.activeRoleFilter && (
              <Pressable
                style={[styles.modalOption, styles.modalOptionDanger]}
                onPress={() => {
                  controller.clearRoleFilter();
                  setFilterVisible(false);
                }}
              >
                <Ionicons name="close-circle" size={20} color="#dc2626" />
                <Text
                  style={[
                    styles.modalOptionLabel,
                    styles.modalOptionDangerLabel,
                  ]}
                >
                  Borrar filtro
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={sortVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSortVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSortVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ordenar por</Text>
            {(
              [
                { label: "Nombre A-Z", value: SortOption.nameAsc },
                { label: "Nombre Z-A", value: SortOption.nameDesc },
                { label: "Más recientes", value: SortOption.dateDesc },
                { label: "Más antiguos", value: SortOption.dateAsc },
                { label: "Más estudiantes", value: SortOption.studentsDesc },
                { label: "Menos estudiantes", value: SortOption.studentsAsc },
              ] as const
            ).map((option) => (
              <Pressable
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  controller.setSortOption(option.value);
                  setSortVisible(false);
                }}
              >
                <Text style={styles.modalOptionLabel}>{option.label}</Text>
                {controller.currentSort === option.value && (
                  <Ionicons name="checkmark" size={16} color="#2563eb" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    marginBottom: 16,
  },
  appBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  appBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sortLabel: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
  filterLabel: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
  chipRow: {
    marginTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  chipText: {
    color: "#1f2937",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errorText: {
    color: "#991b1b",
    fontWeight: "500",
    flex: 1,
  },
  listContent: {
    paddingBottom: 96,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  cardSubtitle: {
    marginTop: 4,
    color: "#6b7280",
  },
  cardMeta: {
    marginTop: 4,
    color: "#9ca3af",
    fontSize: 12,
  },
  emptyState: {
    marginTop: 32,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#6b7280",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    gap: 8,
    shadowColor: "#2563eb",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabLabel: {
    color: "#fff",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  modalOptionLabel: {
    fontSize: 16,
    color: "#111827",
  },
  modalOptionDanger: {
    marginTop: 4,
  },
  modalOptionDangerLabel: {
    color: "#dc2626",
  },
});

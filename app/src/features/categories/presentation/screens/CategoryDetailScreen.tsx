import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCategoryDetailController } from "../hooks/useCategoryDetailController";
import { GroupsModal } from "../components/GroupsModal";
import { ManageGroupsModal } from "../components/ManageGroupsModal";

// Pantalla de detalle de categoría
export default function CategoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId: string }>();
  const categoryId = params.categoryId ?? "";

  const controller = useCategoryDetailController(categoryId);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showManageGroupsModal, setShowManageGroupsModal] = useState(false);

  // TODO: Obtener rol del usuario desde contexto de auth
  const isProfessor = true; // Por ahora hardcoded, después obtener del contexto

  useEffect(() => {
    if (!categoryId) {
      Alert.alert("Error", "ID de categoría no válido");
      router.back();
    }
  }, [categoryId, router]);

  if (controller.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Cargando categoría...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (controller.error || !controller.category) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {controller.error ?? "Categoría no encontrada"}
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const category = controller.category;

  const handleEdit = () => {
    router.push({
      pathname: "/categories/[categoryId]",
      params: { categoryId },
    } as any);
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar categoría",
      "¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await controller.deleteCategory();
              Alert.alert("Éxito", "Categoría eliminada");
              router.back();
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "No se pudo eliminar la categoría"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1f2937" />
            </Pressable>
            <Text style={styles.title}>Detalle de Categoría</Text>
          </View>

          {/* Category Info Card */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Nombre</Text>
              <Text style={styles.value}>{category.name}</Text>
            </View>

            {category.description ? (
              <View style={styles.row}>
                <Text style={styles.label}>Descripción</Text>
                <Text style={styles.value}>{category.description}</Text>
              </View>
            ) : null}

            <View style={styles.row}>
              <Text style={styles.label}>Tipo</Text>
              <View style={styles.typeChip}>
                <Text style={styles.typeText}>{category.type ?? "Sin tipo"}</Text>
              </View>
            </View>

            {category.capacity ? (
              <View style={styles.row}>
                <Text style={styles.label}>Capacidad por grupo</Text>
                <Text style={styles.value}>{category.capacity}</Text>
              </View>
            ) : null}

            <View style={styles.row}>
              <Text style={styles.label}>Cantidad de grupos</Text>
              <Text style={styles.value}>{category.group_count ?? 0}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Actividades asociadas</Text>
              <Text style={styles.value}>{category.activity_count ?? 0}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {/* Ver Grupos Button */}
            <Pressable
              style={({ pressed }) => [
                styles.viewGroupsButton,
                pressed && styles.viewGroupsButtonPressed,
              ]}
              onPress={() => setShowGroupsModal(true)}
            >
              <Ionicons name="people-outline" size={20} color="#2563eb" />
              <Text style={styles.viewGroupsButtonText}>Ver Grupos</Text>
            </Pressable>

            {/* Gestionar Grupos Button - Solo Profesores */}
            {isProfessor && (
              <Pressable
                style={({ pressed }) => [
                  styles.manageGroupsButton,
                  pressed && styles.manageGroupsButtonPressed,
                ]}
                onPress={() => setShowManageGroupsModal(true)}
              >
                <Ionicons name="settings-outline" size={20} color="#10b981" />
                <Text style={styles.manageGroupsButtonText}>Gestionar Grupos</Text>
              </Pressable>
            )}

            {/* Edit Button - Solo Profesores */}
            {isProfessor && (
              <Pressable
                style={({ pressed }) => [
                  styles.editButton,
                  pressed && styles.editButtonPressed,
                ]}
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={20} color="#ffffff" />
                <Text style={styles.editButtonText}>Editar</Text>
              </Pressable>
            )}

            {/* Delete Button - Solo Profesores */}
            {isProfessor && (
              <Pressable
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.deleteButtonPressed,
                  controller.isDeleting && styles.deleteButtonDisabled,
                ]}
                onPress={handleDelete}
                disabled={controller.isDeleting}
              >
                {controller.isDeleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={20} color="#ffffff" />
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Groups Modal */}
      <GroupsModal
        visible={showGroupsModal}
        onClose={() => setShowGroupsModal(false)}
        category={category}
      />

      {/* Manage Groups Modal */}
      <ManageGroupsModal
        visible={showManageGroupsModal}
        onClose={() => setShowManageGroupsModal(false)}
        category={category}
        onUpdate={controller.refresh}
      />
    </SafeAreaView>
  );
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
    padding: 20,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  typeChip: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  typeText: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  actions: {
    gap: 12,
  },
  viewGroupsButton: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  viewGroupsButtonPressed: {
    backgroundColor: "#dbeafe",
  },
  viewGroupsButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
  manageGroupsButton: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  manageGroupsButtonPressed: {
    backgroundColor: "#dcfce7",
  },
  manageGroupsButtonText: {
    color: "#10b981",
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  editButtonPressed: {
    backgroundColor: "#1d4ed8",
  },
  editButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  deleteButtonPressed: {
    backgroundColor: "#b91c1c",
  },
  deleteButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

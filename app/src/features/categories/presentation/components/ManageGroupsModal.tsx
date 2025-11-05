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
import { ManageGroupCard } from "./ManageGroupCard";
import { CreateGroupModal } from "./CreateGroupModal";

interface ManageGroupsModalProps {
  visible: boolean;
  onClose: () => void;
  category: {
    _id: string;
    name: string;
    capacity?: number;
    type?: string;
    course_id: string;
  } | null;
  onUpdate: () => void;
}

export function ManageGroupsModal({
  visible,
  onClose,
  category,
  onUpdate,
}: ManageGroupsModalProps) {
  const [groups, setGroups] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (visible && category) {
      loadGroups();
    }
  }, [visible, category]);

  const loadGroups = async () => {
    if (!category) return;

    setIsLoading(true);
    try {
      const data = await robleGroupService.getGroupsByCategory(category._id);
      setGroups(data);
    } catch (error) {
      console.error("Error cargando grupos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setShowCreateModal(true);
  };

  const handleGroupCreated = () => {
    setShowCreateModal(false);
    loadGroups();
    onUpdate();
  };

  if (!category) return null;

  const isRandom = category.type?.toLowerCase() === "aleatorio";

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
            <Text style={styles.title}>Gestionar Grupos</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Category Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoIcon}>
              <Ionicons
                name={isRandom ? "shuffle" : "hand-right"}
                size={20}
                color={isRandom ? "#f59e0b" : "#2563eb"}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Tipo: {category.type}</Text>
              <Text style={styles.infoSubtitle}>
                {isRandom
                  ? "Asignación automática de estudiantes"
                  : "Los estudiantes pueden elegir su grupo"}
              </Text>
            </View>
          </View>

          {/* Create Group Button */}
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.createButtonPressed,
              ]}
              onPress={handleCreateGroup}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.createButtonText}>Crear Grupo</Text>
            </Pressable>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Cargando grupos...</Text>
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No hay grupos creados</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView}>
              {groups.map((group) => (
                <ManageGroupCard
                  key={group._id}
                  group={group as any}
                  category={{
                    _id: category._id,
                    capacity: category.capacity,
                    course_id: category.course_id,
                  }}
                  onUpdate={() => {
                    loadGroups();
                    onUpdate();
                  }}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        category={category}
        onSuccess={handleGroupCreated}
      />
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
    maxWidth: 600,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
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
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9fafb",
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  infoSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  actionsRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  createButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonPressed: {
    backgroundColor: "#059669",
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    padding: 16,
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
    gap: 12,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 16,
  },
});

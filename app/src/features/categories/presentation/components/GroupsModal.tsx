import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { robleGroupService } from "../../../core/services/robleGroupService";
import { GroupCard } from "./GroupCard";

// Modal para mostrar grupos de una categoría
interface GroupsModalProps {
  visible: boolean;
  onClose: () => void;
  category: {
    _id: string;
    name: string;
    capacity?: number;
    type?: string;
  } | null;
}

export function GroupsModal({ visible, onClose, category }: GroupsModalProps) {
  const [groups, setGroups] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  if (!category) return null;

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
            <Text style={styles.title}>Grupos</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Cargando grupos...</Text>
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No hay grupos en esta categoría</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView}>
              {groups.map((group) => (
                <GroupCard
                  key={group._id}
                  group={group as any}
                  category={category}
                  onUpdate={loadGroups}
                />
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
    maxWidth: 600,
    maxHeight: "80%",
    overflow: "hidden",
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

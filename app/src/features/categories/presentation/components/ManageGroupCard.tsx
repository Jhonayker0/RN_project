import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { robleGroupService } from "../../../core/services/robleGroupService";
import { EditGroupModal } from "./EditGroupModal";
import { AddStudentToGroupModal } from "./AddStudentToGroupModal";

interface Member {
  _id: string;
  name: string;
  email: string;
}

interface Group {
  _id: string;
  name: string;
  description?: string;
  members: Member[];
}

interface ManageGroupCardProps {
  group: Group;
  category: {
    _id: string;
    capacity?: number;
    course_id: string;
  };
  onUpdate: () => void;
}

export function ManageGroupCard({
  group,
  category,
  onUpdate,
}: ManageGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const memberCount = group.members?.length || 0;
  const capacity = category.capacity || 0;
  const percentage = capacity > 0 ? (memberCount / capacity) * 100 : 0;

  const getPercentageColor = () => {
    if (percentage >= 100) return "#ef4444";
    if (percentage >= 80) return "#f97316";
    if (percentage >= 60) return "#eab308";
    return "#10b981";
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Eliminar Grupo",
      `¿Estás seguro de que deseas eliminar el grupo "${group.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await robleGroupService.deleteGroup(group._id);
              onUpdate();
            } catch (error) {
              console.error("Error eliminando grupo:", error);
              Alert.alert("Error", "No se pudo eliminar el grupo");
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      "Eliminar Estudiante",
      `¿Deseas eliminar a ${memberName} del grupo?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setRemovingMember(memberId);
            try {
              await robleGroupService.removeMemberFromGroup(
                group._id,
                memberId
              );
              onUpdate();
            } catch (error) {
              console.error("Error eliminando miembro:", error);
              Alert.alert("Error", "No se pudo eliminar el estudiante");
            } finally {
              setRemovingMember(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <Pressable
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name={expanded ? "chevron-down" : "chevron-forward"}
            size={20}
            color="#6b7280"
          />
          <Text style={styles.groupName}>{group.name}</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.capacityBadge}>
            <Text style={[styles.capacityText, { color: getPercentageColor() }]}>
              {memberCount}/{capacity}
            </Text>
          </View>

          <Pressable
            style={styles.actionButton}
            onPress={() => setShowEditModal(true)}
          >
            <Ionicons name="pencil" size={20} color="#2563eb" />
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={handleDeleteGroup}
          >
            <Ionicons name="trash" size={20} color="#ef4444" />
          </Pressable>
        </View>
      </Pressable>

      {/* Description */}
      {group.description && (
        <Text style={styles.description}>{group.description}</Text>
      )}

      {/* Members List (when expanded) */}
      {expanded && (
        <View style={styles.membersContainer}>
          {/* Header con botón Añadir */}
          <View style={styles.membersHeader}>
            <Text style={styles.membersTitle}>Miembros:</Text>
            <Pressable
              style={({ pressed }) => [
                styles.addStudentButton,
                pressed && styles.addStudentButtonPressed,
              ]}
              onPress={() => setShowAddStudentModal(true)}
            >
              <Ionicons name="person-add" size={16} color="#ffffff" />
              <Text style={styles.addStudentButtonText}>Añadir</Text>
            </Pressable>
          </View>

          {memberCount === 0 ? (
            <Text style={styles.emptyMembers}>No hay estudiantes en este grupo</Text>
          ) : (
            group.members?.map((member) => (
              <View key={member._id} style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {member.name?.charAt(0).toUpperCase() || "?"}
                    </Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{member.name || "Sin nombre"}</Text>
                    <Text style={styles.memberEmail}>{member.email || ""}</Text>
                  </View>
                </View>

                {removingMember === member._id ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => handleRemoveMember(member._id, member.name || "este estudiante")}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </Pressable>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {/* Edit Modal */}
      <EditGroupModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        group={group}
        onSuccess={() => {
          setShowEditModal(false);
          onUpdate();
        }}
      />

      {/* Add Student Modal */}
      <AddStudentToGroupModal
        visible={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        group={{ _id: group._id, name: group.name }}
        category={{ _id: category._id, course_id: category.course_id }}
        onSuccess={() => {
          setShowAddStudentModal(false);
          onUpdate();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  capacityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  capacityText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  membersContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: 16,
    gap: 12,
  },
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  addStudentButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addStudentButtonPressed: {
    backgroundColor: "#1d4ed8",
  },
  addStudentButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyMembers: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  memberEmail: {
    fontSize: 12,
    color: "#6b7280",
  },
  removeButton: {
    padding: 4,
  },
});

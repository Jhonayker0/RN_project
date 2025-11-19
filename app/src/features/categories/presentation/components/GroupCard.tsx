import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { robleUserService } from "../../../core/services/robleUserService";

// Card expandible para mostrar un grupo y sus miembros
interface GroupCardProps {
  group: {
    _id: string;
    name: string;
    description?: string;
    members: any[];
    member_count: number;
  };
  category: {
    capacity?: number;
    type?: string;
  };
  onUpdate: () => void;
}

export function GroupCard({ group, category, onUpdate }: GroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [membersInfo, setMembersInfo] = useState<Record<string, any>[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const capacity = category.capacity ?? 5;
  const memberCount = group.member_count;
  const capacityPercentage = capacity > 0
    ? Math.round((memberCount / capacity) * 100)
    : 0;

  const getPercentageColor = () => {
    if (capacityPercentage >= 100) return "#dc2626";
    if (capacityPercentage >= 80) return "#f59e0b";
    if (capacityPercentage >= 60) return "#eab308";
    return "#10b981";
  };

  const handleToggle = async () => {
    if (!expanded && group.members.length > 0 && membersInfo.length === 0) {
      setLoadingMembers(true);
      try {
        // Cargar información de los miembros
        const info = await Promise.all(
          group.members.map(async (member) => {
            const userInfo = await robleUserService.getUserById(member.student_id);
            return {
              ...member,
              user: userInfo,
            };
          })
        );
        setMembersInfo(info);
      } catch (error) {
        console.error("Error cargando info de miembros:", error);
      } finally {
        setLoadingMembers(false);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={handleToggle} style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={18} color="#2563eb" />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.name}>{group.name}</Text>
          {group.description && (
            <Text style={styles.description} numberOfLines={1}>
              {group.description}
            </Text>
          )}
          <View style={styles.statsRow}>
            <Ionicons name="people-outline" size={14} color="#6b7280" />
            <Text style={styles.statsText}>
              {memberCount}/{capacity} miembros
            </Text>
            <Text
              style={[
                styles.percentage,
                { color: getPercentageColor() },
              ]}
            >
              ({capacityPercentage}%)
            </Text>
          </View>
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={24}
          color="#6b7280"
        />
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          
          {loadingMembers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Cargando miembros...</Text>
            </View>
          ) : group.members.length === 0 ? (
            <Text style={styles.emptyText}>No hay miembros en este grupo</Text>
          ) : (
            <View style={styles.membersContainer}>
              <Text style={styles.membersTitle}>Miembros:</Text>
              {membersInfo.map((member, index) => (
                <View key={member._id || index} style={styles.memberItem}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={16} color="#2563eb" />
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.user?.name || "Usuario sin nombre"}
                    </Text>
                    <Text style={styles.memberBadge}>Estudiante</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
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
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  description: {
    fontSize: 12,
    color: "#6b7280",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  statsText: {
    fontSize: 12,
    color: "#6b7280",
  },
  percentage: {
    fontSize: 12,
    fontWeight: "600",
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },
  membersContainer: {
    gap: 8,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  memberBadge: {
    fontSize: 12,
    color: "#2563eb",
    marginTop: 2,
  },
});

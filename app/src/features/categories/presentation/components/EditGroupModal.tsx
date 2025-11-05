import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { robleGroupService } from "../../../core/services/robleGroupService";

interface EditGroupModalProps {
  visible: boolean;
  onClose: () => void;
  group: {
    _id: string;
    name: string;
    description?: string;
  };
  onSuccess: () => void;
}

export function EditGroupModal({
  visible,
  onClose,
  group,
  onSuccess,
}: EditGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(group.name);
      setDescription(group.description || "");
    }
  }, [visible, group]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre del grupo es requerido");
      return;
    }

    setIsUpdating(true);
    try {
      await robleGroupService.updateGroup(group._id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      onSuccess();
    } catch (error) {
      console.error("Error actualizando grupo:", error);
      Alert.alert("Error", "No se pudo actualizar el grupo");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Editar Grupo</Text>
            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isUpdating}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nombre <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nombre del grupo"
                editable={!isUpdating}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción del grupo"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isUpdating}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              onPress={handleClose}
              disabled={isUpdating}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.updateButton,
                pressed && styles.updateButtonPressed,
                isUpdating && styles.updateButtonDisabled,
              ]}
              onPress={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                  <Text style={styles.updateButtonText}>Guardar</Text>
                </>
              )}
            </Pressable>
          </View>
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
    maxWidth: 400,
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
  form: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  required: {
    color: "#ef4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  },
  textArea: {
    minHeight: 80,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  cancelButtonPressed: {
    backgroundColor: "#e5e7eb",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#2563eb",
  },
  updateButtonPressed: {
    backgroundColor: "#1d4ed8",
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

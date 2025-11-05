import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useActivitiesController } from "../hooks/useActivitiesController";
import DateTimePicker from "@react-native-community/datetimepicker";

// Pantalla para crear una nueva actividad
export default function CreateActivityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId: string }>();
  const courseId = params.courseId ?? "";

  const controller = useActivitiesController(courseId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }

    if (!courseId) {
      Alert.alert("Error", "No se pudo determinar el curso");
      return;
    }

    try {
      await controller.createActivity({
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate,
        course_id: courseId,
        category_id: categoryId || undefined,
      });

      Alert.alert("Éxito", "Actividad creada exitosamente", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "No se pudo crear la actividad"
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1f2937" />
            </Pressable>
            <Text style={styles.title}>Crear Actividad</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Título <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ingresa el título de la actividad"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción opcional"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Due Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Fecha de entrega</Text>
              <Pressable
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {dueDate
                    ? dueDate.toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Seleccionar fecha"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              </Pressable>
              {dueDate && (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => setDueDate(undefined)}
                >
                  <Text style={styles.clearButtonText}>Limpiar fecha</Text>
                </Pressable>
              )}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
              />
            )}

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.label}>Categoría</Text>
              <View style={styles.categoryList}>
                <Pressable
                  style={[
                    styles.categoryOption,
                    !categoryId && styles.categoryOptionSelected,
                  ]}
                  onPress={() => setCategoryId("")}
                >
                  <View
                    style={[
                      styles.radio,
                      !categoryId && styles.radioSelected,
                    ]}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      !categoryId && styles.categoryTextSelected,
                    ]}
                  >
                    Sin categoría
                  </Text>
                </Pressable>

                {controller.categories.map((category: Record<string, any>) => {
                  const id = category._id ?? category.id;
                  const name = category.name ?? "Categoría";
                  const isSelected = categoryId === id;

                  return (
                    <Pressable
                      key={id}
                      style={[
                        styles.categoryOption,
                        isSelected && styles.categoryOptionSelected,
                      ]}
                      onPress={() => setCategoryId(id)}
                    >
                      <View
                        style={[
                          styles.radio,
                          isSelected && styles.radioSelected,
                        ]}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          isSelected && styles.categoryTextSelected,
                        ]}
                      >
                        {name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                controller.isCreating && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={controller.isCreating}
            >
              <Text style={styles.submitButtonText}>
                {controller.isCreating ? "Creando..." : "Crear Actividad"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  required: {
    color: "#dc2626",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dateButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#111827",
  },
  clearButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  clearButtonText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
  },
  categoryList: {
    gap: 12,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  categoryOptionSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
  },
  radioSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#2563eb",
  },
  categoryText: {
    fontSize: 16,
    color: "#374151",
  },
  categoryTextSelected: {
    color: "#1e40af",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonPressed: {
    backgroundColor: "#1d4ed8",
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

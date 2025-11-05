import { useCallback, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "./HomeScreen";
import { HomeCourse } from "../controllers/useHomeController";

interface MainScreenProps {
  onLogout?: () => void;
  currentUserName?: string;
  currentUserId?: string | null;
}

export function MainScreen({
  onLogout,
  currentUserName,
  currentUserId,
}: MainScreenProps) {
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateCourse = useCallback(() => {
    router.push("/courses/create" as any);
  }, [router]);

  const handleJoinCourse = useCallback(() => {
    router.push("/courses/join" as any);
  }, [router]);

  const handleSelectCourse = useCallback(
    (course: HomeCourse) => {
      if (!course.id) return;
      router.push({
        pathname: "/courses/[courseId]",
        params: { courseId: course.id },
      } as any);
    },
    [router]
  );

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.title}>Explorar</Text>
        <Pressable
          onPress={handleRefresh}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.refreshButtonPressed,
          ]}
        >
          <Ionicons name="refresh" size={24} color="#2563eb" />
        </Pressable>
      </View>
      <HomeScreen
        onLogout={onLogout}
        onCreateCourse={handleCreateCourse}
        onJoinCourse={handleJoinCourse}
        onSelectCourse={handleSelectCourse}
        currentUserName={currentUserName}
        currentUserId={currentUserId}
        refreshTrigger={refreshTrigger}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonPressed: {
    opacity: 0.5,
  },
});

/**
 * Activity Logger Utility
 * 
 * This utility provides functions to log user activities in the application.
 * It can be used to track important actions like creating exams, adding users, etc.
 */

// Activity types
export enum ActivityType {
  EXAM_CREATED = "exam_created",
  EXAM_UPDATED = "exam_updated",
  EXAM_PUBLISHED = "exam_published",
  EXAM_DELETED = "exam_deleted",
  EXAM_SHARED = "exam_shared",
  EXAM_ATTEMPT_COMPLETED = "exam_attempt_completed",
  QUESTION_POOL_CREATED = "question_pool_created",
  QUESTION_POOL_UPDATED = "question_pool_updated",
  QUESTION_POOL_DELETED = "question_pool_deleted",
  USER_CREATED = "user_created",
  USER_UPDATED = "user_updated",
  USER_DELETED = "user_deleted",
  SETTINGS_UPDATED = "settings_updated",
  MODEL_CREATED = "model_created",
  MODEL_UPDATED = "model_updated",
  MODEL_DELETED = "model_deleted",
  PROVIDER_CREATED = "provider_created",
  PROVIDER_UPDATED = "provider_updated",
  PROVIDER_DELETED = "provider_deleted",
}

// Entity types
export enum EntityType {
  EXAM = "exam",
  QUESTION_POOL = "question_pool",
  USER = "user",
  SETTINGS = "settings",
  MODEL = "model",
  PROVIDER = "provider",
}

// Activity interface
export interface ActivityData {
  type: ActivityType;
  title: string;
  description?: string;
  entityId?: string;
  entityType?: EntityType;
  metadata?: any;
}

/**
 * Log an activity
 * @param data Activity data
 * @returns Promise<Response>
 */
export async function logActivity(data: ActivityData): Promise<Response> {
  try {
    const response = await fetch("/api/dashboard/activities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error("Failed to log activity:", await response.json());
    }

    return response;
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
}

/**
 * Get activity icon and color based on activity type
 * @param type Activity type
 * @returns Object with icon and color
 */
export function getActivityTypeInfo(type: string): { icon: string; color: string } {
  switch (type) {
    case ActivityType.EXAM_CREATED:
    case ActivityType.EXAM_UPDATED:
    case ActivityType.EXAM_PUBLISHED:
    case ActivityType.EXAM_DELETED:
    case ActivityType.EXAM_SHARED:
      return { icon: "FileText", color: "bg-blue-500" };
    
    case ActivityType.EXAM_ATTEMPT_COMPLETED:
      return { icon: "CheckCircle", color: "bg-green-500" };
    
    case ActivityType.QUESTION_POOL_CREATED:
    case ActivityType.QUESTION_POOL_UPDATED:
    case ActivityType.QUESTION_POOL_DELETED:
      return { icon: "BookOpen", color: "bg-purple-500" };
    
    case ActivityType.USER_CREATED:
    case ActivityType.USER_UPDATED:
    case ActivityType.USER_DELETED:
      return { icon: "Users", color: "bg-amber-500" };
    
    case ActivityType.SETTINGS_UPDATED:
      return { icon: "Settings2", color: "bg-slate-500" };
    
    case ActivityType.MODEL_CREATED:
    case ActivityType.MODEL_UPDATED:
    case ActivityType.MODEL_DELETED:
    case ActivityType.PROVIDER_CREATED:
    case ActivityType.PROVIDER_UPDATED:
    case ActivityType.PROVIDER_DELETED:
      return { icon: "Sparkles", color: "bg-indigo-500" };
    
    default:
      return { icon: "Activity", color: "bg-gray-500" };
  }
}

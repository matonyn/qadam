// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  studentId: string;
  avatar?: string;
  createdAt: string;
}

// Navigation types
export interface Building {
  id: string;
  name: string;
  shortName: string;
  description: string;
  latitude: number;
  longitude: number;
  floors: number;
  hasElevator: boolean;
  hasRamp: boolean;
  category: 'academic' | 'residential' | 'dining' | 'library' | 'sports' | 'admin' | 'other';
  imageUrl?: string;
}

export interface Room {
  id: string;
  buildingId: string;
  name: string;
  floor: number;
  type: 'classroom' | 'lab' | 'office' | 'study_room' | 'restroom' | 'elevator' | 'stairs' | 'other';
  capacity?: number;
  accessible: boolean;
}

export interface Route {
  id: string;
  startLocation: { latitude: number; longitude: number; name: string };
  endLocation: { latitude: number; longitude: number; name: string };
  distance: number; // in meters
  duration: number; // in minutes
  isAccessible: boolean;
  crowdLevel: 'low' | 'medium' | 'high';
  waypoints: { latitude: number; longitude: number }[];
  instructions: string[];
}

export type RoutePreference = 'shortest' | 'accessible' | 'least_crowded';

// Events
export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  buildingId?: string;
  startDate: string;
  endDate: string;
  category: 'academic' | 'social' | 'sports' | 'cultural' | 'career' | 'other';
  imageUrl?: string;
  organizer: string;
  isRegistrationRequired: boolean;
  registrationUrl?: string;
}

// Discounts
export interface Discount {
  id: string;
  vendorName: string;
  vendorLogo?: string;
  title: string;
  description: string;
  discountPercentage: number;
  category: 'food' | 'entertainment' | 'shopping' | 'services' | 'travel' | 'other';
  validUntil: string;
  code?: string;
  terms: string;
  isVerified: boolean;
}

// Reviews
export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  targetId: string;
  targetType: 'building' | 'room' | 'cafe' | 'service';
  targetName: string;
  rating: number;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  helpful: number;
  createdAt: string;
}

// Academic
export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  grade?: string;
  gradePoints?: number;
  semester: string;
  instructor: string;
  schedule: CourseSchedule[];
}

export interface CourseSchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  room: string;
  buildingId: string;
}

export interface AcademicPlan {
  totalCreditsRequired: number;
  creditsCompleted: number;
  creditsInProgress: number;
  gpa: number;
  standing: 'good' | 'probation' | 'dean_list';
  expectedGraduation: string;
  major: string;
  minor?: string;
}

// Planner
export interface PlannerEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'class' | 'study' | 'meeting' | 'event' | 'reminder' | 'other';
  location?: string;
  buildingId?: string;
  color: string;
  isRecurring: boolean;
  reminderMinutes?: number;
}

// Study Rooms
export interface StudyRoom {
  id: string;
  buildingId: string;
  buildingName: string;
  name: string;
  floor: number;
  capacity: number;
  amenities: string[];
  isAvailable: boolean;
  currentOccupancy: number;
  noiseLevel: 'quiet' | 'moderate' | 'collaborative';
  imageUrl?: string;
}

export interface StudyRoomBooking {
  id: string;
  roomId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

// Settings
export interface UserSettings {
  notifications: {
    events: boolean;
    discounts: boolean;
    classReminders: boolean;
    campusAlerts: boolean;
  };
  accessibility: {
    preferAccessibleRoutes: boolean;
    highContrast: boolean;
    largeText: boolean;
  };
  privacy: {
    shareLocation: boolean;
    anonymousMode: boolean;
  };
  language: 'en' | 'kz' | 'ru';
  theme: 'light' | 'dark' | 'system';
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

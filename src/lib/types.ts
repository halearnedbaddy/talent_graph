export interface UserAccount {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  creationTimestamp: string;
  isEmailVerified: boolean;
  role?: 'athlete' | 'scout' | 'club' | 'admin';
  profileCompleted?: boolean;
  onboardingStep?: string;
  updatedAt?: string;
  loginHistory?: string[];
  subscribeToEmails?: boolean;
}

export interface MetricEntry {
  value: number;
  unit: string;
  measuredAt: string;
  method: 'self-reported' | 'tested';
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface MatchEntry {
  id: string;
  competition: string;
  apps: number;
  minutes: number;
  rating: number; // 1-10
  goals: number;
  assists: number;
  shots: number;
  duelsWon: number;
  fouls: number;
  saves: number;
  yellowCards: number;
  redCards: number;
  isVerified: boolean;
  updatedAt: string;
  clubMatchId?: string; // Links back to institutional record if applicable
  statsLogged?: boolean; // True if the athlete has filled in the data
}

export interface AttributeScores {
  Technical: Record<string, number>; // 1-10
  Mental: Record<string, number>;    // 1-10
  Physical: Record<string, number>;  // 1-10
}

export interface AthleteProfile {
  uid: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  nickname?: string;
  jerseyNumber?: string;
  sport: string;
  position?: string;
  altPositions?: string[];
  dominantFoot?: 'Left' | 'Right' | 'Both';
  team?: string;
  affiliatedClubId?: string;
  age: number;
  heightCm: number;
  weightKg: number;
  username: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  isVerified?: boolean;
  photoUrl?: string;
  
  minutesPlayed: number;
  leagueCoefficient: number;
  yellowCards: number;
  redCards: number;

  matchHistory?: MatchEntry[];
  detailedAttributes?: AttributeScores;
  attributesVerified?: boolean;
  
  rawMetrics?: {
    [metricId: string]: MetricEntry[];
  };

  performanceIndex?: number;
  efficiencyIndex?: number;
  consistencyIndex?: number;
  contextIndex?: number;
  developmentIndex?: number;
  riskIndex?: number;

  talentGraphScore?: number;
  compositeScoutingIndex?: number;
  
  metricScores?: {
    [metricName: string]: number;
  };
  readinessTier?: 'Developing' | 'Semi-Pro' | 'Pro' | 'Raw' | 'Elite' | 'Advanced';
  bio?: string;
  highlightVideoUrl?: string;
  highlightVideoTitle?: string;
  likeCount?: number;
}

export interface ProfileView {
  viewerId: string;
  viewerName: string;
  viewerRole: string;
  viewedAt: string;
}

export interface ProfileComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface ProfileReaction {
  userId: string;
  athleteId: string;
  likedAt: string;
}

export interface AthleteNotification {
  id: string;
  type: 'profile_view' | 'like' | 'comment';
  actorName: string;
  actorRole: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ScoutProfile {
  uid: string;
  name: string;
  username: string;
  entityType: 'individual' | 'organization';
  clubId?: string;
  bio?: string;
  website?: string;
  sports?: string[];
  profileCompleted: boolean;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClubProfile {
  uid: string;
  clubName: string;
  logoUrl?: string;
  sportFocus: string[];
  location: string;
  contactEmail: string;
  contactPhone?: string;
  websiteLinks?: string[];
  profileCompleted: boolean;
  isVerified?: boolean;
  createdAt: string;
  onboardingCompletedAt: string;
  settings?: ClubSettings;
}

export interface ClubSettings {
  seasons: string[];
  competitions: string[];
  drillFocuses: string[];
  equipment: string[];
  absenceReasons: string[];
  courtType: 'grass' | 'futsal';
}

export interface ClubMember {
  id: string; 
  userId: string;
  clubId: string;
  role: 'admin' | 'scout';
  status: 'pending' | 'active';
  joinedAt: string;
}

export interface ClubMatch {
  id: string;
  clubId: string;
  competition: string;
  opponent: string;
  date: string;
  location: string;
  result?: 'W' | 'L' | 'D';
  score?: string;
  createdAt: string;
}

export interface MatchInvitation {
  id: string;
  athleteId: string;
  matchId: string;
  clubId: string;
  status: 'pending' | 'confirmed' | 'declined';
  matchData: {
    competition: string;
    opponent: string;
    date: string;
    location: string;
  };
  createdAt: string;
}

export interface PracticeSession {
  id: string;
  clubId: string;
  name: string;
  location: string;
  date: string;
  time: string;
  season: string;
  repeat: boolean;
  drills: string[]; // IDs from library
  attendance: Record<string, 'present' | 'absent' | 'late'>;
  createdAt: string;
}

export interface Drill {
  id: string;
  clubId: string;
  name: string;
  description: string;
  focus: string;
  equipment: string[];
}

export interface ClubConversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: string;
}

export interface ClubMessage {
  id: string;
  senderId: string;
  clubId: string;
  content: string;
  timestamp: string;
}

export interface ScoutConnection {
  id: string;
  scoutId: string;
  athleteId: string;
  clubId?: string;
  status: 'pending' | 'accepted' | 'declined';
  recruitment_stage: 'connected' | 'evaluating' | 'shortlisted' | 'offer_extended' | 'signed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  isReported?: boolean;
  reportReason?: string;
  reportedBy?: string;
  reportedAt?: string;
}

export interface VerificationRequest {
  id: string;
  targetUid: string;
  targetType: 'scout' | 'club';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  linkedInUrl: string;
  nationalIdUrl: string;
  registrationDocUrl?: string;
}

export interface ScoutAthleteData {
  id: string;
  notes?: string;
  aiScoutSummary?: {
    text: string;
    generatedAt: string;
    version: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface SupportThread {
  id: string;
  userId: string;
  adminId: string;
  status: 'pending' | 'accepted' | 'closed';
  lastMessage?: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface WaitingListEntry {
  id: string;
  uid: string;
  name: string;
  email: string;
  primarySport: string;
  age: number;
  position?: string;
  team?: string;
  createdAt: string;
  notified: boolean;
}
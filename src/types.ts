export interface Project {
  id?: string;
  name: string;
  locationName: string;
  lat: number;
  lng: number;
  description: string;
  status: 'abandoned' | 'reviving' | 'active';
  category: 'Water' | 'Land' | 'Air' | 'Wildlife' | 'Urban';
  imageUrl?: string;
  failureReason: string;
  resourceGap: string;
  revivalScore: number;
  successProbability: number;
  diagnosis: string;
  revivalPlan: string[];
  impactMetrics: {
    wasteRemoved: number;
    treesRestored: number;
    waterQualityImprovement: number;
  };
  authorUid: string;
  volunteerUids: string[];
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'user' | 'admin';
  createdAt: any;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

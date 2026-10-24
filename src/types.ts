export type Language = 'en' | 'ur';

export type DepartmentType =
  | 'Haematology'
  | 'Biochemistry'
  | 'Microbiology'
  | 'Immunology'
  | 'Histopathology'
  | 'Clinical Pathology'
  | 'Cytology'
  | 'Hormone'
  | 'Procedures & X-Ray';

export interface LabTest {
  id: string;
  code: string;
  name: string;
  nameUr?: string;
  department: DepartmentType;
  price: number;
  sampleType: string;
  turnaround: string;
  fastingRequired: boolean;
  popular: boolean;
  active: boolean;
}

export interface HealthPackage {
  id: string;
  code: string;
  name: string;
  nameUr: string;
  targetAudience: string;
  targetAudienceUr: string;
  description: string;
  descriptionUr: string;
  includedTests: string[];
  originalPrice: number;
  packagePrice: number;
  turnaround: string;
  homeCollectionFree: boolean;
  active: boolean;
}

export interface BookingItem {
  id: string;
  type: 'test' | 'package';
  code: string;
  name: string;
  department?: string;
  turnaround: string;
  price: number;
}

export interface ReportParameter {
  parameter: string;
  result: string;
  unit: string;
  referenceRange: string;
  flag: 'Normal' | 'High' | 'Low' | 'Positive' | 'Negative';
}

export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Sample Collected'
  | 'Processing'
  | 'Report Ready'
  | 'Completed'
  | 'Cancelled';

export type PaymentStatus = 'Unpaid' | 'Paid' | 'Partial';

export interface BookingRecord {
  id: string;
  verificationPin: string;
  patientName: string;
  patientPhone: string;
  patientAge: string;
  patientGender: 'Male' | 'Female' | 'Other';
  collectionType: 'lab_visit' | 'home_collection';
  address: string;
  preferredDate: string;
  preferredTime: string;
  doctorRef: string;
  notes: string;
  items: BookingItem[];
  subtotal: number;
  homeCollectionFee: number;
  discount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  reportPublished: boolean;
  reportPublishedAt?: string;
  reportResults: ReportParameter[];
  reportRemarks?: string;
  verifiedBy?: string;
  prescriptionImage?: string;
  prescriptionFileName?: string;
}

export interface ReviewRecord {
  id: string;
  patientName: string;
  location: string;
  serviceUsed: string;
  rating: number;
  comment: string;
  bookingId?: string;
  verifiedPatient: boolean;
  approved: boolean;
  createdAt: string;
}

export interface LabSettings {
  labName: string;
  labNameUr: string;
  subtitle: string;
  subtitleUr: string;
  tagline: string;
  taglineUr: string;
  managingDirector: string;
  managingDirectorUr: string;
  primaryPhone: string;
  secondaryPhone: string;
  whatsappNumber: string;
  address: string;
  addressUr: string;
  timings: string;
  timingsUr: string;
  specialNoticeEn: string;
  specialNoticeUr: string;
  homeCollectionFee: number;
  freeHomeCollectionThreshold: number;
}

export interface PublicBootstrapData {
  settings: LabSettings;
  tests: LabTest[];
  packages: HealthPackage[];
  reviews: ReviewRecord[];
}

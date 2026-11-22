export type UserRole = 'CUSTOMER' | 'SALON_OWNER' | 'ADMIN';

export type BookingStatus =
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'WAITING'
  | 'CALLED'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SKIPPED'
  | 'NO_SHOW'
  | 'EXPIRED';

export type BookingSource = 'ONLINE' | 'WALK_IN';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  ownedSalons?: Array<{
    id: string;
    name: string;
    slug: string;
    locality: string;
    isOpen: boolean;
  }>;
}

export interface Salon {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  coverImage?: string | null;
  logoImage?: string | null;
  openingTime: string;
  closingTime: string;
  weeklyClosingDays: string;
  categories: string[];
  isOpen: boolean;
  isPaused: boolean;
  pauseReason?: string | null;
  averageRating: number;
  reviewCount: number;
  distanceMeters?: number;
  distanceFormatted?: string;
  startingPrice?: number;
  estimatedWaitMinutes?: number;
  currentQueueCount?: number;
  availableBarbersCount?: number;
  services?: Service[];
  staff?: Staff[];
  reviews?: Review[];
}

export interface Service {
  id: string;
  salonId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface Staff {
  id: string;
  salonId: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  phone?: string | null;
  isAvailable: boolean;
  isActive: boolean;
  currentBookingId?: string | null;
}

export interface Booking {
  id: string;
  salonId: string;
  customerId?: string | null;
  walkInCustomerName?: string | null;
  walkInCustomerPhone?: string | null;
  staffId?: string | null;
  bookingNumber: string;
  tokenNumber: string;
  bookingSource: BookingSource;
  status: BookingStatus;
  scheduledDate: string;
  totalDurationMinutes: number;
  totalPrice: number;
  commissionRate: number;
  commissionAmount: number;
  customerNotes?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  salon?: Salon;
  staff?: Staff;
  bookingServices?: Array<{
    id: string;
    serviceNameSnapshot: string;
    priceSnapshot: number;
    durationSnapshot: number;
  }>;
}

export interface QueuePosition {
  booking: Booking;
  status: BookingStatus;
  position: number;
  customersAhead: number;
  estimatedWaitMinutes: number;
  isPaused?: boolean;
  pauseReason?: string;
  message: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  ownerReply?: string;
  createdAt: string;
  customer?: {
    name: string;
    avatarUrl?: string;
  };
}

import { PrismaClient, UserRole, BookingStatus, BookingSource } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Kanpur showcase seed data injection...');

  // Clean existing seed data
  await prisma.commissionAdjustment.deleteMany();
  await prisma.commissionLedger.deleteMany();
  await prisma.queueEvent.deleteMany();
  await prisma.bookingEvent.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.queueCounter.deleteMany();
  await prisma.staffBreak.deleteMany();
  await prisma.staffService.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.service.deleteMany();
  await prisma.salonPhoto.deleteMany();
  await prisma.salonHoliday.deleteMany();
  await prisma.salonBusinessHours.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.notificationOutbox.deleteMany();
  await prisma.supportRequest.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Create Demo Customer
  const demoCustomer = await prisma.user.create({
    data: {
      phone: '9876543210',
      email: 'customer@queuecut.com',
      passwordHash,
      name: 'Aarav Sharma',
      role: UserRole.CUSTOMER,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      notificationPref: {
        create: {
          bookingUpdates: true,
          queueAlerts: true,
          soundEnabled: true,
        },
      },
    },
  });

  // 2. Create Demo Salon Owner
  const demoOwner = await prisma.user.create({
    data: {
      phone: '9876501234',
      email: 'owner@queuecut.com',
      passwordHash,
      name: 'Rajesh Verma',
      role: UserRole.SALON_OWNER,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      notificationPref: {
        create: {
          bookingUpdates: true,
          queueAlerts: true,
          soundEnabled: true,
        },
      },
    },
  });

  // Additional mock owners for other salons
  const mockOwners = await Promise.all([
    prisma.user.create({
      data: {
        phone: '9811122233',
        email: 'vikram.salon@gmail.com',
        passwordHash,
        name: 'Vikram Malhotra',
        role: UserRole.SALON_OWNER,
      },
    }),
    prisma.user.create({
      data: {
        phone: '9822233344',
        email: 'amit.barber@gmail.com',
        passwordHash,
        name: 'Amit Gupta',
        role: UserRole.SALON_OWNER,
      },
    }),
  ]);

  console.log('👤 Users created: Demo Customer and Demo Salon Owners');

  // 3. Kanpur Salons (10 Diverse Salons across Kanpur localities)
  const salonsData = [
    {
      ownerId: demoOwner.id,
      name: 'Royal Heritage Salon & Grooming',
      slug: 'royal-heritage-salon-civil-lines',
      description: 'Premium men & unisex luxury grooming lounge offering precision cuts, beard architecture, and revitalizing facials.',
      address: '14/112, Mall Road, Near Phool Bagh, Civil Lines',
      locality: 'Civil Lines',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208001',
      latitude: 26.4729,
      longitude: 80.3458,
      phone: '9876501234',
      email: 'contact@royalheritagekanpur.com',
      coverImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80',
      logoImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&auto=format&fit=crop&q=80',
      openingTime: '09:00',
      closingTime: '21:30',
      weeklyClosingDays: 'Tuesday',
      categories: 'Haircut,Beard,Facial,Grooming,Hair Styling',
      isOpen: true,
      isPaused: false,
      averageRating: 4.9,
      reviewCount: 148,
      commissionRate: 5.0,
    },
    {
      ownerId: mockOwners[0].id,
      name: 'Classic Cuts Barbershop',
      slug: 'classic-cuts-swaroop-nagar',
      description: 'Contemporary urban grooming studio specializing in fade haircuts, sharp beard shaping, and quick walk-ins.',
      address: 'Plot 7, Arya Nagar Crossing, Swaroop Nagar',
      locality: 'Swaroop Nagar',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208002',
      latitude: 26.4785,
      longitude: 80.3168,
      phone: '9811122233',
      email: 'swaroopcuts@gmail.com',
      coverImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
      logoImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&auto=format&fit=crop&q=80',
      openingTime: '09:30',
      closingTime: '21:00',
      weeklyClosingDays: 'Tuesday',
      categories: 'Haircut,Beard,Hair Wash',
      isOpen: true,
      isPaused: false,
      averageRating: 4.7,
      reviewCount: 92,
      commissionRate: 5.0,
    },
    {
      ownerId: mockOwners[1].id,
      name: 'Urban Blade Men Lounge',
      slug: 'urban-blade-kakadeo',
      description: 'Popular student & youth friendly salon right in Kakadeo coaching hub. Fast, sharp, and value-for-money cuts.',
      address: 'Deoki Nagar, Near Coaching Market, Kakadeo',
      locality: 'Kakadeo',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208025',
      latitude: 26.4850,
      longitude: 80.2980,
      phone: '9822233344',
      email: 'urbanblade.kno@gmail.com',
      coverImage: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80',
      logoImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&auto=format&fit=crop&q=80',
      openingTime: '08:30',
      closingTime: '22:00',
      weeklyClosingDays: 'None',
      categories: 'Haircut,Beard,Head Massage,Facial',
      isOpen: true,
      isPaused: false,
      averageRating: 4.6,
      reviewCount: 215,
      commissionRate: 5.0,
    },
    {
      ownerId: demoOwner.id,
      name: 'Scissors & Combs Studio',
      slug: 'scissors-combs-gumti-5',
      description: 'Established 15-year-old family salon in the bustling Gumti market, known for friendly barbers and traditional hot towel shave.',
      address: '80 Feet Road, Near Gurudwara, Gumti No. 5',
      locality: 'Gumti No. 5',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208012',
      latitude: 26.4680,
      longitude: 80.3120,
      phone: '9833344455',
      email: 'gumtisalon@yahoo.com',
      coverImage: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=800&auto=format&fit=crop&q=80',
      logoImage: null,
      openingTime: '09:00',
      closingTime: '21:00',
      weeklyClosingDays: 'Tuesday',
      categories: 'Haircut,Beard,Shave,Hair Spa',
      isOpen: true,
      isPaused: false,
      averageRating: 4.5,
      reviewCount: 88,
      commissionRate: 5.0,
    },
    {
      ownerId: mockOwners[0].id,
      name: 'Gentlemen Hub & Spa',
      slug: 'gentlemen-hub-kidwai-nagar',
      description: 'Full-service grooming parlour with air-conditioned lounge, organic hair spas, and expert beard stylists.',
      address: 'Block K, Near Deep Cinema, Kidwai Nagar',
      locality: 'Kidwai Nagar',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208011',
      latitude: 26.4250,
      longitude: 80.3280,
      phone: '9844455566',
      email: 'kidwaihub@gmail.com',
      coverImage: 'https://images.unsplash.com/photo-1593702295094-aea22597af65?w=800&auto=format&fit=crop&q=80',
      logoImage: null,
      openingTime: '10:00',
      closingTime: '21:00',
      weeklyClosingDays: 'Wednesday',
      categories: 'Haircut,Beard,Facial,Grooming,Hair Spa',
      isOpen: true,
      isPaused: false,
      averageRating: 4.8,
      reviewCount: 110,
      commissionRate: 5.0,
    },
    {
      ownerId: mockOwners[1].id,
      name: 'Vogue Hair & Skin Clinic',
      slug: 'vogue-hair-skin-tilak-nagar',
      description: 'Upscale unisex studio with trichology consultants and celebrity hair stylists.',
      address: 'Parwati Bagla Road, Tilak Nagar',
      locality: 'Tilak Nagar',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208002',
      latitude: 26.4890,
      longitude: 80.3200,
      phone: '9855566677',
      email: 'voguekanpur@outlook.com',
      coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
      logoImage: null,
      openingTime: '10:00',
      closingTime: '20:30',
      weeklyClosingDays: 'Monday',
      categories: 'Haircut,Hair Styling,Facial,Hair Spa,Skin Care',
      isOpen: true,
      isPaused: false,
      averageRating: 4.9,
      reviewCount: 164,
      commissionRate: 5.0,
    },
    {
      ownerId: demoOwner.id,
      name: 'Express Barber Corner',
      slug: 'express-barber-mall-road',
      description: 'Quick in-and-out modern haircut bar located conveniently right off Mall Road commercial street.',
      address: 'Opposite Somdutt Plaza, Mall Road',
      locality: 'Mall Road',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208001',
      latitude: 26.4640,
      longitude: 80.3540,
      phone: '9866677788',
      email: 'expresscuts@gmail.com',
      coverImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
      logoImage: null,
      openingTime: '08:00',
      closingTime: '22:00',
      weeklyClosingDays: 'None',
      categories: 'Haircut,Beard,Shave',
      isOpen: true,
      isPaused: false,
      averageRating: 4.4,
      reviewCount: 76,
      commissionRate: 5.0,
    },
    {
      ownerId: mockOwners[0].id,
      name: 'The Barber Project',
      slug: 'the-barber-project-arya-nagar',
      description: 'Artisanal haircutting & beard grooming shop emphasizing clean lines, hygiene, and curated grooming products.',
      address: 'Main Market Road, Near Swaroop Nagar Boundary, Arya Nagar',
      locality: 'Arya Nagar',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208002',
      latitude: 26.4830,
      longitude: 80.3110,
      phone: '9877788899',
      email: 'barberproject@gmail.com',
      coverImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80',
      logoImage: null,
      openingTime: '09:00',
      closingTime: '21:00',
      weeklyClosingDays: 'Tuesday',
      categories: 'Haircut,Beard,Grooming',
      isOpen: true,
      isPaused: false,
      averageRating: 4.8,
      reviewCount: 134,
      commissionRate: 5.0,
    },
    {
      ownerId: mockOwners[1].id,
      name: 'New Look Hair Saloon',
      slug: 'new-look-govind-nagar',
      description: 'Budget-friendly local favorite with skilled barbers, providing classic cuts, beard trims, and champi massages.',
      address: 'Near Nandlal Chauraha, Govind Nagar',
      locality: 'Govind Nagar',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208006',
      latitude: 26.4430,
      longitude: 80.2960,
      phone: '9888899900',
      email: 'newlook.govindnagar@gmail.com',
      coverImage: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80',
      logoImage: null,
      openingTime: '08:30',
      closingTime: '21:30',
      weeklyClosingDays: 'Tuesday',
      categories: 'Haircut,Beard,Head Massage',
      isOpen: true,
      isPaused: false,
      averageRating: 4.3,
      reviewCount: 52,
      commissionRate: 5.0,
    },
    {
      ownerId: demoOwner.id,
      name: 'Envy Mens Salon & Spa',
      slug: 'envy-mens-salon-lajpat-nagar',
      description: 'Boutique men grooming salon featuring imported chair stations, sterilizer units, and scalp wellness treatments.',
      address: 'Opposite Central Park, Lajpat Nagar',
      locality: 'Lajpat Nagar',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      postalCode: '208005',
      latitude: 26.4740,
      longitude: 80.3090,
      phone: '9899900011',
      email: 'envysalon.kanpur@gmail.com',
      coverImage: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=800&auto=format&fit=crop&q=80',
      logoImage: null,
      openingTime: '10:00',
      closingTime: '21:00',
      weeklyClosingDays: 'Wednesday',
      categories: 'Haircut,Beard,Facial,Grooming',
      isOpen: true,
      isPaused: false,
      averageRating: 4.7,
      reviewCount: 98,
      commissionRate: 5.0,
    },
  ];

  for (const s of salonsData) {
    const salon = await prisma.salon.create({
      data: s,
    });

    // 4. Create Standard Services for each salon
    const services = await Promise.all([
      prisma.service.create({
        data: {
          salonId: salon.id,
          name: 'Classic Haircut',
          description: 'Consultation, customized haircut with shears & clippers, neck shave and styling finish.',
          category: 'Haircut',
          price: 150.0,
          durationMinutes: 25,
        },
      }),
      prisma.service.create({
        data: {
          salonId: salon.id,
          name: 'Beard Trim & Shape',
          description: 'Detailed beard sculpting, outline blade edging, and nourishing beard oil finish.',
          category: 'Beard',
          price: 80.0,
          durationMinutes: 15,
        },
      }),
      prisma.service.create({
        data: {
          salonId: salon.id,
          name: 'Haircut & Beard Combo',
          description: 'Complete makeover including precision haircut and sharp beard trim & hot towel wash.',
          category: 'Hair & Beard',
          price: 220.0,
          durationMinutes: 35,
        },
      }),
      prisma.service.create({
        data: {
          salonId: salon.id,
          name: 'Refreshing Hair Wash & Conditioning',
          description: 'Deep scalp cleansing shampoo, cooling menthol conditioner, and blow dry styling.',
          category: 'Hair Styling',
          price: 100.0,
          durationMinutes: 15,
        },
      }),
      prisma.service.create({
        data: {
          salonId: salon.id,
          name: 'Charcoal Glow Facial',
          description: 'Activated charcoal deep pore extraction, exfoliation scrub, and cooling face mask.',
          category: 'Facial',
          price: 350.0,
          durationMinutes: 40,
        },
      }),
      prisma.service.create({
        data: {
          salonId: salon.id,
          name: 'Herbal Scalp Champi / Massage',
          description: 'Traditional ayurvedic Brahmi & Bhringraj oil massage stimulating blood circulation.',
          category: 'Grooming',
          price: 120.0,
          durationMinutes: 20,
        },
      }),
    ]);

    // 5. Create Staff Barbers for each salon
    const staff1 = await prisma.staff.create({
      data: {
        salonId: salon.id,
        name: 'Sameer Khan',
        role: 'Master Barber',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        phone: '9810101010',
        isAvailable: true,
        staffServices: {
          create: services.map((srv) => ({ serviceId: srv.id })),
        },
      },
    });

    const staff2 = await prisma.staff.create({
      data: {
        salonId: salon.id,
        name: 'Sunil Yadav',
        role: 'Senior Stylist',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        phone: '9820202020',
        isAvailable: true,
        staffServices: {
          create: [services[0], services[1], services[2], services[3]].map((srv) => ({
            serviceId: srv.id,
          })),
        },
      },
    });

    const staff3 = await prisma.staff.create({
      data: {
        salonId: salon.id,
        name: 'Deepak Mishra',
        role: 'Hair & Beard Specialist',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
        phone: '9830303030',
        isAvailable: true,
        staffServices: {
          create: [services[0], services[1], services[4]].map((srv) => ({ serviceId: srv.id })),
        },
      },
    });

    // 6. Create realistic business hours
    for (let day = 0; day <= 6; day++) {
      await prisma.salonBusinessHours.create({
        data: {
          salonId: salon.id,
          dayOfWeek: day,
          openTime: s.openingTime,
          closeTime: s.closingTime,
          isClosed: day === 2 && s.weeklyClosingDays.includes('Tuesday'),
        },
      });
    }

    // 7. Seed Reviews
    await prisma.review.create({
      data: {
        salonId: salon.id,
        customerId: demoCustomer.id,
        rating: 5,
        comment: 'Brilliant queue system! Did not have to wait 45 minutes on the bench. Clean styling and polite staff.',
        ownerReply: 'Thank you Aarav! We look forward to serving you again at ' + salon.name,
      },
    });

    // 8. If this is the primary demo salon (Royal Heritage), create some live queue state for today!
    if (salon.slug === 'royal-heritage-salon-civil-lines') {
      const todayStr = new Date().toISOString().split('T')[0];

      // Initialize queue counter
      await prisma.queueCounter.create({
        data: {
          salonId: salon.id,
          businessDate: todayStr,
          lastTokenNumber: 3,
        },
      });

      // Token Q-001 (IN_SERVICE)
      const b1 = await prisma.booking.create({
        data: {
          salonId: salon.id,
          customerId: null,
          walkInCustomerName: 'Rohan Gupta',
          staffId: staff1.id,
          bookingNumber: `QC-${todayStr.replace(/-/g, '')}-101`,
          tokenNumber: 'Q-001',
          bookingSource: BookingSource.WALK_IN,
          status: BookingStatus.IN_SERVICE,
          scheduledDate: todayStr,
          checkInTime: new Date(Date.now() - 25 * 60000),
          serviceStartTime: new Date(Date.now() - 10 * 60000),
          totalPrice: 220.0,
          totalDurationMinutes: 35,
          commissionRate: 0.0,
          customerNotes: 'Walk-in customer',
          bookingServices: {
            create: [
              {
                serviceId: services[2].id,
                serviceNameSnapshot: services[2].name,
                priceSnapshot: services[2].price,
                durationSnapshot: services[2].durationMinutes,
              },
            ],
          },
        },
      });

      // Token Q-002 (CALLED)
      const b2 = await prisma.booking.create({
        data: {
          salonId: salon.id,
          customerId: demoCustomer.id,
          staffId: staff2.id,
          bookingNumber: `QC-${todayStr.replace(/-/g, '')}-102`,
          tokenNumber: 'Q-002',
          bookingSource: BookingSource.ONLINE,
          status: BookingStatus.CALLED,
          scheduledDate: todayStr,
          checkInTime: new Date(Date.now() - 5 * 60000),
          calledTime: new Date(),
          totalPrice: 150.0,
          totalDurationMinutes: 25,
          commissionRate: 5.0,
          bookingServices: {
            create: [
              {
                serviceId: services[0].id,
                serviceNameSnapshot: services[0].name,
                priceSnapshot: services[0].price,
                durationSnapshot: services[0].durationMinutes,
              },
            ],
          },
        },
      });

      // Token Q-003 (WAITING)
      await prisma.booking.create({
        data: {
          salonId: salon.id,
          customerId: null,
          walkInCustomerName: 'Kabir Mehta',
          staffId: staff3.id,
          bookingNumber: `QC-${todayStr.replace(/-/g, '')}-103`,
          tokenNumber: 'Q-003',
          bookingSource: BookingSource.WALK_IN,
          status: BookingStatus.WAITING,
          scheduledDate: todayStr,
          totalPrice: 80.0,
          totalDurationMinutes: 15,
          commissionRate: 0.0,
          bookingServices: {
            create: [
              {
                serviceId: services[1].id,
                serviceNameSnapshot: services[1].name,
                priceSnapshot: services[1].price,
                durationSnapshot: services[1].durationMinutes,
              },
            ],
          },
        },
      });

      console.log('⚡ Initial live queue tokens seeded for Royal Heritage Salon (Q-001 in service, Q-002 called, Q-003 waiting)');
    }
  }

  console.log('✅ Kanpur showcase database seeded successfully with 10 salons and realistic queue state!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

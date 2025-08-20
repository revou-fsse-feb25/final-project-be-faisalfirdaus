// prisma/seed.ts
import {
  PrismaClient,
  Role,
  StudioType,
  MovieStatus,
  BookingStatus,
  PaymentStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- HASHED PASSWORDS ---
  const passwords = await Promise.all(
    [
      'admin123',
      'john123',
      'jane123',
      'mike123',
      'alice123',
      'bob123',
      'eva123',
      'tom123',
    ].map((p) => bcrypt.hash(p, 10)),
  );

  // --- USERS ---
  await prisma.user.createMany({
    data: [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: passwords[0],
        phone: '0811111111',
        role: Role.ADMIN,
      },
      {
        username: 'john',
        email: 'john@example.com',
        password: passwords[1],
        phone: '0822222222',
        role: Role.USER,
      },
      {
        username: 'jane',
        email: 'jane@example.com',
        password: passwords[2],
        phone: '0833333333',
        role: Role.USER,
      },
      {
        username: 'mike',
        email: 'mike@example.com',
        password: passwords[3],
        phone: '0844444444',
        role: Role.USER,
      },
      {
        username: 'alice',
        email: 'alice@example.com',
        password: passwords[4],
        phone: '0855555555',
        role: Role.USER,
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        password: passwords[5],
        phone: '0866666666',
        role: Role.USER,
      },
      {
        username: 'eva',
        email: 'eva@example.com',
        password: passwords[6],
        phone: '0877777777',
        role: Role.USER,
      },
      {
        username: 'tom',
        email: 'tom@example.com',
        password: passwords[7],
        phone: '0888888888',
        role: Role.USER,
      },
    ],
  });

  // --- GENRES ---
  await prisma.genre.createMany({
    data: [
      { name: 'Action' },
      { name: 'Comedy' },
      { name: 'Drama' },
      { name: 'Horror' },
      { name: 'Romance' },
      { name: 'Sci-Fi' },
      { name: 'Thriller' },
      { name: 'Fantasy' },
    ],
  });
  const allGenres = await prisma.genre.findMany();

  // --- MOVIES ---
  const movies = await Promise.all([
    prisma.movie.create({
      data: {
        title: 'The Great Adventure',
        description: 'An epic action-packed journey.',
        duration_minutes: 120,
        poster_url: 'https://example.com/poster1.jpg',
        status: MovieStatus.NOW_SHOWING,
        genres: {
          create: [
            { genre_id: allGenres[0].genre_id },
            { genre_id: allGenres[2].genre_id },
          ],
        },
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Funny Times',
        description: 'A hilarious comedy.',
        duration_minutes: 90,
        poster_url: 'https://example.com/poster2.jpg',
        status: MovieStatus.NOW_SHOWING,
        genres: { create: [{ genre_id: allGenres[1].genre_id }] },
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Tears of Tomorrow',
        description: 'A heartwarming drama.',
        duration_minutes: 110,
        poster_url: 'https://example.com/poster3.jpg',
        status: MovieStatus.NOW_SHOWING,
        genres: { create: [{ genre_id: allGenres[2].genre_id }] },
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Night of Fear',
        description: 'A terrifying horror story.',
        duration_minutes: 100,
        poster_url: 'https://example.com/poster4.jpg',
        status: MovieStatus.ARCHIVED,
        genres: { create: [{ genre_id: allGenres[3].genre_id }] },
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Love & Destiny',
        description: 'A romance across worlds.',
        duration_minutes: 105,
        poster_url: 'https://example.com/poster5.jpg',
        status: MovieStatus.COMING_SOON,
        genres: {
          create: [
            { genre_id: allGenres[4].genre_id },
            { genre_id: allGenres[7].genre_id },
          ],
        },
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Galaxy Wars',
        description: 'An interstellar sci-fi saga.',
        duration_minutes: 140,
        poster_url: 'https://example.com/poster6.jpg',
        status: MovieStatus.NOW_SHOWING,
        genres: { create: [{ genre_id: allGenres[5].genre_id }] },
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Edge of Fear',
        description: 'A thriller that keeps you hooked.',
        duration_minutes: 95,
        poster_url: 'https://example.com/poster7.jpg',
        status: MovieStatus.NOW_SHOWING,
        genres: { create: [{ genre_id: allGenres[6].genre_id }] },
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Kingdom of Magic',
        description: 'A fantasy realm of wonder.',
        duration_minutes: 130,
        poster_url: 'https://example.com/poster8.jpg',
        status: MovieStatus.COMING_SOON,
        genres: { create: [{ genre_id: allGenres[7].genre_id }] },
      },
    }),
  ]);

  // --- MULTIPLE THEATERS (3) ---
  const theaters = await Promise.all([
    prisma.theater.create({
      data: {
        name: 'Cinema XXI - Sudirman',
        address: 'Jl. Sudirman No.1',
        city: 'Jakarta',
        phone: '021111111',
        studios: {
          create: Array.from({ length: 3 }).map((_, s) => ({
            studio_name: `Studio ${s + 1}`,
            total_seats: 20,
            studio_type: [
              StudioType.Regular,
              StudioType.IMAX,
              StudioType.Premier,
            ][s % 3],
            seats: {
              create: Array.from({ length: 20 }).map((_, i) => ({
                seat_number: i + 1,
                row_letter: String.fromCharCode(65 + Math.floor(i / 10)), // A,B
                is_blocked: false,
              })),
            },
          })),
        },
      },
      include: { studios: { include: { seats: true } } },
    }),
    prisma.theater.create({
      data: {
        name: 'CGV Grand Indonesia',
        address: 'Jl. MH Thamrin No.5',
        city: 'Jakarta',
        phone: '021222222',
        studios: {
          create: Array.from({ length: 4 }).map((_, s) => ({
            studio_name: `Studio ${s + 1}`,
            total_seats: 25,
            studio_type: [
              StudioType.Regular,
              StudioType.IMAX,
              StudioType.Regular,
              StudioType.Premier,
            ][s],
            seats: {
              create: Array.from({ length: 25 }).map((_, i) => ({
                seat_number: i + 1,
                row_letter: String.fromCharCode(65 + Math.floor(i / 10)), // A,B,C
                is_blocked: false,
              })),
            },
          })),
        },
      },
      include: { studios: { include: { seats: true } } },
    }),
    prisma.theater.create({
      data: {
        name: 'Cinepolis Mall of Indonesia',
        address: 'Jl. Kelapa Gading No.7',
        city: 'Jakarta',
        phone: '021333333',
        studios: {
          create: Array.from({ length: 3 }).map((_, s) => ({
            studio_name: `Studio ${s + 1}`,
            total_seats: 30,
            studio_type: [
              StudioType.Regular,
              StudioType.Premier,
              StudioType.Regular,
            ][s],
            seats: {
              create: Array.from({ length: 30 }).map((_, i) => ({
                seat_number: i + 1,
                row_letter: String.fromCharCode(65 + Math.floor(i / 10)), // A–C
                is_blocked: false,
              })),
            },
          })),
        },
      },
      include: { studios: { include: { seats: true } } },
    }),
  ]);

  const allStudios = theaters.flatMap((t) => t.studios);

  // --- SHOWTIMES ---
  const showtimes = await Promise.all(
    movies.map((m, i) =>
      prisma.showtime.create({
        data: {
          movie_id: m.movie_id,
          studio_id: allStudios[i % allStudios.length].studio_id,
          show_datetime: new Date(Date.now() + (i + 1) * 86400000),
          price: 45000 + i * 5000,
        },
      }),
    ),
  );

  // --- BOOKINGS (10 bookings) ---
  for (let i = 0; i < 10; i++) {
    const show = showtimes[i % showtimes.length];
    const studio = allStudios.find((s) => s.studio_id === show.studio_id)!;
    await prisma.booking.create({
      data: {
        user_id: (i % 7) + 2,
        showtime_id: show.showtime_id,
        booking_status: [
          BookingStatus.Confirmed,
          BookingStatus.Pending,
          BookingStatus.Claimed,
          BookingStatus.Cancelled,
          BookingStatus.Expired,
        ][i % 5],
        total_amount: show.price * 2,
        booking_reference: `REF10${i + 1}`,
        bookingSeats: {
          create: [
            {
              seat_id: studio.seats[0].seat_id,
              showtime_id: show.showtime_id,
              price: show.price,
            },
            {
              seat_id: studio.seats[1].seat_id,
              showtime_id: show.showtime_id,
              price: show.price,
            },
          ],
        },
        payments: {
          create: {
            amount: show.price * 2,
            payment_time: new Date(),
            status: [
              PaymentStatus.Success,
              PaymentStatus.Delayed,
              PaymentStatus.Failed,
            ][i % 3],
          },
        },
      },
    });
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."StudioType" AS ENUM ('Regular', 'IMAX', 'Premier');

-- CreateEnum
CREATE TYPE "public"."MovieStatus" AS ENUM ('COMING_SOON', 'NOW_SHOWING', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('Pending', 'Confirmed', 'Claimed', 'Cancelled', 'Expired');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('Delayed', 'Success', 'Failed');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Movie" (
    "movie_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "poster_url" VARCHAR(500) NOT NULL,
    "status" "public"."MovieStatus" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("movie_id")
);

-- CreateTable
CREATE TABLE "public"."Genre" (
    "genre_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("genre_id")
);

-- CreateTable
CREATE TABLE "public"."MovieGenre" (
    "movie_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    CONSTRAINT "MovieGenre_pkey" PRIMARY KEY ("movie_id","genre_id")
);

-- CreateTable
CREATE TABLE "public"."Theater" (
    "theater_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,

    CONSTRAINT "Theater_pkey" PRIMARY KEY ("theater_id")
);

-- CreateTable
CREATE TABLE "public"."Studio" (
    "studio_id" SERIAL NOT NULL,
    "theater_id" INTEGER NOT NULL,
    "studio_name" VARCHAR(50) NOT NULL,
    "total_seats" INTEGER NOT NULL,
    "studio_type" "public"."StudioType" NOT NULL,

    CONSTRAINT "Studio_pkey" PRIMARY KEY ("studio_id")
);

-- CreateTable
CREATE TABLE "public"."Seat" (
    "seat_id" SERIAL NOT NULL,
    "studio_id" INTEGER NOT NULL,
    "seat_number" INTEGER NOT NULL,
    "row_letter" CHAR(2) NOT NULL,
    "is_blocked" BOOLEAN NOT NULL,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("seat_id")
);

-- CreateTable
CREATE TABLE "public"."Showtime" (
    "showtime_id" SERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "studio_id" INTEGER NOT NULL,
    "show_datetime" TIMESTAMP(3) NOT NULL,
    "price" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Showtime_pkey" PRIMARY KEY ("showtime_id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "showtime_id" INTEGER NOT NULL,
    "booking_datetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "booking_status" "public"."BookingStatus" NOT NULL,
    "hold_expires_at" TIMESTAMP(3),
    "total_amount" INTEGER NOT NULL,
    "booking_reference" VARCHAR(50) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingSeat" (
    "booking_seat_id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "seat_id" INTEGER NOT NULL,
    "showtime_id" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "BookingSeat_pkey" PRIMARY KEY ("booking_seat_id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "payment_id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "payment_time" TIMESTAMP(3) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_booking_reference_key" ON "public"."Booking"("booking_reference");

-- AddForeignKey
ALTER TABLE "public"."MovieGenre" ADD CONSTRAINT "MovieGenre_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "public"."Movie"("movie_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovieGenre" ADD CONSTRAINT "MovieGenre_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "public"."Genre"("genre_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Studio" ADD CONSTRAINT "Studio_theater_id_fkey" FOREIGN KEY ("theater_id") REFERENCES "public"."Theater"("theater_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Seat" ADD CONSTRAINT "Seat_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "public"."Studio"("studio_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Showtime" ADD CONSTRAINT "Showtime_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "public"."Movie"("movie_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Showtime" ADD CONSTRAINT "Showtime_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "public"."Studio"("studio_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_showtime_id_fkey" FOREIGN KEY ("showtime_id") REFERENCES "public"."Showtime"("showtime_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingSeat" ADD CONSTRAINT "BookingSeat_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingSeat" ADD CONSTRAINT "BookingSeat_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "public"."Seat"("seat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingSeat" ADD CONSTRAINT "BookingSeat_showtime_id_fkey" FOREIGN KEY ("showtime_id") REFERENCES "public"."Showtime"("showtime_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

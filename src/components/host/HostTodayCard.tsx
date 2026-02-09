"use client";

import Image from "next/image";
import Link from "next/link";
import type { TodayBookingItem } from "./HostTodayContent";

function nightsLeft(checkOut: string): number {
  const end = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(0, diff);
}

function formatMessage(booking: TodayBookingItem, isToday: boolean): string {
  const name = booking.guestName.split(" ")[0] || booking.guestName;
  const nights = nightsLeft(booking.checkOut);
  const guests = booking.guests;

  if (isToday && nights === 0) {
    return `${name} 님 일행(${guests}명)이 오늘 체크아웃합니다.`;
  }
  if (nights === 1) {
    return `${name} 님 일행(${guests}명)이 앞으로 하루 더 숙박`;
  }
  return `${name} 님의 숙박일이 ${nights}일 더 남았습니다`;
}

type Props = {
  booking: TodayBookingItem;
  isToday: boolean;
};

export default function HostTodayCard({ booking, isToday }: Props) {
  const message = formatMessage(booking, isToday);

  return (
    <Link
      href={`/host/calendar?listing=${booking.listingId}`}
      className="block p-4 md:p-5 bg-white border border-minbak-light-gray rounded-airbnb hover:shadow-airbnb transition-shadow"
    >
      <div className="flex items-start gap-4">
        <span className="text-airbnb-caption text-minbak-gray">종일</span>
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-minbak-light-gray">
              {booking.guestImage ? (
                <Image
                  src={booking.guestImage}
                  alt=""
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-minbak-gray text-lg font-medium">
                  {booking.guestName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded overflow-hidden border border-white bg-white">
              <Image
                src={booking.listingImageUrl}
                alt=""
                width={24}
                height={24}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-airbnb-body font-medium text-minbak-black">
              {message}
            </p>
            <p className="text-airbnb-caption text-minbak-gray mt-0.5 truncate">
              {booking.listingTitle}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

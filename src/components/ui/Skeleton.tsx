/** 재사용 가능한 스켈레톤 로딩 컴포넌트 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
      aria-hidden
    />
  );
}

/** 숙소 카드 스켈레톤 */
export function ListingCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

/** 숙소 카드 그리드 스켈레톤 */
export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** 숙소 상세 페이지 스켈레톤 */
export function ListingDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Image gallery */}
      <Skeleton className="w-full aspect-[16/9] rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-px w-full bg-gray-200" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** 예약 목록 스켈레톤 */
export function BookingListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border rounded-xl">
          <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 예약 확인 페이지 스켈레톤 */
export function BookingConfirmSkeleton() {
  return (
    <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-8">
      <div className="mb-8">
        <Skeleton className="h-5 w-20 mb-4" />
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[#ebebeb] overflow-hidden">
            <div className="flex gap-4 p-6">
              <Skeleton className="w-[120px] h-[100px] rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#ebebeb] overflow-hidden">
            <div className="p-6 border-b border-[#ebebeb]">
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="p-6 space-y-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <div className="rounded-2xl border border-[#ebebeb] overflow-hidden">
            <div className="p-6 border-b border-[#ebebeb]">
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="p-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-1">
                <Skeleton className="h-10 w-[72px]" />
                <Skeleton className="h-10 w-[72px]" />
                <Skeleton className="h-10 w-[72px]" />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[280px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/** 결제 페이지 스켈레톤 */
export function BookingPaySkeleton() {
  return (
    <div className="max-w-[600px] mx-auto py-8 px-4 space-y-6">
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="rounded-2xl border border-[#ebebeb] p-6 space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-px w-full bg-gray-200" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-6 w-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-minbak" />
    </div>
  );
}

/** 메시지 스레드 스켈레톤 */
export function MessageThreadSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-[600px] mx-auto">
      <div className="p-4 border-b border-minbak-light-gray">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24 mt-1" />
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-12 w-[min(80%,240px)] rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-minbak-light-gray flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-minbak" />
        <Skeleton className="h-10 w-20 rounded-minbak" />
      </div>
    </div>
  );
}

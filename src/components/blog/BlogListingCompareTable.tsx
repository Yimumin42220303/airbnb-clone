import Link from "next/link";
import { listingPath } from "@/lib/blog-listing-shortcode";
import type { BlogCompareTableRow } from "@/lib/blog-listing-shortcode";

type Props = {
  rows: BlogCompareTableRow[];
};

export default function BlogListingCompareTable({ rows }: Props) {
  return (
    <div className="my-8">
      <div className="hidden md:block overflow-x-auto rounded-minbak border border-minbak-light-gray">
        <table className="w-full text-left text-minbak-body border-collapse">
          <thead>
            <tr className="bg-minbak-bg text-minbak-black">
              <th className="px-4 py-3 font-semibold whitespace-nowrap">여행 인원</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">추천 숙소</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">가까운 역</th>
              <th className="px-4 py-3 font-semibold">주요 특징</th>
              <th className="px-4 py-3 font-semibold">주의할 점</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">상세보기</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = listingPath(row.listingId);
              return (
                <tr key={row.listingId} className="border-t border-minbak-light-gray">
                  <td className="px-4 py-3 text-minbak-gray whitespace-nowrap">{row.guestRange}</td>
                  <td className="px-4 py-3 font-medium text-minbak-black">
                    <Link
                      href={href}
                      className="hover:text-minbak-primary hover:underline underline-offset-2"
                      data-blog-link-type="compare_table"
                      data-listing-id={row.listingId}
                    >
                      {row.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-minbak-gray">{row.station}</td>
                  <td className="px-4 py-3 text-minbak-gray">{row.feature}</td>
                  <td className="px-4 py-3 text-minbak-gray">{row.caution}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={href}
                      className="inline-flex min-h-[40px] items-center px-4 py-2 rounded-minbak border border-minbak-primary text-minbak-primary font-medium hover:bg-minbak-primary/5 transition-colors"
                      data-blog-link-type="compare_table"
                      data-listing-id={row.listingId}
                    >
                      상세보기
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
        {rows.map((row) => {
          const href = listingPath(row.listingId);
          return (
            <div
              key={row.listingId}
              className="snap-start shrink-0 w-[min(100%,280px)] rounded-minbak border border-minbak-light-gray bg-white p-4 flex flex-col"
            >
              <p className="text-minbak-caption text-minbak-primary font-medium">{row.guestRange}</p>
              <h3 className="text-minbak-body font-semibold text-minbak-black mt-1">
                <Link
                  href={href}
                  className="hover:text-minbak-primary"
                  data-blog-link-type="compare_table"
                  data-listing-id={row.listingId}
                >
                  {row.displayName}
                </Link>
              </h3>
              <p className="text-minbak-caption text-minbak-gray mt-2">{row.station}</p>
              <p className="text-minbak-caption text-minbak-gray mt-1">
                <span className="font-medium text-minbak-black">특징 · </span>
                {row.feature}
              </p>
              <p className="text-minbak-caption text-minbak-gray mt-1">
                <span className="font-medium text-minbak-black">주의 · </span>
                {row.caution}
              </p>
              <Link
                href={href}
                className="mt-4 inline-flex min-h-[44px] items-center justify-center px-4 py-2 rounded-minbak bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
                data-blog-link-type="compare_table"
                data-listing-id={row.listingId}
              >
                상세보기
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

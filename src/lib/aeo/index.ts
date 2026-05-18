/**
 * 숙소 상세페이지의 AEO(Answer Engine Optimization) 단일 진입점.
 *
 * 사용 예 (서버 컴포넌트):
 *   const aeo = buildListingAeo(listing);
 *   const summary = buildAeoSummarySentences(listing, aeo);
 *   const faq = buildAutoFaq(listing, aeo);
 *   const notices = buildSuitabilityNotices(listing, aeo);
 *   const links = buildAeoLandingLinks(aeo);
 *   const title = buildListingTitle(listing, aeo);
 *   const description = buildListingMetaDescription(listing, aeo);
 */
export * from "./listing-aeo";
export * from "./listing-summary";
export * from "./listing-meta";
export * from "./listing-jsonld";

/**
 * CSV 파싱 및 숙소 일괄 등록 유틸
 */

export interface ParsedListingRow {
  title: string;
  location: string;
  description?: string;
  pricePerNight: number;
  cleaningFee?: number;
  baseGuests?: number;
  maxGuests?: number;
  extraGuestFee?: number;
  bedrooms?: number;
  beds?: number;
  baths?: number;
  imageUrls: string[];
  category?: string;
  isPromoted?: boolean;
  houseRules?: string;
  mapUrl?: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === "," && !inQuotes) || (c === "\t" && !inQuotes)) {
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

const COLUMN_MAP: Record<string, string> = {
  title: "title",
  name: "title",
  listing_name: "title",
  "listing name": "title",
  숙소명: "title",
  location: "location",
  address: "location",
  street: "location",
  주소: "location",
  위치: "location",
  description: "description",
  설명: "description",
  pricepernight: "pricePerNight",
  price_per_night: "pricePerNight",
  "price per night": "pricePerNight",
  price: "pricePerNight",
  가격: "pricePerNight",
  "1박요금": "pricePerNight",
  cleaningFee: "cleaningFee",
  청소비: "cleaningFee",
  baseGuests: "baseGuests",
  maxGuests: "maxGuests",
  인원: "maxGuests",
  bedrooms: "bedrooms",
  침실: "bedrooms",
  beds: "beds",
  침대: "beds",
  baths: "baths",
  욕실: "baths",
  imageUrls: "imageUrls",
  images: "imageUrls",
  이미지: "imageUrls",
  photo: "imageUrls",
  category: "category",
  카테고리: "category",
  isPromoted: "isPromoted",
  프로모션: "isPromoted",
  houseRules: "houseRules",
  주의사항: "houseRules",
  mapUrl: "mapUrl",
  지도: "mapUrl",
  extraGuestFee: "extraGuestFee",
  추가인원요금: "extraGuestFee",
};

export function parseListingCSV(csvText: string): ParsedListingRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase());
  const colIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    const mapped = COLUMN_MAP[h] ?? COLUMN_MAP[h.replace(/\s/g, "")];
    if (mapped) colIndex[mapped] = i;
  });

  if (!colIndex.title && !colIndex.location && !colIndex.pricePerNight) {
    throw new Error(
      "CSV에 title(숙소명), location(위치), pricePerNight(1박요금) 열이 필요합니다."
    );
  }

  const rows: ParsedListingRow[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = parseCSVLine(lines[r]);
    const get = (key: string) => {
      const i = colIndex[key];
      return i != null && cells[i] != null ? String(cells[i]).trim() : "";
    };

    const title = get("title") || get("location");
    const location = get("location") || get("title");
    const priceStr = get("pricePerNight");
    const price = parseInt(priceStr, 10) || 0;
    if (!title || !location || price <= 0) continue;

    const imageStr = get("imageUrls");
    const imageUrls = imageStr
      ? imageStr.split(/[,|;]/).map((u) => u.trim()).filter(Boolean)
      : [];

    rows.push({
      title,
      location,
      description: get("description") || undefined,
      pricePerNight: price,
      cleaningFee: parseInt(get("cleaningFee"), 10) || 0,
      baseGuests: parseInt(get("baseGuests"), 10) || 2,
      maxGuests: parseInt(get("maxGuests"), 10) || 2,
      extraGuestFee: parseInt(get("extraGuestFee"), 10) || 0,
      bedrooms: parseInt(get("bedrooms"), 10) || 1,
      beds: parseInt(get("beds"), 10) || 1,
      baths: parseInt(get("baths"), 10) || 1,
      imageUrls,
      category: get("category") || undefined,
      isPromoted: /^(1|true|yes|y|예|직영)$/i.test(get("isPromoted")),
      houseRules: get("houseRules") || undefined,
      mapUrl: get("mapUrl") || undefined,
    });
  }
  return rows;
}

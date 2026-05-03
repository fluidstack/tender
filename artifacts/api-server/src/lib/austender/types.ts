export interface OcdsRelease {
  ocid: string;
  id?: string;
  date?: string;
  tag?: string[];
  language?: string;
  buyer?: { id?: string; name?: string };
  parties?: Array<{
    id?: string;
    name?: string;
    roles?: string[];
    identifier?: { scheme?: string; id?: string; legalName?: string };
    address?: { locality?: string; region?: string; countryName?: string };
  }>;
  tender?: {
    id?: string;
    title?: string;
    description?: string;
    status?: string;
    procurementMethod?: string;
    mainProcurementCategory?: string;
    classification?: { scheme?: string; id?: string; description?: string };
    items?: Array<{
      classification?: { scheme?: string; id?: string; description?: string };
      deliveryAddress?: { locality?: string; region?: string };
    }>;
    value?: { amount?: number; currency?: string };
    minValue?: { amount?: number; currency?: string };
    tenderPeriod?: { startDate?: string; endDate?: string };
    awardPeriod?: { startDate?: string; endDate?: string };
    documents?: Array<{
      id?: string;
      documentType?: string;
      title?: string;
      url?: string;
      format?: string;
    }>;
  };
  awards?: Array<{
    id?: string;
    title?: string;
    date?: string;
    value?: { amount?: number; currency?: string };
    suppliers?: Array<{ id?: string; name?: string }>;
  }>;
}

export interface OcdsSearchResponse {
  releases?: OcdsRelease[];
  records?: Array<{ compiledRelease?: OcdsRelease; releases?: OcdsRelease[] }>;
  links?: { next?: string };
}

export interface NormalisedTender {
  sourceSystem: string;
  sourceTenderId: string;
  ocid: string | null;
  title: string;
  description: string | null;
  status: string;
  procurementMethod: string | null;
  jurisdiction: string;
  categoryCode: string | null;
  category: string | null;
  location: string | null;
  estimatedValueMin: number | null;
  estimatedValueMax: number | null;
  currency: string;
  publishedAt: Date | null;
  closingAt: Date | null;
  awardedAt: Date | null;
  buyer: { name: string; abn: string | null } | null;
  documents: Array<{
    docType: string | null;
    title: string | null;
    url: string;
    mimeType: string | null;
  }>;
  awards: Array<{
    awardId: string | null;
    supplier: { name: string; abn: string | null } | null;
    value: number | null;
    currency: string;
    awardedAt: Date | null;
  }>;
  sourceLastModifiedAt: Date | null;
}

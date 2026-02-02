/**
 * Extrait les données détaillées du rapport Lighthouse pour stockage en base
 * et affichage dans le rapport SEO étendu.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LighthouseAudit = Record<string, any>;

function getAudit(audits: Record<string, LighthouseAudit>, key: string): LighthouseAudit {
  return audits?.[key] || {};
}

function safeItems<T>(audit: LighthouseAudit, map: (item: LighthouseAudit) => T): T[] {
  const items = audit?.details?.items;
  if (!Array.isArray(items)) return [];
  return items.map((item) => map(item)).filter(Boolean);
}

export interface ExtractedLighthouseData {
  images_without_alt: Array<{ src: string; snippet?: string; selector?: string }>;
  links_without_text: Array<{ href?: string; snippet?: string; selector?: string }>;
  render_blocking_resources: Array<{ url: string; totalBytes?: number; wastedMs?: number }>;
  unused_javascript: Array<{ url: string; totalBytes?: number; wastedBytes?: number }>;
  unused_css: Array<{ url: string; totalBytes?: number; wastedBytes?: number }>;
  page_size_bytes: number | null;
  request_count: number | null;
  has_sitemap: boolean | null;
  has_robots_txt: boolean | null;
  has_structured_data: boolean | null;
  structured_data_types: string[];
  open_graph_tags: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    hasTwitterCards?: boolean;
  } | null;
  h1_tags: string[];
  h2_tags: string[];
  h3_tags: string[];
  color_contrast_issues: Array<{
    element?: string;
    snippet?: string;
    contrastRatio?: number;
    expectedRatio?: number;
  }>;
}

/**
 * Extrait toutes les données étendues depuis lighthouseResult (objet retourné par PageSpeed).
 */
export function extractLighthouseExtended(
  lighthouseResult: Record<string, unknown> | null | undefined
): ExtractedLighthouseData {
  const audits: Record<string, LighthouseAudit> =
    (lighthouseResult?.audits as Record<string, LighthouseAudit>) || {};

  const imageAlt = getAudit(audits, "image-alt");
  const linkName = getAudit(audits, "link-name");
  const renderBlocking = getAudit(audits, "render-blocking-resources");
  const unusedJs = getAudit(audits, "unused-javascript");
  const unusedCss = getAudit(audits, "unused-css-rules");
  const totalByteWeight = getAudit(audits, "total-byte-weight");
  const networkRequests = getAudit(audits, "network-requests");
  const structuredData = getAudit(audits, "structured-data");
  const structuredDataAuto = getAudit(audits, "structured-data-automatic");
  const sitemap = getAudit(audits, "sitemap");
  const robotsTxt = getAudit(audits, "robots-txt");
  const metaDesc = getAudit(audits, "meta-description");
  const documentTitle = getAudit(audits, "document-title");
  const colorContrast = getAudit(audits, "color-contrast");

  const images_without_alt = safeItems(imageAlt, (item) => {
    const node = item?.node;
    const src =
      item?.url ?? node?.src ?? (typeof node?.snippet === "string" ? node.snippet : "");
    return {
      src: typeof src === "string" ? src : "",
      snippet: node?.snippet,
      selector: node?.selector,
    };
  }).filter((x) => x.src || x.snippet);

  const links_without_text = safeItems(linkName, (item) => ({
    href: item?.href ?? item?.url,
    snippet: item?.node?.snippet,
    selector: item?.node?.selector,
  }));

  const render_blocking_resources = safeItems(renderBlocking, (item) => ({
    url: item?.url ?? "",
    totalBytes: item?.totalBytes,
    wastedMs: item?.wastedMs,
  })).filter((x) => x.url);

  const unused_javascript = safeItems(unusedJs, (item) => ({
    url: item?.url ?? "",
    totalBytes: item?.totalBytes,
    wastedBytes: item?.wastedBytes,
  })).filter((x) => x.url);

  const unused_css = safeItems(unusedCss, (item) => ({
    url: item?.url ?? "",
    totalBytes: item?.totalBytes,
    wastedBytes: item?.wastedBytes,
  })).filter((x) => x.url);

  const page_size_bytes =
    totalByteWeight?.numericValue != null
      ? Math.round(Number(totalByteWeight.numericValue))
      : null;

  const networkItems = networkRequests?.details?.items;
  const request_count = Array.isArray(networkItems) ? networkItems.length : null;

  const has_sitemap = sitemap?.score != null ? sitemap.score >= 0.5 : null;
  const has_robots_txt = robotsTxt?.score != null ? robotsTxt.score >= 0.5 : null;
  const has_structured_data =
    structuredData?.score != null
      ? structuredData.score >= 0.5
      : structuredDataAuto?.score != null
        ? structuredDataAuto.score >= 0.5
        : null;

  let structured_data_types: string[] = [];
  const sdItems = structuredDataAuto?.details?.items ?? structuredData?.details?.items;
  if (Array.isArray(sdItems)) {
    structured_data_types = sdItems
      .map((i: LighthouseAudit) => i?.type ?? i?.name)
      .filter(Boolean);
  }

  const open_graph_tags = (() => {
    const ogTitle = metaDesc?.details?.items?.[0]?.title ?? documentTitle?.details?.items?.[0]?.title;
    const ogDesc = metaDesc?.details?.items?.[0]?.description;
    const ogImageAudit = getAudit(audits, "meta-og-image");
    const ogImage = ogImageAudit?.details?.items?.[0]?.url;
    return ogTitle || ogDesc || ogImage
      ? {
          ogTitle: typeof ogTitle === "string" ? ogTitle : undefined,
          ogDescription: typeof ogDesc === "string" ? ogDesc : undefined,
          ogImage: typeof ogImage === "string" ? ogImage : undefined,
          hasTwitterCards: (getAudit(audits, "meta-twitter-cards")?.score ?? 0) >= 0.5,
        }
      : null;
  })();

  const h1Tags = getAudit(audits, "h1");
  const h2Tags = getAudit(audits, "heading-order");
  const h1_tags = safeItems(h1Tags, (item) =>
    typeof item?.value === "string" ? item.value : item?.node?.snippet ?? ""
  ).filter(Boolean);
  const h2_tags = Array.isArray(h2Tags?.details?.items)
    ? (h2Tags.details.items as LighthouseAudit[])
        .filter((i: LighthouseAudit) => i?.node?.nodeLabel === "H2" || String(i?.heading?.level) === "2")
        .map((i: LighthouseAudit) => i?.node?.snippet ?? i?.value ?? "")
        .filter(Boolean)
    : [];
  const h3_tags: string[] = [];

  const color_contrast_issues = safeItems(colorContrast, (item) => ({
    element: item?.node?.snippet,
    snippet: item?.node?.snippet,
    contrastRatio: item?.contrastRatio,
    expectedRatio: item?.threshold?.min,
  }));

  return {
    images_without_alt,
    links_without_text,
    render_blocking_resources,
    unused_javascript,
    unused_css,
    page_size_bytes,
    request_count,
    has_sitemap,
    has_robots_txt,
    has_structured_data,
    structured_data_types,
    open_graph_tags,
    h1_tags,
    h2_tags,
    h3_tags,
    color_contrast_issues,
  };
}

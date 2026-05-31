export type RawBusiness = {
  name: string;
  phone: string | null;
  website: string | null;
  address?: string | null;
  rating?: number | null;
  reviews?: number | null;
  maps_url?: string | null;
  reviews_list?: Array<{ text: string; rating?: number }> | null;
  business_status?: string;
  types?: string[];
  photos?: unknown[];
  opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
};

export async function scrapeBusinesses(query: string): Promise<RawBusiness[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.error('GOOGLE_PLACES_API_KEY is not defined in environment variables.');
    return [];
  }

  try {
    // Step 1: Call Google Places Text Search
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${apiKey}`;

    const searchRes = await fetch(textSearchUrl);
    if (!searchRes.ok) {
      console.error(`Google Places Text Search failed with status: ${searchRes.status}`);
      return [];
    }

    const searchData = await searchRes.json();
    if (!searchData.results || !Array.isArray(searchData.results)) {
      console.error('Google Places Text Search returned invalid response structure:', searchData);
      return [];
    }

    // Limit candidate list to 30 to stay strictly under the hard cap
    const candidates = searchData.results.slice(0, 30);
    const results: RawBusiness[] = [];

    // Step 2: For each result, call Place Details to get phone + website + newly requested fields
    // Run them in parallel using Promise.all
    await Promise.all(
      candidates.map(async (place: { place_id: string; name?: string }) => {
        if (!place.place_id) return;

        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,formatted_address,rating,user_ratings_total,url,reviews,business_status,types,photos,opening_hours&key=${apiKey}`;
          const detailsRes = await fetch(detailsUrl);
          if (!detailsRes.ok) return;

          const detailsData = await detailsRes.json();
          const resultBiz = detailsData.result;

          if (resultBiz && resultBiz.formatted_phone_number) {
            results.push({
              name: resultBiz.name || place.name || 'Unknown Business',
              phone: resultBiz.formatted_phone_number,
              website: resultBiz.website || null,
              address: resultBiz.formatted_address || null,
              rating: resultBiz.rating || null,
              reviews: resultBiz.user_ratings_total || null,
              maps_url: resultBiz.url || null,
              reviews_list: resultBiz.reviews || null,
              business_status: resultBiz.business_status ?? 'OPERATIONAL',
              types: resultBiz.types ?? [],
              photos: resultBiz.photos ?? [],
              opening_hours: resultBiz.opening_hours ?? null,
            });
          }
        } catch (detailErr) {
          console.error(`Error fetching place details for id ${place.place_id}:`, detailErr);
        }
      })
    );

    // Hard cap: return maximum 30 results per run and slice to make absolutely sure
    return results.slice(0, 30);
  } catch (err) {
    console.error('Error in scrapeBusinesses:', err);
    return []; // Return empty array on any network error - do not throw
  }
}

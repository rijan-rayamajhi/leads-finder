import { RawBusiness } from '@/types/lead';

export async function scrapeBusinesses(query: string): Promise<RawBusiness[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

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

    // Step 2: For each result, call Place Details to get phone + website
    // Run them in parallel using Promise.all
    await Promise.all(
      candidates.map(async (place: { place_id: string; name?: string }) => {
        if (!place.place_id) return;

        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website&key=${apiKey}`;
          const detailsRes = await fetch(detailsUrl);
          if (!detailsRes.ok) return;

          const detailsData = await detailsRes.json();
          const resultBiz = detailsData.result;

          if (resultBiz && resultBiz.formatted_phone_number) {
            results.push({
              name: resultBiz.name || place.name || 'Unknown Business',
              phone: resultBiz.formatted_phone_number,
              website: resultBiz.website || null,
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

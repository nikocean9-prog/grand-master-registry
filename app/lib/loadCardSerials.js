// PostgREST caps each response at 1,000 rows. Keep every serial in larger runs.
export async function loadCardSerials(supabase, cardId) {
  const rows = [];
  const pageSize = 1000;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase.from("serials")
      .select("id, serial_number, region, status")
      .eq("card_id", cardId)
      .order("serial_number").order("id")
      .range(start, start + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return { data: rows, error: null };
  }
}

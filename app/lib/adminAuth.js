export async function getCurrentAdmin(supabase) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id, is_owner")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    return null;
  }

  return {
    ...user,
    isOwner: admin.is_owner === true,
  };
}

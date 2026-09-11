import { createClient } from "@supabase/supabase-js";
function createSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function makeSuperAdmin(email: string) {
  const admin = createSupabaseAdmin();
  
  console.log(`Looking up user by email: ${email}`);
  
  // 1. Check if user exists in auth
  const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers();
  if (usersErr) {
    console.error("Failed to list users:", usersErr);
    return;
  }
  
  let user = usersData?.users?.find((u) => u.email === email.toLowerCase().trim());
  
  if (!user) {
    console.log(`User ${email} not found in auth. Creating...`);
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: "SuperAdminPassword123!",
      email_confirm: true,
    });
    
    if (createErr || !newUser?.user) {
      console.error("Failed to create user:", createErr);
      return;
    }
    user = newUser.user;
    console.log(`Created user with ID: ${user.id}`);
  } else {
    console.log(`Found existing user with ID: ${user.id}`);
  }

  // 2. Check if cafe_profiles exists
  const { data: profile, error: profileErr } = await admin
    .from("cafe_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
    
  if (profile) {
    console.log(`Updating existing profile to super_admin...`);
    const { error: updateErr } = await admin
      .from("cafe_profiles")
      .update({ role: "super_admin", active: true })
      .eq("id", user.id);
      
    if (updateErr) {
      console.error("Failed to update profile:", updateErr);
      return;
    }
  } else {
    console.log(`Creating new profile with super_admin role...`);
    const { error: insertErr } = await admin
      .from("cafe_profiles")
      .insert({
        id: user.id,
        role: "super_admin",
        display_name: "Suraj Rai",
        active: true,
      });
      
    if (insertErr) {
      console.error("Failed to create profile:", insertErr);
      return;
    }
  }
  
  console.log(`Successfully made ${email} a super_admin!`);
}

makeSuperAdmin("surajrai1204@gmail.com")
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

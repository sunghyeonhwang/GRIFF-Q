import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEAM_MEMBERS = [
  { email: "super@griff.co.kr", password: "Griff2026!", name: "황성현", role: "super" },
  { email: "boss@griff.co.kr", password: "Griff2026!", name: "김대표", role: "boss" },
  { email: "manager1@griff.co.kr", password: "Griff2026!", name: "박매니저", role: "manager" },
  { email: "manager2@griff.co.kr", password: "Griff2026!", name: "이매니저", role: "manager" },
  { email: "normal1@griff.co.kr", password: "Griff2026!", name: "최팀원", role: "normal" },
  { email: "normal2@griff.co.kr", password: "Griff2026!", name: "정팀원", role: "normal" },
  { email: "normal3@griff.co.kr", password: "Griff2026!", name: "한팀원", role: "normal" },
];

async function seed() {
  console.log("Seeding users...\n");

  for (const member of TEAM_MEMBERS) {
    // 1. auth.users에 계정 생성 (트리거 없이)
    const { data, error } = await supabase.auth.admin.createUser({
      email: member.email,
      password: member.password,
      email_confirm: true,
      user_metadata: { name: member.name },
    });

    if (error) {
      console.error(`✗ ${member.email} (auth): ${error.message}`);
      continue;
    }

    if (!data.user) {
      console.error(`✗ ${member.email}: user data is null`);
      continue;
    }

    // 2. public.users에 프로필 수동 삽입 (service_role은 RLS 우회)
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        id: data.user.id,
        email: member.email,
        name: member.name,
        role: member.role,
      });

    if (insertError) {
      console.error(`✗ ${member.email} (profile): ${insertError.message}`);
      continue;
    }

    console.log(`✓ ${member.email} (${member.role})`);
  }

  console.log("\nDone!");
}

seed().catch(console.error);

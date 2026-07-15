import { guard, privateOk } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await guard();
  if (error) return error;
  return privateOk({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

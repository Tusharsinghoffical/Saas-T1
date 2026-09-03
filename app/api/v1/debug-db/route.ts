import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  const diagnostics: any = {
    supabaseUrl: url,
    anonKeyInfo: {
      length: anonKey.length,
      prefix: anonKey.slice(0, 15),
      isJwt: anonKey.startsWith("eyJ"),
      isPublishable: anonKey.startsWith("sb_publishable"),
    },
    serviceKeyInfo: {
      length: serviceKey.length,
      prefix: serviceKey.slice(0, 15),
      isJwt: serviceKey.startsWith("eyJ"),
      isDummy: serviceKey.includes("dummy"),
    },
  };

  // Test 1: Query organizations with anon key
  try {
    const res = await fetch(`${url}/rest/v1/organizations?select=id,name`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    diagnostics.anonKeyTest = {
      httpStatus: res.status,
      response: await res.text(),
    };
  } catch (err: any) {
    diagnostics.anonKeyTest = { error: err.message };
  }

  // Test 2: Query organizations with service_role key
  try {
    const res = await fetch(`${url}/rest/v1/organizations?select=id,name`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    diagnostics.serviceKeyTest = {
      httpStatus: res.status,
      response: await res.text(),
    };
  } catch (err: any) {
    diagnostics.serviceKeyTest = { error: err.message };
  }

  // Test 3: Query tasks with service_role key
  try {
    const res = await fetch(`${url}/rest/v1/tasks?select=id,title,status`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    diagnostics.tasksTest = {
      httpStatus: res.status,
      response: await res.text(),
    };
  } catch (err: any) {
    diagnostics.tasksTest = { error: err.message };
  }

  return NextResponse.json(diagnostics);
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/supabase/supabaseServer";
import { listR2Objects, deleteR2Object } from "@/infrastructure/storage/r2Storage";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // 1. Verify CRON_SECRET for security
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "R2 credentials not configured." }, { status: 500 });
  }

  try {
    const adminClient = createAdminClient();

    // 2. Fetch all valid attachment URLs from the database
    const { data: attachments, error } = await adminClient
      .from("task_attachments")
      .select("file_url");

    if (error) {
      throw new Error(`Failed to fetch attachments: ${error.message}`);
    }

    const validUrls = attachments.map((a: any) => a.file_url);

    // 3. List all objects in R2
    const r2Objects = await listR2Objects({
      bucket,
      endpoint,
      accessKeyId,
      secretAccessKey,
    });

    const deletedKeys: string[] = [];
    const now = new Date();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    // 4. Find orphans and delete them
    for (const obj of r2Objects) {
      const isLinkedToDb = validUrls.some((url: string) => url.includes(encodeURIComponent(obj.key)) || url.includes(obj.key));
      const ageMs = now.getTime() - obj.lastModified.getTime();
      
      // Only delete if NOT in DB AND older than 24 hours (prevents race condition with ongoing uploads)
      if (!isLinkedToDb && ageMs > TWENTY_FOUR_HOURS) {
        const success = await deleteR2Object({
          bucket,
          key: obj.key,
          endpoint,
          accessKeyId,
          secretAccessKey,
        });
        
        if (success) {
          deletedKeys.push(obj.key);
        }
      }
    }

    // 5. Log operations
    console.log(`Orphaned R2 Cleanup: Scanned ${r2Objects.length} objects. Deleted ${deletedKeys.length} orphans.`, deletedKeys);

    return NextResponse.json({
      success: true,
      scannedCount: r2Objects.length,
      deletedCount: deletedKeys.length,
      deletedKeys,
    });
  } catch (err: any) {
    console.error("Cron clean-orphans error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

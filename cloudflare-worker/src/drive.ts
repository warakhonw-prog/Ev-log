import { Env } from "./types";
import { getGoogleAccessToken } from "./sheets";

export interface GoogleDriveUploadResult {
  fileId: string;
  name: string;
  webViewLink: string;
}

/**
 * อัปโหลดภาพสลิป/หน้าปัดรถยนต์ไปยัง Google Drive โฟลเดอร์ที่กำหนด
 * @param imageBase64 ข้อมูลภาพในรูปแบบ Base64
 * @param filename ชื่อไฟล์ที่ต้องการบันทึก (เช่น EV_Charge_2026-09-22_143000.jpg)
 * @param folderId ID ของ Google Drive Folder (เช่น 1MQJN7bk8GNUyxdfH4rECRwrR7gPeYE-e)
 * @param env Cloudflare Worker Environment
 */
export async function uploadImageToGoogleDrive(
  imageBase64: string,
  filename: string,
  folderId: string,
  env: Env
): Promise<GoogleDriveUploadResult | null> {
  if (!folderId || !env.GOOGLE_CLIENT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
    console.warn("[Google Drive] Skipped upload: Missing folder ID or Service Account credentials");
    return null;
  }

  try {
    const accessToken = await getGoogleAccessToken(
      env.GOOGLE_CLIENT_EMAIL,
      env.GOOGLE_PRIVATE_KEY
    );

    const boundary = "-------evlogdriveupload" + Date.now();
    const metadata = {
      name: filename,
      parents: [folderId],
      description: "EV Slip / Trip receipt uploaded via LINE Bot",
    };

    // แปลง Base64 เป็น Uint8Array ไบนารี
    const binaryStr = atob(imageBase64);
    const len = binaryStr.length;
    const imageBytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      imageBytes[i] = binaryStr.charCodeAt(i);
    }

    const preContent =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: image/jpeg\r\n\r\n`;

    const postContent = `\r\n--${boundary}--`;

    const encoder = new TextEncoder();
    const preBytes = encoder.encode(preContent);
    const postBytes = encoder.encode(postContent);

    const totalLength = preBytes.byteLength + imageBytes.byteLength + postBytes.byteLength;
    const combinedBytes = new Uint8Array(totalLength);
    combinedBytes.set(preBytes, 0);
    combinedBytes.set(imageBytes, preBytes.byteLength);
    combinedBytes.set(postBytes, preBytes.byteLength + imageBytes.byteLength);

    const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: combinedBytes,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Google Drive] Upload failed (${res.status}): ${errText}`);
      return null;
    }

    const data: any = await res.json();
    console.log(`[Google Drive] Upload success: fileId=${data.id}, name=${data.name}`);
    return {
      fileId: data.id,
      name: data.name || filename,
      webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    };
  } catch (err: any) {
    console.warn("[Google Drive] Exception during upload:", err?.message || err);
    return null;
  }
}

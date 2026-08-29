/**
 * image-clip.js — copy a remote product image onto the clipboard as PNG.
 *
 * The Clipboard API only writes image/png while product CDNs serve JPEG/WebP, so
 * every image is redrawn through an OffscreenCanvas first. fetch() runs from the
 * side-panel document, which carries the CDN hosts in host_permissions and so
 * bypasses CORS. Exposes window.ImageClip.copyImage(url).
 */
(function () {
  'use strict';

  async function toPngBlob(blob) {
    if (blob.type === 'image/png') return blob;
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas.convertToBlob({ type: 'image/png' });
  }

  /** Resolves once the image sits on the clipboard; throws with a Thai reason. */
  async function copyImage(url) {
    if (!url) throw new Error('ไม่มีรูปสินค้าในการ์ดนี้');

    let res;
    try {
      res = await fetch(url, { credentials: 'omit' });
    } catch {
      throw new Error('โหลดรูปไม่ได้ — โดเมน CDN อาจไม่อยู่ใน host_permissions (reload extension)');
    }
    if (!res.ok) throw new Error(`โหลดรูปไม่สำเร็จ (HTTP ${res.status})`);

    const png = await toPngBlob(await res.blob());
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
  }

  window.ImageClip = { copyImage };
})();

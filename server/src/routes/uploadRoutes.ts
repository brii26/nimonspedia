import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { requireAuth } from '../middleware/authMiddleware.js'; 
import sharp from 'sharp'; // Pastikan sudah: npm install sharp

export default async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/upload/image', {
    preHandler: requireAuth
  }, async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.status(400).send({ success: false, message: 'No file uploaded' });

    // 1. Validasi Tipe
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(data.mimetype)) {
        return reply.status(400).send({ success: false, message: 'Invalid file type.' });
    }

    // 2. Proses Buffer
    const buffer = await data.toBuffer();
    const timestamp = Date.now();
    const safeName = path.parse(data.filename).name.replace(/[^a-zA-Z0-9]/g, '_');
    const ext = path.extname(data.filename); 
    
    // 3. Siapkan Nama File
    const fileNameOriginal = `${timestamp}_${safeName}${ext}`;       
    const fileNameThumb = `${timestamp}_${safeName}_thumb${ext}`;    

    const uploadDir = path.join(process.cwd(), 'public/uploads/chat'); 
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // 4. Simpan Original
    await sharp(buffer).toFile(path.join(uploadDir, fileNameOriginal));

    // 5. Simpan Thumbnail (Resize Width 300px, Quality 80%)
    await sharp(buffer)
        .resize(300, null, { withoutEnlargement: true }) 
        .jpeg({ quality: 80, force: false }) 
        .png({ quality: 80, force: false })
        .toFile(path.join(uploadDir, fileNameThumb));

    // 6. Return URL Original (Frontend nanti yang olah string URL untuk thumbnail)
    const fileUrl = `/storage/chat/${fileNameOriginal}`;

    return { success: true, data: { url: fileUrl } };
  });
}
import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import util from 'util';
import { requireAuth } from '../middleware/authMiddleware.js'; // Pastikan path benar

const pump = util.promisify(pipeline);

export default async function uploadRoutes(fastify: FastifyInstance) {
  // Register plugin multipart khusus scope ini atau di index.ts global
  // Jika di sini, pastikan tidak konflik dengan register global

  fastify.post('/upload/image', {
    preHandler: requireAuth // Hanya user login yang boleh upload
  }, async (req, reply) => {
    const data = await req.file();

    if (!data) {
      return reply.status(400).send({ message: 'No file uploaded' });
    }

    // Validasi tipe file (Security)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(data.mimetype)) {
        return reply.status(400).send({ message: 'Invalid file type. Only JPG, PNG, WEBP allowed.' });
    }

    // Generate nama file unik
    const timestamp = Date.now();
    const safeName = data.filename.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${timestamp}_${safeName}`;

    // Tentukan folder simpan (Pastikan folder ini ada!)
    // Disarankan simpan di folder yang bisa diakses publik oleh Nginx/Static server
    const uploadDir = path.join(process.cwd(), 'public/uploads/chat'); 

    // Buat folder jika belum ada
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);

    // Simpan file
    await pump(data.file, fs.createWriteStream(filePath));

    // Return URL relatif yang bisa diakses frontend
    const fileUrl = `/storage/chat/${fileName}`;

    return { 
        success: true, 
        data: { url: fileUrl } 
    };
  });
}
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // genera carpeta 'out'
  images: { unoptimized: true }, // si usas imágenes
  // Si tienes rutas con basePath, añade: basePath: '/Participacion-carrizal'
};
module.exports = nextConfig;
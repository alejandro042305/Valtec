/**
 * Datos empresariales. Es la única fuente de verdad: ningún componente debe
 * escribir a mano el nombre, el teléfono, el correo ni la dirección.
 */
export const company = {
  name: 'Valtec',
  slogan: 'Servicio técnico integral',
  /**
   * Dominio definitivo, sin barra final. Se usa en canonical, sitemap, Open Graph y Schema.org.
   * La variable SITE_URL lo reemplaza al compilar (la usa la publicación en GitHub Pages).
   */
  siteUrl: (process.env.SITE_URL || 'https://valtecsas.com').replace(/\/$/, ''),
  tagline: 'Servicio técnico de electrodomésticos en Bogotá y alrededores',
  description:
    'Valtec es una empresa independiente especializada en diagnóstico, mantenimiento y reparación de electrodomésticos en Bogotá y alrededores.',
  yearsOfExperience: 15,
  coverage: 'Bogotá y alrededores',
  coverageLong: 'Bogotá y municipios cercanos',
  address: {
    street: 'Carrera 106 # 71A-83',
    city: 'Bogotá',
    country: 'Colombia',
    countryCode: 'CO',
  },
  copyrightYear: 2026,
};

export const fullAddress = `${company.address.street}, ${company.address.city}, ${company.address.country}`;

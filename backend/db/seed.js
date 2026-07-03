import dotenv from 'dotenv';
import { pool } from '../src/db/pool.js';

dotenv.config();

const categories = [
  { id: 'newarrivals', name: 'New Arrivals' },
  { id: 'bestsellers', name: 'Best Sellers' },
  { id: 'men', name: 'Men' },
];

const products = [
  { sku: 'BS-1001', name: 'Heavyweight Cotton Crewneck Tee', category: 'bestsellers', price: 58, colors: ['Bone', 'Graphite', 'Black'], rating: 4.8, reviews: 212, badge: 'Best seller', stock: 142, image: 'https://m.media-amazon.com/images/I/914lWGaKetL._AC_UY1100_.jpg' },
  { sku: 'NA-1001', name: 'Washed Linen Slub Tee', category: 'newarrivals', price: 74, colors: ['Stone', 'White', 'Black'], rating: 4.6, reviews: 98, badge: 'New', stock: 8, image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop' },
  { sku: 'MN-1001', name: 'Oversized Drop-Shoulder Tee', category: 'men', price: 48, colors: ['Charcoal', 'Bone'], rating: 4.9, reviews: 64, badge: null, stock: 23, image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=600&auto=format&fit=crop' },
  { sku: 'MN-1002', name: 'Ribbed Knit Slim-Fit Tee', category: 'men', price: 52, colors: ['Black', 'Stone'], rating: 4.5, reviews: 41, badge: null, stock: 56, image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600&auto=format&fit=crop' },
  { sku: 'BS-1002', name: 'Organic Pima Cotton V-Neck', category: 'bestsellers', price: 45, colors: ['White', 'Fog', 'Charcoal'], rating: 4.7, reviews: 156, badge: 'Best seller', stock: 4, image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop' },
  { sku: 'NA-1002', name: 'Vintage Washed Graphic Tee', category: 'newarrivals', price: 64, colors: ['Bone', 'Black'], rating: 4.9, reviews: 33, badge: 'New', stock: 19, image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=600&auto=format&fit=crop' },
  { sku: 'BS-1003', name: 'Waffle Knit Thermal Tee', category: 'bestsellers', price: 55, colors: ['White', 'Stone', 'Graphite'], rating: 4.6, reviews: 88, badge: 'Best seller', stock: 71, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop' },
  { sku: 'BS-1004', name: 'Premium Heavyweight Pocket Tee', category: 'bestsellers', price: 48, colors: ['Black', 'Espresso'], rating: 4.8, reviews: 120, badge: 'Best seller', stock: 12, image: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=600&auto=format&fit=crop' },
  { sku: 'MN-1003', name: 'Mercerized Cotton Dress Tee', category: 'men', price: 68, colors: ['Silver', 'Black'], rating: 4.7, reviews: 76, badge: null, stock: 30, image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop' },
  { sku: 'NA-1003', name: 'Supima Cotton Relaxed Tee', category: 'newarrivals', price: 42, colors: ['Bone', 'Charcoal'], rating: 4.9, reviews: 45, badge: 'New', stock: 6, image: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?q=80&w=600&auto=format&fit=crop' },
  { sku: 'NA-1004', name: 'Lightweight Breathable Mesh Tee', category: 'newarrivals', price: 36, colors: ['Black', 'Stone'], rating: 4.5, reviews: 61, badge: 'New', stock: 88, image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=600&auto=format&fit=crop' },
  { sku: 'BS-1005', name: 'Recycled Blend Boxy Tee', category: 'bestsellers', price: 38, colors: ['Fog', 'Graphite'], rating: 4.8, reviews: 52, badge: 'Best seller', stock: 27, image: 'https://images.unsplash.com/photo-1604004555489-723a93d6ce74?q=80&w=600&auto=format&fit=crop' },
  { sku: 'MN-1004', name: 'Classic Streetwear Heavy Tee', category: 'men', price: 54, colors: ['Black', 'Grey', 'White'], rating: 4.9, reviews: 187, badge: 'Best seller', stock: 54, image: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=600&auto=format&fit=crop' },
  { sku: 'BS-1006', name: 'Premium Long-Sleeve Crewneck', category: 'bestsellers', price: 62, colors: ['Black', 'Brown'], rating: 4.8, reviews: 132, badge: 'Best seller', stock: 67, image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop' },
  { sku: 'NA-1005', name: 'Brushed Suede-Touch Tee', category: 'newarrivals', price: 58, colors: ['White'], rating: 4.9, reviews: 91, badge: 'New', stock: 25, image: 'https://images.unsplash.com/photo-1527719327859-c6ce80353573?q=80&w=600&auto=format&fit=crop' },
  { sku: 'MN-1005', name: 'Fine Merino Wool Blend Tee', category: 'men', price: 88, colors: ['Charcoal', 'Bone', 'Black'], rating: 4.8, reviews: 145, badge: 'Best seller', stock: 38, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop' },
  { sku: 'NA-1006', name: 'Distressed Raw-Edge Tee', category: 'newarrivals', price: 48, colors: ['Indigo', 'Black'], rating: 4.7, reviews: 22, badge: 'New', stock: 43, image: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=600&auto=format&fit=crop' },
  { sku: 'NA-1007', name: 'Striped Retro Knit Tee', category: 'newarrivals', price: 46, colors: ['Bone', 'Graphite'], rating: 4.8, reviews: 17, badge: 'New', stock: 72, image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=600&auto=format&fit=crop' },
  { sku: 'NA-1008', name: 'Minimalist Curved-Hem Tee', category: 'newarrivals', price: 44, colors: ['Black', 'Espresso'], rating: 4.7, reviews: 28, badge: 'New', stock: 31, image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop' },
  { sku: 'BS-1007', name: 'Eco-Luxury Bamboo Jersey Tee', category: 'bestsellers', price: 50, colors: ['Ivory', 'Stone'], rating: 4.9, reviews: 19, badge: 'Best seller', stock: 46, image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=600&auto=format&fit=crop' },
];

async function seed() {
  console.log('Seeding categories...');
  for (const c of categories) {
    await pool.query(
      `INSERT INTO categories (id, name) VALUES ($1,$2)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [c.id, c.name]
    );
  }

  console.log('Seeding products...');
  for (const p of products) {
    await pool.query(
      `INSERT INTO products (sku, name, category_id, price, colors, sizes, image_url, badge, stock, rating, review_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (sku) DO UPDATE SET
         name = EXCLUDED.name, category_id = EXCLUDED.category_id, price = EXCLUDED.price,
         colors = EXCLUDED.colors, image_url = EXCLUDED.image_url, badge = EXCLUDED.badge,
         stock = EXCLUDED.stock, rating = EXCLUDED.rating, review_count = EXCLUDED.review_count`,
      [p.sku, p.name, p.category, p.price, p.colors, ['S', 'M', 'L', 'XL'], p.image, p.badge, p.stock, p.rating, p.reviews]
    );
  }

  console.log('Seed complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

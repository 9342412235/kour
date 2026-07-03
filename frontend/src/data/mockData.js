// ---- Demo data only. Replace with real API calls when wiring a backend. ----

export const categories = [
  
  { id: 'newarrivals', name: 'New Arrivals' },
  { id: 'bestsellers', name: 'Best Sellers' },
  { id: 'men', name: 'Men' },
]

export const products = [
  { id: 'p1', name: 'Heavyweight Cotton Crewneck Tee', category: 'bestsellers', price: 58, colors: ['Bone', 'Graphite', 'Black'], rating: 4.8, reviews: 212, badge: 'Best seller', stock: 142, sku: 'BS-1001' },
  { id: 'p2', name: 'Washed Linen Slub Tee', category: 'newarrivals', price: 74, colors: ['Stone', 'White', 'Black'], rating: 4.6, reviews: 98, badge: 'New', stock: 8, sku: 'NA-1001' },
  { id: 'p3', name: 'Oversized Drop-Shoulder Tee', category: 'men', price: 48, colors: ['Charcoal', 'Bone'], rating: 4.9, reviews: 64, badge: null, stock: 23, sku: 'MN-1001' },
  { id: 'p4', name: 'Ribbed Knit Slim-Fit Tee', category: 'men', price: 52, colors: ['Black', 'Stone'], rating: 4.5, reviews: 41, badge: null, stock: 56, sku: 'MN-1002' },
  { id: 'p5', name: 'Organic Pima Cotton V-Neck', category: 'bestsellers', price: 45, colors: ['White', 'Fog', 'Charcoal'], rating: 4.7, reviews: 156, badge: 'Best seller', stock: 4, sku: 'BS-1002' },
  { id: 'p6', name: 'Vintage Washed Graphic Tee', category: 'newarrivals', price: 64, colors: ['Bone', 'Black'], rating: 4.9, reviews: 33, badge: 'New', stock: 19, sku: 'NA-1002' },
  { id: 'p7', name: 'Waffle Knit Thermal Tee', category: 'bestsellers', price: 55, colors: ['White', 'Stone', 'Graphite'], rating: 4.6, reviews: 88, badge: 'Best seller', stock: 71, sku: 'BS-1003' },
  { id: 'p8', name: 'Premium Heavyweight Pocket Tee', category: 'bestsellers', price: 48, colors: ['Black', 'Espresso'], rating: 4.8, reviews: 120, badge: 'Best seller', stock: 12, sku: 'BS-1004' },
  { id: 'p9', name: 'Mercerized Cotton Dress Tee', category: 'men', price: 68, colors: ['Silver', 'Black'], rating: 4.7, reviews: 76, badge: null, stock: 30, sku: 'MN-1003' },
  { id: 'p10', name: 'Supima Cotton Relaxed Tee', category: 'newarrivals', price: 42, colors: ['Bone', 'Charcoal'], rating: 4.9, reviews: 45, badge: 'New', stock: 6, sku: 'NA-1003' },
  { id: 'p11', name: 'Lightweight Breathable Mesh Tee', category: 'newarrivals', price: 36, colors: ['Black', 'Stone'], rating: 4.5, reviews: 61, badge: 'New', stock: 88, sku: 'NA-1004' },
  { id: 'p12', name: 'Recycled Blend Boxy Tee', category: 'bestsellers', price: 38, colors: ['Fog', 'Graphite'], rating: 4.8, reviews: 52, badge: 'Best seller', stock: 27, sku: 'BS-1005' },
  { id: 'p13', name: 'Classic Streetwear Heavy Tee', category: 'men', price: 54, colors: ['Black', 'Grey', 'White'], rating: 4.9, reviews: 187, badge: 'Best seller', stock: 54, sku: 'MN-1004' },
  { id: 'p14', name: 'Premium Long-Sleeve Crewneck', category: 'bestsellers', price: 62, colors: ['Black', 'Brown'], rating: 4.8, reviews: 132, badge: 'Best seller', stock: 67, sku: 'BS-1006' },
  { id: 'p15', name: 'Brushed Suede-Touch Tee', category: 'newarrivals', price: 58, colors: ['White'], rating: 4.9, reviews: 91, badge: 'New', stock: 25, sku: 'NA-1005' },
  { id: 'p16', name: 'Fine Merino Wool Blend Tee', category: 'men', price: 88, colors: ['Charcoal', 'Bone', 'Black'], rating: 4.8, reviews: 145, badge: 'Best seller', stock: 38, sku: 'MN-1005' },
  { id: 'p17', name: 'Distressed Raw-Edge Tee', category: 'newarrivals', price: 48, colors: ['Indigo', 'Black'], rating: 4.7, reviews: 22, badge: 'New', stock: 43, sku: 'NA-1006' },
  { id: 'p18', name: 'Striped Retro Knit Tee', category: 'newarrivals', price: 46, colors: ['Bone', 'Graphite'], rating: 4.8, reviews: 17, badge: 'New', stock: 72, sku: 'NA-1007' },
  { id: 'p19', name: 'Minimalist Curved-Hem Tee', category: 'newarrivals', price: 44, colors: ['Black', 'Espresso'], rating: 4.7, reviews: 28, badge: 'New', stock: 31, sku: 'NA-1008' },
  { id: 'p20', name: 'Eco-Luxury Bamboo Jersey Tee', category: 'bestsellers', price: 50, colors: ['Ivory', 'Stone'], rating: 4.9, reviews: 19, badge: 'Best seller', stock: 46, sku: 'BS-1007' },
]

export const productImages = {
  p1: "https://m.media-amazon.com/images/I/914lWGaKetL._AC_UY1100_.jpg", 
  p2: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop",  
  p3: "https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=600&auto=format&fit=crop",   
  p4: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600&auto=format&fit=crop",  
  p5: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop",  
  p6: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=600&auto=format&fit=crop",  
  p7: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop",  
  p8: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=600&auto=format&fit=crop",  
  p9: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop",   
  p10: "https://images.unsplash.com/photo-1554568218-0f1715e72254?q=80&w=600&auto=format&fit=crop", 
  p11: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=600&auto=format&fit=crop", 
  p12: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7fqEuilqZk-t4AHieoKTaX9DI7ObWlUX13A&s", 
  p13: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=600&auto=format&fit=crop", 
  p14: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop", 
  p15: "https://images.unsplash.com/photo-1527719327859-c6ce80353573?q=80&w=600&auto=format&fit=crop", 
  p16: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop", 
  p17: "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=600&auto=format&fit=crop", 
  p18: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=600&auto=format&fit=crop", 
  p19: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop", 
  p20: "https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=600&auto=format&fit=crop", 
}

export const bannerSlides = [
  {
    id: 1,
    image: productImages.p13,
    title: "Classic Streetwear Heavy Tee",
    subtitle: "Thick premium cotton tailored for everyday drop.",
    buttonText: "Shop Heavyweights",
    link: "/shop?category=men",
  },
  {
    id: 2,
    image: productImages.p8,
    title: "Premium Heavyweight Pocket Tee",
    subtitle: "Structural utility meets absolute daily comfort.",
    buttonText: "Shop Bestsellers",
    link: "/shop?category=bestsellers",
  },
  {
    id: 3,
    image: productImages.p17,
    title: "Distressed Raw-Edge Tee",
    subtitle: "New lightweight arrivals for the perfect modern layout.",
    buttonText: "Explore New Arrivals",
    link: "/shop?category=newarrivals",
  },
]
export const orders = [
  { id: 'ORD-10245', customer: 'Aanya Krishnan', date: '2026-06-18', items: 3, total: 224.00, status: 'Processing', payment: 'Paid' },
  { id: 'ORD-10244', customer: 'Rohit Mehta', date: '2026-06-17', items: 1, total: 58.00, status: 'Shipped', payment: 'Paid' },
  { id: 'ORD-10243', customer: 'Sara Lin', date: '2026-06-17', items: 2, total: 212.00, status: 'Delivered', payment: 'Paid' },
  { id: 'ORD-10242', customer: 'David Okafor', date: '2026-06-16', items: 4, total: 396.00, status: 'Cancelled', payment: 'Refunded' },
  { id: 'ORD-10241', customer: 'Priya Nair', date: '2026-06-15', items: 1, total: 138.00, status: 'Delivered', payment: 'Paid' },
  { id: 'ORD-10240', customer: 'Tom Reyes', date: '2026-06-15', items: 2, total: 116.00, status: 'Pending', payment: 'Unpaid' },
]

export const tickets = [
  { id: 'TCK-552', subject: 'Wrong size delivered', customer: 'Sara Lin', priority: 'High', status: 'Open', assignee: 'Unassigned', sla: '2h left', updated: '12m ago' },
  { id: 'TCK-551', subject: 'Refund not received', customer: 'David Okafor', priority: 'Urgent', status: 'In Progress', assignee: 'Meera Joshi', sla: 'Overdue', updated: '40m ago' },
  { id: 'TCK-550', subject: 'Tracking not updating', customer: 'Rohit Mehta', priority: 'Medium', status: 'In Progress', assignee: 'Meera Joshi', sla: '5h left', updated: '1h ago' },
  { id: 'TCK-549', subject: 'Coupon not applying', customer: 'Priya Nair', priority: 'Low', status: 'Resolved', assignee: 'Arjun Das', sla: 'Closed', updated: 'Yesterday' },
  { id: 'TCK-548', subject: 'Damaged item on arrival', customer: 'Tom Reyes', priority: 'High', status: 'Open', assignee: 'Unassigned', sla: '3h left', updated: '2h ago' },
]

export const users = [
  { id: 'u1', name: 'Aanya Krishnan', email: 'aanya@example.com', role: 'Customer', status: 'Active', joined: '2025-02-11' },
  { id: 'u2', name: 'Meera Joshi', email: 'meera@example.com', role: 'Support Agent', status: 'Active', joined: '2024-11-02' },
  { id: 'u3', name: 'Arjun Das', email: 'arjun@example.com', role: 'Support Agent', status: 'Active', joined: '2025-01-19' },
  { id: 'u4', name: 'Lena Fischer', email: 'lena@example.com', role: 'Blogger', status: 'Active', joined: '2025-04-30' },
  { id: 'u5', name: 'Carlos Bravo', email: 'carlos@example.com', role: 'Warehouse Staff', status: 'Disabled', joined: '2024-08-14' },
  { id: 'u6', name: 'Priya Nair', email: 'priya@example.com', role: 'Customer', status: 'Active', joined: '2025-06-21' },
]

export const stockAlerts = [
  { sku: 'AP-1002', name: 'Washed Linen Shirt', qty: 8, threshold: 15, warehouse: 'WH-Mumbai' },
  { sku: 'HM-2001', name: 'Organic Cotton Bedding Set', qty: 4, threshold: 20, warehouse: 'WH-Chennai' },
  { sku: 'WL-4001', name: 'Cashmere Travel Wrap', qty: 6, threshold: 15, warehouse: 'WH-Mumbai' },
]

export const shipments = [
  { id: 'SHP-771', type: 'Outbound', order: 'ORD-10245', items: 3, status: 'Ready to pack', warehouse: 'WH-Mumbai' },
  { id: 'SHP-770', type: 'Outbound', order: 'ORD-10244', items: 1, status: 'Packed', warehouse: 'WH-Mumbai' },
  { id: 'SHP-769', type: 'Inbound', order: 'PO-3391', items: 240, status: 'In transit', warehouse: 'WH-Chennai' },
  { id: 'SHP-768', type: 'Outbound', order: 'ORD-10241', items: 1, status: 'Shipped', warehouse: 'WH-Chennai' },
]

export const blogPosts = [
  { id: 'b1', title: 'Caring for Cashmere: A Seasonal Guide', status: 'Published', author: 'Lena Fischer', views: 4210, likes: 312, comments: 28, date: '2026-06-10' },
  { id: 'b2', title: 'The Quiet Case for Monochrome Interiors', status: 'Draft', author: 'Lena Fischer', views: 0, likes: 0, comments: 0, date: '—' },
  { id: 'b3', title: 'How We Source Full-Grain Leather', status: 'Scheduled', author: 'Lena Fischer', views: 0, likes: 0, comments: 0, date: '2026-06-25' },
  { id: 'b4', title: 'Five Ways to Style a Wool Throw', status: 'Published', author: 'Lena Fischer', views: 1893, likes: 145, comments: 9, date: '2026-05-28' },
]

export const reviews = [
  { product: 'Heavyweight Cotton Crewneck Tee', text: 'Heavier than expected, fits true to size, and the collar stitching feels built to last.', author: 'Sara L.', rating: 5 },
  { product: 'Premium Heavyweight Pocket Tee', text: 'Looks expensive without the heavy price tag. The cotton softened beautifully after the first week.', author: 'David O.', rating: 5 },
  { product: 'Organic Pima Cotton V-Neck', text: 'Soft from the first wash, and the V-neck hold its shape perfectly without pilling.', author: 'Priya N.', rating: 4 },
  { product: 'Classic Streetwear Heavy Tee', text: 'The fabric feels premium and the drop-shoulder fit is perfect. Easily my favorite daily tee.', author: 'Emma R.', rating: 5 },
  { product: 'Fine Merino Wool Blend Tee', text: 'Warm without feeling bulky. Great premium drape and elegant knit design.', author: 'Michael T.', rating: 5 },
  { product: 'Distressed Raw-Edge Tee', text: 'Comfortable from day one with a subtle vintage edge. Pairs well with everything in my wardrobe.', author: 'James W.', rating: 4 },
]

export const roles = [
  { key: 'admin', label: 'Admin' },
  { key: 'warehouse', label: 'Warehouse Staff' },
  { key: 'support', label: 'Support Agent' },
  { key: 'blogger', label: 'Blogger' },
  { key: 'customer', label: 'Customer' },
]
export const heroData = {
  season: "Spring / Summer 2026",
  title: "Everything, beautifully reduced\nto black and white.",
  subtitle: "Discover timeless essentials crafted with premium materials, thoughtful design, and everyday comfort.\nElevated fashion without unnecessary markups.",
  backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop",
  ctaText: "Shop the Edit",
  ctaLink: "/shop"
};
export const promoBannerData = {
  text: "Free Shipping On Every Order — No Minimum",
  isVisible: true 
};

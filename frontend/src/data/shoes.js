const importedImages = import.meta.glob('../assets/shoes/**/*.jpg', { eager: true, query: '?url', import: 'default' });

const PRICES = {
  'Adidas Samba': 70000,
  'boots': 50000,
  'Nike': 75000,
  'New Balance': 80000,
  'Rick Owens': 100000,
  'Timberlands': 85000,
};

export const shoes = Object.entries(importedImages).map(([path, imgUrl], index) => {
  const pathParts = path.split('/');
  const folderName = pathParts[pathParts.length - 2];

  return {
    id: `shoe_${index}`,
    name: folderName,
    img: imgUrl,
    price: PRICES[folderName] || 50000,
  };
});

export const uniqueCategories = ['All', ...new Set(shoes.map(s => s.name))];

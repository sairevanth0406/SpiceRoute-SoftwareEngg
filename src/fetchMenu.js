import { sanityClient } from './sanityClient';

export const fetchMenu = async () => {
  const query = `*[_type == "foodItem"]{
    _id,
    name,
    price,
    calories,
    description,
    category,
    "imageUrl": image.asset->url
  }`;

  try {
    const menuItems = await sanityClient.fetch(query);
    return menuItems;
  } catch (error) {
    console.error("Error fetching menu from Sanity:", error);
    return [];
  }
};
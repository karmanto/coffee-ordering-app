// lib/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const fetchMenus = async (skip = 0, limit = 10) => {
  try {
    const res = await fetch(`${API_URL}/api/menus?skip=${skip}&limit=${limit}`);
    const data = await res.json();
    // Pastikan setiap item memiliki properti amount
    return data.map(item => ({
      ...item,
      amount: item.amount !== undefined ? item.amount : 0,
    }));
  } catch (error) {
    console.error("Error fetching menus:", error);
    return [];
  }
};

export const fetchCategories = async (limit = 10) => {
  try {
    const res = await fetch(`${API_URL}/api/categories?skip=0&limit=${limit}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

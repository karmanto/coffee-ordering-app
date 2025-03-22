// lib/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const fetchMenus = async (skip = 0, limit = 10, categoryId = null) => {
  try {
    const categoryQuery = categoryId ? `&categoryId=${categoryId}` : "";
    const res = await fetch(
      `${API_URL}/api/menus?skip=${skip}&limit=${limit}${categoryQuery}`
    );
    const data = await res.json();
    return data.map((item) => ({
      ...item,
      amount: item.amount !== undefined ? item.amount : 0,
    }));
  } catch (error) {
    console.error("Error fetching menus:", error);
    return [];
  }
};

export const fetchDiscounts = async (date = null) => {
  try {
    if (!date) {
      const today = new Date().toISOString().slice(0, 10);
      date = today;
    }
    const dateQuery = `&date=${date}`;
    const res = await fetch(`${API_URL}/api/discounts?${dateQuery}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching menus:", error);
    return [];
  }
};

export const fetchCategories = async () => {
  try {
    const res = await fetch(`${API_URL}/api/categories`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};



export const fetchChairs = async (uuid) => {
  try {
    const res = await fetch(`${API_URL}/api/chairs/${uuid}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching chair:", error);
    return null;
  }
};

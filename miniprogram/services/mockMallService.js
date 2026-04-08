const mockStore = require("../utils/mockStore.js");

function getMallData() {
  return Promise.resolve(mockStore.getState().mallState);
}

function setKeyword(keyword) {
  mockStore.setMallState({ searchKeyword: (keyword || "").trim() });
  return Promise.resolve(mockStore.getState().mallState);
}

function setCategory(categoryId) {
  mockStore.setMallState({ selectedCategory: categoryId || "herb" });
  return Promise.resolve(mockStore.getState().mallState);
}

function getFilteredProducts() {
  const mall = mockStore.getState().mallState;
  const keyword = (mall.searchKeyword || "").trim().toLowerCase();
  const category = mall.selectedCategory || "herb";

  let products = mall.products || [];

  if (category) {
    products = products.filter((item) => item.category === category);
  }

  if (keyword) {
    products = products.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const desc = (item.desc || "").toLowerCase();
      const tags = (item.tags || []).join(" ").toLowerCase();
      return name.includes(keyword) || desc.includes(keyword) || tags.includes(keyword);
    });
  }

  return Promise.resolve(products);
}

function getProductById(productId) {
  const products = mockStore.getState().mallState.products || [];
  return Promise.resolve(products.find((p) => p.id === productId) || null);
}

module.exports = {
  getMallData,
  setKeyword,
  setCategory,
  getFilteredProducts,
  getProductById
};

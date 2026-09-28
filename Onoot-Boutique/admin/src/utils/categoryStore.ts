export const getCategories = () => {
  if (typeof window === 'undefined') return [];
  const json = localStorage.getItem('categories');
  return json ? JSON.parse(json) : [];
};

export const setCategories = (cats: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('categories', JSON.stringify(cats));
};

export const addCategory = (cat: any) => {
  const cats = getCategories();
  const updated = [...cats, cat];
  setCategories(updated);
  return updated;
};

export const editCategory = (id: number, updatedFields: any) => {
  const cats = getCategories().map((c: any) => (c.id === id ? { ...c, ...updatedFields } : c));
  setCategories(cats);
  return cats;
};

export const deleteCategory = (id: number) => {
  const cats = getCategories().filter((c: any) => c.id !== id);
  setCategories(cats);
  return cats;
};

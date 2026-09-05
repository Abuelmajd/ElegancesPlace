import React, { createContext, useContext, useState, useEffect } from 'react';

export interface StoreCategory {
  id: string;
  category_id: string;
  name: string; // Used for product matching e.g., 'عطور', 'ساعات', 'حقائب'
  title: string; // Display title e.g., 'عطور فاخرة'
  subtitle: string; // Short description e.g., 'أرقى العطور العالمية'
  slug: string;
  image_url: string; // High-res image URL
  icon: string; // Symbolic icon / emoji e.g., '💎', '⌚', '👜', '🎁'
  display_mode: 'image' | 'icon'; // 'image' for photo background/card, 'icon' for symbolic icon
  sort_order: number;
  status: 'active' | 'inactive';
}

export const DEFAULT_STORE_CATEGORIES: StoreCategory[] = [
  {
    id: 'cat_perfumes',
    category_id: 'cat_perfumes',
    name: 'عطور',
    title: 'عطور فاخرة',
    subtitle: 'أرقى العطور الشرقية والعالمية',
    slug: 'perfumes',
    image_url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&auto=format&fit=crop&q=80',
    icon: '💎',
    display_mode: 'image',
    sort_order: 1,
    status: 'active'
  },
  {
    id: 'cat_watches',
    category_id: 'cat_watches',
    name: 'ساعات',
    title: 'ساعات وإكسسوارات',
    subtitle: 'تصاميم عصرية وفخامة استثنائية',
    slug: 'watches',
    image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
    icon: '⌚',
    display_mode: 'image',
    sort_order: 2,
    status: 'active'
  },
  {
    id: 'cat_handbags',
    category_id: 'cat_handbags',
    name: 'حقائب',
    title: 'حقائب وجلديات ومحافظ',
    subtitle: 'حقائب يد ومحافظ جلد طبيعي',
    slug: 'handbags',
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    icon: '👜',
    display_mode: 'image',
    sort_order: 3,
    status: 'active'
  },
  {
    id: 'cat_gifts',
    category_id: 'cat_gifts',
    name: 'هدايا وعروض',
    title: 'هدايا وتوزيعات فاخرة',
    subtitle: 'باقات وتنسيقات هدايا راقية',
    slug: 'gifts',
    image_url: 'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=600&auto=format&fit=crop&q=80',
    icon: '🎁',
    display_mode: 'image',
    sort_order: 4,
    status: 'active'
  },
  {
    id: 'cat_accessories',
    category_id: 'cat_accessories',
    name: 'إكسسوارات',
    title: 'إكسسوارات ومجوهرات',
    subtitle: 'قطع فريدة تكمل إطلالتك',
    slug: 'accessories',
    image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
    icon: '✨',
    display_mode: 'image',
    sort_order: 5,
    status: 'active'
  },
  {
    id: 'cat_fashion',
    category_id: 'cat_fashion',
    name: 'ملابس',
    title: 'أزياء وملابس راقية',
    subtitle: 'أحدث صيحات الموضة والأناقة',
    slug: 'fashion',
    image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
    icon: '👗',
    display_mode: 'image',
    sort_order: 6,
    status: 'active'
  }
];

interface CategoryContextType {
  categories: StoreCategory[];
  activeCategories: StoreCategory[];
  addCategory: (category: Omit<StoreCategory, 'id' | 'category_id'>) => void;
  updateCategory: (id: string, updates: Partial<StoreCategory>) => void;
  deleteCategory: (id: string) => void;
  toggleDisplayMode: (id: string) => void;
  resetToDefaults: () => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<StoreCategory[]>(() => {
    const saved = localStorage.getItem('elites_rich_categories') || localStorage.getItem('elites_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize entries if loaded from legacy format
          return parsed.map((cat: any, idx: number) => ({
            id: cat.id || cat.category_id || `cat_${idx + 1}`,
            category_id: cat.category_id || cat.id || `cat_${idx + 1}`,
            name: cat.name || 'قسم عام',
            title: cat.title || `${cat.name || 'قسم'} فاخر`,
            subtitle: cat.subtitle || cat.description || 'أرقى المنتجات والخيارات',
            slug: cat.slug || (cat.name ? cat.name.toLowerCase().replace(/\s+/g, '-') : `cat-${idx + 1}`),
            image_url: cat.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
            icon: cat.icon || '💎',
            display_mode: (cat.display_mode === 'icon' || cat.display_mode === 'image') ? cat.display_mode : 'image',
            sort_order: cat.sort_order || (idx + 1),
            status: cat.status || 'active'
          }));
        }
      } catch (e) {
        console.error('Failed to parse categories from localStorage:', e);
      }
    }
    return DEFAULT_STORE_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('elites_rich_categories', JSON.stringify(categories));
    localStorage.setItem('elites_categories', JSON.stringify(categories));
    localStorage.setItem('elites_category_names', JSON.stringify(categories.map(c => c.name)));
  }, [categories]);

  const addCategory = (categoryData: Omit<StoreCategory, 'id' | 'category_id'>) => {
    const id = 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newCategory: StoreCategory = {
      ...categoryData,
      id,
      category_id: id,
      slug: categoryData.slug || (categoryData.name ? categoryData.name.toLowerCase().replace(/\s+/g, '-') : id),
      sort_order: categoryData.sort_order || (categories.length + 1)
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, updates: Partial<StoreCategory>) => {
    setCategories(prev => prev.map(cat => (cat.id === id || cat.category_id === id) ? { ...cat, ...updates } : cat));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id && cat.category_id !== id));
  };

  const toggleDisplayMode = (id: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === id || cat.category_id === id) {
        return {
          ...cat,
          display_mode: cat.display_mode === 'image' ? 'icon' : 'image'
        };
      }
      return cat;
    }));
  };

  const resetToDefaults = () => {
    setCategories(DEFAULT_STORE_CATEGORIES);
  };

  const activeCategories = categories
    .filter(c => c.status === 'active')
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <CategoryContext.Provider value={{
      categories,
      activeCategories,
      addCategory,
      updateCategory,
      deleteCategory,
      toggleDisplayMode,
      resetToDefaults
    }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

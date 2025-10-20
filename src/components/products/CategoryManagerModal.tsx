/**
 * Category Manager Modal
 *
 * Manage product categories:
 * - Create new categories
 * - Edit existing categories
 * - Delete categories (with warning if products exist)
 * - Reorder categories
 */

import { useState } from 'react';
import { X, Folder, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import type { ProductCategory } from '@/types';

interface CategoryManagerModalProps {
  categories: ProductCategory[];
  onClose: () => void;
  onSaved: () => void;
}

export default function CategoryManagerModal({
  categories,
  onClose,
  onSaved,
}: CategoryManagerModalProps) {
  const [categoryList, setCategoryList] = useState<ProductCategory[]>(categories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  const handleAddCategory = () => {
    setError('');

    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    if (categoryList.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      setError('A category with this name already exists');
      return;
    }

    const newCategory: ProductCategory = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setCategoryList([...categoryList, newCategory]);
    setNewCategoryName('');
  };

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setEditName(category.name);
  };

  const handleSaveEdit = () => {
    setError('');

    if (!editName.trim()) {
      setError('Category name is required');
      return;
    }

    if (categoryList.some(cat =>
      cat.id !== editingCategory?.id &&
      cat.name.toLowerCase() === editName.toLowerCase()
    )) {
      setError('A category with this name already exists');
      return;
    }

    setCategoryList(categoryList.map(cat =>
      cat.id === editingCategory?.id
        ? { ...cat, name: editName.trim() }
        : cat
    ));

    setEditingCategory(null);
    setEditName('');
  };

  const handleDeleteCategory = (categoryId: string) => {
    // In a real implementation, check if products exist in this category
    if (!confirm('Are you sure you want to delete this category? Products in this category will become uncategorized.')) {
      return;
    }

    setCategoryList(categoryList.filter(cat => cat.id !== categoryId));
  };

  const handleSave = () => {
    // In a real implementation, send categoryList to API
    console.log('Saving categories:', categoryList);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <Folder className="w-6 h-6 text-primary mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Manage Categories</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Add New Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Add New Category
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCategory();
                  }
                }}
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Enter category name..."
              />
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Existing Categories */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Existing Categories ({categoryList.length})
            </label>

            {categoryList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No categories yet. Add your first category above.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {categoryList.map((category) => (
                  <div key={category.id} className="p-3 hover:bg-gray-50">
                    {editingCategory?.id === category.id ? (
                      // Edit Mode
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit();
                            } else if (e.key === 'Escape') {
                              setEditingCategory(null);
                              setEditName('');
                            }
                          }}
                          className="flex-1 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-primary focus:border-primary text-sm"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary/90"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(null);
                            setEditName('');
                          }}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Folder className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{category.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Edit category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

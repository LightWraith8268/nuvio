/**
 * Product Management Interface
 *
 * Features:
 * - View all products organized by category
 * - Create/edit products
 * - Manage categories
 * - Enable/disable inventory tracking
 * - Set pricing and reorder points
 * - Filter by category, in-stock status
 * - Search by name/SKU
 */

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit,
  Search,
  Filter,
  Folder,
  FolderOpen,
  CheckCircle,
  XCircle,
  DollarSign,
} from 'lucide-react';
import { invoissAPI } from '@/lib/invoiss-api';
import type { Product, ProductCategory } from '@/types';
import NewProductModal from './NewProductModal';
import EditProductModal from './EditProductModal';
import CategoryManagerModal from './CategoryManagerModal';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await invoissAPI.listProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // TODO: Implement getCategories in API
      // For now, extract unique categories from products
      const data = await invoissAPI.listProducts();
      const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
      const mockCategories: ProductCategory[] = uniqueCategories.map((cat, idx) => ({
        id: `cat-${idx}`,
        name: cat!,
        isActive: true,
        createdAt: new Date().toISOString(),
      }));
      setCategories(mockCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditProductModal(true);
  };

  const handleProductSaved = () => {
    loadProducts();
    loadCategories();
    setShowNewProductModal(false);
    setShowEditProductModal(false);
    setSelectedProduct(null);
  };

  const handleCategoriesUpdated = () => {
    loadCategories();
    setShowCategoryManager(false);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
      product.category === selectedCategory ||
      product.categoryId === selectedCategory;

    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'in_stock' && product.inStock) ||
      (stockFilter === 'out_of_stock' && !product.inStock);

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const categoryName = product.category || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Package className="w-6 h-6 text-primary mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Product Catalog</h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCategoryManager(true)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Folder className="w-4 h-4 inline-block mr-2" />
            Manage Categories
          </button>
          <button
            onClick={() => setShowNewProductModal(true)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 inline-block mr-2" />
            New Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="all">All Products</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products by Category */}
      <div className="space-y-6">
        {Object.keys(productsByCategory).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No products found matching your filters.</p>
          </div>
        ) : (
          Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
            <div key={categoryName} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Category Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <FolderOpen className="w-5 h-5 text-primary mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">{categoryName}</h3>
                  <span className="ml-2 text-sm text-gray-500">
                    ({categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'})
                  </span>
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pricing
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inventory
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoryProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-gray-500">{product.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.sku || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-gray-900">
                              <DollarSign className="w-3 h-3 inline-block" />
                              {product.contractorPrice.toFixed(2)} (Contractor)
                            </div>
                            {product.retailPrice && (
                              <div className="text-gray-500">
                                <DollarSign className="w-3 h-3 inline-block" />
                                {product.retailPrice.toFixed(2)} (Retail)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.unit || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.trackInventory ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Tracked
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">Not tracked</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.inStock ? (
                            <span className="inline-flex items-center">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-sm text-green-700">In Stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center">
                              <XCircle className="w-4 h-4 text-red-500 mr-1" />
                              <span className="text-sm text-red-700">Out of Stock</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-primary hover:text-primary/90"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showNewProductModal && (
        <NewProductModal
          categories={categories}
          onClose={() => setShowNewProductModal(false)}
          onSaved={handleProductSaved}
        />
      )}

      {showEditProductModal && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          categories={categories}
          onClose={() => {
            setShowEditProductModal(false);
            setSelectedProduct(null);
          }}
          onSaved={handleProductSaved}
        />
      )}

      {showCategoryManager && (
        <CategoryManagerModal
          categories={categories}
          onClose={() => setShowCategoryManager(false)}
          onSaved={handleCategoriesUpdated}
        />
      )}
    </div>
  );
}

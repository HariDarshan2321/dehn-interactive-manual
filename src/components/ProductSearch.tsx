'use client';

import { useState, useEffect } from 'react';

interface ProductSearchProps {
  onProductSelected: (product: any) => void;
}

export default function ProductSearch({ onProductSelected }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, products]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const result = await response.json();
        setProducts(result.data.products);
        setFilteredProducts(result.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product =>
        product.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'surge', label: 'Surge Protection' },
    { value: 'lightning', label: 'Lightning Protection' },
    { value: 'earthing', label: 'Earthing' },
    { value: 'arc', label: 'Arc Fault Protection' },
    { value: 'safety', label: 'Safety Equipment' }
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by product name or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <svg className="animate-spin h-8 w-8 text-dehn-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 9.34c-.665-.995-1.824-2.34-3-2.34s-2.335 1.345-3 2.34M12 3a9 9 0 11-9 9 9 9 0 019-9z" />
              </svg>
              <p className="text-gray-600">No products found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => onProductSelected(product)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-dehn-secondary hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-dehn-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-dehn-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 9.34c-.665-.995-1.824-2.34-3-2.34s-2.335 1.345-3 2.34M12 3a9 9 0 11-9 9 9 9 0 019-9z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {product.estimatedInstallTime}
                        </span>
                        <span className={`text-xs font-medium ${
                          product.difficultyLevel === 'High' ? 'text-red-600' :
                          product.difficultyLevel === 'Medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {product.difficultyLevel}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Access */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Access</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedCategory('surge')}
              className="btn-secondary text-sm py-2"
            >
              Surge Protection
            </button>
            <button
              onClick={() => setSelectedCategory('lightning')}
              className="btn-secondary text-sm py-2"
            >
              Lightning Protection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

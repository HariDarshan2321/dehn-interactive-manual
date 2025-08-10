'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, QrCode, Upload, Eye, Save, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  qrCode: string;
  manualUrl: string;
  videoUrl: string;
  imageUrl: string;
  estimatedInstallTime: string;
  difficultyLevel: string;
  requiredTools: string[];
  safetyWarnings: string[];
  isLoaded?: boolean;
}

interface AdminCredentials {
  username: string;
  password: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState<AdminCredentials>({ username: '', password: '' });
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: 'Surge Protection',
    description: '',
    videoUrl: '',
    estimatedInstallTime: '15-25 minutes',
    difficultyLevel: 'Medium',
    requiredTools: ['Phillips screwdriver', 'Wire strippers', 'Multimeter'],
    safetyWarnings: ['Ensure power is disconnected before installation', 'Use appropriate PPE', 'Verify correct wire connections']
  });

  // Simple authentication (in production, use proper auth)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      setIsAuthenticated(true);
      loadProducts();
    } else {
      alert('Invalid credentials. Use admin/admin');
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products');
      const result = await response.json();
      if (result.success) {
        setProducts(result.data.products || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
    setIsLoading(false);
  };

  const generateQRCode = (productName: string): string => {
    const cleanName = productName.replace(/\s+/g, '-').toUpperCase();
    return `DEHN-${cleanName}-2024`;
  };

  const generateProductId = (productName: string): string => {
    return productName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 30);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.description) {
      alert('Please fill in required fields (name and description)');
      return;
    }

    const productId = generateProductId(newProduct.name);
    const qrCode = generateQRCode(newProduct.name);

    const product: Product = {
      id: productId,
      name: newProduct.name,
      category: newProduct.category || 'Surge Protection',
      description: newProduct.description,
      qrCode,
      manualUrl: `/pdfs/${productId}.pdf`,
      videoUrl: newProduct.videoUrl || `/videos/${productId}-installation.mp4`,
      imageUrl: `/images/products/${productId}.jpg`,
      estimatedInstallTime: newProduct.estimatedInstallTime || '15-25 minutes',
      difficultyLevel: newProduct.difficultyLevel || 'Medium',
      requiredTools: newProduct.requiredTools || ['Phillips screwdriver', 'Wire strippers', 'Multimeter'],
      safetyWarnings: newProduct.safetyWarnings || ['Ensure power is disconnected before installation', 'Use appropriate PPE', 'Verify correct wire connections']
    };

    // Add to products list (in production, this would be saved to database)
    setProducts(prev => [...prev, product]);

    // Update the product embeddings service
    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
    } catch (error) {
      console.error('Failed to add product to embeddings:', error);
    }

    setShowAddForm(false);
    setNewProduct({
      name: '',
      category: 'Surge Protection',
      description: '',
      videoUrl: '',
      estimatedInstallTime: '15-25 minutes',
      difficultyLevel: 'Medium',
      requiredTools: ['Phillips screwdriver', 'Wire strippers', 'Multimeter'],
      safetyWarnings: ['Ensure power is disconnected before installation', 'Use appropriate PPE', 'Verify correct wire connections']
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));

      try {
        await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleFileUpload = async (file: File, productId: string, type: 'pdf' | 'video' | 'image') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId);
    formData.append('type', type);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert(`${type.toUpperCase()} uploaded successfully!`);
        loadProducts(); // Refresh products
      } else {
        alert(`Failed to upload ${type}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Error uploading ${type}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-red-600">DEHN Admin Portal</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="admin"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
            >
              Login
            </button>
          </form>
          <p className="text-sm text-gray-500 text-center mt-4">
            Demo credentials: admin / admin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-red-600">DEHN Product Management</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Category:</strong> {product.category}</p>
                  <p><strong>QR Code:</strong> {product.qrCode}</p>
                  <p><strong>Install Time:</strong> {product.estimatedInstallTime}</p>
                  <p><strong>Difficulty:</strong> {product.difficultyLevel}</p>
                  <p className="text-xs">{product.description}</p>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], product.id, 'pdf')}
                      className="hidden"
                      id={`pdf-${product.id}`}
                    />
                    <label
                      htmlFor={`pdf-${product.id}`}
                      className="flex-1 bg-blue-100 text-blue-800 px-3 py-1 rounded text-xs cursor-pointer hover:bg-blue-200 text-center"
                    >
                      Upload PDF
                    </label>

                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], product.id, 'video')}
                      className="hidden"
                      id={`video-${product.id}`}
                    />
                    <label
                      htmlFor={`video-${product.id}`}
                      className="flex-1 bg-green-100 text-green-800 px-3 py-1 rounded text-xs cursor-pointer hover:bg-green-200 text-center"
                    >
                      Upload Video
                    </label>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(`/manual/${product.id}`, '_blank')}
                      className="flex-1 bg-gray-100 text-gray-800 px-3 py-1 rounded text-xs hover:bg-gray-200 flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Manual</span>
                    </button>

                    <button
                      onClick={() => {
                        const qrUrl = `data:image/svg+xml,${encodeURIComponent(`
                          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
                            <rect width="200" height="200" fill="white"/>
                            <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">${product.qrCode}</text>
                          </svg>
                        `)}`;
                        const link = document.createElement('a');
                        link.href = qrUrl;
                        link.download = `${product.id}-qr.svg`;
                        link.click();
                      }}
                      className="flex-1 bg-red-100 text-red-800 px-3 py-1 rounded text-xs hover:bg-red-200 flex items-center justify-center space-x-1"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>QR Code</span>
                    </button>
                  </div>
                </div>

                {product.isLoaded && (
                  <div className="mt-2">
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Embeddings Loaded
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Product Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Product</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={newProduct.name || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="e.g., DEHNventil M2 TNC 255 FM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newProduct.category || 'Surge Protection'}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Surge Protection">Surge Protection</option>
                    <option value="Lightning Protection">Lightning Protection</option>
                    <option value="Earthing">Earthing</option>
                    <option value="Arc Fault Protection">Arc Fault Protection</option>
                    <option value="Safety Equipment">Safety Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={newProduct.description || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Professional electrical protection device for..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={newProduct.videoUrl || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Install Time</label>
                    <input
                      type="text"
                      value={newProduct.estimatedInstallTime || ''}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, estimatedInstallTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="15-25 minutes"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      value={newProduct.difficultyLevel || 'Medium'}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, difficultyLevel: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddProduct}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

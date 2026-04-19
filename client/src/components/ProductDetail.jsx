import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  Edit,
  Truck,
  DollarSign,
  Package,
  Eye
} from 'lucide-react';
import { api } from '../utils/api';

export default function ProductDetail({ setPage, user, productId }) {
  const [product, setProduct] = useState(null);
  const [projects, setProjects] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const fetchProductData = async () => {
    try {
      setLoading(true);

      const [productData, projectsData, similarData] = await Promise.all([
        api.get(`/api/products/${productId}`),
        api.get(`/api/products/${productId}/projects`),
        api.get(`/api/products/${productId}/alternatives`)
      ]);

      setProduct(productData.data);
      setEditData(productData.data);
      setProjects(projectsData.data || []);
      setSimilar(similarData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await api.put(`/api/products/${productId}`, editData);
      setProduct(updated.data);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-slate-600 mb-4">Product not found</p>
        <button
          onClick={() => setPage('products')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setPage('products')}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
          {product.code && (
            <p className="text-slate-600">SKU: {product.code}</p>
          )}
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
        >
          <Edit className="w-4 h-4" /> Edit
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Main Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Image and Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="bg-slate-100 h-48 flex items-center justify-center rounded-lg mb-4 overflow-hidden">
              {product.imageUrl || product.thumbnailUrl ? (
                <img
                  src={`/api/image-proxy?url=${encodeURIComponent(product.imageUrl || product.thumbnailUrl)}`}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex'; }}
                />
              ) : null}
              <div className={`fallback-icon w-full h-full items-center justify-center ${product.imageUrl || product.thumbnailUrl ? 'hidden' : 'flex'}`}>
                <Package className="w-16 h-16 text-slate-400" />
              </div>
            </div>

            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                    <input
                      type="number"
                      value={editData.price || ''}
                      onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Availability</label>
                    <select
                      value={editData.availability || ''}
                      onChange={(e) => setEditData({ ...editData, availability: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 bg-white"
                    >
                      <option value="in-stock">In Stock</option>
                      <option value="limited">Limited Stock</option>
                      <option value="backorder">Backorder</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lead Time (days)</label>
                    <input
                      type="number"
                      value={editData.leadTime || ''}
                      onChange={(e) => setEditData({ ...editData, leadTime: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-600">Price</p>
                    <p className="text-2xl font-bold text-indigo-600">${product.price?.toFixed(2)}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-600">Availability</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                      product.availability === 'in-stock'
                        ? 'bg-emerald-100 text-emerald-700'
                        : product.availability === 'limited'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.availability}
                    </span>
                  </div>

                  {product.leadTime && (
                    <div className="p-3 bg-slate-50 rounded flex items-start gap-2">
                      <Truck className="w-4 h-4 text-slate-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-600">Lead Time</p>
                        <p className="font-semibold text-slate-900">{product.leadTime} days</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Specifications and Vendor Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Product Information</h2>

            <div className="space-y-3">
              {product.code && (
                <div className="flex justify-between">
                  <span className="text-slate-600">SKU:</span>
                  <span className="font-medium text-slate-900">{product.code}</span>
                </div>
              )}
              {product.category && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Category:</span>
                  <span className="font-medium text-slate-900 capitalize">{product.category}</span>
                </div>
              )}
              {product.vendor && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Vendor:</span>
                  <span className="font-medium text-slate-900">{product.vendor.name}</span>
                </div>
              )}
              {product.description && (
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">Description</p>
                  <p className="text-slate-900">{product.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Specifications</h2>

              <div className="space-y-3">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-medium text-slate-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Projects Using This Product */}
      {projects.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Used In Projects</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => setPage('project-detail', { projectId: project.id })}
                className="p-4 border border-slate-200 rounded-lg hover:shadow-md cursor-pointer transition"
              >
                <h3 className="font-semibold text-slate-900">{project.name}</h3>
                <p className="text-sm text-slate-600">{project.client?.name}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Room: {project.room || 'Unspecified'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar Products / Alternatives */}
      {similar.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Similar Products & Alternatives</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {similar.map(altProduct => (
              <div
                key={altProduct.id}
                onClick={() => setPage('product-detail', { productId: altProduct.id })}
                className="p-4 border border-slate-200 rounded-lg hover:shadow-md cursor-pointer transition"
              >
                <div className="bg-slate-100 h-24 flex items-center justify-center rounded mb-3 overflow-hidden">
                  {altProduct.imageUrl || altProduct.thumbnailUrl ? (
                    <img
                      src={`/api/image-proxy?url=${encodeURIComponent(altProduct.thumbnailUrl || altProduct.imageUrl)}`}
                      alt={altProduct.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <h4 className="font-semibold text-slate-900 line-clamp-1">{altProduct.name}</h4>
                <p className="text-sm text-slate-600 mb-2">{altProduct.vendor?.name}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-600">${altProduct.price?.toFixed(2)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    altProduct.availability === 'in-stock'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {altProduct.availability}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

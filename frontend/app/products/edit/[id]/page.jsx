"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProductForm from "../../../../components/ProductForm";

export default function EditProductPage() {
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  useEffect(() => {
    checkAuth();
    fetchProduct();
  }, [productId]);

  const checkAuth = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/login");
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${productId}`,
      );
      if (response.ok) {
        const productData = await response.json();
        setProduct(productData);
      } else {
        alert("Product not found");
        router.push("/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      alert("Error loading product");
      router.push("/products");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ProductForm initialData={product} isEdit={true} />
      </div>
    </div>
  );
}

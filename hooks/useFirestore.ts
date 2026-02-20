import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

// Hook genérico para sincronizar un array con Firestore
export function useFirestoreCollection<T extends { id: string }>(
  collectionName: string,
  initialData: T[] = []
): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean] {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);

  // Escuchar cambios en tiempo real
  useEffect(() => {
    const q = query(collection(db, collectionName));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as T);
      });
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}:`, error);
      // Si hay error, intentar cargar de localStorage como backup
      try {
        const saved = localStorage.getItem(`dxy_${collectionName}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setData(Array.isArray(parsed) ? parsed : initialData);
        }
      } catch {
        setData(initialData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  // Función para actualizar datos (guarda en Firebase y localStorage)
  const setDataWithSync = (newDataOrUpdater: React.SetStateAction<T[]>) => {
    setData(prevData => {
      const newData = typeof newDataOrUpdater === 'function' 
        ? (newDataOrUpdater as (prev: T[]) => T[])(prevData)
        : newDataOrUpdater;
      
      // Guardar cada item en Firestore
      newData.forEach(async (item) => {
        try {
          await setDoc(doc(db, collectionName, item.id), item);
        } catch (error) {
          console.error(`Error saving to ${collectionName}:`, error);
        }
      });

      // Backup en localStorage
      localStorage.setItem(`dxy_${collectionName}`, JSON.stringify(newData));
      
      return newData;
    });
  };

  return [data, setDataWithSync, loading];
}

// Hook simplificado para productos
export function useProducts(initialProducts: any[]) {
  return useFirestoreCollection('products', initialProducts);
}

// Hook simplificado para ventas diarias
export function useDailySales() {
  return useFirestoreCollection('dailySales', []);
}

// Hook simplificado para facturas de compra
export function usePurchaseInvoices() {
  return useFirestoreCollection('purchaseInvoices', []);
}

// Hook simplificado para entrenadores
export function useTrainers() {
  return useFirestoreCollection('trainers', []);
}

// Hook simplificado para ventas de entrenadores
export function useTrainerSales() {
  return useFirestoreCollection('trainerSales', []);
}

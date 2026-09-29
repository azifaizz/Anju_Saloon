import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => { }
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: () => void;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Listen to role from firestore in real-time
          const docRef = doc(db, 'users', firebaseUser.uid);
          unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: userData.role
              });
            } else {
               // Fallback if user document doesn't exist yet
               setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
               });
            }
            setLoading(false);
          }, (error) => {
            console.error("Error listening to user role:", error);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
            });
            setLoading(false);
          });
        } catch (error) {
          console.error("Error setting up user role listener:", error);
           setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
           });
           setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
        if (unsubscribeDoc) unsubscribeDoc();
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const logout = async () => {
    await auth.signOut();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
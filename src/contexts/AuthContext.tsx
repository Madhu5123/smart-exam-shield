
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, database } from "../lib/firebase";

// Define user roles
export type UserRole = "admin" | "teacher" | "student";

// Define user interface with role
export interface AuthUser extends User {
  role?: UserRole;
  displayName: string | null;
}

// Context interface
interface AuthContextType {
  currentUser: AuthUser | null;
  userRole: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  adminRegister: (email: string, password: string, name: string) => Promise<void>;
  teacherRegister: (email: string, password: string, name: string) => Promise<void>;
  studentRegister: (regNumber: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to set user role in the database
  const setUserRoleInDB = async (uid: string, role: UserRole, name: string) => {
    await set(ref(database, `users/${uid}`), {
      role,
      name
    });
  };

  // Function to get user role from the database
  const getUserRoleFromDB = async (uid: string) => {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val().role as UserRole;
    }
    
    return null;
  };

  // Admin registration
  const adminRegister = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await setUserRoleInDB(userCredential.user.uid, "admin", name);
  };

  // Teacher registration (should be called by admin)
  const teacherRegister = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await setUserRoleInDB(userCredential.user.uid, "teacher", name);
  };

  // Student registration (should be called by teacher)
  const studentRegister = async (regNumber: string, password: string, name: string) => {
    // For students, use registration number as email
    const email = `${regNumber}@examportal.com`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await setUserRoleInDB(userCredential.user.uid, "student", name);
    
    // Store additional student info
    await set(ref(database, `students/${userCredential.user.uid}`), {
      registrationNumber: regNumber,
      name
    });
  };

  // Login
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Logout
  const logout = () => {
    return signOut(auth);
  };

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await getUserRoleFromDB(user.uid);
        
        // Add role to user object
        const authUser = user as AuthUser;
        authUser.role = role;
        
        setCurrentUser(authUser);
        setUserRole(role);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    adminRegister,
    teacherRegister,
    studentRegister,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

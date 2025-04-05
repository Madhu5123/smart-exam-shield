
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
import { useToast } from "@/hooks/use-toast";

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
  teacherRegister: (email: string, password: string, name: string, branch?: string) => Promise<void>;
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
  const setUserRoleInDB = async (uid: string, role: UserRole, name: string, branch?: string) => {
    const userData: { role: UserRole; name: string; branch?: string } = {
      role,
      name
    };
    
    // Add branch if provided
    if (branch) {
      userData.branch = branch;
    }
    
    await set(ref(database, `users/${uid}`), userData);
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

  // Teacher registration (should be called by admin)
  const teacherRegister = async (email: string, password: string, name: string, branch?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await setUserRoleInDB(userCredential.user.uid, "teacher", name, branch);
  };

  // Student registration (should be called by teacher)
  const studentRegister = async (regNumber: string, password: string, name: string) => {
    try {
      // For students, use registration number as email with domain
      const email = `${regNumber}@examportal.com`;
      console.log("Registering student with email:", email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await setUserRoleInDB(userCredential.user.uid, "student", name);
      
      // Store additional student info
      await set(ref(database, `students/${userCredential.user.uid}`), {
        registrationNumber: regNumber,
        name
      });
      
      console.log("Student registration successful:", userCredential.user.uid);
      // Don't return the user object, just return void to match the type
    } catch (error) {
      console.error("Student registration failed:", error);
      throw error;
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      // First, check if it's a registration number login (student)
      if (!email.includes('@')) {
        // Assume it's a registration number, append domain
        email = `${email}@examportal.com`;
      }
      
      console.log("Attempting login with:", email);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    // Clear admin login state if exists
    localStorage.removeItem("adminLoggedIn");
    
    // For Firebase authenticated users
    return signOut(auth);
  };

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const role = await getUserRoleFromDB(user.uid);
          console.log("User authenticated:", user.uid, "with role:", role);
          
          // Add role to user object
          const authUser = user as AuthUser;
          authUser.role = role;
          
          setCurrentUser(authUser);
          setUserRole(role);
        } catch (error) {
          console.error("Error getting user role:", error);
          setCurrentUser(user as AuthUser);
          setUserRole(null);
        }
      } else {
        console.log("No user is authenticated");
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

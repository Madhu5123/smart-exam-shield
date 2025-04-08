
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
  const { toast } = useToast();

  // Function to set user role in the database
  const setUserRoleInDB = async (uid: string, role: UserRole, name: string, branch?: string) => {
    const userData: { role: UserRole; name: string; branch?: string } = {
      role,
      name
    };
    
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
      // Set a flag to indicate we're adding a student
      sessionStorage.setItem("isAddingStudent", "true");
      
      const email = `${regNumber}@examportal.com`;
      console.log("Registering student with email:", email);
      
      const teacherUser = auth.currentUser;
      
      if (!teacherUser) {
        throw new Error("No authenticated user found to add student");
      }
      
      // Save current teacher info
      const teacherInfo = {
        uid: teacherUser.uid,
        email: teacherUser.email,
        displayName: teacherUser.displayName
      };
      
      // Store student data in Firebase Realtime Database
      await set(ref(database, `students/${regNumber}`), {
        email: email,
        name: name,
        createdBy: teacherUser.uid,
        createdAt: new Date().toISOString()
      });
      
      // Create a temporary auth object for student registration
      const secondaryAuth = auth;
      
      // Get the teacher's role for later restoration
      const userRef = ref(database, `users/${teacherUser.uid}`);
      const snapshot = await get(userRef);
      const teacherRole = snapshot.exists() ? snapshot.val().role : null;
      
      // Use a separate process to create the student account
      // This is to avoid logging out the teacher
      try {
        // Create the student account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await setUserRoleInDB(userCredential.user.uid, "student", name);
        
        // Add to students collection
        await set(ref(database, `students/${userCredential.user.uid}`), {
          registrationNumber: regNumber,
          name
        });
        
        // Log back in as the teacher
        if (teacherInfo.email) {
          await signInWithEmailAndPassword(auth, teacherInfo.email, "temporary-password-placeholder")
            .catch(() => {
              // If we can't log back in automatically, at least restore the teacher info
              if (teacherRole) {
                const authUser = teacherUser as AuthUser;
                authUser.role = teacherRole;
                setCurrentUser(authUser);
                setUserRole(teacherRole);
              }
            });
        }
        
        toast({
          title: "Student added successfully",
          description: `${name} has been added with registration number ${regNumber}`,
        });
      } catch (error) {
        console.error("Error creating student account:", error);
        // Ensure teacher session is maintained even if student creation fails
        if (teacherRole) {
          const authUser = teacherUser as AuthUser;
          authUser.role = teacherRole;
          setCurrentUser(authUser);
          setUserRole(teacherRole);
        }
        throw error;
      } finally {
        // Clear the adding student flag
        setTimeout(() => {
          sessionStorage.removeItem("isAddingStudent");
        }, 2000); // Give a little time for redirects to resolve
      }
    } catch (error) {
      console.error("Student registration failed:", error);
      sessionStorage.removeItem("isAddingStudent");
      throw error;
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      if (!email.includes('@')) {
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
    localStorage.removeItem("adminLoggedIn");
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const role = await getUserRoleFromDB(user.uid);
          console.log("User authenticated:", user.uid, "with role:", role);
          
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

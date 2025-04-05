
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  PlusCircle, 
  User, 
  Users, 
  Trash2,
  Mail,
  Lock,
  School
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { get, ref, set, remove, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import BranchManagement from "@/components/admin/BranchManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Teacher {
  id: string;
  name: string;
  email: string;
  branch?: string;
}

interface Branch {
  id: string;
  name: string;
}

const AdminDashboard = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("teachers");
  
  const { teacherRegister } = useAuth();
  const { toast } = useToast();

  // Load teachers from database
  useEffect(() => {
    const teachersRef = ref(database, "users");
    
    const unsubscribe = onValue(teachersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const teachersList: Teacher[] = [];
      
      Object.keys(data).forEach((key) => {
        if (data[key].role === "teacher") {
          teachersList.push({
            id: key,
            name: data[key].name,
            email: data[key].email || "No email provided", // Email might not be in the user object
            branch: data[key].branch
          });
        }
      });
      
      setTeachers(teachersList);
    });
    
    return () => unsubscribe();
  }, []);

  // Load branches from database
  useEffect(() => {
    const branchesRef = ref(database, "branches");
    
    const unsubscribe = onValue(branchesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setBranches([]);
        return;
      }
      
      const branchesList: Branch[] = [];
      
      Object.keys(data).forEach((key) => {
        branchesList.push({
          id: key,
          name: data[key].name
        });
      });
      
      setBranches(branchesList);
    });
    
    return () => unsubscribe();
  }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Register teacher with Firebase Auth
      await teacherRegister(email, password, name, selectedBranch || undefined);
      
      toast({
        title: "Teacher added successfully",
        description: `${name} has been added as a teacher.`,
      });
      
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setSelectedBranch("");
      setIsAddingTeacher(false);
    } catch (error: any) {
      toast({
        title: "Failed to add teacher",
        description: error.message || "An error occurred while adding the teacher.",
        variant: "destructive",
      });
      console.error("Error adding teacher:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (window.confirm(`Are you sure you want to delete ${teacherName}?`)) {
      try {
        // In a real app, you'd need to delete the user from Firebase Auth as well
        // This would typically be done through a Cloud Function for security
        
        // For now, we'll just remove from the database
        await remove(ref(database, `users/${teacherId}`));
        
        toast({
          title: "Teacher deleted",
          description: `${teacherName} has been removed.`,
        });
      } catch (error) {
        toast({
          title: "Failed to delete teacher",
          description: "An error occurred while deleting the teacher.",
          variant: "destructive",
        });
        console.error("Error deleting teacher:", error);
      }
    }
  };

  const getBranchNameById = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : "No branch assigned";
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="teachers" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="teachers">Manage Teachers</TabsTrigger>
          <TabsTrigger value="branches">Manage Branches</TabsTrigger>
        </TabsList>
        
        <TabsContent value="teachers">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Manage Teachers</h2>
            
            <Dialog open={isAddingTeacher} onOpenChange={setIsAddingTeacher}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add Teacher
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Teacher</DialogTitle>
                  <DialogDescription>
                    Create a new teacher account. The teacher will be able to manage students and exams.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddTeacher} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="teacher@example.com"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a temporary password"
                        required
                        minLength={6}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      The teacher will be able to change this password later.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <School className="h-4 w-4 text-slate-400" />
                      </div>
                      <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select a branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.length === 0 ? (
                            <div className="p-2 text-center text-sm text-slate-500">
                              No branches available.
                              <Button 
                                variant="link" 
                                className="w-full mt-1"
                                onClick={() => {
                                  setIsAddingTeacher(false);
                                  setActiveTab("branches");
                                }}
                              >
                                Add a branch first
                              </Button>
                            </div>
                          ) : (
                            branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingTeacher(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                          Adding...
                        </span>
                      ) : "Add Teacher"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Teachers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {teachers.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <Users className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-500">No teachers added yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => setIsAddingTeacher(true)}
                    className="mt-2"
                  >
                    Add your first teacher
                  </Button>
                </CardContent>
              </Card>
            ) : (
              teachers.map((teacher) => (
                <Card key={teacher.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{teacher.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">{teacher.email}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      <span className="font-medium">Branch:</span> {teacher.branch ? getBranchNameById(teacher.branch) : "No branch assigned"}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="branches">
          <BranchManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;

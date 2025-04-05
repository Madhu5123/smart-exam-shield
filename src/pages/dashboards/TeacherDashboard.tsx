
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  PlusCircle, 
  User, 
  Users, 
  BookOpen,
  CalendarCheck,
  BarChart,
  Clock,
  Trash2 
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
import { get, ref, set, remove, onValue } from "firebase/database";
import { database } from "@/lib/firebase";

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
}

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [name, setName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { studentRegister } = useAuth();
  const { toast } = useToast();

  // Load students from database
  useEffect(() => {
    const studentsRef = ref(database, "students");
    
    const unsubscribe = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const studentsList: Student[] = [];
      
      Object.keys(data).forEach((key) => {
        studentsList.push({
          id: key,
          name: data[key].name,
          registrationNumber: data[key].registrationNumber
        });
      });
      
      setStudents(studentsList);
    });
    
    return () => unsubscribe();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Check if registration number already exists
      const studentsRef = ref(database, "students");
      const snapshot = await get(studentsRef);
      const data = snapshot.val();
      
      if (data) {
        const exists = Object.values(data).some((student: any) => 
          student.registrationNumber === regNumber
        );
        
        if (exists) {
          throw new Error("A student with this registration number already exists.");
        }
      }
      
      // Register student with Firebase Auth
      await studentRegister(regNumber, password, name);
      
      toast({
        title: "Student added successfully",
        description: `${name} has been added with registration number ${regNumber}.`,
      });
      
      // Reset form
      setName("");
      setRegNumber("");
      setPassword("");
      setIsAddingStudent(false);
    } catch (error: any) {
      toast({
        title: "Failed to add student",
        description: error.message || "An error occurred while adding the student.",
        variant: "destructive",
      });
      console.error("Error adding student:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
      try {
        // In a real app, you'd need to delete the user from Firebase Auth as well
        // This would typically be done through a Cloud Function for security
        
        // For now, we'll just remove from the database
        await remove(ref(database, `students/${studentId}`));
        await remove(ref(database, `users/${studentId}`));
        
        toast({
          title: "Student deleted",
          description: `${studentName} has been removed.`,
        });
      } catch (error) {
        toast({
          title: "Failed to delete student",
          description: "An error occurred while deleting the student.",
          variant: "destructive",
        });
        console.error("Error deleting student:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-[400px]">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Students</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Subjects</span>
          </TabsTrigger>
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            <span>Exams</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage Students</h2>
            
            <Dialog open={isAddingStudent} onOpenChange={setIsAddingStudent}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Create a new student account. The student will be able to take assigned exams.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddStudent} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="regNumber">Registration Number</Label>
                    <Input
                      id="regNumber"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="REG2025001"
                      required
                    />
                    <p className="text-xs text-slate-500">
                      This will be used for student login.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a temporary password"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-slate-500">
                      The student will be able to change this password later.
                    </p>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingStudent(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                          Adding...
                        </span>
                      ) : "Add Student"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Students List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <Users className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-500">No students added yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => setIsAddingStudent(true)}
                    className="mt-2"
                  >
                    Add your first student
                  </Button>
                </CardContent>
              </Card>
            ) : (
              students.map((student) => (
                <Card key={student.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{student.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteStudent(student.id, student.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">Reg. No: {student.registrationNumber}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Subjects Tab - Placeholder for now */}
        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Manage your course subjects here. (This section will be implemented later)</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exams Tab - Placeholder for now */}
        <TabsContent value="exams">
          <Card>
            <CardHeader>
              <CardTitle>Exams</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Create and manage exams here. (This section will be implemented later)</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab - Placeholder for now */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>View student performance analytics here. (This section will be implemented later)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;

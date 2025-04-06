import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { get, ref, set, remove, onValue, push } from "firebase/database";
import { database } from "@/lib/firebase";
import ExamCreator from "@/components/ExamCreator";

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  semester?: string;
  subjects?: string[];
}

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: string;
}

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [name, setName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [password, setPassword] = useState("");
  const [semester, setSemester] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  
  const { studentRegister } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const branchesRef = ref(database, "branches");
    
    const unsubscribe = onValue(branchesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const branchesList: {id: string, name: string}[] = [];
      
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
          registrationNumber: data[key].registrationNumber,
          semester: data[key].semester || '',
          subjects: data[key].subjects || []
        });
      });
      
      setStudents(studentsList);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const subjectsRef = ref(database, "subjects");
    
    const unsubscribe = onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const subjectsList: Subject[] = [];
      
      Object.keys(data).forEach((key) => {
        subjectsList.push({
          id: key,
          name: data[key].name,
          code: data[key].code,
          semester: data[key].semester
        });
      });
      
      setSubjects(subjectsList);
    });
    
    return () => unsubscribe();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
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
      
      await studentRegister(regNumber, password, name);
      
      const userQuery = await get(ref(database, "users"));
      const users = userQuery.val();
      
      let studentUid = null;
      Object.keys(users).forEach(uid => {
        if (users[uid].role === 'student' && users[uid].name === name) {
          studentUid = uid;
        }
      });
      
      if (studentUid) {
        await set(ref(database, `students/${studentUid}/semester`), semester);
        
        if (selectedBranch) {
          await set(ref(database, `students/${studentUid}/branch`), selectedBranch);
        }
        
        if (selectedSubjects.length > 0) {
          await set(ref(database, `students/${studentUid}/subjects`), selectedSubjects);
        }
      }
      
      toast({
        title: "Student added successfully",
        description: `${name} has been added with registration number ${regNumber}.`,
      });
      
      setName("");
      setRegNumber("");
      setPassword("");
      setSemester("");
      setSelectedBranch("");
      setSelectedSubjects([]);
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

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const subjectName = formData.get('subjectName') as string;
    const subjectCode = formData.get('subjectCode') as string;
    const subjectSemester = formData.get('subjectSemester') as string;
    
    try {
      setLoading(true);
      
      const subjectsRef = ref(database, "subjects");
      const snapshot = await get(subjectsRef);
      const data = snapshot.val();
      
      if (data) {
        const exists = Object.values(data).some((subject: any) => 
          subject.code === subjectCode
        );
        
        if (exists) {
          throw new Error("A subject with this code already exists.");
        }
      }
      
      const newSubjectRef = push(ref(database, "subjects"));
      await set(newSubjectRef, {
        name: subjectName,
        code: subjectCode,
        semester: subjectSemester
      });
      
      toast({
        title: "Subject added successfully",
        description: `${subjectName} has been added with code ${subjectCode}.`,
      });
      
      form.reset();
      setIsAddingSubject(false);
    } catch (error: any) {
      toast({
        title: "Failed to add subject",
        description: error.message || "An error occurred while adding the subject.",
        variant: "destructive",
      });
      console.error("Error adding subject:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
      try {
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

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (window.confirm(`Are you sure you want to delete ${subjectName}?`)) {
      try {
        await remove(ref(database, `subjects/${subjectId}`));
        
        toast({
          title: "Subject deleted",
          description: `${subjectName} has been removed.`,
        });
      } catch (error) {
        toast({
          title: "Failed to delete subject",
          description: "An error occurred while deleting the subject.",
          variant: "destructive",
        });
        console.error("Error deleting subject:", error);
      }
    }
  };

  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
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
              <DialogContent className="max-w-md">
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
                    <Label htmlFor="branch">Branch</Label>
                    <Select onValueChange={setSelectedBranch} value={selectedBranch}>
                      <SelectTrigger id="branch">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select onValueChange={setSemester} value={semester}>
                      <SelectTrigger id="semester">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                        <SelectItem value="3">Semester 3</SelectItem>
                        <SelectItem value="4">Semester 4</SelectItem>
                        <SelectItem value="5">Semester 5</SelectItem>
                        <SelectItem value="6">Semester 6</SelectItem>
                        <SelectItem value="7">Semester 7</SelectItem>
                        <SelectItem value="8">Semester 8</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Assign Subjects</Label>
                    <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                      {subjects.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-2">
                          No subjects available. Add subjects first.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {subjects
                            .filter(subject => !semester || subject.semester === semester)
                            .map(subject => (
                            <div key={subject.id} className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id={`subject-${subject.id}`}
                                checked={selectedSubjects.includes(subject.id)}
                                onChange={() => toggleSubjectSelection(subject.id)}
                                className="rounded"
                              />
                              <label htmlFor={`subject-${subject.id}`} className="text-sm">
                                {subject.name} ({subject.code}) - Sem {subject.semester}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                    <p className="text-sm text-slate-500">Semester: {student.semester || 'Not assigned'}</p>
                    
                    {student.subjects && student.subjects.length > 0 ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Subjects:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {student.subjects.map(subjectId => {
                            const subject = subjects.find(s => s.id === subjectId);
                            return subject ? (
                              <span key={subjectId} className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {subject.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-2">No subjects assigned</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage Subjects</h2>
            
            <Dialog open={isAddingSubject} onOpenChange={setIsAddingSubject}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>
                    Create a new subject for student registration and exams.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddSubject} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="subjectName">Subject Name</Label>
                    <Input
                      id="subjectName"
                      name="subjectName"
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subjectCode">Subject Code</Label>
                    <Input
                      id="subjectCode"
                      name="subjectCode"
                      placeholder="e.g., MATH101"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subjectSemester">Semester</Label>
                    <Select name="subjectSemester" defaultValue="1">
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                        <SelectItem value="3">Semester 3</SelectItem>
                        <SelectItem value="4">Semester 4</SelectItem>
                        <SelectItem value="5">Semester 5</SelectItem>
                        <SelectItem value="6">Semester 6</SelectItem>
                        <SelectItem value="7">Semester 7</SelectItem>
                        <SelectItem value="8">Semester 8</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingSubject(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                          Adding...
                        </span>
                      ) : "Add Subject"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-500">No subjects added yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => setIsAddingSubject(true)}
                    className="mt-2"
                  >
                    Add your first subject
                  </Button>
                </CardContent>
              </Card>
            ) : (
              subjects.map((subject) => (
                <Card key={subject.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteSubject(subject.id, subject.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">Code: {subject.code}</p>
                    <p className="text-sm text-slate-500">Semester: {subject.semester}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="exams" className="mt-6">
          <ExamCreator />
        </TabsContent>

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

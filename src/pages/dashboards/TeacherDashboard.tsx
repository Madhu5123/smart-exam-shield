
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { 
  PlusCircle, 
  User, 
  Users, 
  BookOpen,
  CalendarCheck,
  BarChart,
  Clock,
  Trash2,
  Plus,
  Pencil,
  Upload,
  Save,
  X
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
import { get, ref, set, remove, onValue, push, update } from "firebase/database";
import { database, storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  semester?: string;
  subjects?: string[];
  photoURL?: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

interface Exam {
  id: string;
  title: string;
  subject: string;
  subjectId: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startTime: string;
  endTime: string;
  instructions: string;
  randomizeQuestions: boolean;
  semester: string;
  status: "draft" | "published";
  questions: Question[];
  createdBy: string;
  createdAt: string;
}

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [studentName, setStudentName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [semester, setSemester] = useState("");
  const [studentSubjects, setStudentSubjects] = useState<string[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectSemester, setSubjectSemester] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoURL, setPhotoURL] = useState("");
  const [openEditDialog, setOpenEditDialog] = useState(false);

  // Load students and subjects from Firebase on component mount
  useEffect(() => {
    // Reference to students in the database
    const studentsRef = ref(database, "students");
    // Listen for changes to the students
    const unsubscribeStudents = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedStudents: Student[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          loadedStudents.push({
            id: key,
            ...data[key]
          });
        });
      }
      setStudents(loadedStudents);
    });

    // Reference to subjects in the database
    const subjectsRef = ref(database, "subjects");
    // Listen for changes to the subjects
    const unsubscribeSubjects = onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedSubjects: Subject[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          loadedSubjects.push({
            id: key,
            ...data[key]
          });
        });
      }
      setSubjects(loadedSubjects);
    });

    // Reference to exams in the database
    const examsRef = ref(database, "exams");
    // Listen for changes to the exams
    const unsubscribeExams = onValue(examsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedExams: Exam[] = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          loadedExams.push({
            id: key,
            ...data[key]
          });
        });
      }
      setExams(loadedExams);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeStudents();
      unsubscribeSubjects();
      unsubscribeExams();
    };
  }, []);

  // Handle adding a student
  const handleAddStudent = async () => {
    // Validation
    if (!studentName || !registrationNumber || !semester) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if registration number is already used
    const existingStudent = students.find(s => s.registrationNumber === registrationNumber);
    if (existingStudent) {
      toast({
        title: "Registration number already exists",
        description: "Please use a unique registration number.",
        variant: "destructive",
      });
      return;
    }

    // Reference to students in the database
    const studentsRef = ref(database, "students");
    // Create a new student record
    const newStudentRef = push(studentsRef);
    // Set the student data
    await set(newStudentRef, {
      name: studentName,
      registrationNumber,
      semester,
      subjects: studentSubjects.length ? studentSubjects : null,
      photoURL: photoURL || null
    });

    // Clear the form
    setStudentName("");
    setRegistrationNumber("");
    setSemester("");
    setStudentSubjects([]);
    setPhotoURL("");

    // Show success message
    toast({
      title: "Student added",
      description: "The student has been added successfully.",
    });
  };

  // Handle deleting a student
  const handleDeleteStudent = async (studentId: string) => {
    // Reference to the student in the database
    const studentRef = ref(database, `students/${studentId}`);
    // Remove the student
    await remove(studentRef);

    // Show success message
    toast({
      title: "Student deleted",
      description: "The student has been deleted successfully.",
    });
  };

  // Handle editing a student
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentName(student.name);
    setRegistrationNumber(student.registrationNumber);
    setSemester(student.semester || "");
    setStudentSubjects(student.subjects || []);
    setPhotoURL(student.photoURL || "");
    setOpenEditDialog(true);
  };

  // Save edited student
  const saveEditedStudent = async () => {
    if (!editingStudent) return;

    // Validation
    if (!studentName || !registrationNumber || !semester) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if registration number is already used by another student
    const existingStudent = students.find(
      s => s.registrationNumber === registrationNumber && s.id !== editingStudent.id
    );
    
    if (existingStudent) {
      toast({
        title: "Registration number already exists",
        description: "Please use a unique registration number.",
        variant: "destructive",
      });
      return;
    }

    // Reference to the student in the database
    const studentRef = ref(database, `students/${editingStudent.id}`);
    
    // Update the student data
    await update(studentRef, {
      name: studentName,
      registrationNumber,
      semester,
      subjects: studentSubjects.length ? studentSubjects : null,
      photoURL: photoURL || null
    });

    // Reset form and state
    setEditingStudent(null);
    setStudentName("");
    setRegistrationNumber("");
    setSemester("");
    setStudentSubjects([]);
    setPhotoURL("");
    setOpenEditDialog(false);

    // Show success message
    toast({
      title: "Student updated",
      description: "The student has been updated successfully.",
    });
  };

  // Handle adding a subject
  const handleAddSubject = async () => {
    // Validation
    if (!subjectName || !subjectCode || !subjectSemester) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if subject code is already used
    const existingSubject = subjects.find(s => s.code === subjectCode);
    if (existingSubject) {
      toast({
        title: "Subject code already exists",
        description: "Please use a unique subject code.",
        variant: "destructive",
      });
      return;
    }

    // Reference to subjects in the database
    const subjectsRef = ref(database, "subjects");
    // Create a new subject record
    const newSubjectRef = push(subjectsRef);
    // Set the subject data
    await set(newSubjectRef, {
      name: subjectName,
      code: subjectCode,
      semester: subjectSemester
    });

    // Clear the form
    setSubjectName("");
    setSubjectCode("");
    setSubjectSemester("");

    // Show success message
    toast({
      title: "Subject added",
      description: "The subject has been added successfully.",
    });
  };

  // Handle deleting a subject
  const handleDeleteSubject = async (subjectId: string) => {
    // Reference to the subject in the database
    const subjectRef = ref(database, `subjects/${subjectId}`);
    // Remove the subject
    await remove(subjectRef);

    // Show success message
    toast({
      title: "Subject deleted",
      description: "The subject has been deleted successfully.",
    });
  };

  // Handle uploading a photo to Cloudinary
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploadingPhoto(true);
    
    try {
      // Create a Cloudinary unsigned upload preset
      const cloudName = "your-cloud-name"; // Replace with your Cloudinary cloud name
      const uploadPreset = "student-photos-unsigned"; // Replace with your unsigned upload preset
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      
      // Upload to Cloudinary
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.secure_url) {
        setPhotoURL(data.secure_url);
        toast({
          title: "Photo uploaded",
          description: "The photo has been uploaded successfully.",
        });
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Toggle subject selection for a student
  const toggleSubjectSelection = (subjectId: string) => {
    if (studentSubjects.includes(subjectId)) {
      setStudentSubjects(studentSubjects.filter(id => id !== subjectId));
    } else {
      setStudentSubjects([...studentSubjects, subjectId]);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100 
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <motion.h1 
        className="text-3xl font-bold text-examblue-800 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Teacher Dashboard
      </motion.h1>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="students" className="data-[state=active]:bg-examblue-600 data-[state=active]:text-white">
            <Users className="mr-2 h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="subjects" className="data-[state=active]:bg-examblue-600 data-[state=active]:text-white">
            <BookOpen className="mr-2 h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="exams" className="data-[state=active]:bg-examblue-600 data-[state=active]:text-white">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Exams
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card className="bg-white shadow-md border-examblue-100">
            <CardHeader>
              <CardTitle className="text-examblue-800 flex items-center">
                <User className="mr-2 h-5 w-5" />
                Add New Student
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-examblue-700">Name</Label>
                  <Input 
                    id="name" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Student's full name"
                    className="border-examblue-200 focus:border-examblue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber" className="text-examblue-700">Registration Number</Label>
                  <Input 
                    id="registrationNumber" 
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="Unique registration number"
                    className="border-examblue-200 focus:border-examblue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester" className="text-examblue-700">Semester</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger className="border-examblue-200 focus:border-examblue-400">
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
                  <Label htmlFor="photo" className="text-examblue-700">Upload Photo</Label>
                  <div className="flex items-center gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      className="border-examblue-200 text-examblue-700 hover:bg-examblue-50"
                      disabled={isUploadingPhoto}
                    >
                      {isUploadingPhoto ? (
                        <>
                          <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-examblue-600 rounded-full"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Photo
                        </>
                      )}
                    </Button>
                    <input 
                      type="file" 
                      id="photo-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                    />
                    {photoURL && (
                      <div className="relative w-12 h-12 overflow-hidden rounded-full border border-examblue-200">
                        <img src={photoURL} alt="Student" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-examblue-700">Assigned Subjects</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`subject-${subject.id}`} 
                        checked={studentSubjects.includes(subject.id)}
                        onCheckedChange={() => toggleSubjectSelection(subject.id)}
                      />
                      <Label 
                        htmlFor={`subject-${subject.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {subject.name} ({subject.code})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleAddStudent}
                className="bg-examblue-600 hover:bg-examblue-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </CardFooter>
          </Card>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {students.map((student) => (
              <motion.div key={student.id} variants={itemVariants}>
                <Card className="overflow-hidden bg-white border-examblue-50 hover:shadow-lg transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-examblue-500 to-examblue-600 p-4 text-white flex justify-between items-center">
                    <h3 className="font-semibold truncate">{student.name}</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditStudent(student)}
                        className="text-white hover:bg-examblue-400 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-white hover:bg-examblue-400 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-examblue-100">
                      {student.photoURL ? (
                        <AvatarImage src={student.photoURL} alt={student.name} />
                      ) : (
                        <AvatarFallback className="bg-examblue-100 text-examblue-700">
                          {student.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">ID: {student.registrationNumber}</p>
                      <p className="text-sm text-gray-500">Semester: {student.semester}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Subjects: {student.subjects ? 
                          subjects
                            .filter(s => student.subjects?.includes(s.id))
                            .map(s => s.code)
                            .join(", ") : 
                          "None"
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-6">
          <Card className="bg-white shadow-md border-examblue-100">
            <CardHeader>
              <CardTitle className="text-examblue-800 flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Add New Subject
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subjectName" className="text-examblue-700">Subject Name</Label>
                  <Input 
                    id="subjectName" 
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="border-examblue-200 focus:border-examblue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectCode" className="text-examblue-700">Subject Code</Label>
                  <Input 
                    id="subjectCode" 
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="e.g. MATH101"
                    className="border-examblue-200 focus:border-examblue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectSemester" className="text-examblue-700">Semester</Label>
                  <Select value={subjectSemester} onValueChange={setSubjectSemester}>
                    <SelectTrigger className="border-examblue-200 focus:border-examblue-400">
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
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleAddSubject}
                className="bg-examblue-600 hover:bg-examblue-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </CardFooter>
          </Card>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {subjects.map((subject) => (
              <motion.div key={subject.id} variants={itemVariants}>
                <Card className="bg-white border-examblue-50 hover:shadow-lg transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-examblue-600 to-examblue-700 p-4 text-white">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold truncate">{subject.name}</h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteSubject(subject.id)}
                        className="text-white hover:bg-examblue-400 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                    <div className="text-sm mt-1 opacity-90">Code: {subject.code}</div>
                  </div>
                  <CardContent className="p-4">
                    <div className="text-sm">
                      <span className="font-medium">Semester:</span> {subject.semester}
                    </div>
                    <div className="text-sm mt-2">
                      <span className="font-medium">Students:</span> {
                        students.filter(s => s.subjects?.includes(subject.id)).length
                      }
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-6">
          <Card className="bg-white shadow-md border-examblue-100">
            <CardHeader>
              <CardTitle className="text-examblue-800 flex items-center">
                <CalendarCheck className="mr-2 h-5 w-5" />
                Manage Exams
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Button 
                className="bg-examblue-600 hover:bg-examblue-700 text-white"
                onClick={() => {
                  // This would be replaced with actual exam creation navigation or modal
                  toast({
                    title: "Create Exam",
                    description: "Exam creation feature coming soon!",
                  });
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Exam
              </Button>
            </CardContent>
          </Card>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {exams.length === 0 ? (
              <motion.div 
                className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-examblue-200"
                variants={itemVariants}
              >
                <CalendarCheck className="h-12 w-12 mx-auto text-examblue-300" />
                <h3 className="mt-4 text-lg font-medium text-examblue-700">No Exams Created Yet</h3>
                <p className="mt-2 text-sm text-gray-500">Create your first exam to get started.</p>
              </motion.div>
            ) : (
              exams.map((exam) => (
                <motion.div key={exam.id} variants={itemVariants}>
                  <Card className="bg-white border-examblue-50 hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-examblue-800">{exam.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-examblue-700">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {exam.subject} ({exam.semester})
                        </div>
                        <div className="flex items-center text-examblue-700">
                          <Clock className="h-4 w-4 mr-2" />
                          Duration: {exam.duration} minutes
                        </div>
                        <div className="flex items-center text-examblue-700">
                          <BarChart className="h-4 w-4 mr-2" />
                          Marks: {exam.totalMarks} (Pass: {exam.passingMarks})
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            exam.status === "published" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {exam.status === "published" ? "Published" : "Draft"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between bg-gray-50">
                      <Button 
                        variant="outline" 
                        className="text-examblue-600 border-examblue-200 hover:bg-examblue-50"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {exam.status === "draft" ? (
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Publish
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="text-gray-600 border-gray-200 hover:bg-gray-50"
                        >
                          View Results
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Edit Student Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-examblue-800">Edit Student</DialogTitle>
            <DialogDescription>
              Update the student's information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-examblue-700">Name</Label>
              <Input 
                id="edit-name" 
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="border-examblue-200 focus:border-examblue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reg" className="text-examblue-700">Registration Number</Label>
              <Input 
                id="edit-reg" 
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="border-examblue-200 focus:border-examblue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-semester" className="text-examblue-700">Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger id="edit-semester" className="border-examblue-200 focus:border-examblue-400">
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
              <Label htmlFor="edit-photo" className="text-examblue-700">Photo</Label>
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('edit-photo-upload')?.click()}
                  className="border-examblue-200 text-examblue-700 hover:bg-examblue-50"
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-examblue-600 rounded-full"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </>
                  )}
                </Button>
                <input 
                  type="file" 
                  id="edit-photo-upload" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                />
                {photoURL && (
                  <div className="relative w-12 h-12 overflow-hidden rounded-full border border-examblue-200">
                    <img src={photoURL} alt="Student" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-examblue-700">Assigned Subjects</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md border-examblue-100">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`edit-subject-${subject.id}`} 
                    checked={studentSubjects.includes(subject.id)}
                    onCheckedChange={() => toggleSubjectSelection(subject.id)}
                  />
                  <Label 
                    htmlFor={`edit-subject-${subject.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {subject.name} ({subject.code})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenEditDialog(false)}
              className="border-examblue-200 text-examblue-700 hover:bg-examblue-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveEditedStudent}
              className="bg-examblue-600 hover:bg-examblue-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDashboard;
